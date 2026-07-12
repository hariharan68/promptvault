"""§8 items still pending. #5 (OAuth transaction replay) is now covered by
test_oauth_transactions.py and #7/#8 by test_email_and_races.py. Only #6 (the
hardened linking challenge) remains — it needs email-send capability (step 6,
§5.4) and is recorded here as a skip so the release-gate matrix stays complete.
"""
import pytest

pytestmark = pytest.mark.skip(reason="Depends on redesign step 6 (linking challenge — needs email infra) — not implemented yet")


def test_oauth_email_matching_password_account_requires_challenge():
    """§8 #6 — needs the hardened linking challenge (step 6, §5.4)."""
