# Security Document
# PromptVault

**Version:** 1.0  
**Date:** 2026-07-09

---

## 1. Security Overview

PromptVault is a personal prompt management application with user authentication and user-scoped data isolation. This document covers the security controls currently implemented, known vulnerabilities, and required fixes before any production deployment.

---

## 2. Authentication Security

### 2.1 Password Hashing

**Implementation:** `app/core/security.py`

```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

**Controls:**
- Passwords hashed with **bcrypt** (work factor ~12 by default in passlib).
- bcrypt is a slow, adaptive hash function specifically designed for passwords.
- Verification uses `pwd_context.verify(plain, hashed)` — constant-time comparison.
- **72-byte limit enforced:** bcrypt silently truncates inputs > 72 bytes, so PromptVault enforces this explicitly:

```python
def hash_password(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password cannot be longer than 72 bytes")
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if len(plain_password.encode("utf-8")) > 72:
        return False
    return pwd_context.verify(plain_password, hashed_password)
```

**Status:** ✅ Implemented correctly.

---

### 2.2 JWT Tokens

**Implementation:** `app/core/security.py`

```python
SECRET_KEY = "change_this_secret_key_later"  # ⚠️ MUST CHANGE
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

**JWT payload:**
```json
{
  "sub": "<user-uuid-string>",
  "email": "user@example.com",
  "exp": 1720521600
}
```

**Controls:**
- Tokens signed with HMAC-SHA256 (`HS256`).
- 30-minute expiry — short enough to limit damage from token theft.
- `sub` claim is the user's UUID (not username or email, which can change).
- Token decoded and verified on every protected request.

**Critical vulnerability:**

| Issue | Severity | Status |
|---|---|---|
| `SECRET_KEY` hardcoded as `"change_this_secret_key_later"` | CRITICAL | NOT FIXED |

**Fix required:**
```python
# security.py
import os
SECRET_KEY = os.environ["SECRET_KEY"]  # Raise if missing — fail fast
```

**Generate a secure key:**
```python
import secrets
print(secrets.token_hex(32))  # 64 hex chars = 256-bit key
```

---

### 2.3 Token Storage & Transport

**Frontend storage:** `localStorage.getItem("access_token")`

**Risk:** `localStorage` is accessible to any JavaScript on the page. XSS attack → token theft.

**v1 decision:** `localStorage` chosen for simplicity. Acceptable for a personal-use tool with no XSS vectors.

**Recommended for production:** Use `HttpOnly` cookies instead. This requires backend to set the cookie and frontend to use `credentials: 'include'` in requests.

**Transport:** Token sent in `Authorization: Bearer <token>` header via Axios request interceptor — not in URL query strings (which get logged).

---

### 2.4 Token Validation Flow

```python
# app/core/dependencies.py
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

**Controls:**
- Expired tokens raise `JWTError` → 401 response.
- Tampered tokens fail signature verification → 401 response.
- Deleted users (user_id not found in DB) → 401 response.
- `HTTPBearer` security scheme — requires `Authorization: Bearer` format; missing header → 403.

---

## 3. Authorization (Data Isolation)

### 3.1 User Scoping

Every data query includes `user_id == current_user.id`. No user can access another user's resources.

**Example — prompt list:**
```python
query = db.query(Prompt).filter(
    Prompt.user_id == user_id,    # ← always required
    Prompt.deleted_at.is_(None)   # ← soft-delete filter
)
```

**Example — group get by ID:**
```python
db.query(Group).filter(
    Group.id == group_id,
    Group.user_id == user_id  # ← ownership check
).first()
```

If a resource belongs to another user, the query returns `None`, and the router raises HTTP 404. This response is intentionally ambiguous (404, not 403) — the attacker learns nothing about whether the resource exists.

**Status:** ✅ Consistently applied across all services.

---

### 3.2 Missing Controls (v1)

| Missing Control | Risk | Priority |
|---|---|---|
| No role-based access control (RBAC) | Single role only; all users equal | Low (v1 scope) |
| No team/org scoping | Not applicable in v1 | Low |
| Soft-deleted data queryable by DB admin | Not user-facing | Low |

---

## 4. Input Validation

### 4.1 Request Body Validation (Pydantic)

FastAPI uses Pydantic for automatic request body validation. Invalid input returns HTTP 422 with detailed error messages.

**Validated fields:**
| Field | Validation |
|---|---|
| email | `EmailStr` — valid email format |
| username | `str` type, max 50 chars |
| group.name | `str`, max 100 chars |
| tag.name | `str`, max 50 chars |
| prompt.title | `str`, max 200 chars |
| UUID params | FastAPI parses `UUID` type path/query params |
| bool params | FastAPI parses `bool` (accepts `true`/`false`/`1`/`0`) |

### 4.2 SQL Injection Prevention

All queries use SQLAlchemy ORM with parameterized queries. Direct string interpolation into SQL is never used.

```python
# Safe — parameterized
query.filter(Prompt.title.ilike(f"%{q}%"))
# SQLAlchemy sends: WHERE title ILIKE $1, params=('%python%',)
```

**Status:** ✅ ORM usage throughout prevents SQL injection.

### 4.3 XSS Prevention

The React frontend renders user content as:
- Text content in JSX (React auto-escapes) — ✅ safe
- `<pre>` block for `prompt_content` — ✅ safe (text, not innerHTML)
- Tag names in `<span>` — ✅ safe

No `dangerouslySetInnerHTML` used anywhere.

**Status:** ✅ No XSS vectors in current implementation.

---

## 5. Sensitive Data Exposure

### 5.1 Password Hash

The `password_hash` field on the `User` model is intentionally excluded from all API responses via the `UserResponse` Pydantic schema, which only includes:
```python
class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # password_hash NOT included
```

**Verified:** Test `check("password_hash" not in register_data, "Password hash not returned")` passes.

### 5.2 Environment Variables

| Secret | Current State | Required State |
|---|---|---|
| `DATABASE_URL` | In `.env` file | ✅ Environment variable (not in source) |
| `SECRET_KEY` | **Hardcoded in source** | ❌ Must move to environment variable |
| DB password | In `.env` as `admin` | Acceptable for dev; use strong password in prod |

### 5.3 `.env` Files

`.env` files should be in `.gitignore` to prevent committing credentials:
```
# .gitignore
.env
*.env
venv/
__pycache__/
*.pyc
```

---

## 6. API Security

### 6.1 CORS

**Current state:** No `CORSMiddleware` configured. In development, the Vite proxy eliminates the need for CORS headers. In production, browser requests from the frontend domain will be blocked by CORS.

**Required before production:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### 6.2 Rate Limiting

**Current state:** No rate limiting implemented.

**Risks:**
- Brute-force login attempts against `/auth/login`
- Account enumeration via registration endpoint error messages
- DoS via repeated expensive queries

**Recommended solution:**
```python
pip install slowapi
# Add rate limiting to auth endpoints:
@router.post("/login")
@limiter.limit("5/minute")
def login(...):
```

### 6.3 HTTPS

**Current state:** HTTP only (development).

**Required for production:** All traffic must be served over HTTPS (TLS 1.2+). Never transmit JWT tokens over HTTP.

### 6.4 Security Headers

**Not implemented in v1.** Recommended headers for production:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 7. Known Security Issues — Priority Order

| # | Issue | Severity | Action |
|---|---|---|---|
| 1 | `SECRET_KEY` hardcoded in source | CRITICAL | Move to env var immediately |
| 2 | No HTTPS | CRITICAL | Required before any production deploy |
| 3 | No CORS configuration | HIGH | Blocks production frontend |
| 4 | No rate limiting on auth endpoints | HIGH | Enables brute-force |
| 5 | JWT in `localStorage` (XSS risk) | MEDIUM | Migrate to HttpOnly cookies |
| 6 | No security headers | MEDIUM | Add via Nginx or middleware |
| 7 | No token revocation | MEDIUM | Implement refresh token + blocklist |
| 8 | `password: admin` in DB URL | LOW | Use strong credential in production |
| 9 | No audit logging | LOW | Add structured request logging |
| 10 | Soft-deleted data never purged | LOW | Schedule cleanup job |

---

## 8. Security Checklist Before Production

### Must-Fix (Blocking)
- [ ] Move `SECRET_KEY` to environment variable
- [ ] Set strong, random `SECRET_KEY` (32+ bytes)
- [ ] Enable HTTPS (TLS)
- [ ] Add `CORSMiddleware` with specific origin allowlist
- [ ] Change DB password from `admin`

### Should-Fix (High Priority)
- [ ] Add rate limiting to `/auth/login` and `/auth/register`
- [ ] Add security response headers
- [ ] Set up HTTPS redirect
- [ ] Add request logging (structured, no PII in logs)

### Nice-to-Have (Pre-Launch)
- [ ] Implement HttpOnly cookie token storage
- [ ] Add refresh token flow with revocation
- [ ] Configure Content-Security-Policy header
- [ ] Add intrusion detection / anomaly alerting
- [ ] Regular dependency audit (`pip audit`, `npm audit`)

---

## 9. Dependency Security

**Backend audit:**
```bash
pip install pip-audit
pip-audit
```

**Frontend audit:**
```bash
npm audit
# Current: 2 vulnerabilities (1 moderate, 1 high) in dev dependencies
npm audit fix
```

The 2 current frontend vulnerabilities are in dev dependencies (build tools), not in runtime code shipped to users.

---

## 10. Data Privacy

| Data | Stored Where | Sensitivity | Notes |
|---|---|---|---|
| Email | PostgreSQL `users.email` | Personal | Used only for login |
| Password | PostgreSQL as bcrypt hash | Sensitive | Never stored in plaintext |
| Prompt content | PostgreSQL `prompts.prompt_content` | User data | May contain sensitive information the user typed |
| Usage timestamps | PostgreSQL | Low | When prompts were used |
| JWT | Browser `localStorage` | Sensitive | Expires in 30 minutes |

**Data not collected:** IP addresses, browser fingerprints, analytics events (v1).

**Data deletion:** Deleting a user account should cascade-delete all their data (enforced by PostgreSQL CASCADE constraints). No user-facing "delete account" endpoint exists in v1.
