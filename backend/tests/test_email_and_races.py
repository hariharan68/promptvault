"""§8 #7 (registration race hardening) and #8 (case-insensitive email) — step 7.

Run against a real Postgres (see conftest): the lower(email) unique index and the
concurrent-INSERT race cannot be exercised on SQLite.
"""
import threading
from concurrent.futures import ThreadPoolExecutor

import pytest
from sqlalchemy.exc import IntegrityError

from app.core.db_errors import is_unique_violation
from app.core.normalize import normalize_email
from app.models.user import User
from app.services.auth_service import hash_password


BASE = "/api/v1/auth"


def test_normalize_email_strips_and_lowercases():
    assert normalize_email("  User@Example.COM ") == "user@example.com"


# --- §8 #8: case-insensitive email -----------------------------------------

def test_register_stores_lowercased_email(client):
    res = client.post(
        f"{BASE}/register",
        json={"username": "casey", "email": "Casey@Example.com", "password": "Password123"},
    )
    assert res.status_code == 201
    assert res.json()["email"] == "casey@example.com"


@pytest.mark.parametrize("login_email", ["mixed@example.com", "Mixed@Example.com", "MIXED@EXAMPLE.COM"])
def test_login_is_case_insensitive(client, login_email):
    client.post(
        f"{BASE}/register",
        json={"username": "mixedcase", "email": "Mixed@Example.com", "password": "Password123"},
    )
    res = client.post(
        f"{BASE}/login",
        json={"email": login_email, "password": "Password123", "remember_me": False},
    )
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_duplicate_email_different_case_is_rejected(client):
    first = client.post(
        f"{BASE}/register",
        json={"username": "dupe1", "email": "dupe@example.com", "password": "Password123"},
    )
    assert first.status_code == 201
    second = client.post(
        f"{BASE}/register",
        json={"username": "dupe2", "email": "DUPE@Example.com", "password": "Password123"},
    )
    assert second.status_code == 409
    # Uniform message must not reveal which field collided.
    assert "email" in second.json()["detail"].lower() and "username" in second.json()["detail"].lower()


def test_lower_email_unique_index_is_enforced_at_db_level(db):
    """Bypass the endpoint pre-check to prove the index (not the SELECT) is the
    authority, and that the collision is classified as a unique violation."""
    db.add(User(username="idx1", email="idx@example.com", password_hash=hash_password("Password123")))
    db.commit()
    db.add(User(username="idx2", email="IDX@Example.com", password_hash=hash_password("Password123")))
    with pytest.raises(IntegrityError) as excinfo:
        db.commit()
    assert is_unique_violation(excinfo.value)
    db.rollback()


# --- §8 #7: concurrent duplicate registration ------------------------------

def test_concurrent_duplicate_registration_one_201_rest_409(client):
    """N concurrent identical registrations => exactly one 201, the rest 409,
    and never a 500 (the IntegrityError must be caught, not leaked)."""
    n = 5
    barrier = threading.Barrier(n)

    def attempt(i):
        barrier.wait()  # align the requests so they genuinely race on INSERT
        return client.post(
            f"{BASE}/register",
            json={"username": f"racer{i}", "email": "race@example.com", "password": "Password123"},
        ).status_code

    with ThreadPoolExecutor(max_workers=n) as pool:
        statuses = list(pool.map(attempt, range(n)))

    assert statuses.count(201) == 1, statuses
    assert statuses.count(409) == n - 1, statuses
    assert 500 not in statuses, statuses
