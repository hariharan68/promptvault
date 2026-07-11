from datetime import datetime, timedelta
import hashlib
import secrets

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.core.config import REFRESH_TOKEN_EXPIRE_DAYS
from app.schemas.user import UserCreate
from app.schemas.auth import LoginRequest


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, user_data: UserCreate):
    hashed_password = hash_password(user_data.password)

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# Precomputed hash used to equalize timing when an account is missing, so an
# attacker cannot tell a valid email from an invalid one by response time.
_DUMMY_PASSWORD_HASH = hash_password(secrets.token_urlsafe(16))


def authenticate_user(db: Session, login_data: LoginRequest):
    user = db.query(User).filter(
        User.email == login_data.email,
        User.is_active.is_(True),
    ).first()

    if not user or not user.password_hash:
        # Run a dummy verify so the no-such-user path costs the same as a wrong
        # password (prevents email enumeration via timing side-channel).
        verify_password(login_data.password, _DUMMY_PASSWORD_HASH)
        return None

    if not verify_password(login_data.password, user.password_hash):
        return None

    return user


def create_login_token(user: User):
    return create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "ver": user.token_version,
        }
    )


def _hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_refresh_token(db: Session, user: User) -> str:
    raw_token = secrets.token_urlsafe(48)
    token = RefreshToken(
        user_id=user.id,
        token_hash=_hash_refresh_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(token)
    db.commit()
    return raw_token


def rotate_refresh_token(db: Session, raw_token: str):
    token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == _hash_refresh_token(raw_token),
        RefreshToken.revoked_at.is_(None),
        RefreshToken.expires_at > datetime.utcnow(),
    ).first()
    if not token:
        return None

    user = db.query(User).filter(User.id == token.user_id, User.is_active.is_(True)).first()
    if not user:
        return None

    token.revoked_at = datetime.utcnow()
    new_raw_token = secrets.token_urlsafe(48)
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=_hash_refresh_token(new_raw_token),
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    ))
    db.commit()
    return user, new_raw_token


def revoke_refresh_token(db: Session, raw_token: str | None) -> None:
    if not raw_token:
        return
    token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == _hash_refresh_token(raw_token),
        RefreshToken.revoked_at.is_(None),
    ).first()
    if token:
        token.revoked_at = datetime.utcnow()
        db.commit()


def change_password(db: Session, user: User, current_password: str, new_password: str):
    if not user.password_hash or not verify_password(current_password, user.password_hash):
        return False
    user.password_hash = hash_password(new_password)
    # Invalidate every existing access token immediately.
    user.token_version = (user.token_version or 0) + 1
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked_at.is_(None),
    ).update({RefreshToken.revoked_at: datetime.utcnow()})
    db.commit()
    return True


def revoke_all_sessions(db: Session, user_id):
    count = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None),
    ).update({RefreshToken.revoked_at: datetime.utcnow()})
    # Also invalidate outstanding access tokens for this user.
    db.query(User).filter(User.id == user_id).update(
        {User.token_version: User.token_version + 1}
    )
    db.commit()
    return count
