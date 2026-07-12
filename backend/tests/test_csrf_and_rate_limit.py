"""Step 8 — CSRF origin check (§6.2) on /auth/refresh & /auth/logout, and the
expanded rate limits (§6.6). Postgres-backed (see conftest)."""
from app.core.config import TRUSTED_ORIGINS


BASE = "/api/v1/auth"
UNTRUSTED = "https://evil.example.com"
# A lookalike that would defeat a naive startswith() check but not an exact match.
LOOKALIKE = f"{TRUSTED_ORIGINS[0]}.evil.example.com"


def test_refresh_rejects_untrusted_origin(auth, client):
    res = auth.signup_and_login()
    cookie = auth.cookie(res)
    r = client.post(f"{BASE}/refresh", cookies={"refresh_token": cookie}, headers={"origin": UNTRUSTED})
    assert r.status_code == 403


def test_refresh_rejects_lookalike_origin(auth, client):
    res = auth.signup_and_login()
    cookie = auth.cookie(res)
    r = client.post(f"{BASE}/refresh", cookies={"refresh_token": cookie}, headers={"origin": LOOKALIKE})
    assert r.status_code == 403


def test_refresh_rejects_missing_origin_and_referer(auth, client):
    res = auth.signup_and_login()
    cookie = auth.cookie(res)
    # Explicitly blank both headers (the client default sets Origin otherwise).
    r = client.post(
        f"{BASE}/refresh",
        cookies={"refresh_token": cookie},
        headers={"origin": "", "referer": ""},
    )
    assert r.status_code == 403


def test_refresh_accepts_referer_when_origin_absent(auth, client):
    res = auth.signup_and_login()
    cookie = auth.cookie(res)
    r = client.post(
        f"{BASE}/refresh",
        cookies={"refresh_token": cookie},
        headers={"origin": "", "referer": f"{TRUSTED_ORIGINS[0]}/dashboard"},
    )
    assert r.status_code == 200


def test_logout_rejects_untrusted_origin(auth, client):
    res = auth.signup_and_login()
    cookie = auth.cookie(res)
    r = client.post(f"{BASE}/logout", cookies={"refresh_token": cookie}, headers={"origin": UNTRUSTED})
    assert r.status_code == 403
    # The session must survive a rejected (forged) logout.
    assert auth.refresh(cookie).status_code == 200


def test_refresh_rate_limited_after_20(auth, client):
    res = auth.signup_and_login()
    cookie = auth.cookie(res)
    # Reuse of a rotated token yields 401, but the rate limiter counts every hit;
    # the 21st request in the window must be 429 regardless of auth outcome.
    statuses = [
        client.post(f"{BASE}/refresh", cookies={"refresh_token": cookie}).status_code
        for _ in range(21)
    ]
    assert 429 in statuses
    assert statuses[-1] == 429


def test_login_per_account_limited_across_rotating_ips(auth, client, monkeypatch):
    # Trust the forwarded-IP header so each attempt looks like a different source
    # IP — that defeats the per-IP limit (5) and isolates the per-account bucket.
    monkeypatch.setattr("app.core.rate_limit.TRUST_PROXY", True)
    auth.register()

    statuses = []
    for i in range(11):
        statuses.append(
            client.post(
                f"{BASE}/login",
                json={"email": "user1@example.com", "password": "wrong-password", "remember_me": False},
                headers={"x-forwarded-for": f"203.0.113.{i}"},
            ).status_code
        )

    # First 10 are 401 (wrong password, but allowed through); the 11th trips the
    # per-account limit even though every request came from a distinct IP.
    assert statuses[:10] == [401] * 10
    assert statuses[10] == 429
