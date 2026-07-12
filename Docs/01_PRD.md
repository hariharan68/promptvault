# Product Requirements Document (PRD)
# PromptNest

**Version:** 1.0  
**Date:** 2026-07-09  
**Status:** Active Development

---

## 1. Product Overview

### 1.1 Product Name
PromptNest

### 1.2 One-Line Description
A personal prompt management platform where users can create, organize, search, and reuse AI prompts with groups, tags, favorites, and usage tracking.

### 1.3 Problem Statement
AI practitioners — developers, writers, researchers — accumulate dozens or hundreds of prompts over time. These prompts live scattered across text files, Notion pages, browser bookmarks, and chat history. There is no dedicated tool that lets a person:
- Store prompts with rich metadata (title, description, content)
- Organize them into named groups/folders
- Tag them for cross-group discovery
- Search across content, not just titles
- Track which prompts are actually being used
- Favorite the best ones for fast recall

PromptNest solves this by acting as a personal prompt library with a clean, fast UI and a robust backend.

### 1.4 Target Users
| Persona | Description |
|---|---|
| AI Developer | Writes and iterates on system prompts for LLM apps, needs version history and reuse |
| Content Creator | Uses ChatGPT/Claude for copywriting, builds a library of proven prompts |
| Researcher | Experiments with many prompt variations, needs grouping and tagging |
| Power User | Heavy daily AI usage, needs favorites and copy-to-clipboard for speed |

---

## 2. Goals and Non-Goals

### 2.1 Goals (v1.0)
1. Users can register and log in securely with JWT authentication.
2. Users can create, read, update, and soft-delete prompts.
3. Users can organize prompts into named groups.
4. Users can tag prompts (auto-created tags, reused across prompts).
5. Users can favorite/unfavorite prompts.
6. Users can copy a prompt (increments usage counter, records `last_used_at`).
7. Users can duplicate a prompt to create a starting point for a variation.
8. Users can search prompts by keyword across title, description, and content.
9. Users can filter prompts by group, tag, and favorite status.
10. Dashboard shows aggregate stats (total prompts, favorites, group count).
11. All data is user-scoped — no user can see another user's prompts.

### 2.2 Non-Goals (v1.0)
- Prompt sharing between users (public prompts, marketplace)
- Version history / diff tracking for prompts
- Folder nesting (groups are flat, not hierarchical)
- Prompt rating or community upvoting
- AI integration (running the prompt against an LLM)
- Mobile native app
- Team/organization accounts
- Import from ChatGPT, Claude, or other chat export formats
- Real-time collaboration

---

## 3. Features

### 3.1 Authentication
| Feature | Detail |
|---|---|
| Register | Username + email + password. Duplicate username/email blocked. |
| Login | Email + password (+ "keep me signed in"). Returns a 5-minute in-memory JWT access token; a rotating HttpOnly refresh cookie renews it. |
| Me | Returns current user profile from token. |
| Auth persistence | Access token in memory only; the HttpOnly refresh cookie restores the session on app load via `POST /auth/refresh`. Auto-attached to every request via Axios interceptor. |
| Session expiry | 401 responses automatically clear token and redirect to `/login`. |

**Acceptance Criteria:**
- Registering with an existing email returns HTTP 400 with detail `"Email already registered"`.
- Registering with an existing username returns HTTP 400 with detail `"Username already registered"`.
- Logging in with wrong password returns HTTP 401.
- Accessing any protected endpoint without a token returns HTTP 401.

### 3.2 Groups
| Feature | Detail |
|---|---|
| Create | Name (required) + description (optional). Duplicate name within user blocked. |
| List | Returns all groups for the current user, ordered by `created_at DESC`. |
| Get by ID | Returns a single group. 404 if not found or belongs to different user. |
| Update | Name and/or description. Duplicate name check excludes current group. |
| Delete | Hard delete. Prompts in the group have `group_id` set to NULL (SET NULL FK). |

**Acceptance Criteria:**
- Creating a group with a duplicate name returns HTTP 400.
- Deleting a group does not delete its prompts; they become ungrouped.
- Groups are visible in the sidebar for one-click filtering.

### 3.3 Tags
| Feature | Detail |
|---|---|
| Create | Tag name (required, unique per user). |
| List | Returns all tags for user, ordered alphabetically by name. |
| Get by ID | Returns a single tag. 404 if not found. |
| Auto-create on prompt | When creating/updating a prompt with `tag_names`, tags are auto-created if they don't exist (per user). |

