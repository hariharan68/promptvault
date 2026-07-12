"""§8 #2 (ephemeral idle timeout) and #3 (cookie attributes per policy)."""
from datetime import datetime, timedelta

from sqlalchemy import text


def _age_last_used(db, minutes):
    db.execute(text("UPDATE refresh_tokens SET last_used_at = :t WHERE replaced_at IS NULL"),
               {"t": datetime.utcnow() - timedelta(minutes=minutes)})
    db.commit()


def test_ephemeral_session_idles_out(auth, db):
    res = auth.signup_and_login(remember_me=False)
    cookie = auth.cookie(res)

    _age_last_used(db, 31)  # past the 30-min idle timeout
    assert auth.refresh(cookie).status_code == 401


def test_persistent_session_survives_idle(auth, db):
    res = auth.signup_and_login(remember_me=True)
    cookie = auth.cookie(res)

    _age_last_used(db, 31)  # persistent policy ignores idleness
    assert auth.refresh(cookie).status_code == 200


def test_persistent_cookie_has_max_age(auth):
    res = auth.signup_and_login(remember_me=True)
    set_cookie = res.headers.get("set-cookie", "").lower()
    assert "httponly" in set_cookie
    assert "samesite=lax" in set_cookie
    assert "path=/api/v1/auth" in set_cookie
    assert "max-age=" in set_cookie


def test_ephemeral_cookie_is_session_cookie(auth):
    res = auth.signup_and_login(remember_me=False)
    set_cookie = res.headers.get("set-cookie", "").lower()
    assert "httponly" in set_cookie
    assert "path=/api/v1/auth" in set_cookie
    assert "max-age=" not in set_cookie  # session cookie — no lifetime
