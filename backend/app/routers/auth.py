from datetime import datetime
import hmac
from urllib.parse import urlencode

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.csrf import require_trusted_origin
from app.core.db_errors import is_unique_violation
from app.core.dependencies import get_current_user
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, RegisterResponse
from app.schemas.product import ChangePasswordRequest
from app.core.config import COOKIE_SECURE, OAUTH_FRONTEND_CALLBACK_URL, REFRESH_TOKEN_EXPIRE_DAYS
from app.core.rate_limit import enforce_rate_limit
from app.services.auth_service import (
    authenticate_user,
    create_login_token,
    create_user,
    get_user_by_email,
    get_user_by_username,
    create_refresh_token,
    revoke_refresh_token,
    rotate_refresh_token,
    change_password,
    revoke_all_sessions,
)
from app.models.refresh_token import RefreshToken
from app.models.prompt import Prompt
from app.services.oauth_service import (
    OAuthError,
    SUPPORTED_PROVIDERS,
    create_authorization_request,
    fetch_oauth_profile,
    login_or_create_oauth_user,
)

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Auth"]
)

OAUTH_COOKIE_PATH = "/api/v1/auth/oauth"


def _set_refresh_cookie(response: Response, token: str, persistent: bool) -> None:
    # Persistent ("remember me") sessions get a dated cookie; ephemeral sessions
    # get a session cookie (no Max-Age). The session cookie is only a best-effort
    # accelerator — the server's idle-timeout clock is the real authority.
    cookie_options = {
        "httponly": True,
        "secure": COOKIE_SECURE,
        "samesite": "lax",
        "path": "/api/v1/auth",
    }
    if persistent:
        cookie_options["max_age"] = REFRESH_TOKEN_EXPIRE_DAYS * 86400
    response.set_cookie("refresh_token", token, **cookie_options)


def _frontend_oauth_redirect(error: str | None = None) -> RedirectResponse:
    query = urlencode({"error": error}) if error else "status=success"
    response = RedirectResponse(f"{OAUTH_FRONTEND_CALLBACK_URL}?{query}", status_code=302)
    response.headers["Cache-Control"] = "no-store"
    response.delete_cookie("oauth_state", path=OAUTH_COOKIE_PATH)
    response.delete_cookie("oauth_pkce", path=OAUTH_COOKIE_PATH)
    response.delete_cookie("oauth_remember", path=OAUTH_COOKIE_PATH)
    return response


_ACCOUNT_TAKEN_DETAIL = "That email or username is already taken"


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    enforce_rate_limit(request, "register", 10)

    # Fast, friendly pre-check — but NOT the authority. Two concurrent requests
    # can both pass this and then race on INSERT; the unique constraints below
    # are what actually guarantee uniqueness.
    if get_user_by_email(db, user_data.email) or get_user_by_username(db, user_data.username):
        # Generic message — do not reveal which field is taken (enumeration).
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=_ACCOUNT_TAKEN_DETAIL)

    try:
        return create_user(db, user_data)
    except IntegrityError as exc:
        # The race loser lands here: a concurrent request won the unique index.
        # Same uniform 409 as the pre-check — no field leak, no 500.
        db.rollback()
        if is_unique_violation(exc):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=_ACCOUNT_TAKEN_DETAIL)
        raise


@router.post("/login", response_model=TokenResponse)
def login(request: Request, response: Response, login_data: LoginRequest, db: Session = Depends(get_db)):
    enforce_rate_limit(request, "login", 5)
    # Also throttle attempts against a single account regardless of source IP, so
    # a distributed guessing attack on one email can't sidestep the per-IP limit.
    enforce_rate_limit(request, "login_acct", 10, identity=login_data.email)
    user = authenticate_user(db, login_data)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    session_policy = "persistent" if login_data.remember_me else "ephemeral"
    refresh_token, family_id = create_refresh_token(db, user, session_policy)
    access_token = create_login_token(user, sid=family_id)
    _set_refresh_cookie(response, refresh_token, persistent=login_data.remember_me)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=TokenResponse, dependencies=[Depends(require_trusted_origin)])
