import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))
os.environ.setdefault("DATABASE_URL", "postgresql://unused:unused@localhost/unused")
os.environ.setdefault("SECRET_KEY", "unit-test-secret-key-that-is-not-used-in-production")

from app.services.oauth_service import (  # noqa: E402
    OAuthError,
    OAuthProfile,
    create_authorization_request,
    login_or_create_oauth_user,
)


class OAuthServiceTests(unittest.TestCase):
    def test_google_authorization_uses_state_and_pkce(self):
        with (
            patch("app.services.oauth_service.GOOGLE_CLIENT_ID", "client-id"),
            patch("app.services.oauth_service.GOOGLE_CLIENT_SECRET", "client-secret"),
            patch("app.services.oauth_service.GOOGLE_REDIRECT_URI", "http://localhost/callback"),
        ):
            url, state, verifier = create_authorization_request("google")

        query = parse_qs(urlparse(url).query)
        self.assertEqual(query["state"], [state])
        self.assertEqual(query["code_challenge_method"], ["S256"])
        self.assertNotEqual(query["code_challenge"][0], verifier)
        self.assertEqual(query["redirect_uri"], ["http://localhost/callback"])

    def test_github_authorization_requests_only_identity_scopes(self):
        with (
            patch("app.services.oauth_service.GITHUB_CLIENT_ID", "client-id"),
            patch("app.services.oauth_service.GITHUB_CLIENT_SECRET", "client-secret"),
            patch("app.services.oauth_service.GITHUB_REDIRECT_URI", "http://localhost/callback"),
        ):
            url, _, _ = create_authorization_request("github")

        query = parse_qs(urlparse(url).query)
        self.assertEqual(query["scope"], ["read:user user:email"])

    def test_unverified_email_is_rejected_before_database_access(self):
        profile = OAuthProfile("google", "123", "person@example.com", False, "person")
        with self.assertRaises(OAuthError) as error:
            login_or_create_oauth_user(None, profile)
        self.assertEqual(error.exception.code, "verified_email_required")


if __name__ == "__main__":
    unittest.main()