**Acceptance Criteria:**
- Creating a duplicate tag returns HTTP 400.
- Tags are user-scoped — different users can have tags with identical names.
- Tags on a prompt are replaced entirely on each update (the old tag links are deleted and new ones inserted).

### 3.4 Prompts (Core Feature)
| Feature | Detail |
|---|---|
| Create | Title + content (required), description + group_id + tag_names (optional). |
| List with filters | Supports `q` (search), `group_id`, `tag`, `is_favorite` query params. |
| Get by ID | Returns a single prompt. 404 if not found or soft-deleted. |
| Update | Any subset of fields. Tags are replaced if `tag_names` provided. |
| Soft Delete | Sets `deleted_at` timestamp; prompt disappears from all queries. |
| Duplicate | Creates a new prompt with title `"<original> Copy"`, same content/group/favorite status. |
| Copy / Use | Increments `usage_count` and updates `last_used_at`. |
| Favorite | Sets `is_favorite = true`. |
| Unfavorite | Sets `is_favorite = false`. |

**Search behavior (`q` param):**
- Case-insensitive partial match (`ilike`) across:
  - `title`
  - `description`
  - `prompt_content`

**Acceptance Criteria:**
- Deleted prompts do not appear in any list or search.
- `usage_count` starts at 0 and increments by 1 per copy action.
- Tag filter matches exact tag name (case-sensitive at DB level).
- Group filter returns only prompts in that specific group.
- `is_favorite=true` returns only favorited prompts.
- Combined filters work conjunctively (AND, not OR).

---

## 4. User Flows

### 4.1 New User Registration Flow
```
/register → fills form → POST /auth/register → POST /auth/login → store token → /dashboard
```

### 4.2 Create and Organize a Prompt
```
/prompts → click "+ New Prompt" → fill PromptEditor (title, content, group, tags) → POST /prompts/ → card appears in list
```

### 4.3 Find a Prompt
```
/prompts → type in Search box → results filter live → OR click a group in sidebar → group_id filter applied
```

### 4.4 Reuse a Prompt
```
PromptCard → click "Copy" → POST /prompts/{id}/copy → usage_count increments → user manually copies text from card
```

### 4.5 Group Sidebar Navigation
```
Sidebar shows "Dashboard", "All Prompts", then all groups → click group → /prompts?group_id=<uuid>
```

---

## 5. Data Model Summary

| Entity | Key Fields |
|---|---|
| User | id, username, email, password_hash, is_active |
| Group | id, user_id, name, description |
| Tag | id, user_id, name |
| Prompt | id, user_id, group_id, title, description, prompt_content, is_favorite, usage_count, last_used_at, deleted_at |
| PromptTag | prompt_id, tag_id (composite PK, junction table) |
| RefreshToken | id, user_id, token_hash, expires_at, revoked_at (future use) |

---

## 6. Success Metrics

| Metric | Target (v1.0) |
|---|---|
| All API tests pass | 73/73 (currently achieved) |
| Average list response time | < 200ms with up to 1,000 prompts |
| Frontend build with zero errors | Achieved |
| Auth flow works end-to-end | Register → Login → Protected routes |
| Soft delete confirmed | Deleted prompts absent from all queries |

---

## 7. Constraints

| Constraint | Detail |
|---|---|
| Platform | Web only (responsive; desktop-first) |
| Auth | JWT access + rotating refresh cookie; Google & GitHub OAuth |
| Database | PostgreSQL (psycopg2-binary), database `promptnest` |
| Password | 8–72 chars, enforced server-side (bcrypt 72-byte limit) |
| Token expiry | 30-min access token, revocable; 30-day rotating refresh token |
| Secret key | Loaded from environment; production startup guard rejects weak values |

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Access token in `localStorage` (XSS) | Mitigated by CSP + token revocation; HttpOnly cookie is future work |
| In-memory rate limiter | Fine single-instance; use shared store (Redis) at scale |
| Soft deletes not purged | Schedule periodic hard-delete of old soft-deleted records |

**Resolved since v1:** JWT secret moved to env, refresh tokens + revocation, rate limiting, and tags in `PromptResponse` are all implemented (see Security Document).
