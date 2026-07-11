# Software Requirements Specification (SRS)
# PromptNest

**Version:** 1.0  
**Date:** 2026-07-09

---

## 1. Introduction

### 1.1 Purpose
This document specifies the complete software requirements for PromptNest v1.0 — a personal AI prompt management system. It covers functional requirements, non-functional requirements, system constraints, and external interface requirements derived directly from the implemented codebase.

### 1.2 Scope
PromptNest consists of:
- A **REST API backend** built with FastAPI (Python), backed by PostgreSQL via SQLAlchemy ORM.
- A **Single Page Application frontend** built with React 18 + Vite, communicating with the backend over HTTP/JSON.

### 1.3 Definitions
| Term | Meaning |
|---|---|
| Prompt | An AI instruction string stored with metadata (title, description, content, tags, group) |
| Group | A named container (folder) that organizes prompts, scoped to a user |
| Tag | A keyword label attached to prompts, scoped to a user |
| Soft Delete | Setting `deleted_at` timestamp instead of removing the row from the database |
| JWT | JSON Web Token used for stateless authentication |
| Bearer Token | JWT sent in the `Authorization: Bearer <token>` HTTP header |
| Usage Count | Integer tracking how many times a prompt has been "copied" (used) |

---

## 2. Overall System Description

### 2.1 System Context
```
Browser (React SPA)
    │  HTTP/JSON (Axios, port 3000 → proxied to 8000)
    ▼
FastAPI Backend (port 8000)
    │  SQLAlchemy ORM
    ▼
PostgreSQL Database (port 5432, database: promptnest)
```

### 2.2 Technology Stack
| Layer | Technology | Version |
|---|---|---|
| Backend framework | FastAPI | latest |
| Backend language | Python | 3.11+ |
| ORM | SQLAlchemy | latest |
| Database | PostgreSQL | 14+ |
| DB driver | psycopg2-binary | latest |
| Auth | python-jose (JWT) + passlib (bcrypt) | latest |
| Config | python-dotenv | latest |
| Frontend framework | React | 18.3.1 |
| Frontend bundler | Vite | 5.3.1 |
| HTTP client | Axios | 1.7.2 |
| Routing | React Router DOM | 6.24.0 |

---

## 3. Functional Requirements

### 3.1 Authentication Module

**FR-AUTH-01:** The system shall allow a new user to register with a unique `username` (max 50 chars), unique `email` (valid format), and `password`.

**FR-AUTH-02:** On successful registration, the system shall return the created user object (HTTP 201) excluding `password_hash`.

**FR-AUTH-03:** The system shall reject registration if `email` is already registered (HTTP 400, detail: `"Email already registered"`).

**FR-AUTH-04:** The system shall reject registration if `username` is already registered (HTTP 400, detail: `"Username already registered"`).

**FR-AUTH-05:** The system shall authenticate a user via email + password and return a JWT access token with `token_type: "bearer"` on success (HTTP 200).

**FR-AUTH-06:** The system shall reject login with incorrect credentials (HTTP 401, detail: `"Invalid email or password"`).

**FR-AUTH-07:** JWT tokens shall expire after 30 minutes from issuance.

**FR-AUTH-08:** JWT payload shall include `sub` (user UUID as string) and `email`.

**FR-AUTH-09:** The system shall provide a `GET /api/v1/auth/me` endpoint that returns the current user's profile when a valid token is supplied.

**FR-AUTH-10:** Passwords shall be hashed using bcrypt before storage. Passwords exceeding 72 bytes shall be rejected.

### 3.2 Groups Module

**FR-GRP-01:** An authenticated user shall be able to create a group with `name` (required, max 100 chars) and optional `description`.

**FR-GRP-02:** Group names shall be unique per user. Duplicate names shall return HTTP 400.

**FR-GRP-03:** The system shall return all groups belonging to the current user, ordered by `created_at DESC`.

**FR-GRP-04:** The system shall return a single group by UUID. Non-existent or other-user's group returns HTTP 404.

**FR-GRP-05:** The system shall allow partial updates to a group's `name` and/or `description`.

**FR-GRP-06:** When a group is deleted, associated prompts shall have their `group_id` set to NULL (not deleted).

**FR-GRP-07:** All group endpoints shall require valid JWT authentication.

### 3.3 Tags Module

**FR-TAG-01:** An authenticated user shall be able to create a tag with a unique `name` (max 50 chars) per user.

**FR-TAG-02:** Duplicate tag names per user shall return HTTP 400 with detail `"Tag already exists"`.

**FR-TAG-03:** The system shall return all tags for the current user, ordered alphabetically by `name ASC`.

**FR-TAG-04:** The system shall return a single tag by UUID. Non-existent tag returns HTTP 404.

**FR-TAG-05:** Tags shall be automatically created when referenced in `tag_names` during prompt creation or update, if they do not already exist for that user.

**FR-TAG-06:** All tag endpoints shall require valid JWT authentication.

### 3.4 Prompts Module

**FR-PRM-01:** An authenticated user shall be able to create a prompt with:
- `title` (required, max 200 chars)
- `prompt_content` (required, unbounded text)
- `description` (optional, unbounded text)
- `group_id` (optional UUID)
- `tag_names` (optional list of strings, default empty)

**FR-PRM-02:** The system shall return all non-deleted prompts for the current user, ordered by `created_at DESC`.

