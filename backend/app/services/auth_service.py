from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
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


def authenticate_user(db: Session, login_data: LoginRequest):
    user = get_user_by_email(db, login_data.email)

    if not user:
        return None

    if not verify_password(login_data.password, user.password_hash):
        return None

    return user


def create_login_token(user: User):
    return create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email
        }
    )