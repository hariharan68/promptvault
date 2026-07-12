# Project Roadmap
# PromptNest

**Version:** 2.0  
**Date:** 2026-07-11  
**Current Status:** v2.x — auth, OAuth, versioning, import/export, security hardening, and public marketing + docs pages all shipped

---

## Current State (v1.0) — DONE

### Backend ✅
- [x] User registration and login (JWT auth)
- [x] GET /auth/me
- [x] Groups CRUD (create, list, get, update, delete)
- [x] Tags CRUD (create, list, get)
- [x] Prompts CRUD (create, list, get, update, soft-delete)
- [x] Prompt duplicate
- [x] Prompt copy/use count tracking
- [x] Prompt favorite/unfavorite
- [x] Prompt search (q param — ilike on title, description, content)
- [x] Prompt filters (group_id, tag, is_favorite)
- [x] All 73 automated tests passing
- [x] Swagger UI auto-generated at /docs

### Frontend ✅
- [x] React 18 + Vite scaffold
- [x] React Router v6 with protected routes
- [x] AuthContext with token persistence
- [x] Axios client with request/response interceptors
- [x] Login and Register pages
- [x] Dashboard with stats cards
- [x] Prompts page with filter bar
- [x] Prompt cards with all actions (copy, edit, duplicate, delete, favorite)
- [x] Prompt editor modal (create + edit)
- [x] Group sidebar with inline group creation
- [x] Dark theme with CSS variables
- [x] Frontend builds with zero errors

---

## Completed Since v1.0 ✅

### Authentication & Security
- [x] `SECRET_KEY` moved to environment + production weak-secret startup guard
- [x] Rotating refresh tokens (HttpOnly cookie) + logout revocation
- [x] Access-token revocation via `token_version` (password change / sign-out-everywhere)
- [x] Google & GitHub OAuth login (Google with PKCE)
- [x] Server-side password/username validation
- [x] CORS middleware, security headers + CSP, rate limiting (anti-enumeration)
- [x] Swagger disabled in production

### Prompt Features
- [x] Template variables (`{{variable}}`)
- [x] Version history + restore
- [x] Trash (soft delete) + restore
- [x] Bulk operations, import (JSON), export (JSON/CSV/Markdown)
- [x] Discover collections (most-used, recently-edited, favorites, recent)

### Platform
- [x] Pagination on prompt lists; dashboard stats/recent endpoints
- [x] Alembic migrations
- [x] Tags returned in `PromptResponse`
- [x] Tooling moved to **uv** (`pyproject.toml`, `uv run app.py`)
- [x] Ports standardized (frontend 3000, backend 8000); database `promptnest`
- [x] Public **Landing page** and **Documentation page** (`/`, `/docs`)
- [x] Toasts, command palette (⌘K), sort/filter, group management

---

## v1.1 — Bug Fixes & Quick Wins
**Estimated effort:** 1-2 days

### Critical Fixes
- [ ] **Tags not in PromptResponse** — Add SQLAlchemy `relationship` to Prompt model and include `tags` in PromptResponse schema. This is a known gap — the frontend has `TagPill` ready but cards currently show no tags.
- [ ] **JWT secret in source code** — Move `SECRET_KEY` from `security.py` to `.env` and read via `os.getenv`.
- [ ] **Duplicate auth router registration** — `main.py` registers `auth_router` twice. Remove the duplicate `app.include_router(auth_router)`.
- [ ] **`datetime.utcnow()` deprecation** — Replace with `datetime.now(timezone.utc)` in `prompt_service.py`.

### Quick Improvements
- [ ] Add `CORSMiddleware` to `main.py` with configurable allowed origins.
- [ ] Add `favicon.ico` to frontend.
- [ ] Show tag pills on PromptCards once tags are in the API response.
- [ ] Display "No groups yet" placeholder in sidebar when empty.
- [ ] Sidebar should highlight active group link from `?group_id=` param.

---

## v1.2 — Polish & Usability
**Estimated effort:** 3-5 days

