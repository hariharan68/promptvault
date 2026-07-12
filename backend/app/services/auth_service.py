from datetime import datetime, timedelta
import hashlib
import secrets
import uuid

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.core.normalize import normalize_email
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.security_event import SecurityEvent
from app.core.config import (
    REFRESH_TOKEN_EXPIRE_DAYS,
    IDLE_TIMEOUT_MINUTES,
    EPHEMERAL_ABSOLUTE_CAP_HOURS,
)
from app.schemas.user import UserCreate
from app.schemas.auth import LoginRequest


# Legitimate multi-tab races refresh the same token within a few hundred ms of
# each other. Only one UPDATE wins; the losers land in the reuse branch. Within
# this window we treat that as a benign race (return 401, the client retries),
# not theft — so we do not nuke the family.
REUSE_GRACE_SECONDS = 10


def get_user_by_email(db: Session, email: str):
    # Case-insensitive to match the lower(email) unique index; normalize the
    # input so callers need not pre-normalize.
    return db.query(User).filter(func.lower(User.email) == normalize_email(email)).first()


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, user_data: UserCreate):
    hashed_password = hash_password(user_data.password)

    new_user = User(
        username=user_data.username,
        email=normalize_email(user_data.email),
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
        func.lower(User.email) == normalize_email(login_data.email),
        User.is_active.is_(True),
    ).first()

    if not user or not user.password_hash:
        # Equalize timing against the found-user path: run a dummy DB round-trip
        # (matches the row-fetch cost) then a dummy bcrypt verify (matches the
        # hash-check cost). Without both, missing emails are ~300 ms faster,
        # leaking which addresses exist in the database.
        db.query(User).filter(func.lower(User.email) == "timing-equalize@invalid").first()
        verify_password(login_data.password, _DUMMY_PASSWORD_HASH)
        return None

    if not verify_password(login_data.password, user.password_hash):
        return None

    return user


def create_login_token(user: User, sid) -> str:
    return create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "ver": user.token_version,
            "sid": str(sid),                      # session (family) id — per-device revocation, sessions UI
            "jti": secrets.token_urlsafe(16),     # future-proofs an optional denylist
        }
    )


def _hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _expiry_for(policy: str, now: datetime) -> datetime:
    if policy == "ephemeral":
        return now + timedelta(hours=EPHEMERAL_ABSOLUTE_CAP_HOURS)
    return now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)


def log_security_event(db: Session, event_type: str, *, user_id=None, family_id=None, detail=None) -> None:
    db.add(SecurityEvent(event_type=event_type, user_id=user_id, family_id=family_id, detail=detail))


def revoke_family(db: Session, family_id, reason: str) -> int:
    """Revoke every still-live token in a family. Returns rows affected."""
    result = db.execute(
        text(
            "UPDATE refresh_tokens SET revoked_at = :now, revoke_reason = :reason "
            "WHERE family_id = :fid AND revoked_at IS NULL"
        ),
        {"now": datetime.utcnow(), "reason": reason, "fid": str(family_id)},
    )
    return result.rowcount


def create_refresh_token(db: Session, user: User, session_policy: str = "persistent") -> tuple[str, uuid.UUID]:
    """Start a new token family for a fresh login. Returns (raw_token, family_id)."""
    now = datetime.utcnow()
    raw_token = secrets.token_urlsafe(48)
    family_id = uuid.uuid4()
    token = RefreshToken(
        user_id=user.id,
        token_hash=_hash_refresh_token(raw_token),
        family_id=family_id,
        parent_id=None,
        session_policy=session_policy,
        expires_at=_expiry_for(session_policy, now),
        last_used_at=now,
    )
    db.add(token)
    db.commit()
    return raw_token, family_id


def _enforce_session_policy(session_policy: str, last_used_at: datetime, now: datetime) -> str | None:
    """Return a revoke reason if an ephemeral session has idled out, else None.

    The 12h absolute cap is enforced by the token's inherited expires_at (the
    rotation UPDATE's `expires_at > now` guard), so only the idle check lives here.
    """
    if session_policy == "ephemeral":
        if now - last_used_at > timedelta(minutes=IDLE_TIMEOUT_MINUTES):
            return "idle_timeout"
    return None


