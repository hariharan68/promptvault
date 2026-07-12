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
- Algorithm `HS256`, access-token lifetime **5 minutes** (configurable). The token lives in browser memory only (§2.5), so a short ceiling bounds the damage of an in-flight leak; the lifetime is emitted in the startup log so drift between doc and deployment is visible.

**JWT payload:**
```json
{
  "sub": "<user-uuid>",
  "email": "user@example.com",
  "ver": 0,
  "sid": "<refresh-family-uuid>",
  "jti": "<random>",
  "iat": 1720521600,
  "nbf": 1720521600,
  "exp": 1720521900
}
```

- `sub` is the user's UUID (stable identifier).
- `iat` / `nbf` / `exp` are all set; jose validates `nbf`/`exp` on decode.
- `ver` is the user's **token version** — see §2.4.
- `sid` ties the token to the refresh-token family that minted it (per-device revocation + the sessions UI); `jti` future-proofs an optional denylist.

**Status:** ✅ Implemented (env-based secret, prod guard, full claim set).

---

### 2.3 Refresh Tokens (rotating)

**Implementation:** `app/services/auth_service.py`, `app/routers/auth.py`

- Refresh tokens are opaque random strings (`secrets.token_urlsafe(48)`), **stored SHA-256-hashed** in the `refresh_tokens` table — a database leak never exposes usable tokens.
- Delivered as an **HttpOnly** cookie, `SameSite=Lax`, `Secure=COOKIE_SECURE`, scoped to path `/api/v1/auth`.
- **Families + atomic rotation:** every token belongs to a `family_id` (the chain from one login). `/auth/refresh` claims and rotates a token in a single atomic `UPDATE … RETURNING` — the `WHERE` clause is the lock, so concurrent refreshes cannot both win.
- **Reuse detection:** presenting an already-rotated token (outside a ~10s multi-tab grace window) revokes the **entire family** and logs a `security_events` row — turning refresh-token theft from a silent 30-day compromise into a self-extinguishing, audited incident.
- **Server-enforced session policy** (chosen by `remember_me` at login, inherited by the family): *persistent* → 30-day sliding cookie; *ephemeral* → session cookie with a server-side 30-min idle timeout + 12h absolute cap. The server clock — not a browser session cookie — is the authority, so browser "restore previous tabs" cannot defeat "sign me out when I leave".
- Revoked on logout (whole family), password change, "sign out everywhere", per-device revoke, and reuse/idle security events.

**Status:** ✅ Implemented (migration `20260715_refresh_families`).

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

- **Access token:** **browser memory only** (a module variable), sent as `Authorization: Bearer <token>` (never in URLs, never `localStorage`/`sessionStorage`). On every app load the frontend calls `POST /auth/refresh`; a valid cookie resumes the session invisibly, otherwise the login page shows.
- **Refresh token:** HttpOnly cookie (not readable by JavaScript).
- An **auth-epoch** guard on the frontend drops any in-flight refresh write-back that completes after a logout, so a stale response can't resurrect a signed-out session.

**Residual risk:** an in-flight access token could still be exfiltrated by XSS, but the exposure is bounded to ≤5 minutes *and* the attacker must also beat the `token_version` check. Keeping the token out of persistent storage removes the durable XSS-exfiltration surface that `localStorage` previously created. A Redis `jti` denylist (payload already carries `jti`) is documented as optional future hardening.

---

### 2.5a CSRF on Cookie-Authenticated Endpoints

`/auth/refresh` and `/auth/logout` are the only cookie-authenticated, state-changing endpoints. Both require an `Origin` (or `Referer`) whose `scheme://host:port` **exactly matches** a trusted origin (`CORS_ORIGINS`); a lookalike like `trusted.evil.com` is rejected, and a missing header is untrusted. `SameSite=Lax` remains the first line; this explicit check removes the dependency on SameSite semantics surviving future deployment changes.

**Status:** ✅ Implemented (`app/core/csrf.py`).

---

### 2.5b OAuth Transaction Integrity

OAuth `state` + PKCE verifier + `remember_me` live in a server-side `oauth_transactions` row (10-min TTL), not cookies. The callback claims the row with one atomic `UPDATE … SET consumed_at … RETURNING` keyed on the single-use `state`, so **replay, expiry, and forged/unknown state all fail uniformly**, and concurrent multi-tab logins each match their own row. Email from the provider is normalized and requires `email_verified` (Google) / a verified primary email (GitHub).

**Status:** ✅ Implemented (migration `20260717_oauth_transactions`).

---

### 2.5c Email Normalization & Registration Races

Email is normalized once (NFC + trim + lowercase) for registration, login, and OAuth, backed by a `lower(email)` unique index — so login is case-insensitive and duplicates cannot slip in by case. Registration keeps a friendly pre-check but treats the unique constraint as the authority: a concurrent duplicate INSERT is caught (`IntegrityError`) and returned as a uniform `409`, never a `500` and never revealing which field collided.

**Status:** ✅ Implemented (migration `20260716_email_lower_unique`).

---

### 2.5d OAuth Account Linking (challenge, not auto-link)

Automatic linking on email match is a top OAuth account-takeover vector, so when
an OAuth login's email matches an existing **password** account we do **not**
link. Instead a short-lived `link_challenges` row is created and the user is
bounced to a "confirm it's you" screen; the link is written only after they
re-enter the existing account's password. Wrong passwords don't consume the
challenge (retry within a 5/min limit); an OAuth-only account matched by a
*different* provider is refused rather than linked (no way to prove control
without email). New emails still create-and-link normally.

**Status:** ✅ Implemented (migration `20260719_link_challenges`).

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
| 9 | JWT in `localStorage` (XSS) | MEDIUM | ✅ Fixed — access token moved to memory only; refresh-on-load + auth-epoch guard |
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
| Access token | browser memory only | Sensitive | 5-minute expiry, revocable via token_version |

**Account deletion:** `DELETE /api/v1/auth/account` removes the account; related rows cascade. `GET /api/v1/auth/account/export` lets a user download their data first.

**Not collected:** analytics events, browser fingerprints. Client IP is used transiently for rate limiting only.
