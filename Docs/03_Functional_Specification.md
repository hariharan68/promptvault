# Functional Specification Document
# PromptNest

**Version:** 1.0  
**Date:** 2026-07-09

---

## 1. Purpose
This document describes the exact behavior of every feature in PromptNest — what each screen shows, what each action does, and what each API endpoint returns. It bridges the PRD (what we want) and the SRS (what we require) with the concrete behavior visible in the code.

---

## 2. Application Pages

### 2.1 Login Page (`/login`)

**Route:** Public (no auth required)  
**File:** `src/pages/LoginPage.jsx`

**Layout:**
- Centered card (max-width 380px) on dark background
- "PromptNest" title at top
- Email input field
- Password input field
- "Login" button (full width)
- Link: "No account? Register" → `/register`

**Behavior:**
1. User fills email + password and submits.
2. Frontend calls `POST /api/v1/auth/login` with `{ email, password }`.
3. On success (HTTP 200): token saved to `localStorage` as `access_token`. User state set. Redirect to `/dashboard`.
4. On failure: error message displayed inline below inputs (from `error.response.data.detail`).
5. Button shows "Logging in..." during request, disabled to prevent double-submit.

**Redirects:**
- If already logged in (token + valid user from `/auth/me`): redirected away by `ProtectedRoute` (but login page itself does not check — user lands here only after logout or token expiry).

---

### 2.2 Register Page (`/register`)

**Route:** Public  
**File:** `src/pages/RegisterPage.jsx`

**Layout:** Same card style as login.
- Username input
- Email input
- Password input
- "Register" button
- Link: "Already have an account? Login" → `/login`

**Behavior:**
1. User submits form.
2. Frontend calls `POST /api/v1/auth/register` with `{ username, email, password }`.
3. On success: immediately calls `POST /api/v1/auth/login` to get token.
4. Saves token. Sets user. Redirects to `/dashboard`.
5. Error shown inline if duplicate username/email or validation failure.

---

### 2.3 App Layout (`AppLayout.jsx`)

**Applied to:** All protected routes (`/dashboard`, `/prompts`)  
**File:** `src/layouts/AppLayout.jsx`

**Structure:**
```
┌──────────────┬────────────────────────────────────┐
│  GroupSidebar │         <Outlet />                 │
│  (240px)      │   (DashboardPage or PromptsPage)   │
└──────────────┴────────────────────────────────────┘
```

---

### 2.4 Group Sidebar (`GroupSidebar.jsx`)

**File:** `src/components/groups/GroupSidebar.jsx`

**Sections:**
1. **Brand name:** "PromptNest" heading.
2. **Navigation links:**
   - Dashboard → `/dashboard`
   - All Prompts → `/prompts`
   - Active link: purple color + surface-hover background.
3. **Groups section:**
   - "GROUPS" uppercase label + "+" button to create a new group.
   - Clicking "+" shows an inline form with text input + "Add" button.
   - Submitting calls `POST /api/v1/groups/` and appends the new group to the list.
   - Each group is a NavLink: `/prompts?group_id=<uuid>`.
4. **Footer:**
   - Current username displayed.
   - "Logout" button: clears `localStorage` token, sets user to null, redirects to `/login`.

**Data:** Groups loaded once on mount via `GET /api/v1/groups/`.

---

### 2.5 Dashboard Page (`/dashboard`)

**File:** `src/pages/DashboardPage.jsx`

**Layout:**
- Heading: "Welcome back, `<username>`"
- Sub-text: "Here's an overview of your prompt library."
- 3 stat cards in a responsive grid:
  | Card | Value | Link |
  |---|---|---|
  | Total Prompts | count from `GET /prompts/` | `/prompts` |
  | Favorites | count from `GET /prompts/?is_favorite=true` | `/prompts?is_favorite=true` |
  | Groups | count from `GET /groups/` | `/prompts` |
- "Browse Prompts" CTA button → `/prompts`

**Data loading:** Three API calls in parallel via `Promise.all`.

---

### 2.6 Prompts Page (`/prompts`)

**File:** `src/pages/PromptsPage.jsx`

**Layout:**
```
[Prompts heading]          [+ New Prompt button]
[PromptFilters bar]
[PromptList grid]
```

