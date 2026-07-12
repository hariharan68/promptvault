# PromptNest Hardening Changes

## Environment

Copy `backend/.env.example` to the backend environment and set a unique random
`SECRET_KEY`. Production must set `COOKIE_SECURE=true` and use HTTPS. CORS origins
are configured through `CORS_ORIGINS`.

## Database migrations

From the `backend` directory:

```powershell
uv sync
uv run alembic upgrade head
```

The migration creates refresh-token storage, per-user group/tag uniqueness, and
prompt/dashboard indexes. Future schema changes should be added as new revisions.

## API contract changes

`GET /api/v1/prompts/` now returns:

```json
{
  "items": [],
  "page": 1,
  "page_size": 25,
  "total": 0,
  "has_next": false
}
```

Use `page` and `page_size` query parameters. Dashboard data is available from
`GET /api/v1/dashboard/stats` and `GET /api/v1/dashboard/recent`.

## Authentication

Login issues a short-lived access token and an HttpOnly refresh-token cookie.
`POST /api/v1/auth/refresh` rotates the refresh token. `POST /api/v1/auth/logout`
revokes the current refresh token and clears the cookie. Login and registration
are rate-limited per client IP.
