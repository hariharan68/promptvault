"""Shared fixtures for the auth integration suite.

These tests run against a REAL Postgres database (the atomic `UPDATE ... RETURNING`
rotation, UUID columns, and partial indexes cannot run on SQLite). Point
TEST_DATABASE_URL at an empty, disposable database, e.g.:

    $env:TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/promptvault_test"

If TEST_DATABASE_URL is unset, the DB-backed tests skip (the config-guard unit test
still runs, since it needs no database).
"""
import os

import pytest

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")


@pytest.fixture(scope="session")
def engine():
    if not TEST_DATABASE_URL:
        pytest.skip("TEST_DATABASE_URL not set — Postgres integration tests skipped")
    from sqlalchemy import create_engine
    import app.models  # noqa: F401  register every model on Base.metadata
    from app.database import Base

    eng = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    Base.metadata.drop_all(bind=eng)
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)
    eng.dispose()


@pytest.fixture()
def session_factory(engine):
    from sqlalchemy.orm import sessionmaker

    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db(session_factory):
    s = session_factory()
    try:
        yield s
    finally:
        s.close()


@pytest.fixture()
def client(engine, session_factory):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.database import Base, get_db
    from app.core.rate_limit import _requests

    # Clean slate between tests: wipe rows AND the in-memory rate-limit buckets
    # (module-level global state that would otherwise 429 later tests).
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
    _requests.clear()

    def override_get_db():
        s = session_factory()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        # Mirror a real browser: fetch/XHR POSTs always carry an Origin. The
        # cookie-authed endpoints (/auth/refresh, /auth/logout) now require a
        # trusted one, so default every request to the first trusted origin.
        from app.core.config import TRUSTED_ORIGINS

        c.headers.update({"origin": TRUSTED_ORIGINS[0]})
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def auth(client):
    """Helper to register + login and expose the refresh cookie + access token."""

    class AuthHelper:
        base = "/api/v1/auth"

        def register(self, username="user1", email="user1@example.com", password="Password123"):
            return client.post(
                f"{self.base}/register",
                json={"username": username, "email": email, "password": password},
            )

        def login(self, email="user1@example.com", password="Password123", remember_me=True):
            return client.post(
                f"{self.base}/login",
                json={"email": email, "password": password, "remember_me": remember_me},
            )

        def signup_and_login(self, remember_me=True, **kw):
            self.register(**{k: kw[k] for k in ("username", "email", "password") if k in kw})
            email = kw.get("email", "user1@example.com")
            password = kw.get("password", "Password123")
            res = self.login(email=email, password=password, remember_me=remember_me)
            return res

        def refresh(self, refresh_token):
            return client.post(f"{self.base}/refresh", cookies={"refresh_token": refresh_token})

        @staticmethod
        def cookie(res):
            return res.cookies.get("refresh_token")

        @staticmethod
        def bearer(res):
            return {"Authorization": f"Bearer {res.json()['access_token']}"}

    return AuthHelper()
