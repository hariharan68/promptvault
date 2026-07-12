# PromptVault Auth Architecture v2 — Final Design

**Status:** Proposed (supersedes v1 architecture doc)
**Date:** 2026-07-11
**Inputs reconciled:** v1 architecture doc, Codex 25-issue audit, Sonnet 4.6 review

---

## 0. Executive Summary

Both reviews are largely correct and largely overlapping. After deduplicating, there are **six real design flaws** (not 25) — everything else is either a symptom of one of these six, an operational task, or a documentation fix.

The six root flaws:

1. **The access token lives in web storage.** Any XSS, malicious extension, or compromised dependency exfiltrates it. This undermines the httpOnly cookie you carefully set up for the refresh token.
2. **"Logout on browser close" is being solved client-side, and client-side cannot solve it.** sessionStorage and session cookies are both restored by modern browsers (Chrome/Firefox "continue where you left off", crash recovery, mobile). The only reliable enforcement point is the **server**, via session lifetime policy.
3. **Refresh rotation is not atomic and has no reuse detection.** This is the single most exploitable backend flaw. A stolen refresh token is currently a 30-day skeleton key with no alarm attached.
4. **Security depends on deployment variables that are never validated.** `COOKIE_SECURE=false` default with no production fail-fast means one bad `.env` silently ships refresh tokens over HTTP.
5. **OAuth transaction state lives in fixed-name cookies with no server-side record.** This breaks multi-tab logins and gives you no replay protection, no audit trail, and no `prompt=select_account`, so Google silently re-authenticates users even after your session ends — defeating flaw #2's fix entirely.
6. **Concurrency is handled by check-then-act everywhere** (registration, OAuth account creation, refresh rotation, logout-vs-refresh on the frontend). Check-then-act always races. The database's unique constraints and atomic updates must be the authority.

The design below fixes all six at the root, which resolves ~20 of the 25 Codex findings and all of Sonnet's critical items as side effects. The remainder (cleanup jobs, session UI metadata, naming, tests, migrations) are scheduled in the implementation plan at the end.

**The headline architectural change:** session behavior ("keep me signed in" vs "sign me out when I leave") becomes a **server-enforced session policy** chosen at login, not a client storage trick. The access token moves to memory only. Refresh tokens get families, atomic rotation, and reuse detection.

---

## 1. Where I Agree and Disagree with the Reviewers

Agreements are absorbed into the design below, so this section only records the arbitration calls.

**Codex #2 / Sonnet #4 (access JWT valid after logout).** Both flag it; Codex calls it High. With the access token (a) in memory only, (b) genuinely 5 minutes, and (c) `token_version`-checked against the DB on every request, the residual risk is a stolen-in-flight token with ≤5 minutes of life *and* the attacker must beat a `token_version` bump. I rate this **Low/accepted** for this product. A Redis JTI denylist is documented as an optional hardening step, not a requirement — do not build Redis infrastructure just for this. If you later add Redis for rate limiting, add the denylist then for free.

**Sonnet #5 (store a `closed_at` heartbeat).** Right diagnosis (session cookies are unreliable), but a heartbeat that writes on every unload is fragile — `beforeunload` doesn't fire reliably, especially on mobile and crashes. The idle-timeout model in §3 achieves the same guarantee with zero client cooperation: if the browser was closed, no requests arrived, so the session idles out. That *is* the heartbeat, implemented as its absence.

**Codex #6–8 vs Sonnet (OAuth cookies).** Codex is right that this is a reliability bug, not primarily a vulnerability. But the fix (server-side transaction store, §5) is worth doing anyway because it simultaneously buys replay protection, auditing, multi-tab support, and a natural place to hang `prompt=select_account` — five findings closed by one table.

**Codex #9 (automatic OAuth account linking).** Codex hedges ("product decision"). I'm firmer: **automatic linking on email match is the #1 real-world OAuth account-takeover vector** and has burned multiple large products. For a vault product whose entire value proposition is "your prompts are private," linking must require proof of control of the existing account. This is upgraded to a hard requirement in §5.4.

