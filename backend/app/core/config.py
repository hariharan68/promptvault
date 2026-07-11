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
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
CORS_ORIGINS = csv_env(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
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
