"""Step 6 — OAuth account-linking challenge (§5.4, §8 #6, password-confirm variant).

An OAuth login whose email matches an existing password account must NOT be
linked silently; the user proves control by re-entering the account password.
Postgres-backed (see conftest).
"""
from datetime import datetime, timedelta

import pytest

from app.core.security import hash_password
from app.models.oauth_account import OAuthAccount
from app.models.oauth_transaction import OAuthTransaction
from app.models.user import User
from app.services.oauth_service import (
    OAuthError,
    OAuthLinkRequired,
    OAuthProfile,
    confirm_link_challenge,
    create_link_challenge,
    login_or_create_oauth_user,
)

BASE = "/api/v1/auth"


def _password_user(db, email="owner@example.com", username="owner", password="Password123"):
    u = User(username=username, email=email, password_hash=hash_password(password))
    db.add(u)
    db.commit()
    return u


# --- service: conflict detection -------------------------------------------

def test_oauth_matching_password_account_requires_challenge_not_silent_link(db):
    _password_user(db, email="owner@example.com")
    profile = OAuthProfile("google", "g-123", "owner@example.com", True, "owner")

    with pytest.raises(OAuthLinkRequired) as exc:
        login_or_create_oauth_user(db, profile)
    assert exc.value.provider == "google"
    assert exc.value.provider_user_id == "g-123"

    # Crucially, nothing was linked.
    assert db.query(OAuthAccount).count() == 0


def test_confirm_with_correct_password_links_and_consumes(db):
    user = _password_user(db, email="link@example.com")
    challenge_id = create_link_challenge(
        db, user_id=user.id, provider="google", provider_user_id="g-9",
        email="link@example.com", remember_me=True,
    )

    result = confirm_link_challenge(db, str(challenge_id), "Password123")
    assert result.user.id == user.id
    assert result.remember_me is True

    link = db.query(OAuthAccount).filter(OAuthAccount.user_id == user.id).one()
    assert link.provider == "google" and link.provider_user_id == "g-9"

    # Replay of the (now consumed) challenge fails.
    with pytest.raises(OAuthError):
        confirm_link_challenge(db, str(challenge_id), "Password123")


def test_confirm_with_wrong_password_is_rejected_and_not_consumed(db):
    user = _password_user(db, email="wrong@example.com")
    challenge_id = create_link_challenge(
        db, user_id=user.id, provider="github", provider_user_id="gh-1",
        email="wrong@example.com", remember_me=False,
    )

    with pytest.raises(OAuthError) as exc:
        confirm_link_challenge(db, str(challenge_id), "not-the-password")
    assert exc.value.code == "invalid_link_credentials"
    assert db.query(OAuthAccount).count() == 0

    # Still usable: the correct password now succeeds.
    result = confirm_link_challenge(db, str(challenge_id), "Password123")
    assert result.user.id == user.id


def test_confirm_expired_challenge_fails(db):
    user = _password_user(db, email="expired@example.com")
    challenge_id = create_link_challenge(
        db, user_id=user.id, provider="google", provider_user_id="g-x",
        email="expired@example.com", remember_me=False,
    )
    # Force expiry.
    from app.models.link_challenge import LinkChallenge
    db.query(LinkChallenge).filter(LinkChallenge.challenge_id == challenge_id).update(
        {LinkChallenge.expires_at: datetime.utcnow() - timedelta(minutes=1)}
    )
    db.commit()

    with pytest.raises(OAuthError):
        confirm_link_challenge(db, str(challenge_id), "Password123")


def test_oauth_only_account_different_provider_is_not_linked(db):
    # An OAuth-only account (no password) matched by a *different* provider must
    # not be silently linked either — there's no way to prove control here.
    u = User(username="oauthonly", email="oo@example.com", password_hash=None)
    db.add(u)
    db.commit()
    profile = OAuthProfile("github", "gh-77", "oo@example.com", True, "oo")

    with pytest.raises(OAuthError) as exc:
        login_or_create_oauth_user(db, profile)
    assert exc.value.code == "account_exists_use_original_provider"


# --- router: full callback → confirm flow ----------------------------------

def test_callback_bounces_to_link_then_confirm_issues_session(client, db, monkeypatch):
    client.post(
        f"{BASE}/register",
        json={"username": "router", "email": "router@example.com", "password": "Password123"},
    )
    db.add(OAuthTransaction(
        provider="google", state="link-state", pkce_verifier="v",
        remember_me=True, expires_at=datetime.utcnow() + timedelta(minutes=10),
    ))
    db.commit()

    async def fake_profile(provider, code, verifier):
        return OAuthProfile("google", "g-router", "router@example.com", True, "router")

    monkeypatch.setattr("app.routers.auth.fetch_oauth_profile", fake_profile)

    cb = client.get(f"{BASE}/oauth/google/callback?code=abc&state=link-state", follow_redirects=False)
    assert cb.status_code == 302
    assert "status=link_required" in cb.headers["location"]
    assert client.cookies.get("link_challenge")           # challenge cookie set
    assert db.query(OAuthAccount).count() == 0             # not linked yet

    confirmed = client.post(f"{BASE}/oauth/link/confirm", json={"password": "Password123"})
    assert confirmed.status_code == 200
    assert confirmed.json()["access_token"]
    assert confirmed.cookies.get("refresh_token")          # session issued
    assert db.query(OAuthAccount).count() == 1             # now linked


def test_confirm_with_bad_password_returns_401(client, db, monkeypatch):
    client.post(
        f"{BASE}/register",
        json={"username": "router2", "email": "router2@example.com", "password": "Password123"},
    )
    db.add(OAuthTransaction(
        provider="google", state="link-state-2", pkce_verifier="v",
        remember_me=False, expires_at=datetime.utcnow() + timedelta(minutes=10),
    ))
    db.commit()

    async def fake_profile(provider, code, verifier):
        return OAuthProfile("google", "g-router2", "router2@example.com", True, "router2")

    monkeypatch.setattr("app.routers.auth.fetch_oauth_profile", fake_profile)
    client.get(f"{BASE}/oauth/google/callback?code=abc&state=link-state-2", follow_redirects=False)

    bad = client.post(f"{BASE}/oauth/link/confirm", json={"password": "wrong-password"})
    assert bad.status_code == 401
    assert db.query(OAuthAccount).count() == 0
