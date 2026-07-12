# PromptVault

**A personal AI-prompt library for developers.** Save, organize, version, and instantly reuse your best prompts across every AI tool — instead of losing them in chat history.

Full-stack app: **FastAPI + PostgreSQL** backend, **React + Vite + Tailwind** frontend, with a hardened, production-grade authentication system (in-memory access tokens, atomic rotating refresh tokens with reuse detection, server-enforced sessions, OAuth 2.0, and CSRF protection).

> **Note on naming:** the product/repo is **PromptVault**; the codebase still uses the identifier `PromptNest` in some places (app title, package names, UI strings). A repo-wide rename is planned as its own change.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Running the app](#running-the-app)
- [Database & migrations](#database--migrations)
- [Authentication model](#authentication-model)
- [API overview](#api-overview)
- [Testing](#testing)
- [Operations](#operations)
- [Documentation](#documentation)

---

## Features

- **Prompt library** — create, edit, search, tag, group, and favorite prompts.
- **Template variables** — parameterize prompts (`{{variable}}`) and fill them in on copy.
- **Version history** — every edit is versioned; restore any previous version.
- **Groups & tags** — organize prompts and filter with URL-shareable views.
- **Trash & restore** — soft-delete with a recoverable trash bin.
- **Import / export** — bulk import and export your prompts (JSON / CSV / Markdown).
- **Usage tracking & dashboard** — see counts and activity at a glance.
- **Social login** — Google and GitHub OAuth 2.0 (with PKCE for Google).
- **Account & sessions** — change password, manage active devices, export/delete account.
- **Light / dark theme.**

### Security highlights

- Access token is **5-minute, in browser memory only** (never `localStorage`), auto-renewed by a rotating refresh cookie.
- **Refresh-token families** with atomic rotation and **reuse detection** — a replayed/stolen token revokes the whole family and is audited.
- **Server-enforced session policy** — "keep me signed in" (30-day) vs ephemeral (30-min idle timeout).
- **CSRF** origin checks on cookie-authenticated endpoints; per-IP and per-account **rate limiting**.
- Case-insensitive, normalized emails; **OAuth account-linking challenge** (no silent auto-link to password accounts).
- Strict security headers (CSP, HSTS, X-Frame-Options), production **config fail-fast**.

---

## Tech stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy (sync ORM), Alembic, Pydantic v2 |
| **Database** | PostgreSQL |
| **Auth** | `python-jose` (JWT), `passlib[bcrypt]`, OAuth 2.0 (Google PKCE + GitHub) |
| **Frontend** | React 18, Vite, React Router, SWR, Axios, Tailwind CSS v4, Motion, Phosphor Icons |
| **Tooling** | `uv` (Python deps/runner), `pytest`, `vitest`, `npm` |

---

## Architecture

```
Browser (React SPA, :3000)
   │  access token in memory only · refresh cookie (HttpOnly)
   │  Vite dev proxy: /api → :8000
   ▼
FastAPI backend (:8000)
   ├─ Routers:  auth · prompts · groups · tags · dashboard
   ├─ Services: auth_service · oauth_service
   ├─ Core:     security · dependencies · csrf · rate_limit · config · normalize
   ├─ Jobs:     token_cleanup
   ▼
PostgreSQL  (SQLAlchemy models + Alembic migrations)
   users · prompts · prompt_versions · groups · tags · prompt_tags
   refresh_tokens · security_events · oauth_accounts
   oauth_transactions · link_challenges
```

---

## Project structure

```
Promptvault/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, middleware, error handlers
│   │   ├── database.py        # engine + session factory
│   │   ├── core/              # config, security, dependencies, csrf, rate_limit, normalize
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic request/response models
│   │   ├── routers/           # auth, prompts, groups, tags, dashboard
│   │   ├── services/          # auth_service, oauth_service
│   │   └── jobs/              # token_cleanup
│   ├── alembic/               # migrations
│   ├── tests/                 # pytest integration suite (Postgres-backed)
│   ├── app.py                 # run entrypoint (uv run app.py)
│   ├── pyproject.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/             # Landing, Login, Register, Dashboard, Prompts, Groups, Settings, Trash, ...
│   │   ├── components/        # common, auth, groups, ...
│   │   ├── context/           # AuthContext, ThemeContext
│   │   ├── api/               # client (axios), authApi, authState, productApi
│   │   ├── layouts/
│   │   └── styles/
│   ├── vite.config.js
│   └── package.json
└── Docs/                      # PRD, SRS, API, DB design, security, deployment, ...
```

---

## Getting started

### Prerequisites

- **Python 3.11+** and [`uv`](https://docs.astral.sh/uv/)
- **Node.js 18+** and npm
- **PostgreSQL 14+** running locally

### 1. Clone

```bash
git clone https://github.com/hariharan68/promptvault.git
cd promptvault
```

### 2. Backend setup

```bash
cd backend
uv sync                              # install dependencies from pyproject/uv.lock
cp .env.example .env                 # then edit .env (see Configuration below)
```

Create the database and apply migrations:

```bash
# create the database (adjust user/host as needed)
createdb promptnest                  # or via your PG client

uv run alembic upgrade head          # apply all migrations
```

> ⚠️ Always run `uv run alembic upgrade head` after pulling changes that touch the models — otherwise login and other writes fail with a 503 (undefined column).

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env                 # if present; set VITE_* vars as needed
```

---

## Configuration

Backend environment variables (`backend/.env`) — see `backend/.env.example` for the full list.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | `postgresql://user:pass@host:5432/promptnest` |
| `SECRET_KEY` | ✅ | — | JWT signing secret (≥ 32 chars in production) |
| `ENVIRONMENT` | | `development` | Set to `production` to enforce prod safety checks |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | `5` | Access-token lifetime (memory-only token) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | | `30` | Persistent ("remember me") session lifetime |
| `IDLE_TIMEOUT_MINUTES` | | `30` | Ephemeral session idle timeout |
| `EPHEMERAL_ABSOLUTE_CAP_HOURS` | | `12` | Hard cap on an ephemeral session |
| `COOKIE_SECURE` | | `false` | **Must be `true` in production (HTTPS)** |
| `TRUST_PROXY` | | `false` | Trust `X-Forwarded-For` (only behind a proxy you control) |
| `CORS_ORIGINS` | | `http://localhost:3000,http://127.0.0.1:3000` | Also the trusted origins for CSRF |
| `FRONTEND_URL` | | `http://127.0.0.1:3000` | |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | | — | Google OAuth (leave blank to disable) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | | — | GitHub OAuth (leave blank to disable) |

For OAuth setup (redirect URIs, provider console configuration), see [`Docs/13_OAuth_Setup.md`](Docs/13_OAuth_Setup.md).

---

## Running the app

**Backend** (from `backend/`):

```bash
uv run app.py
# FastAPI on http://127.0.0.1:8000
# Swagger UI at http://127.0.0.1:8000/docs (dev only)
```

**Frontend** (from `frontend/`):

```bash
npm run dev
# Vite dev server on http://127.0.0.1:3000  (proxies /api → :8000)
```

Open **http://127.0.0.1:3000**.

| Service | URL |
|---|---|
| Frontend | http://127.0.0.1:3000 |
| Backend API | http://127.0.0.1:8000/api/v1 |
| Health check | http://127.0.0.1:8000/health |
| API docs (dev) | http://127.0.0.1:8000/docs |

---

## Database & migrations

Migrations are managed with **Alembic** (in `backend/alembic/`).

```bash
uv run alembic upgrade head          # apply all pending migrations
uv run alembic heads                 # should show exactly one head
uv run alembic current               # current DB revision
uv run alembic downgrade -1          # roll back one migration
```

> The migration chain is **not** from-scratch — it assumes the base tables exist. For a brand-new database, the standard path is `alembic upgrade head`. See [`Docs/10_Deployment_Document.md`](Docs/10_Deployment_Document.md) for the full migration/release checklist.

---

## Authentication model

| Credential | Form | Lifetime | Storage |
|---|---|---|---|
| **Access token** | JWT (HS256) with `sub`, `sid`, `jti`, `ver` | 5 min | Browser **memory only** |
| **Refresh token** | 256-bit opaque, stored SHA-256-hashed | 30 days (persistent) / idle-timeout (ephemeral) | HttpOnly cookie, `SameSite=Lax`, path `/api/v1/auth` |
| **OAuth transaction** | server-side row | 10 min, single-use | `oauth_transactions` table |

- On every app load the frontend calls `POST /auth/refresh`; a valid cookie resumes the session invisibly.
- Refresh tokens rotate atomically; reuse of a rotated token revokes the whole family and logs a `security_events` row.
- OAuth email matching an existing **password** account triggers a "confirm it's you" challenge instead of silently linking.

Full design: [`Docs/11_Security_Document.md`](Docs/11_Security_Document.md) and [`authredesignimplementation.md`](authredesignimplementation.md).

---

## API overview

Base URL: `http://127.0.0.1:8000/api/v1`

| Area | Endpoints |
|---|---|
| **Auth** | `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` · `POST /auth/change-password` |
| **OAuth** | `GET /auth/oauth/{provider}/start` · `GET /auth/oauth/{provider}/callback` · `POST /auth/oauth/link/confirm` |
| **Sessions** | `GET /auth/sessions` · `DELETE /auth/sessions/{family_id}` · `POST /auth/sessions/revoke-all` |
| **Account** | `GET /auth/account/export` · `DELETE /auth/account` |
| **Prompts** | `GET/POST /prompts` · `GET/PUT/DELETE /prompts/{id}` · versions, trash, restore, bulk, import/export, discover |
| **Groups** | `GET/POST /groups` · `GET/PUT/DELETE /groups/{id}` |
| **Tags** | `GET/POST /tags` · `DELETE /tags/{id}` |
| **Dashboard** | `GET /dashboard` |

Full reference: [`Docs/05_API_Documentation.md`](Docs/05_API_Documentation.md). Interactive docs at `/docs` when running in dev.

---

## Testing

The backend suite runs against a **real PostgreSQL** database (the atomic rotation, UUID columns, and partial indexes can't run on SQLite).

```bash
cd backend

# point at an empty, disposable database:
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/promptvault_test"
# PowerShell: $env:TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/promptvault_test"

uv run python -m pytest
```

If `TEST_DATABASE_URL` is unset, DB-backed tests skip (the config-guard unit test still runs).

Frontend tests:

```bash
cd frontend
npm test
```

---

## Operations

**Token cleanup job** — purges long-dead refresh tokens, sweeps expired OAuth transactions and link challenges, and logs a leak alert for accounts with unusually many live sessions. Run on a schedule (cron / systemd timer / container job):

```bash
cd backend
uv run python -m app.jobs.token_cleanup
```

Deployment guidance (release checklist, security headers, prod config): [`Docs/10_Deployment_Document.md`](Docs/10_Deployment_Document.md).

---

## Documentation

Detailed docs live in [`Docs/`](Docs/):

| Doc | Contents |
|---|---|
| `01_PRD.md` | Product requirements |
| `02_SRS.md` | Software requirements spec |
| `03_Functional_Specification.md` | Functional spec |
| `04_Database_Design.md` | Schema & relationships |
| `05_API_Documentation.md` | REST API reference |
| `06_UI_UX_Documentation.md` | UI/UX design |
| `07_System_Architecture.md` | System architecture |
| `09_Test_Plan.md` | Test plan |
| `10_Deployment_Document.md` | Deployment & migration checklist |
| `11_Security_Document.md` | Security architecture |
| `13_OAuth_Setup.md` | OAuth provider setup |
| `authredesignimplementation.md` | Auth v2 design plan |

---

## License

No license file is currently present. Add one (e.g. MIT) if you intend to open-source this project.