def refresh(request: Request, response: Response, refresh_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    # Generous: a legitimate client refreshes at most once per ~5 min per tab, so
    # 20/min per IP only bites credential-stuffing loops, not real usage.
    enforce_rate_limit(request, "refresh", 20)
    rotated = rotate_refresh_token(db, refresh_token) if refresh_token else None
    if not rotated:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user, new_refresh_token, family_id, session_policy = rotated
    _set_refresh_cookie(response, new_refresh_token, persistent=(session_policy == "persistent"))
    return {"access_token": create_login_token(user, sid=family_id), "token_type": "bearer"}


@router.get("/oauth/{provider}/start")
def oauth_start(provider: str, request: Request, remember_me: bool = Query(default=False)):
    enforce_rate_limit(request, f"oauth_start:{provider}", 20)
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=404, detail="Unsupported OAuth provider")
    try:
        authorization_url, state_token, verifier = create_authorization_request(provider)
    except OAuthError as exc:
        return _frontend_oauth_redirect(exc.code)

    response = RedirectResponse(authorization_url, status_code=302)
    response.headers["Cache-Control"] = "no-store"
    cookie_options = {
        "httponly": True,
        "secure": COOKIE_SECURE,
        "samesite": "lax",
        "max_age": 600,
        "path": OAUTH_COOKIE_PATH,
    }
    response.set_cookie("oauth_state", state_token, **cookie_options)
    response.set_cookie("oauth_pkce", verifier, **cookie_options)
    # Carry the remember-me choice through the round-trip so the callback can pick
    # the session policy (the OAuth provider round-trip has no other place for it).
    response.set_cookie("oauth_remember", "1" if remember_me else "0", **cookie_options)
    return response


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    request: Request,
    code: str | None = Query(default=None),
    state_token: str | None = Query(default=None, alias="state"),
    provider_error: str | None = Query(default=None, alias="error"),
    oauth_state: str | None = Cookie(default=None),
    oauth_pkce: str | None = Cookie(default=None),
    oauth_remember: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    enforce_rate_limit(request, f"oauth_callback:{provider}", 10)
    if provider not in SUPPORTED_PROVIDERS:
        return _frontend_oauth_redirect("unsupported_provider")
    if provider_error:
        return _frontend_oauth_redirect("authorization_cancelled")
    if not code or not state_token or not oauth_state or not oauth_pkce:
        return _frontend_oauth_redirect("invalid_oauth_response")
    if not hmac.compare_digest(state_token, oauth_state):
        return _frontend_oauth_redirect("invalid_oauth_state")

    remember_me = oauth_remember == "1"
    session_policy = "persistent" if remember_me else "ephemeral"
    try:
        profile = await fetch_oauth_profile(provider, code, oauth_pkce)
        user = login_or_create_oauth_user(db, profile)
        refresh_token, _family_id = create_refresh_token(db, user, session_policy)
    except OAuthError as exc:
        return _frontend_oauth_redirect(exc.code)

    response = _frontend_oauth_redirect()
    _set_refresh_cookie(response, refresh_token, persistent=remember_me)
    return response


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_trusted_origin)])
def logout(response: Response, refresh_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    revoke_refresh_token(db, refresh_token)
    response.delete_cookie("refresh_token", path="/api/v1/auth")

@router.get("/me", response_model=UserResponse)
def me(current_user: UserResponse = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
def update_password(payload: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not change_password(db, current_user, payload.current_password, payload.new_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return {"message": "Password changed successfully"}


@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked_at.is_(None),
        RefreshToken.expires_at > datetime.utcnow(),
    ).order_by(RefreshToken.created_at.desc()).all()
    return {"data": [{"id": str(session.id), "created_at": session.created_at, "expires_at": session.expires_at} for session in sessions], "meta": {"total": len(sessions)}}


@router.post("/sessions/revoke-all")
def revoke_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"revoked": revoke_all_sessions(db, current_user.id)}


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(response: Response, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.delete(current_user)
    db.commit()
    response.delete_cookie("refresh_token", path="/api/v1/auth")


@router.get("/account/export")
def export_account(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prompts = db.query(Prompt).filter(Prompt.user_id == current_user.id).all()
    return {"user": {"username": current_user.username, "email": current_user.email}, "prompts": [{"title": p.title, "description": p.description, "prompt_content": p.prompt_content, "variables": p.variables or {}} for p in prompts]}
