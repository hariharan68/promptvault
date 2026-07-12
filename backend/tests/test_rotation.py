"""§8 #1 (rotation atomicity + reuse), #4 (logout), #9 (token_version)."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

from sqlalchemy import text


def test_concurrent_refresh_yields_exactly_one_success(auth, client):
    res = auth.signup_and_login()
    cookie = auth.cookie(res)

    def do_refresh():
        return client.post("/api/v1/auth/refresh", cookies={"refresh_token": cookie}).status_code

    with ThreadPoolExecutor(max_workers=6) as pool:
        statuses = list(pool.map(lambda _: do_refresh(), range(6)))

    # Exactly one caller may consume a given token; the rest get 401.
    assert statuses.count(200) == 1
    assert statuses.count(401) == 5


def test_multitab_race_within_grace_does_not_kill_family(auth, client, db):
    res = auth.signup_and_login()
    c0 = auth.cookie(res)

    r1 = auth.refresh(c0)
    assert r1.status_code == 200
    c1 = auth.cookie(r1)

    # Reusing c0 immediately (inside the grace window) is treated as a benign race:
    # 401, but the family survives and c1 still works.
    assert auth.refresh(c0).status_code == 401
    assert auth.refresh(c1).status_code == 200

    events = db.execute(text("SELECT count(*) FROM security_events WHERE event_type='refresh_token_reuse'")).scalar()
    assert events == 0


def test_reuse_after_grace_revokes_family_and_logs_event(auth, client, db):
    res = auth.signup_and_login()
    c0 = auth.cookie(res)

    r1 = auth.refresh(c0)
    assert r1.status_code == 200
    c1 = auth.cookie(r1)

    # Simulate a token rotated long ago (outside the grace window) being replayed.
    db.execute(text("UPDATE refresh_tokens SET replaced_at = :t WHERE replaced_at IS NOT NULL"),
               {"t": datetime.utcnow() - timedelta(seconds=60)})
    db.commit()

    assert auth.refresh(c0).status_code == 401          # theft signal
    # Whole family is now dead — the legitimate successor is revoked too.
    assert auth.refresh(c1).status_code == 401

    events = db.execute(text("SELECT count(*) FROM security_events WHERE event_type='refresh_token_reuse'")).scalar()
    assert events == 1
    live = db.execute(text("SELECT count(*) FROM refresh_tokens WHERE revoked_at IS NULL")).scalar()
    assert live == 0


def test_logout_revokes_family_and_clears_cookie(auth, client):
    res = auth.signup_and_login()
    cookie = auth.cookie(res)

    logout = client.post("/api/v1/auth/logout", cookies={"refresh_token": cookie}, headers=auth.bearer(res))
    assert logout.status_code == 204
    set_cookie = logout.headers.get("set-cookie", "")
    assert "refresh_token=" in set_cookie  # deletion header present

    assert auth.refresh(cookie).status_code == 401


def test_token_version_bump_invalidates_access_token(auth, client):
    res = auth.signup_and_login()
    headers = auth.bearer(res)
    cookie = auth.cookie(res)

    assert client.get("/api/v1/auth/me", headers=headers).status_code == 200

    # revoke-all bumps token_version and kills every family.
    assert client.post("/api/v1/auth/sessions/revoke-all", headers=headers).status_code == 200

    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401
    assert auth.refresh(cookie).status_code == 401