**Filter Bar (`PromptFilters.jsx`):**
| Control | Type | API param |
|---|---|---|
| Search | Text input | `q` |
| Group | Select dropdown (loaded from `/groups/`) | `group_id` |
| Tag | Text input | `tag` |
| Favorites | Select: All / Favorites only / Non-favorites | `is_favorite` |
| Clear button | Resets all filters to empty | — |

Filters are reactive: changing any filter triggers `fetchPrompts()` via `useEffect` on `filters` state object.

**URL params:** Page reads `?q`, `?group_id`, `?tag`, `?is_favorite` from URL on mount and initializes filter state accordingly (supports direct links like sidebar group links).

**Prompt List (`PromptList.jsx`):**
- Responsive CSS grid: `repeat(auto-fill, minmax(320px, 1fr))`
- Empty state: "No prompts found." centered text
- Loading state: "Loading..." centered text

---

### 2.7 Prompt Card (`PromptCard.jsx`)

**File:** `src/components/prompts/PromptCard.jsx`

**Displays:**
- Title (bold, 15px)
- Description (muted, if present)
- Star button (☆/★): yellow if favorited, muted if not
- Content preview (scrollable pre block, max-height 100px, dark background)
- Tags as `TagPill` components (if any)
- Action buttons: **Copy**, **Edit**, **Duplicate**, **Delete**
- Usage count: "Used N time(s)"

**Actions:**

| Button | API Call | Effect |
|---|---|---|
| ★/☆ (favorite toggle) | `POST /prompts/{id}/favorite` or `DELETE /prompts/{id}/favorite` | Toggles `is_favorite`, re-fetches list |
| Copy | `POST /prompts/{id}/copy` | Increments `usage_count`, re-fetches |
| Edit | (no API call) | Opens Edit Modal with `PromptEditor` pre-filled |
| Duplicate | `POST /prompts/{id}/duplicate` | Creates copy titled `"<title> Copy"`, re-fetches |
| Delete | `window.confirm()` → `DELETE /prompts/{id}` | Soft-deletes, card disappears from list |

---

### 2.8 Prompt Editor (`PromptEditor.jsx`)

**File:** `src/components/prompts/PromptEditor.jsx`  
**Used in:** Create modal and Edit modal

**Fields:**
| Field | Required | Notes |
|---|---|---|
| Title | Yes | Text input |
| Description | No | Text input |
| Prompt Content | Yes | Textarea, 6 rows, resizable |
| Group | No | Select dropdown from `/groups/` |
| Tags | No | Comma-separated string, split on save |

**Create mode:** All fields empty, button says "Create". Calls `POST /api/v1/prompts/`.

**Edit mode:** Pre-filled from the prompt object passed as `initial`. Tags populated as comma-separated string from `initial.tags[].name`. Button says "Update". Calls `PUT /api/v1/prompts/{id}`.

**Tag processing:** Input string `"python, gpt, coding"` → `["python", "gpt", "coding"]` → sent as `tag_names` array.

**Error handling:** API errors shown inline below the form.

---

### 2.9 Modal (`Modal.jsx`)

**File:** `src/components/common/Modal.jsx`

- Fixed overlay with `rgba(0,0,0,0.6)` backdrop
- Centered content box (max-width 520px, max-height 90vh, scrollable)
- Title + close button (×)
- Click outside (overlay) → close
- `Escape` key → close

---

### 2.10 Not Found Page (`/*)

**File:** `src/pages/NotFoundPage.jsx`

- Large "404" in muted border color
- "Page not found."
- Link back to `/dashboard`

---

## 3. API Endpoint Behavior

### 3.1 Auth Endpoints

#### POST /api/v1/auth/register
**Input:**
```json
{ "username": "alice", "email": "alice@example.com", "password": "secret123" }
```
**Success (201):**
```json
{
  "id": "uuid",
  "username": "alice",
  "email": "alice@example.com",
  "is_active": true,
  "created_at": "2026-07-09T10:00:00",
  "updated_at": "2026-07-09T10:00:00"
}
```
**Errors:** 400 if username or email already exists.

#### POST /api/v1/auth/login
**Input:** `{ "email": "alice@example.com", "password": "secret123" }`  
**Success (200):** `{ "access_token": "<jwt>", "token_type": "bearer" }`  
**Error:** 401 if credentials invalid.

#### GET /api/v1/auth/me
**Header:** `Authorization: Bearer <token>`  
**Success (200):** Same structure as register response.  
**Error:** 401 if no token or invalid token.

---

### 3.2 Groups Endpoints