**FR-PRM-03:** The list endpoint shall accept the following optional query parameters:
- `q` (string): case-insensitive partial match on `title`, `description`, and `prompt_content`
- `group_id` (UUID): filter by group
- `tag` (string): filter by exact tag name via JOIN on `prompt_tags` and `tags`
- `is_favorite` (boolean): filter by favorite status

**FR-PRM-04:** Multiple filter parameters shall be applied conjunctively (AND logic).

**FR-PRM-05:** The system shall return a single prompt by UUID. Soft-deleted or other-user's prompts return HTTP 404.

**FR-PRM-06:** The system shall allow partial updates to all prompt fields. Providing `tag_names` replaces all existing tags for the prompt.

**FR-PRM-07:** Deleting a prompt shall perform a soft delete by setting `deleted_at = NOW()`. The row is retained in the database.

**FR-PRM-08:** Soft-deleted prompts shall be excluded from all list, get, and filter queries.

**FR-PRM-09:** The system shall support prompt duplication: creates a new prompt with `title = "<original_title> Copy"`, same `description`, `prompt_content`, `group_id`, and `is_favorite`. Usage count starts at 0.

**FR-PRM-10:** The system shall support a "copy" action (`POST /prompts/{id}/copy`) that increments `usage_count` by 1 and sets `last_used_at = NOW()` for the prompt.

**FR-PRM-11:** The system shall allow a user to favorite a prompt (`POST /prompts/{id}/favorite`) setting `is_favorite = true`.

**FR-PRM-12:** The system shall allow a user to unfavorite a prompt (`DELETE /prompts/{id}/favorite`) setting `is_favorite = false`.

**FR-PRM-13:** All prompt endpoints shall require valid JWT authentication.

---

## 4. Non-Functional Requirements

### 4.1 Performance
**NFR-PERF-01:** The API shall respond to list/filter requests within 500ms for up to 10,000 prompts per user under normal load.

**NFR-PERF-02:** The frontend initial page load shall complete within 3 seconds on a standard broadband connection.

**NFR-PERF-03:** Search (`q` param) shall return results within 300ms for typical datasets.

### 4.2 Security
**NFR-SEC-01:** All endpoints except `POST /auth/register` and `POST /auth/login` shall require a valid JWT Bearer token.

**NFR-SEC-02:** All user data queries shall include `user_id == current_user.id` to prevent cross-user data access.

**NFR-SEC-03:** Passwords shall be hashed with bcrypt; plaintext passwords shall never be stored or logged.

**NFR-SEC-04:** The JWT secret key (`SECRET_KEY`) shall not be hardcoded in production; it shall be read from an environment variable.

**NFR-SEC-05:** JWT tokens shall use HMAC-SHA256 (`HS256`) signing algorithm.

**NFR-SEC-06:** The `password_hash` field shall never be included in any API response (enforced by Pydantic response models).

### 4.3 Reliability
**NFR-REL-01:** The system shall pass all 73 automated test cases defined in `test_api.py`.

**NFR-REL-02:** Database sessions shall be properly closed after each request (enforced by `get_db()` generator with `finally` block).

**NFR-REL-03:** Soft deletes shall ensure data integrity — no prompt is permanently lost by a user-initiated delete.

### 4.4 Maintainability
**NFR-MAINT-01:** The backend shall follow a layered architecture: routers → services → models.

**NFR-MAINT-02:** Business logic shall reside in service modules (`app/services/`), not in routers.

**NFR-MAINT-03:** Pydantic schemas shall be separate from ORM models.

**NFR-MAINT-04:** Frontend API calls shall be isolated in `src/api/` modules; pages shall not call `axios` directly.

### 4.5 Usability
**NFR-USE-01:** The frontend shall display a loading state while any API request is in flight.

**NFR-USE-02:** Form validation errors returned by the API shall be displayed inline below the form.

**NFR-USE-03:** The Modal component shall close on `Escape` key press and on overlay click.

**NFR-USE-04:** Delete operations shall require a `window.confirm()` confirmation dialog.

---

## 5. System Constraints

| Constraint | Value |
|---|---|
| Backend port | 8000 |
| Frontend dev port | 3000 |
| Database | PostgreSQL on localhost:5432, database `promptnest` |
| JWT algorithm | HS256 |
| JWT expiry | 30 minutes |
| Password max length | 72 bytes (bcrypt limit) |
| Username max length | 50 characters |
| Prompt title max length | 200 characters |
| Group name max length | 100 characters |
| Tag name max length | 50 characters |
| All PKs | UUID v4 (postgres UUID type) |

---

## 6. External Interface Requirements

### 6.1 API Interface
- Protocol: HTTP/1.1
- Data format: JSON (request and response bodies)
- Authentication: Bearer token in `Authorization` header
- API prefix: `/api/v1`
- Swagger UI: `http://127.0.0.1:8000/docs`

### 6.2 Database Interface
- Connection string: `postgresql://postgres:admin@localhost:5432/promptnest`
- Connection managed by: SQLAlchemy `create_engine` (synchronous)
- Session lifecycle: per-request, via `get_db()` dependency

### 6.3 Frontend ↔ Backend Interface
- Base URL (via `.env`): `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1`
- Vite dev proxy: requests to `/api/*` are proxied to `http://127.0.0.1:8000`
- Auth header attached by Axios request interceptor from `localStorage.getItem("access_token")`
- 401 responses handled by Axios response interceptor → clears token → redirects to `/login`
