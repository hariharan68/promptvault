from pydantic import BaseModel, EmailStr, field_validator

from app.core.normalize import normalize_email


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    # Selects the server-enforced session policy: True -> persistent (30d),
    # False -> ephemeral (30-min idle timeout, 12h absolute cap).
    remember_me: bool = False

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, value: str) -> str:
        return normalize_email(value)


class OAuthLinkConfirmRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterResponse(BaseModel):
    message: str