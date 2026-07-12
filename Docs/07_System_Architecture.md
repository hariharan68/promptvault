# System Architecture Document
# PromptNest

**Version:** 1.0  
**Date:** 2026-07-09

---

## 1. Architecture Overview

PromptNest follows a classic three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT TIER                               │
│                                                             │
│  Browser → React 18 SPA (Vite, port 3000)                  │
│  ├── React Router DOM v6 (client-side routing)             │
│  ├── Axios (HTTP client with interceptors)                  │
│  ├── AuthContext (React Context API for auth state)         │
│  └── Component tree (pages → layouts → components)         │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/JSON (proxied /api → :8000)
┌─────────────────────────▼───────────────────────────────────┐
│                   APPLICATION TIER                           │
│                                                             │
│  FastAPI Backend (uvicorn, port 8000)                       │
│  ├── Routers (HTTP layer: validate, route, respond)         │
│  ├── Services (business logic, DB operations)               │
│  ├── Schemas (Pydantic: request/response validation)        │
│  ├── Models (SQLAlchemy ORM models)                         │
│  └── Core (JWT auth, password hashing, dependencies)        │
└─────────────────────────┬───────────────────────────────────┘
                          │ SQLAlchemy ORM (psycopg2)
┌─────────────────────────▼───────────────────────────────────┐
│                     DATA TIER                                │
│                                                             │
│  PostgreSQL (port 5432, database: promptnest)              │
│  ├── users            (incl. token_version)                 │
│  ├── groups                                                  │
│  ├── tags                                                    │
│  ├── prompts                                                 │
│  ├── prompt_tags                                             │
│  ├── prompt_versions                                         │
│  ├── refresh_tokens                                          │
│  └── oauth_accounts                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Architecture

### 2.1 Directory Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI app, middleware (security headers/CSP), handlers
│   ├── database.py          # SQLAlchemy engine, session, Base
│   ├── core/
│   │   ├── config.py        # env-driven settings + production guards
│   │   ├── security.py      # password hashing, JWT create/verify
│   │   ├── dependencies.py  # get_current_user (JWT + token_version)
│   │   └── rate_limit.py    # sliding-window rate limiter
│   ├── models/              # user, group, tag, prompt, prompt_tag,
│   │                        #   prompt_version, refresh_token, oauth_account
│   ├── schemas/             # user, auth, group, tag, prompt, search, common, product
│   ├── services/            # auth, group, tag, prompt, dashboard, oauth
│   └── routers/             # auth, groups, tags, prompts, dashboard (prefix /api/v1)
├── alembic/                 # database migrations
├── app.py                   # uv entry point (uvicorn runner)
├── pyproject.toml           # dependencies (uv) + uv.lock
├── requirements.txt         # pip fallback
├── test_api.py
└── .env
```

### 2.2 Layered Architecture

```
HTTP Request
     │
     ▼
┌─────────────┐
│   Router    │  Validates auth, parses input, delegates to service
│  (FastAPI)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │  Business logic, DB queries, error-free data manipulation
│  (Python)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Model    │  SQLAlchemy ORM, maps Python ↔ PostgreSQL
│ (SQLAlchemy)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │
└─────────────┘
```

**Rules:**
- Routers never query the DB directly — always call service functions.
- Services receive `db: Session` and return ORM objects or raise no exceptions (routers handle HTTP exceptions).
- Schemas are used at router boundaries only (input validation + output serialization).

### 2.3 Authentication Flow

```
Client                     FastAPI                        DB
  │                          │                             │
  │── POST /auth/login ──────▶                             │
  │   {email, password}      │── query User by email ─────▶
  │                          │◀── User row ───────────────│
  │                          │── verify_password()        │
  │                          │── create_access_token()    │
  │◀── {access_token} ───────│                             │
  │                          │                             │
  │── GET /prompts/ ─────────▶                             │
  │   Authorization: Bearer  │── decode JWT               │
  │                          │── query User by id ─────────▶
  │                          │◀── User row ───────────────│
  │                          │── get_prompts()             │
  │                          │── query prompts ────────────▶
  │◀── [prompts] ────────────│◀── rows ───────────────────│
```

**JWT structure:**
```json
Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": "<user-uuid>", "email": "...", "exp": <timestamp> }
```

### 2.4 Dependency Injection Chain

```python
# Every protected endpoint:
current_user = Depends(get_current_user)
    └── credentials = Depends(HTTPBearer())  # extracts Bearer token
    └── db = Depends(get_db)               # opens DB session
    └── jwt.decode(token)                  # validates + extracts user_id
    └── db.query(User).filter(id == user_id).first()
    └── returns User ORM object
```

---

## 3. Frontend Architecture

### 3.1 Directory Structure
```
frontend/src/
├── main.jsx             # React root, BrowserRouter wrapping
├── App.jsx              # Route definitions, AuthProvider wrapping
├── styles/
│   └── index.css        # CSS variables, global reset
├── api/
│   ├── client.js        # Axios instance, interceptors
│   ├── authApi.js       # Auth API functions
│   ├── groupApi.js      # Groups API functions
│   ├── tagApi.js        # Tags API functions
│   └── promptApi.js     # Prompts API functions
├── context/
│   └── AuthContext.jsx  # User state, token management
├── layouts/
│   └── AppLayout.jsx    # Sidebar + Outlet
├── components/
│   ├── common/          # Button, Input, Modal, ProtectedRoute
│   ├── groups/          # GroupSidebar
│   ├── prompts/         # PromptCard, PromptEditor, PromptFilters, PromptList
│   └── tags/            # TagPill
└── pages/
    ├── LoginPage.jsx
    ├── RegisterPage.jsx
    ├── DashboardPage.jsx
    ├── PromptsPage.jsx
    └── NotFoundPage.jsx