**Sonnet's summary ("fix two things and it's strong").** Too optimistic. Non-atomic rotation without reuse detection (Codex #4/#5) is at least as severe as the localStorage issue and Sonnet missed it entirely. Fixing storage without fixing rotation leaves the more durable credential (30-day refresh token) as the weaker one.

---

## 2. Token Model (Final)

| Credential | Form | Lifetime | Storage | Readable by JS | Revocable |
|---|---|---|---|---|---|
| Access token | JWT (HS256/RS256) with `sub`, `sid`, `tv`, `jti`, `exp` | **5 min** (config fixed, doc and code reconciled) | **JS memory only** (module variable) | Yes, but never persisted | Effectively yes, via `tv` check + 5-min ceiling |
| Refresh token | 256-bit random opaque string; **only its SHA-256 hash stored server-side** | Policy-dependent (see §3) | `__Host-refresh_token` httpOnly cookie, `Secure`, `SameSite=Lax`, `Path=/api/v1/auth` | No | Yes, individually, per-family, or all-sessions |
| OAuth transaction | Random `txn_id` | 10 min, single-use | Server row + short-lived httpOnly cookie carrying only the `txn_id` | No | Consumed atomically on callback |

Decisions locked in:

**Access token in memory only.** No localStorage, no sessionStorage — not even behind the toggle. On every app load, the frontend calls `POST /auth/refresh`; if the cookie is valid the session resumes invisibly, if not the login page shows. This makes token persistence entirely the cookie's job, which is exactly the component you already secured. Cost: one extra request per page load. That is the correct price.

