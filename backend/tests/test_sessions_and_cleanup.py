"""Step 10 — sessions UI (GET one-per-family + DELETE per-device) and the token
cleanup job. Postgres-backed (see conftest)."""
import secrets
import uuid
from datetime import datetime, timedelta

import pytest

from app.core.security import hash_password
from app.models.oauth_transaction import OAuthTransaction
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services.auth_service import device_label_from_user_agent
from app.jobs.token_cleanup import run_cleanup, LEAK_ALERT_THRESHOLD

BASE = "/api/v1/auth"


# --- device label helper ---------------------------------------------------

@pytest.mark.parametrize("ua,expected", [
    ("Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537", "Chrome on Windows"),
    ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604", "Safari on iOS"),
    ("Mozilla/5.0 (X11; Linux x86_64) Firefox/121", "Firefox on Linux"),
    ("", None),
    (None, None),
])
def test_device_label_from_user_agent(ua, expected):
    assert device_label_from_user_agent(ua) == expected


# --- GET /auth/sessions ----------------------------------------------------

def test_sessions_lists_current_with_metadata(auth, client):
    res = client.post(
        f"{BASE}/register",
        json={"username": "sess1", "email": "sess1@example.com", "password": "Password123"},
    )
    assert res.status_code == 201
    login = client.post(
        f"{BASE}/login",
        json={"email": "sess1@example.com", "password": "Password123", "remember_me": True},
        headers={"user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537"},
    )
    listing = client.get(f"{BASE}/sessions", headers=auth.bearer(login)).json()
    assert listing["meta"]["total"] == 1
    entry = listing["data"][0]
    assert entry["current"] is True
    assert entry["device_label"] == "Chrome on Windows"
    assert entry["session_policy"] == "persistent"


def test_sessions_one_entry_per_family_survives_rotation(auth, client):
    res = auth.signup_and_login()
    cookie = auth.cookie(res)
    # Rotate a few times; the family must still appear as a single session.
    r1 = auth.refresh(cookie)
    assert r1.status_code == 200
    listing = client.get(f"{BASE}/sessions", headers=auth.bearer(r1)).json()
    assert listing["meta"]["total"] == 1
    assert listing["data"][0]["current"] is True


def test_two_logins_show_two_sessions_one_current(auth, client):
    auth.register()
    first = auth.login()
    second = auth.login()
    listing = client.get(f"{BASE}/sessions", headers=auth.bearer(second)).json()
    assert listing["meta"]["total"] == 2
    assert sum(1 for s in listing["data"] if s["current"]) == 1
    assert listing["data"][0]["current"] is True  # current sorted first


# --- DELETE /auth/sessions/{family_id} -------------------------------------

def test_delete_revokes_other_device(auth, client):
    auth.register()
    first = auth.login()
    second = auth.login()
    listing = client.get(f"{BASE}/sessions", headers=auth.bearer(second)).json()
    other = next(s for s in listing["data"] if not s["current"])

    deleted = client.delete(f"{BASE}/sessions/{other['family_id']}", headers=auth.bearer(second))
    assert deleted.status_code == 204

    after = client.get(f"{BASE}/sessions", headers=auth.bearer(second)).json()
    assert after["meta"]["total"] == 1
    # The revoked family's refresh token can no longer rotate.
    assert auth.refresh(auth.cookie(first)).status_code == 401


def test_delete_unknown_session_returns_404(auth, client):
    res = auth.signup_and_login()
    missing = client.delete(f"{BASE}/sessions/{uuid.uuid4()}", headers=auth.bearer(res))
    assert missing.status_code == 404


# --- cleanup job -----------------------------------------------------------

def _user(db, email="cleanup@example.com", username="cleanup"):
    u = User(username=username, email=email, password_hash=hash_password("Password123"))
    db.add(u)
    db.commit()
    return u


def _rt(db, user_id, **kw):
    now = datetime.utcnow()
    defaults = dict(
        token_hash=secrets.token_hex(16),
        family_id=uuid.uuid4(),
        session_policy="persistent",
        expires_at=now + timedelta(days=30),
        last_used_at=now,
        created_at=now,
    )
    defaults.update(kw)
    row = RefreshToken(user_id=user_id, **defaults)
    db.add(row)
    db.commit()
    return row


def test_cleanup_purges_old_and_keeps_live(db):
    u = _user(db)
    old = datetime.utcnow() - timedelta(days=40)
    _rt(db, u.id, revoked_at=old, created_at=old)                 # long-revoked → delete
    _rt(db, u.id, expires_at=old, created_at=old)                 # long-expired → delete
    live = _rt(db, u.id)                                          # live → keep

    result = run_cleanup(db)
    assert result.deleted_refresh_tokens == 2

    remaining = db.query(RefreshToken).filter(RefreshToken.user_id == u.id).all()
    assert [r.id for r in remaining] == [live.id]


def test_cleanup_sweeps_expired_oauth_transactions(db):
    db.add(OAuthTransaction(
        provider="google", state="expired-txn", pkce_verifier="v",
        expires_at=datetime.utcnow() - timedelta(minutes=1),
    ))
    db.add(OAuthTransaction(
        provider="google", state="live-txn", pkce_verifier="v",
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    ))
    db.commit()

    result = run_cleanup(db)
    assert result.deleted_oauth_transactions == 1
    assert db.query(OAuthTransaction).filter(OAuthTransaction.state == "live-txn").first() is not None


def test_cleanup_flags_leak_suspects(db, monkeypatch):
    monkeypatch.setattr("app.jobs.token_cleanup.LEAK_ALERT_THRESHOLD", 2)
    u = _user(db, email="leak@example.com", username="leaky")
    for _ in range(3):
        _rt(db, u.id)  # 3 live families > threshold of 2

    result = run_cleanup(db)
    assert (str(u.id), 3) in result.leak_suspects
