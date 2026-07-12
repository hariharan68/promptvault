from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.normalize import normalize_email


class UserBase(BaseModel):
    username: str
    email: EmailStr

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, value: str) -> str:
        return normalize_email(value)


class UserCreate(UserBase):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_]+$")
    password: str = Field(min_length=8, max_length=72)


class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    has_password: bool

    class Config:
        from_attributes = True
