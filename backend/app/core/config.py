import os
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env explicitly so config is self-sufficient regardless of which
# module imports it first or what the current working directory is.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
IS_PRODUCTION = ENVIRONMENT in {"production", "prod"}


def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} environment variable is required")
    return value


def csv_env(name: str, default: str) -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


DATABASE_URL = required_env("DATABASE_URL")
SECRET_KEY = required_env("SECRET_KEY")

# Refuse to boot in production with a weak or placeholder signing secret — a
# guessable SECRET_KEY lets anyone forge access tokens for any account.
_WEAK_SECRETS = {
    "local-development-only-change-before-deployment",
    "generate-a-64-character-random-secret",
    "your-long-random-production-secret",
    "changeme",
    "secret",
}
if IS_PRODUCTION and (SECRET_KEY.strip().lower() in _WEAK_SECRETS or len(SECRET_KEY) < 32):
    raise RuntimeError(
        "SECRET_KEY must be a strong, unique value of at least 32 characters in production."
    )

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
# Access tokens live in browser memory only and are refreshed on every page load,
# so a short ceiling is cheap. 5 minutes bounds the damage of an in-flight leak.
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "5"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

# Ephemeral ("do not remember me") sessions are enforced server-side: a session
# idles out after IDLE_TIMEOUT_MINUTES of no requests, and is capped absolutely at
# EPHEMERAL_ABSOLUTE_CAP_HOURS regardless of activity. The client cannot reliably
# detect "browser closed", so the server clock is the authority.
IDLE_TIMEOUT_MINUTES = int(os.getenv("IDLE_TIMEOUT_MINUTES", "30"))
EPHEMERAL_ABSOLUTE_CAP_HOURS = int(os.getenv("EPHEMERAL_ABSOLUTE_CAP_HOURS", "12"))
CORS_ORIGINS = csv_env(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
# Origins allowed to drive the cookie-authenticated, state-changing endpoints
# (/auth/refresh, /auth/logout). Same set as CORS by default; kept as its own
# name so CSRF policy can diverge from CORS later without confusion.
TRUSTED_ORIGINS = tuple(origin.rstrip("/") for origin in CORS_ORIGINS)
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"

# Trust X-Forwarded-For for the client IP. Only enable this behind a reverse
# proxy you control, otherwise clients can spoof their IP to dodge rate limits.
TRUST_PROXY = os.getenv("TRUST_PROXY", "false").strip().lower() == "true"

# Interactive API docs (Swagger / ReDoc). Disabled by default in production.
ENABLE_DOCS = os.getenv(
    "ENABLE_DOCS", "false" if IS_PRODUCTION else "true"
).strip().lower() == "true"

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000").rstrip("/")
OAUTH_FRONTEND_CALLBACK_URL = os.getenv(
    "OAUTH_FRONTEND_CALLBACK_URL",
    f"{FRONTEND_URL}/oauth/callback",
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://127.0.0.1:8000/api/v1/auth/oauth/google/callback",
)

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv(
    "GITHUB_REDIRECT_URI",
    "http://127.0.0.1:8000/api/v1/auth/oauth/github/callback",
)


# Fail fast in production rather than silently shipping an insecure deployment.
# A process that refuses to boot is infinitely easier to notice than a cookie
# quietly sent over HTTP or a half-configured OAuth provider.
if IS_PRODUCTION:
    _problems: list[str] = []
    if not COOKIE_SECURE:
        _problems.append("COOKIE_SECURE must be true in production")
    for _name, _id, _secret, _redirect in (
        ("Google", GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI),
        ("GitHub", GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI),
    ):
        # A provider is "in use" once its client id/secret is set. Only then do we
        # demand a complete, https redirect — the default http://127.0.0.1 redirect
        # is harmless when the provider is disabled.
        if any((_id, _secret)):
            if not all((_id, _secret, _redirect)):
                _problems.append(f"{_name} OAuth is partially configured (need client id, secret, and redirect URI)")
            elif _redirect.startswith("http://"):
                _problems.append(f"{_name} OAuth redirect URI must use https in production")
    if _problems:
        raise RuntimeError("Refusing to start: " + "; ".join(_problems))
