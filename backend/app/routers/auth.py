from datetime import datetime
import uuid
from urllib.parse import urlencode

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.csrf import require_trusted_origin
from app.core.db_errors import is_unique_violation
from app.core.dependencies import get_current_user, get_current_session_id
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, RegisterResponse, OAuthLinkConfirmRequest
from app.schemas.product import ChangePasswordRequest
from app.core.config import COOKIE_SECURE, OAUTH_FRONTEND_CALLBACK_URL, REFRESH_TOKEN_EXPIRE_DAYS
from app.core.rate_limit import enforce_rate_limit, client_ip
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
    OAuthLinkRequired,
    SUPPORTED_PROVIDERS,
    confirm_link_challenge,
    consume_oauth_transaction,
    create_link_challenge,
    fetch_oauth_profile,
    login_or_create_oauth_user,
    start_oauth_transaction,
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


def _frontend_oauth_redirect(error: str | None = None, status: str = "success") -> RedirectResponse:
    query = urlencode({"error": error}) if error else urlencode({"status": status})
    response = RedirectResponse(f"{OAUTH_FRONTEND_CALLBACK_URL}?{query}", status_code=302)
    response.headers["Cache-Control"] = "no-store"
    # Clear the legacy client-side OAuth cookies (state/pkce/remember) in case a
    # user is mid-flight across the deploy that moved this state server-side.
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
    refresh_token, family_id = create_refresh_token(
        db, user, session_policy,
        ip_created=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
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
def oauth_start(provider: str, request: Request, remember_me: bool = Query(default=False), db: Session = Depends(get_db)):
    enforce_rate_limit(request, f"oauth_start:{provider}", 20)
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=404, detail="Unsupported OAuth provider")
    try:
        # State, PKCE verifier, and the remember-me choice are persisted in a
        # server-side transaction row rather than round-tripped through cookies.
        authorization_url, _txn_id = start_oauth_transaction(db, provider, remember_me)
    except OAuthError as exc:
        return _frontend_oauth_redirect(exc.code)

    response = RedirectResponse(authorization_url, status_code=302)
    response.headers["Cache-Control"] = "no-store"
    return response


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    request: Request,
    code: str | None = Query(default=None),
    state_token: str | None = Query(default=None, alias="state"),
    provider_error: str | None = Query(default=None, alias="error"),
    db: Session = Depends(get_db),
):
    enforce_rate_limit(request, f"oauth_callback:{provider}", 10)
    if provider not in SUPPORTED_PROVIDERS:
        return _frontend_oauth_redirect("unsupported_provider")
    if provider_error:
        return _frontend_oauth_redirect("authorization_cancelled")
    if not code or not state_token:
        return _frontend_oauth_redirect("invalid_oauth_response")

    try:
        # Atomic single-use claim: rejects replay, expiry, and forged/unknown
        # state in one statement. verifier + remember_me come from the row.
        txn = consume_oauth_transaction(db, provider, state_token)
        session_policy = "persistent" if txn.remember_me else "ephemeral"
        profile = await fetch_oauth_profile(provider, code, txn.pkce_verifier)
        user = login_or_create_oauth_user(db, profile)
        refresh_token, _family_id = create_refresh_token(
            db, user, session_policy,
            ip_created=client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
    except OAuthLinkRequired as link:
        # Email matches an existing password account — do not link silently.
        # Stash a challenge and bounce the user to the confirm-password screen.
        challenge_id = create_link_challenge(
            db,
            user_id=link.user_id,
            provider=link.provider,
            provider_user_id=link.provider_user_id,
            email=link.email,
            remember_me=txn.remember_me,
        )
        response = _frontend_oauth_redirect(status="link_required")
        response.set_cookie(
            "link_challenge", str(challenge_id),
            httponly=True, secure=COOKIE_SECURE, samesite="lax",
            max_age=600, path="/api/v1/auth",
        )
        return response
    except OAuthError as exc:
        return _frontend_oauth_redirect(exc.code)

    response = _frontend_oauth_redirect()
    _set_refresh_cookie(response, refresh_token, persistent=txn.remember_me)
    return response


@router.post("/oauth/link/confirm", response_model=TokenResponse, dependencies=[Depends(require_trusted_origin)])
def oauth_link_confirm(
    request: Request,
    response: Response,
    payload: OAuthLinkConfirmRequest,
    link_challenge: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    enforce_rate_limit(request, "oauth_link_confirm", 5)
    if not link_challenge:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No pending link confirmation")
    try:
        confirmed = confirm_link_challenge(db, link_challenge, payload.password)
    except OAuthError:
        # Uniform 401 for wrong password / invalid / expired challenge.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not confirm — check your password and try again")

    session_policy = "persistent" if confirmed.remember_me else "ephemeral"
    refresh_token, family_id = create_refresh_token(
        db, confirmed.user, session_policy,
        ip_created=client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    access_token = create_login_token(confirmed.user, sid=family_id)
    _set_refresh_cookie(response, refresh_token, persistent=confirmed.remember_me)
    response.delete_cookie("link_challenge", path="/api/v1/auth")
    return {"access_token": access_token, "token_type": "bearer"}


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
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    current_sid: str | None = Depends(get_current_session_id),
):
    now = datetime.utcnow()
    # One entry per live family: the tip is the only token with neither
    # replaced_at nor revoked_at set, and it carries the inherited device metadata.
    tips = db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked_at.is_(None),
        RefreshToken.replaced_at.is_(None),
        RefreshToken.expires_at > now,
    ).all()

    # The family's original sign-in time is the earliest created_at in the family.
    first_seen = dict(
        db.query(RefreshToken.family_id, func.min(RefreshToken.created_at))
        .filter(RefreshToken.user_id == current_user.id)
        .group_by(RefreshToken.family_id)
        .all()
    )

    data = [
        {
            "family_id": str(tip.family_id),
            "current": str(tip.family_id) == current_sid,
            "device_label": tip.device_label,
            "ip": str(tip.ip_created) if tip.ip_created else None,
            "session_policy": tip.session_policy,
            "created_at": first_seen.get(tip.family_id, tip.created_at),
            "last_used_at": tip.last_used_at,
            "expires_at": tip.expires_at,
        }
        for tip in tips
    ]
    # Current device first, then most-recently-used.
    data.sort(key=lambda s: (0 if s["current"] else 1, -s["last_used_at"].timestamp()))
    return {"data": data, "meta": {"total": len(data)}}


@router.delete("/sessions/{family_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_session(
    family_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Scope to the caller's own families so one user can't revoke another's device.
    revoked = db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.family_id == family_id,
        RefreshToken.revoked_at.is_(None),
    ).update({RefreshToken.revoked_at: datetime.utcnow(), RefreshToken.revoke_reason: "user_revoked"})
    db.commit()
    if not revoked:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")


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
