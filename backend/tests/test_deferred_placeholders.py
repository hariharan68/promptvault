"""§8 items still pending. #7 (race hardening) and #8 (email case) are implemented
by step 7 and now live in test_email_and_races.py. #5 (OAuth transaction replay)
and #6 (linking challenge) remain scheduled for steps 5–6 and are recorded here as
skips so the release-gate matrix stays complete.
"""
import pytest

pytestmark = pytest.mark.skip(reason="Depends on redesign steps 5–6 (OAuth transactions / linking challenge) — not implemented yet")


def test_oauth_callback_replay_returns_401():
    """§8 #5 — needs the server-side oauth_transactions table (step 5, §5.1)."""


def test_oauth_email_matching_password_account_requires_challenge():
    """§8 #6 — needs the hardened linking challenge (step 6, §5.4)."""