```

### 3.2 Component Hierarchy

```
App.jsx
├── AuthProvider (Context)
│   ├── Route: /login → LoginPage
│   ├── Route: /register → RegisterPage
│   ├── Route: / (ProtectedRoute)
│   │   └── AppLayout
│   │       ├── GroupSidebar (always visible)
│   │       └── Outlet
│   │           ├── /dashboard → DashboardPage
│   │           └── /prompts → PromptsPage
│   │               ├── PromptFilters
│   │               ├── PromptList
│   │               │   └── PromptCard × N
│   │               │       └── TagPill × N
│   │               ├── Modal (create) → PromptEditor
│   │               └── Modal (edit) → PromptEditor
│   └── Route: * → NotFoundPage
```

### 3.3 Data Flow

```
PromptsPage
    │
    │ [filters state changes]
    │
    ▼
fetchPrompts() ─── GET /prompts/?q=...&group_id=...
    │
    ▼
promptApi.getPrompts(params)
    │
    ▼
client.js (Axios)
    ├── adds Authorization header
    ├── sends request
    └── handles 401 (clear token + redirect)
    │
    ▼
FastAPI backend
    │
    ▼
setPrompts(response.data)
    │
    ▼
PromptList → PromptCard × N → rendered cards
```

### 3.4 State Architecture

**Global state (Context):** Only auth state (`user`, `loading`, `saveToken`, `logout`).

**Local state (component):** Everything else — prompts list, filters, modal visibility, form values, loading flags.

**No state management library** (no Redux, Zustand, etc.) — React Context + `useState` is sufficient for v1 scope.

### 3.5 API Layer Design

```
pages/            ← never import axios directly
   │
   └── api/*.js   ← all HTTP calls go through named functions
        └── client.js  ← single Axios instance, base URL, interceptors
```

This means the base URL and auth header logic exist in exactly one place.

---

## 4. Request Lifecycle (End-to-End)

Example: User searches for "python" prompts.

```
1. User types "python" in search input (PromptFilters.jsx)
2. setFilters({ ...filters, q: "python" }) (PromptsPage.jsx)
3. useEffect fires → fetchPrompts() called
4. promptApi.getPrompts({ q: "python" })
5. client.get("/prompts/", { params: { q: "python" } })
   └── Axios interceptor adds: Authorization: Bearer <token>
6. HTTP GET http://127.0.0.1:8000/api/v1/prompts/?q=python
7. FastAPI router: list_prompts(q="python", ..., current_user=...)
   └── get_current_user dependency validates JWT → returns User
8. prompt_service.get_prompts(db, user_id, q="python")
   └── SQLAlchemy query with ILIKE filter
9. Returns list of Prompt ORM objects
10. Pydantic serializes to JSON (PromptResponse schema)
11. HTTP 200 response with JSON array
12. Axios receives response.data (array)
13. setPrompts(response.data)
14. React re-renders PromptList with filtered cards
```

---

## 5. Deployment Architecture (Current: Local Dev)

```
Developer Machine
├── PostgreSQL (system service, port 5432)
├── uv run app.py  (backend, port 8000)
└── npm run dev (frontend, port 3000)
    └── Vite proxy: /api/* → http://127.0.0.1:8000
```

**Vite proxy config (`vite.config.js`):**
```javascript
proxy: {
  "/api": {
    target: "http://127.0.0.1:8000",
    changeOrigin: true,
  }
}
```
This means the browser calls `http://localhost:3000/api/...` and Vite forwards it to the FastAPI server, eliminating CORS issues in development.

---

## 6. Key Architectural Decisions

| Decision | Choice | Reason |
|---|---|---|
| Auth strategy | JWT access + rotating refresh cookie | Short-lived tokens, revocable via token_version |
| ORM | SQLAlchemy synchronous | Simple, stable, well-documented |
| Soft deletes | `deleted_at` timestamp | Data safety, restore via Trash |
| State management | React Context + SWR | Scope doesn't justify Redux/Zustand |
| Styling | Tailwind CSS v4 (plum tokens) | Utility-first, dark mode support |
| API layer | Axios with interceptors | Centralizes auth header + deduped 401 refresh |
| Tag replacement | Full replace on update | Simpler than diff-and-patch; consistent |
| Pagination | `page` / `page_size` on list | Handles large libraries |

---

## 7. Known Architectural Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| Synchronous SQLAlchemy | Can block under high load | Switch to async SQLAlchemy + asyncpg for scale |
| In-memory rate limiter | Per-process; resets on restart | Use a shared store (Redis) for multi-instance |
| Access token in `localStorage` | XSS could exfiltrate it | Mitigated by CSP + revocation; HttpOnly cookie is future work |

**Resolved:** Alembic migrations, environment-based `SECRET_KEY` (+ prod guard), pagination, `tags` in `PromptResponse`, and CORS middleware are all implemented.
