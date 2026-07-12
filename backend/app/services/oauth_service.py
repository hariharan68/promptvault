from dataclasses import dataclass
import base64
import hashlib
import re
import secrets
from urllib.parse import urlencode

import httpx
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import (
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_REDIRECT_URI,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
)
from app.core.normalize import normalize_email
from app.models.oauth_account import OAuthAccount
from app.models.user import User


SUPPORTED_PROVIDERS = {"google", "github"}


class OAuthError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class OAuthProfile:
    provider: str
    provider_user_id: str
    email: str
    email_verified: bool
    username: str


def provider_is_configured(provider: str) -> bool:
    if provider == "google":
        return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI)
    if provider == "github":
        return bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET and GITHUB_REDIRECT_URI)
    return False


def _provider_config(provider: str) -> tuple[str, str, str]:
    if provider == "google":
        values = (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
    elif provider == "github":
        values = (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI)
    else:
        raise OAuthError("unsupported_provider", "Unsupported OAuth provider")
    if not all(values):
        raise OAuthError("provider_not_configured", f"{provider.title()} login is not configured")
    return values  # type: ignore[return-value]


def create_authorization_request(provider: str) -> tuple[str, str, str]:
    client_id, _, redirect_uri = _provider_config(provider)
    state = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode("ascii")).digest()
    ).rstrip(b"=").decode("ascii")

    if provider == "google":
        endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "prompt": "select_account",
        }
    else:
        # GitHub OAuth Apps do not support PKCE — state alone is the CSRF guard
        endpoint = "https://github.com/login/oauth/authorize"
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": "read:user user:email",
            "state": state,
        }
    return f"{endpoint}?{urlencode(params)}", state, verifier


async def fetch_oauth_profile(provider: str, code: str, verifier: str) -> OAuthProfile:
    client_id, client_secret, redirect_uri = _provider_config(provider)
    timeout = httpx.Timeout(10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            if provider == "google":
                token_response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": code,
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code",
                        "code_verifier": verifier,
                    },
                )
            else:
                # GitHub OAuth Apps do not accept code_verifier — omit it
                token_response = await client.post(
                    "https://github.com/login/oauth/access_token",
                    headers={"Accept": "application/json"},
                    data={
                        "code": code,
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "redirect_uri": redirect_uri,
                    },
                )
            token_response.raise_for_status()
            access_token = token_response.json().get("access_token")
            if not access_token:
                raise OAuthError("token_exchange_failed", "OAuth provider did not issue an access token")

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
                "User-Agent": "PromptNest",
            }
            if provider == "google":
                profile_response = await client.get(
                    "https://openidconnect.googleapis.com/v1/userinfo",
                    headers=headers,
                )
                profile_response.raise_for_status()
                profile = profile_response.json()
                return OAuthProfile(
                    provider="google",
                    provider_user_id=str(profile["sub"]),
                    email=normalize_email(str(profile.get("email", ""))),
                    email_verified=profile.get("email_verified") is True,
                    username=str(profile.get("name") or profile.get("email", "").split("@")[0]),
                )

            profile_response = await client.get("https://api.github.com/user", headers=headers)
            profile_response.raise_for_status()
            profile = profile_response.json()
            emails_response = await client.get("https://api.github.com/user/emails", headers=headers)
            emails_response.raise_for_status()
            verified_emails = [item for item in emails_response.json() if item.get("verified")]
            primary = next((item for item in verified_emails if item.get("primary")), None)
            selected_email = primary or (verified_emails[0] if verified_emails else None)
            return OAuthProfile(
                provider="github",
                provider_user_id=str(profile["id"]),
                email=normalize_email(str((selected_email or {}).get("email", ""))),
                email_verified=selected_email is not None,
                username=str(profile.get("login") or "github_user"),
            )
        except OAuthError:
            raise
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            raise OAuthError("provider_request_failed", "Could not verify your identity with the OAuth provider") from exc


def _available_username(db: Session, preferred: str) -> str:
    base = re.sub(r"[^A-Za-z0-9_]", "_", preferred).strip("_")[:40] or "user"
    candidate = base
    for _ in range(20):
        exists = db.query(User.id).filter(func.lower(User.username) == candidate.lower()).first()
        if not exists:
            return candidate
        candidate = f"{base[:40]}_{secrets.token_hex(3)}"
    raise OAuthError("username_generation_failed", "Could not create a unique username")


def login_or_create_oauth_user(db: Session, profile: OAuthProfile) -> User:
    if not profile.email or not profile.email_verified:
        raise OAuthError("verified_email_required", "A verified email address is required")

    identity = db.query(OAuthAccount).filter(
        OAuthAccount.provider == profile.provider,
        OAuthAccount.provider_user_id == profile.provider_user_id,
    ).first()
    if identity:
        user = db.query(User).filter(User.id == identity.user_id, User.is_active.is_(True)).first()
        if not user:
            raise OAuthError("account_inactive", "This PromptNest account is inactive")
        return user

    user = db.query(User).filter(func.lower(User.email) == profile.email.lower()).first()
    if user and not user.is_active:
        raise OAuthError("account_inactive", "This PromptNest account is inactive")
    if not user:
        user = User(
            username=_available_username(db, profile.username),
            email=profile.email,
            password_hash=None,
            is_active=True,
        )
        db.add(user)
        db.flush()

    db.add(OAuthAccount(
        user_id=user.id,
        provider=profile.provider,
        provider_user_id=profile.provider_user_id,
        email_at_link=profile.email,
    ))
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError as exc:
        db.rollback()
        identity = db.query(OAuthAccount).filter(
            OAuthAccount.provider == profile.provider,
            OAuthAccount.provider_user_id == profile.provider_user_id,
        ).first()
        if identity:
            user = db.query(User).filter(User.id == identity.user_id, User.is_active.is_(True)).first()
            if user:
                return user
        raise OAuthError("account_link_failed", "Could not link the OAuth account") from exc
