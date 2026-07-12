"""Step 5 — server-side OAuth transactions (§5.1–5.3) and §8 #5 (replay ⇒ 401).

Postgres-backed. The atomic consume is exercised directly (deterministic) and
through the callback route with the provider profile fetch mocked out.
"""
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse

import pytest

from app.models.oauth_transaction import OAuthTransaction
from app.services.oauth_service import (
    OAuthError,
    OAuthProfile,
    consume_oauth_transaction,
)

BASE = "/api/v1/auth"


def _txn(db, *, state="state-abc", provider="google", remember_me=False, ttl_minutes=10, consumed=False):
    row = OAuthTransaction(
        provider=provider,
        state=state,
        pkce_verifier="verifier-xyz",
        remember_me=remember_me,
        expires_at=datetime.utcnow() + timedelta(minutes=ttl_minutes),
        consumed_at=datetime.utcnow() if consumed else None,
    )
    db.add(row)
    db.commit()
    return row


# --- consume: the atomic single-use claim ----------------------------------

def test_consume_returns_row_then_rejects_replay(db):
    _txn(db, state="s1", remember_me=True)

    first = consume_oauth_transaction(db, "google", "s1")
    assert first.pkce_verifier == "verifier-xyz"
    assert first.remember_me is True

    # §8 #5: replaying the same state must fail — the row is already consumed.
    with pytest.raises(OAuthError) as exc:
        consume_oauth_transaction(db, "google", "s1")
    assert exc.value.code == "invalid_oauth_transaction"


def test_consume_rejects_expired_transaction(db):
    _txn(db, state="s2", ttl_minutes=-1)
    with pytest.raises(OAuthError):
        consume_oauth_transaction(db, "google", "s2")


def test_consume_rejects_unknown_state(db):
    with pytest.raises(OAuthError):
        consume_oauth_transaction(db, "google", "does-not-exist")


def test_consume_rejects_provider_mismatch(db):
    _txn(db, state="s3", provider="google")
    with pytest.raises(OAuthError):
        consume_oauth_transaction(db, "github", "s3")


# --- start: redirect + persisted transaction -------------------------------

def test_oauth_start_persists_transaction_and_redirects(client, db, monkeypatch):
    monkeypatch.setattr("app.services.oauth_service.GOOGLE_CLIENT_ID", "client-id")
    monkeypatch.setattr("app.services.oauth_service.GOOGLE_CLIENT_SECRET", "client-secret")
    monkeypatch.setattr("app.services.oauth_service.GOOGLE_REDIRECT_URI", "http://localhost/callback")

    res = client.get(f"{BASE}/oauth/google/start?remember_me=true", follow_redirects=False)
    assert res.status_code == 302

    location = res.headers["location"]
    assert location.startswith("https://accounts.google.com/")
    query = parse_qs(urlparse(location).query)
    assert query["prompt"] == ["select_account"]  # kills silent re-auth

    row = db.query(OAuthTransaction).filter(OAuthTransaction.state == query["state"][0]).first()
    assert row is not None
    assert row.remember_me is True
    assert row.consumed_at is None


# --- callback: full flow + replay at the route level -----------------------

def test_callback_succeeds_then_replay_is_rejected(client, db, monkeypatch):
    _txn(db, state="callback-state", provider="google", remember_me=False)

    async def fake_profile(provider, code, verifier):
        assert verifier == "verifier-xyz"  # verifier came from the DB row
        return OAuthProfile(
            provider="google",
            provider_user_id="google-123",
            email="oauthuser@example.com",
            email_verified=True,
            username="oauthuser",
        )

    monkeypatch.setattr("app.routers.auth.fetch_oauth_profile", fake_profile)

    first = client.get(
        f"{BASE}/oauth/google/callback?code=abc&state=callback-state",
        follow_redirects=False,
    )
    assert first.status_code == 302
    assert "status=success" in first.headers["location"]
    assert first.cookies.get("refresh_token")  # session issued

    # §8 #5: a replayed callback with the same state is rejected (row consumed).
    second = client.get(
        f"{BASE}/oauth/google/callback?code=abc&state=callback-state",
        follow_redirects=False,
    )
    assert second.status_code == 302
    error = parse_qs(urlparse(second.headers["location"]).query).get("error")
    assert error == ["invalid_oauth_transaction"]
