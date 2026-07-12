# Security Document
# PromptNest

**Version:** 2.0
**Date:** 2026-07-11

---

## 1. Security Overview

PromptNest is a personal prompt management application with user authentication and strict user-scoped data isolation. This document describes the security controls currently implemented, the residual risks, and the checklist for production.

The current build has been through a security hardening pass. Most items previously listed as "required fixes" are now implemented; see §7 for what remains.

---

## 2. Authentication Security

### 2.1 Password Hashing

**Implementation:** `app/core/security.py`

- Passwords hashed with **bcrypt** via passlib (`CryptContext(schemes=["bcrypt"])`).
- `bcrypt` is pinned to `<4.1` in `pyproject.toml` for passlib compatibility (newer bcrypt breaks passlib's backend).
- The **72-byte bcrypt limit** is enforced explicitly on both hash and verify.
- **Server-side password policy** (Pydantic): `password` must be **8–72 characters**; `username` must be **3–50 chars** matching `[A-Za-z0-9_]`. This is enforced in the API, not just the UI, so it cannot be bypassed by calling the endpoint directly.

**Status:** ✅ Implemented.

---

### 2.2 JWT Access Tokens

**Implementation:** `app/core/security.py`, `app/core/config.py`

- `SECRET_KEY` is loaded from the environment (`required_env`) — **never hardcoded**.
- In `ENVIRONMENT=production`, the app **refuses to start** if `SECRET_KEY` is a known placeholder or shorter than 32 characters.
- Algorithm `HS256`, access-token lifetime 30 minutes (configurable).

**JWT payload:**
```json
{
  "sub": "<user-uuid>",
  "email": "user@example.com",
  "ver": 0,
  "iat": 1720521600,
  "nbf": 1720521600,
  "exp": 1720523400
}
```

- `sub` is the user's UUID (stable identifier).
- `iat` / `nbf` / `exp` are all set; jose validates `nbf`/`exp` on decode.
- `ver` is the user's **token version** — see §2.4.

**Status:** ✅ Implemented (env-based secret, prod guard, full claim set).

---

### 2.3 Refresh Tokens (rotating)

**Implementation:** `app/services/auth_service.py`, `app/routers/auth.py`

- Refresh tokens are opaque random strings (`secrets.token_urlsafe(48)`), **stored SHA-256-hashed** in the `refresh_tokens` table — a database leak never exposes usable tokens.
- Delivered as an **HttpOnly** cookie, `SameSite=Lax`, `Secure=COOKIE_SECURE`, scoped to path `/api/v1/auth`, 30-day lifetime.
- **Rotate-on-use:** every `/auth/refresh` revokes the old token and issues a new one. The frontend funnels all refreshes through a single in-flight request so concurrent refreshes never race the rotating token.
- Revoked on logout, password change, and "sign out everywhere".

**Status:** ✅ Implemented.

---

### 2.4 Access-Token Revocation (token version)

Stateless JWTs normally can't be revoked before expiry. PromptNest adds a `users.token_version` integer that is embedded in each access token as `ver`. `get_current_user` (which already loads the user) compares the token's `ver` against the user's current value:

```python
if token_version is None or token_version != user.token_version:
    raise HTTPException(401, "Token has been revoked")
```

`token_version` is incremented on **password change** and **"sign out everywhere"**, so those actions invalidate all outstanding access tokens immediately (not just refresh tokens).

**Status:** ✅ Implemented (migration `20260714_token_version`).

---

### 2.5 Token Storage & Transport

- **Access token:** browser `localStorage`, sent as `Authorization: Bearer <token>` (never in URLs).
- **Refresh token:** HttpOnly cookie (not readable by JavaScript).

**Residual risk:** the access token in `localStorage` is readable by any JavaScript, so an XSS bug could exfiltrate it. This is mitigated by (a) the strict app-wide CSP (§6.4), and (b) token-version revocation — a stolen token can be killed via "sign out everywhere". Moving the access token to an HttpOnly cookie + CSRF tokens is the recommended future hardening.

---

### 2.6 Anti-Enumeration

- **Registration** returns a single generic message ("That email or username is already taken") — it does not reveal which field collided.
- **Login** runs a dummy bcrypt verify on the no-such-user path so a missing account takes the same time as a wrong password (no timing side-channel).
- Ownership failures return **404** (not 403), so an attacker learns nothing about whether a resource exists.

**Status:** ✅ Implemented.

---

## 3. Authorization (Data Isolation)

Every query is scoped with `user_id == current_user.id`. No user can read or modify another user's prompts, groups, tags, versions, or sessions. Ownership failures return HTTP 404 (intentionally ambiguous).

**Status:** ✅ Consistently applied across all services.

| Not in scope (by design) | Note |
|---|---|
| Role-based access control | Single role; all users equal |
| Team / org sharing | On the roadmap |

---

## 4. Input Validation

### 4.1 Request Validation (Pydantic)

| Field | Validation |
|---|---|
| email | `EmailStr` |
| username (create) | 3–50 chars, `[A-Za-z0-9_]` |
| password (create / change) | 8–72 chars |
| import payload | list capped at 500 items |
| group.name | max 100 chars |
| tag.name | max 50 chars |
| prompt.title | max 200 chars |
| UUID / bool params | parsed & validated by FastAPI |

Invalid input returns HTTP 422.

### 4.2 SQL Injection

All access uses the **SQLAlchemy ORM** with parameterized queries; no string-built SQL. ✅

### 4.3 XSS

React auto-escapes rendered content; prompt content renders as text, not HTML; **no `dangerouslySetInnerHTML`** anywhere (including the docs page). ✅

---

## 5. Sensitive Data

### 5.1 Password Hash
Excluded from all API responses via `UserResponse` (never serialized).

### 5.2 Secrets & `.env`

| Secret | State |
|---|---|
| `SECRET_KEY` | ✅ Environment variable; prod startup guard rejects weak values |
| `DATABASE_URL` | ✅ Environment variable |
| OAuth client secrets | ✅ Environment variables (blank = provider disabled) |

`.env`, `*.env`, `venv/`, `.venv/`, and `__pycache__/` are git-ignored.

---

## 6. API Security

### 6.1 CORS
Configured in `main.py` with an explicit origin allowlist (`CORS_ORIGINS`) and `allow_credentials=True`. In production, set `CORS_ORIGINS` to the real frontend origin only. ✅

### 6.2 Rate Limiting
Custom sliding-window limiter (`app/core/rate_limit.py`), keyed on action + client IP:

| Endpoint | Limit (per 60s) |
|---|---|
| `POST /auth/login` | 5 |
| `POST /auth/register` | 10 |
| `GET /auth/oauth/*/start` | 20 |
| `GET /auth/oauth/*/callback` | 30 |

Client IP uses `X-Forwarded-For` **only** when `TRUST_PROXY=true` (so clients can't spoof it otherwise).

**Residual risk:** the store is in-memory and per-process — it resets on restart and isn't shared across workers/instances. For multi-instance production, back it with a shared store (e.g. Redis).

### 6.3 HTTPS & Cookies
Set `COOKIE_SECURE=true` and serve over HTTPS in production. The `Strict-Transport-Security` header is added automatically on HTTPS responses.

### 6.4 Security Headers
Applied to every response by the `security_headers` middleware:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains   (HTTPS only)
X-Request-ID: <uuid>
```
The CSP is relaxed **only** for `/docs` and `/redoc` (Swagger/ReDoc need the jsDelivr CDN + inline init scripts). Every application route keeps the strict policy.

### 6.5 API Docs Exposure
Swagger (`/docs`), ReDoc (`/redoc`), and the OpenAPI schema are gated by `ENABLE_DOCS` and **disabled by default in production**.

---

## 7. Known Security Issues — Current Status

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | `SECRET_KEY` hardcoded | CRITICAL | ✅ Fixed — env var + prod guard |
| 2 | No CORS configuration | HIGH | ✅ Fixed |
| 3 | No rate limiting | HIGH | ✅ Fixed (see §6.2 residual) |
| 4 | No server-side password policy | HIGH | ✅ Fixed |
| 5 | User enumeration (register + login timing) | MEDIUM | ✅ Fixed |
| 6 | No security headers | MEDIUM | ✅ Fixed |
| 7 | No token revocation | MEDIUM | ✅ Fixed (refresh rotation + token_version) |
| 8 | Swagger exposed in all envs | MEDIUM | ✅ Fixed (off in prod) |
| 9 | JWT in `localStorage` (XSS) | MEDIUM | ⚠️ Mitigated; HttpOnly cookie = future work |
| 10 | Rate limiter in-memory / per-process | LOW | ⚠️ Fine for single instance; use Redis at scale |
| 11 | No email verification for email signups | LOW | Open (OAuth requires verified email) |
| 12 | Soft-deleted data never purged | LOW | Open (schedule a cleanup job) |
| 13 | No persisted audit log | LOW | Open (structured request logging exists, not stored) |

---

## 8. Production Security Checklist

- [ ] `ENVIRONMENT=production` (enables the weak-secret startup guard)
- [ ] Strong, random `SECRET_KEY` (32+ chars) from a secret manager
- [ ] `COOKIE_SECURE=true` + HTTPS everywhere
- [ ] `CORS_ORIGINS` restricted to the real frontend origin
- [ ] `ENABLE_DOCS=false` (default in prod)
- [ ] `TRUST_PROXY=true` only behind a proxy you control
- [ ] Strong `DATABASE_URL` credentials (not `admin`)
- [ ] Separate production OAuth clients with HTTPS callback URLs
- [ ] (Recommended) shared-store rate limiting for multi-instance
- [ ] Regular dependency audits

---

## 9. Dependency Security

**Backend (uv):**
```bash
uv run pip-audit      # add pip-audit via `uv add --dev pip-audit`
```

**Frontend:**
```bash
npm audit
```

`bcrypt` is intentionally pinned to `<4.1` for passlib compatibility; do not unpin without testing password login.

---

## 10. Data Privacy

| Data | Stored | Sensitivity | Notes |
|---|---|---|---|
| Email | `users.email` | Personal | Login identity |
| Password | bcrypt hash | Sensitive | Never plaintext |
| Prompt content | `prompts.prompt_content` | User data | May contain sensitive text |
| OAuth link | `oauth_accounts` | Personal | Provider id + email at link; provider tokens **not** stored |
| Refresh sessions | `refresh_tokens` (hashed) | Sensitive | Rotating, revocable |
| Access token | browser `localStorage` | Sensitive | 30-minute expiry, revocable via token_version |

**Account deletion:** `DELETE /api/v1/auth/account` removes the account; related rows cascade. `GET /api/v1/auth/account/export` lets a user download their data first.

**Not collected:** analytics events, browser fingerprints. Client IP is used transiently for rate limiting only.