#### POST /api/v1/groups/
**Input:** `{ "name": "Python Prompts", "description": "Optional" }`  
**Success (201):** `{ "id": "uuid", "user_id": "uuid", "name": "...", "description": "...", "created_at": "...", "updated_at": "..." }`

#### GET /api/v1/groups/
**Success (200):** Array of group objects, ordered newest first.

#### GET /api/v1/groups/{group_id}
**Success (200):** Single group object.  
**Error:** 404 if not found.

#### PUT /api/v1/groups/{group_id}
**Input:** `{ "name": "New Name" }` (partial)  
**Success (200):** Updated group object.

#### DELETE /api/v1/groups/{group_id}
**Success (200):** `{ "message": "Group deleted successfully" }`

---

### 3.3 Tags Endpoints

#### POST /api/v1/tags/
**Input:** `{ "name": "python" }`  
**Success (201):** `{ "id": "uuid", "user_id": "uuid", "name": "python", "created_at": "..." }`

#### GET /api/v1/tags/
**Success (200):** Array of tag objects, ordered A-Z.

#### GET /api/v1/tags/{tag_id}
**Success (200):** Single tag object.  
**Error:** 404 if not found.

---

### 3.4 Prompts Endpoints

#### POST /api/v1/prompts/
**Input:**
```json
{
  "title": "My Prompt",
  "description": "Optional",
  "prompt_content": "Explain X like I'm 5",
  "group_id": "uuid or null",
  "tag_names": ["python", "education"]
}
```
**Success (201):** Full PromptResponse object. Tags auto-created if new.

#### GET /api/v1/prompts/
**Query params:** `q`, `group_id`, `tag`, `is_favorite`  
**Success (200):** Array of non-deleted prompt objects, newest first.

#### GET /api/v1/prompts/{prompt_id}
**Success (200):** Single prompt.  
**Error:** 404 if not found or soft-deleted.

#### PUT /api/v1/prompts/{prompt_id}
**Input:** Any subset of `title`, `description`, `prompt_content`, `group_id`, `is_favorite`, `tag_names`.  
**Success (200):** Updated prompt object.

#### DELETE /api/v1/prompts/{prompt_id}
**Success (200):** `{ "message": "Prompt deleted successfully" }` (soft delete)

#### POST /api/v1/prompts/{prompt_id}/duplicate
**Success (201):** New prompt object with `title = "<original> Copy"`.

#### POST /api/v1/prompts/{prompt_id}/copy
**Success (200):** Prompt object with incremented `usage_count` and updated `last_used_at`.

#### POST /api/v1/prompts/{prompt_id}/favorite
**Success (200):** Prompt object with `is_favorite: true`.

#### DELETE /api/v1/prompts/{prompt_id}/favorite
**Success (200):** Prompt object with `is_favorite: false`.

---

## 4. State Management

### 4.1 Auth State (`AuthContext`)
```
user: null | UserObject
loading: boolean
saveToken(token): void → localStorage.setItem("access_token", token)
logout(): void → localStorage.removeItem + setUser(null)
```

**Initial load sequence:**
1. Check `localStorage` for `access_token`.
2. If found: call `GET /auth/me` → set user.
3. If not found or 401: set user to null.
4. Set `loading = false`.

`ProtectedRoute` blocks render until `loading === false`. If `user === null`, renders `<Navigate to="/login" replace />`.

### 4.2 Filter State (`PromptsPage`)
```javascript
const [filters, setFilters] = useState({
  q: "",
  group_id: "",
  tag: "",
  is_favorite: ""
});
```
Empty string = no filter applied. `useEffect` on `filters` triggers `fetchPrompts()`.

### 4.3 Modal State (`PromptsPage`)
```javascript
const [showCreate, setShowCreate] = useState(false);  // create modal
const [editTarget, setEditTarget] = useState(null);   // edit modal (null = closed)
```

---

## 5. Error Handling Summary

| Scenario | Backend Response | Frontend Behavior |
|---|---|---|
| Invalid token | 401 | Axios interceptor → clear token → `/login` |
| Not found | 404 | Component shows nothing / stays on page |
| Duplicate register | 400 | Error message shown in form |
| Wrong password | 401 | Error message shown in form |
| Missing required field | 422 (FastAPI validation) | Error shown in form |
| Network error | — | Error caught in catch block, shown inline |
| Delete confirmation denied | — | `window.confirm` returns false, no API call |