### Frontend
- [ ] Collapsible sidebar for mobile/small screens
- [ ] Toast notifications for success/error actions (instead of only error inline text)
- [ ] Prompt card copy-to-clipboard button (copy `prompt_content` to clipboard)
- [ ] Search debounce (300ms delay before firing API call on `q` input)
- [ ] Sort options for prompts list (newest, oldest, most used, A-Z)
- [ ] Pagination or infinite scroll for large prompt libraries
- [ ] Group rename/delete from sidebar
- [ ] Tag management page (view all tags, delete unused)

### Backend
- [ ] Add pagination to `GET /prompts/` (`limit`, `offset` or cursor-based)
- [ ] Add `GET /prompts/stats` endpoint for dashboard metrics
- [ ] Add `GET /groups/{id}/prompts` — prompts by group
- [ ] Add DB-level unique constraints on `(user_id, name)` for groups and tags
- [ ] Database migrations setup with Alembic

---

## v2.0 — Power Features (mostly shipped)

### Auth
- [x] Refresh tokens (rotating, HttpOnly cookie)
- [x] Logout endpoint that revokes the refresh token
- [ ] "Remember me" session extension

### Prompt Enhancements
- [x] **Prompt variables** — `{{variable}}` template syntax
- [x] **Version history** — track edits + restore
- [ ] **Prompt rating** — Personal effectiveness score per prompt
- [x] **Bulk operations** — move to group, delete, export
- [x] **Import/Export** — JSON/CSV/Markdown export, JSON import

### Organization
- [ ] **Nested groups** — Sub-folders (group hierarchy, max 2 levels)
- [ ] **Pinned prompts** — Quick-access section above the grid
- [ ] **Archived prompts** — Second soft-delete level; separate "Archive" view

---

## v3.0 — Collaboration & Discovery
**Estimated effort:** 4-6 weeks

### Sharing
- [ ] **Public prompts** — Toggle a prompt to public with a shareable URL
- [ ] **Prompt marketplace** — Browse public prompts from other users
- [ ] **Community upvotes** — Rate public prompts
- [ ] **Copy from community** — One-click copy another user's public prompt to personal library

### Teams
- [ ] **Organization accounts** — Shared prompt libraries for teams
- [ ] **Role-based access** — Admin, Editor, Viewer roles per team
- [ ] **Team groups** — Shared groups with team members

### AI Integration
- [ ] **Run prompt** — Send a prompt directly to Claude/GPT from the UI
- [ ] **Model selector** — Choose which AI model to run the prompt against
- [ ] **Response history** — Store AI responses tied to the prompt
- [ ] **A/B testing** — Run two prompt variants and compare responses

---

## v4.0 — Platform Scale
**Estimated effort:** 8+ weeks

- [ ] Mobile app (React Native or PWA)
- [ ] Browser extension (Chrome/Firefox) — save prompts from any chat interface
- [ ] CLI tool — `promptnest get <name> | pbcopy`
- [ ] API keys — Allow third-party tools to access personal prompt library
- [ ] Webhooks — Trigger external actions when prompts are used
- [ ] Analytics dashboard — Usage trends, top prompts, search analytics
- [ ] Async backend (switch to async SQLAlchemy + asyncpg)
- [ ] Redis caching layer for frequently accessed prompts
- [ ] Full-text search engine (Elasticsearch or PostgreSQL FTS with `tsvector`)

---

## Technical Debt Backlog (remaining)

| Item | Priority | Notes |
|---|---|---|
| Access token → HttpOnly cookie + CSRF | Medium | Removes localStorage XSS exposure (mitigated today) |
| Shared-store rate limiting (Redis) | Medium | Current limiter is in-memory / per-process |
| Replace `datetime.utcnow()` | Low | Deprecation warning on newer Python |
| DB-level unique constraint on `(user_id, name)` | Low | Enforced at app layer today |
| Purge job for soft-deleted prompts | Low | Data cleanup |
| Email verification for email signups | Low | OAuth already requires verified email |
| Async SQLAlchemy | Low | Only needed at significant scale |

---

## Release History

| Version | Date | Summary |
|---|---|---|
| v1.0 | 2026-07-09 | Initial release: full backend (73 tests passing) + frontend scaffold |
| v2.0 | 2026-07-11 | OAuth login, refresh tokens + token revocation, versioning, trash, import/export, security hardening, uv tooling, rename to PromptNest, public landing + docs pages |
