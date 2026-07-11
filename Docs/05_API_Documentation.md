# API Documentation
# PromptNest REST API

**Version:** 1.0  
**Base URL:** `http://127.0.0.1:8000/api/v1`  
**Swagger UI:** `http://127.0.0.1:8000/docs`  
**Authentication:** Bearer token (JWT, HS256, 30-minute expiry)

All protected endpoints require the header:
```
Authorization: Bearer <access_token>
```

---

## Authentication

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "mypassword"
}
```

| Field | Type | Required | Constraint |
|---|---|---|---|
| username | string | Yes | Max 50 chars, unique |
| email | string | Yes | Valid email, unique |
| password | string | Yes | Max 72 bytes |

**Response 201:**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "username": "alice",
  "email": "alice@example.com",
  "is_active": true,
  "created_at": "2026-07-09T10:00:00",
  "updated_at": "2026-07-09T10:00:00"
}
```

**Error Responses:**
| Status | Detail |
|---|---|
| 400 | `"Email already registered"` |
| 400 | `"Username already registered"` |
| 422 | Validation error (invalid email format, etc.) |

---

### POST /auth/login
Log in and receive a JWT access token.

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "mypassword"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
| Status | Detail |
|---|---|
| 401 | `"Invalid email or password"` |

---

### GET /auth/me
Get the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "username": "alice",
  "email": "alice@example.com",
  "is_active": true,
  "created_at": "2026-07-09T10:00:00",
  "updated_at": "2026-07-09T10:00:00"
}
```

**Error Responses:**
| Status | Detail |
|---|---|
| 401 | `"Invalid token"` or `"User not found"` |

---

## Groups

All group endpoints require authentication.

### POST /groups/
Create a new group.

**Request Body:**
```json
{
  "name": "Python Prompts",
  "description": "Prompts for Python coding tasks"
}
```

| Field | Type | Required |
|---|---|---|
| name | string | Yes |
| description | string | No |

**Response 201:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Python Prompts",
  "description": "Prompts for Python coding tasks",
  "created_at": "2026-07-09T10:00:00",
  "updated_at": "2026-07-09T10:00:00"
}
```

**Error Responses:**
| Status | Detail |
|---|---|
| 400 | `"Group name already exists"` |

---

### GET /groups/
List all groups for the current user.

**Response 200:** Array of group objects, ordered by `created_at DESC`.
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Python Prompts",
    "description": "...",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

### GET /groups/{group_id}
Get a single group by ID.

**Path Parameter:** `group_id` (UUID)

**Response 200:** Single group object.

**Error Responses:**
| Status | Detail |
|---|---|
| 404 | `"Group not found"` |

---

### PUT /groups/{group_id}
Update a group. All fields optional (partial update).

**Request Body:**
```json
{
  "name": "New Name",
  "description": "Updated description"
}
```

**Response 200:** Updated group object.

**Error Responses:**
| Status | Detail |
|---|---|
| 404 | `"Group not found"` |
| 400 | `"Group name already exists"` |

---

### DELETE /groups/{group_id}
Delete a group. Prompts in the group become ungrouped (group_id set to NULL).

**Response 200:**
```json
{ "message": "Group deleted successfully" }
```

**Error Responses:**
| Status | Detail |
|---|---|
| 404 | `"Group not found"` |

---

## Tags

All tag endpoints require authentication.

### POST /tags/
Create a new tag.

**Request Body:**
```json
{ "name": "python" }
```