def rotate_refresh_token(db: Session, raw_token: str):
    """Atomically consume a refresh token and mint its successor.

    Returns (user, new_raw_token, family_id, session_policy) on success, or None
    on any failure (invalid, expired, idle-timed-out, or reuse). The 401 is
    uniform so an attacker gets no oracle distinguishing these cases.
    """
    now = datetime.utcnow()
    token_hash = _hash_refresh_token(raw_token)

    # ONE atomic statement claims the token iff it is still live. The WHERE clause
    # is the lock: two concurrent refreshes cannot both match. last_used_at is left
    # untouched so the idle check below reads the pre-rotation activity time.
    claimed = db.execute(
        text(
            """
            UPDATE refresh_tokens
               SET replaced_at = :now
             WHERE token_hash = :h
               AND replaced_at IS NULL
               AND revoked_at  IS NULL
               AND expires_at  > :now
            RETURNING id, user_id, family_id, session_policy, created_at, last_used_at, expires_at
            """
        ),
        {"now": now, "h": token_hash},
    ).first()

    if claimed is None:
        # Invalid / expired — or reuse of an already-rotated token.
        prior = db.execute(
            text("SELECT family_id, replaced_at, revoked_at FROM refresh_tokens WHERE token_hash = :h"),
            {"h": token_hash},
        ).first()
        if prior is not None and prior.replaced_at is not None and prior.revoked_at is None:
            if now - prior.replaced_at > timedelta(seconds=REUSE_GRACE_SECONDS):
                # Theft signal: a token rotated long ago was presented again.
                revoke_family(db, prior.family_id, reason="reuse_detected")
                log_security_event(db, "refresh_token_reuse", family_id=prior.family_id)
                db.commit()
            # else: benign multi-tab race inside the grace window — let the client retry.
        return None

    user = db.query(User).filter(User.id == claimed.user_id, User.is_active.is_(True)).first()
    if not user:
        db.commit()  # persist the replaced_at claim
        return None

    idle_reason = _enforce_session_policy(claimed.session_policy, claimed.last_used_at, now)
    if idle_reason:
        revoke_family(db, claimed.family_id, reason=idle_reason)
        db.commit()
        return None

    new_raw_token = secrets.token_urlsafe(48)
    # Persistent sessions slide (new 30-day window); ephemeral successors inherit
    # the family's expires_at so the 12h absolute cap cannot be extended by refreshing.
    if claimed.session_policy == "ephemeral":
        successor_expiry = claimed.expires_at
    else:
        successor_expiry = _expiry_for(claimed.session_policy, now)

    db.add(RefreshToken(
        user_id=user.id,
        token_hash=_hash_refresh_token(new_raw_token),
        family_id=claimed.family_id,
        parent_id=claimed.id,
        session_policy=claimed.session_policy,
        expires_at=successor_expiry,
        last_used_at=now,
    ))
    db.commit()
    return user, new_raw_token, claimed.family_id, claimed.session_policy


def revoke_refresh_token(db: Session, raw_token: str | None) -> None:
    """Logout: revoke the whole family the presented token belongs to."""
    if not raw_token:
        return
    token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == _hash_refresh_token(raw_token),
    ).first()
    if token:
        revoke_family(db, token.family_id, reason="logout")
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
    ).update({RefreshToken.revoked_at: datetime.utcnow(), RefreshToken.revoke_reason: "password_change"})
    db.commit()
    return True


def revoke_all_sessions(db: Session, user_id):
    count = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None),
    ).update({RefreshToken.revoked_at: datetime.utcnow(), RefreshToken.revoke_reason: "logout_all"})
    # Also invalidate outstanding access tokens for this user.
    db.query(User).filter(User.id == user_id).update(
        {User.token_version: User.token_version + 1}
    )
    db.commit()
    return count