**JWT claims gain `sid` (session id) and `jti`.** `sid` ties every access token to the refresh-token family that minted it, enabling per-device revocation and the session-management UI (Codex #20). `jti` future-proofs the optional denylist.

**Cookie name uses the `__Host-` prefix.** The browser then *refuses* the cookie unless it is `Secure`, has no `Domain` attribute, and `Path=/` — wait, `__Host-` requires `Path=/`, which conflicts with your scoped `/api/v1/auth` path. Choose one: keep the scoped path with a plain name (current behavior, fine), or use `__Host-` with `Path=/` for the browser-enforced guarantee. **Recommendation: keep `Path=/api/v1/auth` and enforce `Secure` server-side via the fail-fast check in §6.1.** The scoped path meaningfully shrinks the surface where the cookie travels; the `__Host-` guarantee is redundant once the startup check exists.

**Access token config:** `ACCESS_TOKEN_EXPIRE_MINUTES = 5` in `config.py`, and the value is emitted in the startup log so drift between doc and deployment is visible (closes Codex #3).

---

## 3. Session Model — Server-Enforced "Remember Me"

This replaces v1's Option A/Option B and wires up the UI toggle Sonnet found dangling.

### 3.1 The principle

The client cannot reliably detect "browser closed" (session restore, crash recovery, mobile process lifecycle all break it). So the server defines two session **policies**, and the client's toggle merely selects which policy to request at login:

```
POST /auth/login        { email, password, remember_me: bool }
GET  /oauth/{p}/start   ?remember_me=true|false   (stored in the OAuth transaction)
```

| Policy | remember_me | Refresh cookie | Server-side lifetime |
|---|---|---|---|
| **Persistent** | true | `Max-Age` = 30 days | Absolute expiry 30 days; sliding rotation as today |
| **Ephemeral** | false | Session cookie (no Max-Age) | **Idle timeout 30 min** + absolute cap 12 h |

### 3.2 Why this actually solves the complaint

Under the ephemeral policy, closing the browser stops all requests. After 30 minutes of silence the server marks the session dead — regardless of whether the browser later restores the session cookie or the tab. When the restored browser calls `/auth/refresh`, the server sees `last_used_at` > 30 minutes ago and returns 401. The user sees the login page. **Browser restore cannot defeat a server clock.**

The session cookie (no Max-Age) is kept as a best-effort accelerator — in the common case the cookie is gone and the user never even hits the idle-timeout path — but it is no longer the enforcement mechanism.

Implementation is one column and one condition:

```sql
ALTER TABLE refresh_tokens ADD COLUMN session_policy TEXT NOT NULL DEFAULT 'persistent';
ALTER TABLE refresh_tokens ADD COLUMN last_used_at TIMESTAMPTZ NOT NULL DEFAULT now();
```

```python
# inside the refresh flow, after loading the token row
if token.session_policy == "ephemeral":
    if now - token.last_used_at > IDLE_TIMEOUT:            # 30 min
        revoke_family(token.family_id, reason="idle_timeout")
        raise credentials_error()
    if now - token.family_created_at > EPHEMERAL_ABSOLUTE_CAP:  # 12 h
        revoke_family(token.family_id, reason="absolute_cap")
        raise credentials_error()
```

The policy is inherited by every rotated token in the family, so the toggle only ever matters at login time — which is also the honest UX: "keep me signed in" is a promise made when signing in.

### 3.3 Frontend toggle wiring

The toggle stops being a storage switch and becomes a login parameter:

```js
// SettingsToggle / LoginForm — the preference itself may live in localStorage,
// it's not a secret:
localStorage.setItem("remember_me_pref", String(enabled));

// login call:
await api.post("/auth/login", { email, password, remember_me: pref });

// OAuth start:
window.location = `/api/v1/oauth/google/start?remember_me=${pref}`;
```

Note the asymmetry: the *preference* is non-sensitive and may persist in localStorage; the *tokens* never touch storage. This resolves Sonnet's #2 without reintroducing the XSS surface.

---

## 4. Refresh Rotation — Atomic, Familied, Reuse-Detecting

This is the highest-value backend change. One schema, one query pattern.

### 4.1 Schema

```sql
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,           -- sha256(raw token)
    family_id       UUID NOT NULL,                  -- constant across rotations
    parent_id       UUID REFERENCES refresh_tokens(id),
    session_policy  TEXT NOT NULL DEFAULT 'persistent',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    replaced_at     TIMESTAMPTZ,                    -- set when rotated
    revoked_at      TIMESTAMPTZ,                    -- set on logout/security event
    revoke_reason   TEXT,                           -- 'logout','reuse','idle_timeout',...
    -- session metadata (Codex #20)
    device_label    TEXT,
    ip_created      INET,
    user_agent      TEXT
);
CREATE INDEX ix_rt_family ON refresh_tokens(family_id);
CREATE INDEX ix_rt_user_active ON refresh_tokens(user_id) WHERE revoked_at IS NULL AND replaced_at IS NULL;
```

### 4.2 The atomic rotation query

Replace the read-check-update-insert sequence in `auth_service.py:91` with a single compare-and-swap. The `WHERE` clause *is* the lock:

```python
async def rotate_refresh_token(db, raw_token: str) -> tuple[User, str]:
    token_hash = sha256(raw_token)

    # ONE atomic statement: claim the token iff it is still live.
    row = await db.execute(text("""
        UPDATE refresh_tokens
           SET replaced_at = now(), last_used_at = now()
         WHERE token_hash = :h
           AND replaced_at IS NULL
           AND revoked_at  IS NULL
           AND expires_at  > now()
        RETURNING id, user_id, family_id, session_policy, created_at, last_used_at
    """), {"h": token_hash})
    claimed = row.first()

    if claimed is None:
        # Either invalid/expired... or REUSE of an already-rotated token.
        prior = await db.execute(text(
            "SELECT family_id, replaced_at, revoked_at FROM refresh_tokens WHERE token_hash = :h"
        ), {"h": token_hash})
        p = prior.first()
        if p is not None and p.replaced_at is not None and p.revoked_at is None:
            # THEFT SIGNAL: someone presented a token that was already rotated.
            await revoke_family(db, p.family_id, reason="reuse_detected")
            await log_security_event(db, "refresh_token_reuse", family_id=p.family_id)
            # optional: enqueue user notification email
        raise credentials_error()   # uniform 401 either way — no oracle for attackers

    enforce_session_policy(claimed)          # §3.2 idle/absolute checks
    new_raw = secrets.token_urlsafe(48)
    await db.execute(insert_refresh_token(
        user_id=claimed.user_id, family_id=claimed.family_id,
        parent_id=claimed.id, token_hash=sha256(new_raw),
        session_policy=claimed.session_policy, ...
    ))
    await db.commit()
    return claimed, new_raw
```

Properties worth stating explicitly:

- **Two concurrent tabs refreshing simultaneously:** exactly one `UPDATE` matches; the loser's request falls into the reuse branch. To avoid punishing legitimate multi-tab races with family revocation, allow a **grace window**: skip family revocation if `replaced_at` is within ~10 seconds and the successor token is still unreplaced. Tab B then simply gets a 401, retries, and the frontend's shared-refresh dedup (already in `client.js:15`) plus the retry absorbs it. Outside the grace window, treat as theft.
- **Reuse of a genuinely stolen token** (attacker uses it hours later, after the real client rotated): family revoked, event logged, every session in the family dead, user optionally notified. This converts refresh-token theft from a silent 30-day compromise into a self-extinguishing incident with an audit trail — closing Codex #4 and #5 together.
- No `SELECT ... FOR UPDATE` needed; the conditional `UPDATE ... RETURNING` is simpler, lock-free from the application's perspective, and works identically across all backend workers.

### 4.3 Logout (server side)

```python
# POST /auth/logout
# Revoke the FAMILY (not just the presented token), clear the cookie.
await revoke_family(db, family_id_of(cookie_token), reason="logout")
response.delete_cookie("refresh_token", path="/api/v1/auth")
```

Access-token residue: with 5-minute expiry + `token_version` verification per request, the accepted exposure is ≤5 minutes for a token exfiltrated *before* logout by an attacker who also evades the version check. Documented as accepted risk (see §1). "Log out all devices" bumps `users.token_version` and revokes all families — that path already exists and now also kills in-flight access tokens on their next request.

---

## 5. OAuth — Server-Side Transactions

One table replaces the fixed-name cookies and closes Codex #6, #7, #8, part of #23/#24, and Sonnet's #3.

### 5.1 Schema

```sql
CREATE TABLE oauth_transactions (
    txn_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider       TEXT NOT NULL,                 -- 'google' | 'github'
    state          TEXT NOT NULL UNIQUE,
    pkce_verifier  TEXT NOT NULL,
    remember_me    BOOLEAN NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at     TIMESTAMPTZ NOT NULL,          -- created_at + 10 min
    consumed_at    TIMESTAMPTZ                    -- single-use marker
);
```

(A Redis hash with 10-min TTL is equally fine if Redis exists; the DB table needs no new infrastructure and the volume is trivial.)

### 5.2 Flow changes

```
GET /oauth/google/start?remember_me=true
  ├─ create oauth_transactions row (state, verifier, remember_me, 10-min expiry)
  ├─ Set-Cookie: oauth_txn=<txn_id>; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/api/v1/oauth
  └─ 302 → Google with:
        state=<state>, code_challenge, code_challenge_method=S256,
        prompt=select_account            ← kills silent re-auth (Sonnet #3)
        access_type=online

GET /oauth/google/callback?code&state
  ├─ ATOMIC consume:
  │     UPDATE oauth_transactions
  │        SET consumed_at = now()
  │      WHERE state = :state AND txn_id = :cookie_txn
  │        AND consumed_at IS NULL AND expires_at > now()
  │     RETURNING pkce_verifier, remember_me, provider
  │   → no row  ⇒ 401 (covers: replay, expiry, cross-tab mixup, forged state)
  ├─ exchange code + verifier at provider
  ├─ validate profile against model constraints (§5.3)
  ├─ find-or-create user (§5.4 linking rules, DB constraints as authority)
  └─ issue refresh family with session_policy from remember_me
```

Multi-tab now works naturally: each tab has its own row and its own `txn_id` cookie is unnecessary for correctness — even if the cookie is overwritten by tab B, tab A's `state` still matches its own row. (Keep the cookie check as a second binding factor when present, but key the lookup on `state`.) Replay is dead by construction: `consumed_at IS NULL` is checked in the same atomic statement that sets it.

### 5.3 Provider response validation (Codex #24)

Before any DB write: require `sub`/`id` present and ≤255 chars; require `email` present, RFC-plausible, ≤320 chars, and `email_verified == true` (Google) / verified primary email (GitHub API call); normalize email per §6.3; truncate/sanitize display name to the `users` model constraints and validate the *final* generated username against the same Pydantic model used for registration — one validator, both entry paths.

### 5.4 Account linking (hardened — upgrade from Codex's "product decision")

When the OAuth email matches an existing **password** account:

1. Do **not** link automatically.
2. Create a short-lived `link_challenge` (10 min) and redirect to a "Confirm it's you" page.
3. The user must either enter the existing account password, or click a verification link emailed to the account address.
4. On success: link, record `linked_at`, `linked_via`, provider metadata, and send a notification email "Google sign-in was added to your account."

When the email matches an existing account that is *itself OAuth-only from the same provider*: normal login. Same email, *different* provider, no password: require the email-link confirmation path. This is the standard defense against the misconfigured-provider / unverified-email takeover class.

---

## 6. Cross-Cutting Hardening

### 6.1 Fail-fast configuration (Codex #16, #23)

```python
# config.py — executed at import time
if IS_PRODUCTION:
    problems = []
    if not COOKIE_SECURE:
        problems.append("COOKIE_SECURE must be true in production")
    if OAUTH_GOOGLE_ENABLED and not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET):
        problems.append("Google OAuth enabled but credentials missing")
    if any(u.startswith("http://") for u in OAUTH_REDIRECT_URLS):
        problems.append("OAuth redirect URLs must be https in production")
    if len(SECRET_KEY) < 32:
        problems.append("SECRET_KEY too short")
    if problems:
        raise RuntimeError("Refusing to start: " + "; ".join(problems))
```

A process that won't boot is infinitely easier to notice than a cookie quietly sent over HTTP.

### 6.2 CSRF for cookie-authenticated endpoints (Codex #18)

`/auth/refresh` and `/auth/logout` are the only cookie-authenticated, state-changing endpoints. Add explicit Origin validation on both — it's ~5 lines and removes the dependency on SameSite semantics surviving future deployment changes:

```python
def require_trusted_origin(request: Request):
    origin = request.headers.get("origin") or request.headers.get("referer")
    if origin is None or not origin.startswith(tuple(TRUSTED_ORIGINS)):
        raise HTTPException(403, "untrusted origin")
```

Keep `SameSite=Lax`. No CSRF token machinery needed at this scale.

### 6.3 Email normalization (Codex #12)

Normalize (`strip().lower()`, NFC) in **one** function called from registration, login, and the OAuth path, plus the database as backstop:

```sql
CREATE UNIQUE INDEX ux_users_email_lower ON users (lower(email));
```

Run a pre-migration duplicate check (`SELECT lower(email), count(*) ... HAVING count(*) > 1`) before adding the index; resolve collisions manually if any exist.

### 6.4 Registration / OAuth creation races (Codex #10, #11)

Delete no code — just stop trusting the pre-checks and make the constraint violation a first-class path:

```python
try:
    user = await create_user(...)
except IntegrityError as e:
    await db.rollback()
    if is_unique_violation(e, "ux_users_email_lower") or is_unique_violation(e, "ux_users_username"):
        # OAuth path: re-SELECT — the concurrent winner may be *our* user, link to it
        # Registration path: uniform response, no field leak:
        raise HTTPException(409, "An account could not be created with these details")
    raise
```

The uniform 409 avoids confirming which field collided (account-enumeration hygiene); the OAuth path retries the lookup after rollback so the race loser recovers instead of 500ing.

### 6.5 Frontend logout correctness (Codex #13, #14)

Introduce an **auth epoch** — a monotonically increasing integer that invalidates every in-flight auth write from a previous era:

```js
// authState.js
let inMemoryToken = null;
let authEpoch = 0;

export const getToken = () => inMemoryToken;
export const setToken = (t, epoch) => { if (epoch === authEpoch) inMemoryToken = t; };
export const beginLogout = () => { authEpoch += 1; inMemoryToken = null; return authEpoch; };

// client.js — refresh interceptor captures the epoch when it STARTS:
const epochAtStart = currentEpoch();
const { access_token } = await refresh();
setToken(access_token, epochAtStart);   // silently dropped if logout happened meanwhile

// AuthContext logout — local-first, server-second, honest about failure:
async function logout() {
  beginLogout();
  setUser(null);                        // UI is logged out immediately, always
  try {
    await api.post("/auth/logout");     // revokes family + clears cookie
  } catch {
    toast.warn("Signed out on this device; couldn't reach the server. " +
               "Use 'Sign out everywhere' from another session if this device is shared.");
  }
}
```

The stale refresh response can no longer resurrect the session, and a failed server logout is surfaced instead of swallowed.

### 6.6 Rate limiting (Sonnet #6)

Per-IP + per-account (where identifiable) limits: `/auth/login` 5/min, `/auth/register` 3/min, `/auth/refresh` 20/min (generous — legitimate clients refresh at most every 5 minutes per tab), `/oauth/*/callback` 10/min. `slowapi` in-process is sufficient for a single-instance deployment; move to Redis-backed only when you scale horizontally.

---

## 7. Corrected End-to-End Flows

### Login (either method) → session

```
LOGIN (password or OAuth, remember_me = R)
  backend:
    verify credentials
    create refresh family { policy: R ? persistent : ephemeral }
    Set-Cookie: refresh_token
        persistent → Max-Age = 30d
        ephemeral  → (no Max-Age)          # best-effort; server clock is authority
    return { access_token }                # 5-min JWT with sid, tv, jti
  frontend:
    setToken(access_token)                 # memory ONLY
```

### Every app load (replaces the localStorage bootstrap in AuthContext.jsx:11)

```
app boots → no token in memory (by design)
  POST /auth/refresh                       # cookie auto-sent
     200 → setToken(new access), GET /auth/me → app
     401 → login page
           reasons: no cookie | expired | revoked | idle-timeout (ephemeral)
```

### API call with expired access token — unchanged from v1

401 → shared single-flight refresh → retry, now with atomic rotation underneath and the epoch guard around the write-back.

---

## 8. Test Plan (Codex #21 — release gate)

First, fix the environment: `httpx` is declared but not installed — the test suite must run in CI before anything below counts. Router-level integration tests (FastAPI `TestClient`/`httpx.AsyncClient` against a real Postgres, not mocks) covering, in priority order:

1. **Rotation atomicity:** fire N concurrent refreshes with the same token → exactly one 200; within grace window no family revocation; after grace window, reuse ⇒ whole family 401s and a security event row exists.
2. **Ephemeral policy:** login `remember_me=false`, advance clock 31 min, refresh ⇒ 401; persistent policy unaffected.
3. Login sets correct cookie attributes per policy (HttpOnly, Secure, SameSite, Path, presence/absence of Max-Age).
4. Logout: family revoked, cookie deletion header sent, subsequent refresh 401, in-flight refresh cannot restore session (epoch test — frontend, Vitest).
5. OAuth: happy path; state mismatch; **callback replay ⇒ second attempt 401**; expired transaction; two-tab concurrent flows both succeed; `prompt=select_account` present in redirect URL.
6. Linking: OAuth email matching password account ⇒ challenge page, not silent link; confirmation completes link + notification recorded.
7. Registration: concurrent duplicate ⇒ one 201, one 409, no 500, response doesn't reveal colliding field. Same for concurrent OAuth first-logins.
8. Email case: register `User@X.com`, login `user@x.com` succeeds; OAuth with either casing matches the same account.
9. `token_version` bump invalidates live access token on next request; revoke-all kills every family.
10. Production config guard: app refuses to start with `IS_PRODUCTION=true, COOKIE_SECURE=false` (unit test on config module).

---

## 9. Operational Items

**Token hygiene (Codex #19):** nightly job — delete rows where `revoked_at < now() - 30d` or `expires_at < now() - 30d` (retention window kept for incident forensics). Alert if the active-token count per user exceeds ~50 (leak indicator).

**Session management UI (Codex #20):** the schema in §4.1 already carries `device_label` (parsed from UA), `ip_created`, `last_used_at`. Expose `GET /auth/sessions` (one entry per live family, flag the current one by matching `sid`), and `DELETE /auth/sessions/{family_id}` for per-device revoke.

**Naming (Codex #22):** pick **one** product name and do a repo-wide rename in a single dedicated PR (docs, OAuth app names in the Google/GitHub consoles, redirect URLs, README). All docs must cite full deployed paths (`/api/v1/auth/login`). Do this before writing more docs, not after.

**Migrations (Codex #25):** the deploy checklist gains: `alembic heads` shows exactly one head → `alembic current` on prod → `alembic upgrade head` → schema-vs-model diff (`alembic check` or `alembic revision --autogenerate` producing an empty migration) → smoke-test login/refresh/logout against staging.

**GitHub OAuth (Sonnet, minor):** it exists in code and UI; add it to this document's provider table, including its email-verification call (GitHub's `/user/emails`, primary + verified) — its semantics differ from Google's `email_verified` claim, which is precisely the Codex #9 risk class.

---

## 10. Implementation Order

Sequenced so each step is independently shippable and the riskiest fixes land first:

1. **Config fail-fast** (§6.1) + set `ACCESS_TOKEN_EXPIRE_MINUTES=5`. Smallest diff, biggest silent-failure eliminated. *(~half a day)*
2. **Atomic rotation + families + reuse detection** (§4) — schema migration + rewrite of one service function + tests #1. *(1–2 days)*
3. **In-memory access token + refresh-on-load + auth epoch** (§2, §6.5) — frontend refactor of three files. *(1 day)*
4. **Server-enforced session policy + toggle wiring** (§3) — closes the original user complaint, properly. *(1 day)*
5. **OAuth transaction table + prompt=select_account + replay consumption** (§5.1–5.3). *(1–2 days)*
6. **Linking challenge flow** (§5.4) — needs the email-send capability; if email infra doesn't exist yet, ship the password-confirmation variant first. *(1–2 days)*
7. **Race hardening + email normalization** (§6.3, §6.4) — includes the `lower(email)` index migration with duplicate pre-check. *(1 day)*
8. **CSRF origin check + rate limiting** (§6.2, §6.6). *(half a day)*
9. **Integration test suite** (§8) — written alongside steps 2–8, gated in CI before the release tag. *(continuous)*
10. **Ops: cleanup job, sessions UI, rename, migration checklist** (§9). *(1–2 days)*

Total: roughly two focused weeks. Steps 1–4 alone eliminate every High-severity finding from both reviews.

---

## 11. Consequences

**Easier afterwards:** device/session management, security incident response (reuse events are logged), horizontal scaling (rotation is DB-atomic, no in-process locks), audits (OAuth transactions and revocations have rows).

**Harder afterwards:** one extra `/auth/refresh` round-trip on every cold page load (~50–150 ms, invisible behind a splash state); ephemeral users on unstable networks may be logged out after 30 idle minutes (tunable); the linking challenge adds one screen to a rare flow.

**Revisit later:** Redis JTI denylist if the ≤5-min post-logout window ever becomes unacceptable; WebAuthn/passkeys as a third credential type (the family model accommodates it cleanly); moving OAuth transactions to Redis when the table sees real volume.