**Response 201:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "python",
  "created_at": "2026-07-09T10:00:00"
}
```

**Error Responses:**
| Status | Detail |
|---|---|
| 400 | `"Tag already exists"` |

---

### GET /tags/
List all tags for the current user, ordered A-Z.

**Response 200:** Array of tag objects.

---

### GET /tags/{tag_id}
Get a single tag by ID.

**Response 200:** Single tag object.

**Error Responses:**
| Status | Detail |
|---|---|
| 404 | `"Tag not found"` |

---

## Prompts

All prompt endpoints require authentication.

### POST /prompts/
Create a new prompt.

**Request Body:**
```json
{
  "title": "Explain Python Decorators",
  "description": "For beginner developers",
  "prompt_content": "Explain Python decorators in simple words with examples.",
  "group_id": "uuid-or-null",
  "tag_names": ["python", "education", "beginner"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| title | string | Yes | Max 200 chars |
| prompt_content | string | Yes | The actual prompt text |
| description | string | No | Optional summary |
| group_id | UUID | No | Must be a group owned by the user |
| tag_names | string[] | No | Auto-created if they don't exist |

**Response 201:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "group_id": "uuid",
  "title": "Explain Python Decorators",
  "description": "For beginner developers",
  "prompt_content": "Explain Python decorators in simple words with examples.",
  "is_favorite": false,
  "usage_count": 0,
  "last_used_at": null,
  "deleted_at": null,
  "created_at": "2026-07-09T10:00:00",
  "updated_at": "2026-07-09T10:00:00"
}
```

---

### GET /prompts/
List all active prompts for the current user with optional filters.

**Query Parameters:**

| Param | Type | Description | Example |
|---|---|---|---|
| `q` | string | Case-insensitive partial match on title, description, prompt_content | `?q=python` |
| `group_id` | UUID | Filter by group | `?group_id=3fa85f64-...` |
| `tag` | string | Filter by exact tag name | `?tag=education` |
| `is_favorite` | boolean | Filter by favorite status | `?is_favorite=true` |

All params are optional. Multiple params apply as AND conditions.

**Examples:**
```
GET /prompts/
GET /prompts/?q=python
GET /prompts/?group_id=3fa85f64-5717-4562-b3fc-2c963f66afa6
GET /prompts/?tag=education
GET /prompts/?is_favorite=true
GET /prompts/?q=python&is_favorite=true
GET /prompts/?q=decorator&group_id=<uuid>&tag=python
```

**Response 200:** Array of prompt objects (non-deleted), ordered by `created_at DESC`.

---

### GET /prompts/{prompt_id}
Get a single prompt by ID.

**Response 200:** Single prompt object.

**Error Responses:**
| Status | Detail |
|---|---|
| 404 | `"Prompt not found"` (also if soft-deleted) |

---

### PUT /prompts/{prompt_id}
Update a prompt. All fields are optional.

**Request Body (partial):**
```json
{
  "title": "Updated Title",
  "is_favorite": true,
  "tag_names": ["new-tag", "another-tag"]
}
```

**Notes:**
- If `tag_names` is provided, ALL existing tags for the prompt are replaced.
- If `tag_names` is omitted, existing tags are unchanged.
- Tags in `tag_names` are auto-created if they don't exist for the user.

**Response 200:** Updated prompt object.

**Error Responses:**
| Status | Detail |
|---|---|
| 404 | `"Prompt not found"` |

---

### DELETE /prompts/{prompt_id}
Soft-delete a prompt. Sets `deleted_at` timestamp. Data is not destroyed.

**Response 200:**
```json
{ "message": "Prompt deleted successfully" }
```

**Error Responses:**
| Status | Detail |
|---|---|
| 404 | `"Prompt not found"` |

---

### POST /prompts/{prompt_id}/duplicate
Create a full copy of a prompt with title `"<original_title> Copy"`.

**Notes:**
- Copies title, description, prompt_content, group_id, is_favorite.
- New prompt has `usage_count = 0`, `last_used_at = null`.
- Tags are NOT duplicated (tags relationship not copied in current implementation).

**Response 201:** New prompt object.

**Error Responses:**
| Status | Detail |
|---|---|
| 404 | `"Prompt not found"` |

---

### POST /prompts/{prompt_id}/copy
Record usage of a prompt. Increments `usage_count` by 1 and sets `last_used_at = NOW()`.

**Response 200:** Updated prompt object with incremented usage_count.

**Error Responses:**
| Status | Detail |
|---|---|
| 404 | `"Prompt not found"` |

---

### POST /prompts/{prompt_id}/favorite
Mark a prompt as favorite.

**Response 200:** Prompt object with `is_favorite: true`.

**Error Responses:**
| Status | Detail |
|---|---|
| 404 | `"Prompt not found"` |

---

### DELETE /prompts/{prompt_id}/favorite
Remove a prompt from favorites.

**Response 200:** Prompt object with `is_favorite: false`.

**Error Responses:**
| Status | Detail |
|---|---|
| 404 | `"Prompt not found"` |

---

## System Endpoints

### GET /
Health check. No authentication required.

**Response 200:**
```json
{ "message": "PromptNest backend is running" }
```

---

### GET /health
Application health status.

**Response 200:**
```json
{ "status": "healthy" }
```

---

### GET /db-test
Verify database connectivity. Executes `SELECT 1`.

**Response 200:**
```json
{ "message": "Database connection successful" }
```

---

## Common HTTP Status Codes

| Code | Meaning | When |
|---|---|---|
| 200 | OK | GET, PUT, DELETE (soft) succeeded |
| 201 | Created | POST succeeded, resource created |
| 400 | Bad Request | Duplicate name, validation failure |
| 401 | Unauthorized | Missing, expired, or invalid token |
| 403 | Forbidden | Valid token, insufficient permissions |
| 404 | Not Found | Resource doesn't exist or belongs to another user |
| 422 | Unprocessable Entity | FastAPI request body validation failure |

---

## JWT Token Details

| Property | Value |
|---|---|
| Algorithm | HS256 |
| Expiry | 30 minutes from issuance |
| Payload fields | `sub` (user UUID string), `email`, `exp` (expiry timestamp) |
| Storage | Browser `localStorage` key: `access_token` |
| Transport | `Authorization: Bearer <token>` header |

---

## Pydantic Response Schemas

### UserResponse
```
id, username, email, is_active, created_at, updated_at
```

### GroupResponse
```
id, user_id, name, description, created_at, updated_at
```

### TagResponse
```
id, user_id, name, created_at
```

### PromptResponse
```
id, user_id, group_id, title, description, prompt_content,
is_favorite, usage_count, last_used_at, deleted_at, created_at, updated_at
```

### TokenResponse
```
access_token, token_type
```
