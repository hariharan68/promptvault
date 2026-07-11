# Database Design Document
# PromptNest

**Version:** 1.0  
**Date:** 2026-07-09  
**Database:** PostgreSQL  
**ORM:** SQLAlchemy (declarative_base)

---

## 1. Overview

PromptNest uses 6 tables. All primary keys are UUID v4. All timestamps use PostgreSQL server-side defaults (`func.now()`).

```
users
  └─ groups         (user_id FK → CASCADE DELETE)
  └─ tags           (user_id FK → CASCADE DELETE)
  └─ prompts        (user_id FK → CASCADE DELETE)
       └─ group_id FK → groups (SET NULL on delete)
  └─ prompt_tags    (prompt_id FK → CASCADE, tag_id FK → CASCADE)
  └─ refresh_tokens (user_id FK → CASCADE DELETE)
```

---

## 2. Table Definitions

### 2.1 `users`
**File:** `app/models/user.py`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default uuid4 | Auto-generated |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Display name, login identifier |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Used for login |
| `password_hash` | TEXT | NOT NULL | bcrypt hash of password |
| `is_active` | BOOLEAN | NOT NULL, default TRUE | Soft-disable user (future use) |
| `created_at` | TIMESTAMP | NOT NULL, server_default=now() | |
| `updated_at` | TIMESTAMP | NOT NULL, server_default=now(), onupdate=now() | Auto-updated |

**Indexes:** PK on `id`, UNIQUE on `username`, UNIQUE on `email`.

---

### 2.2 `groups`
**File:** `app/models/group.py`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default uuid4 | |
| `user_id` | UUID | FK → users.id, NOT NULL, CASCADE DELETE | Owner |
| `name` | VARCHAR(100) | NOT NULL | Unique enforced at app layer per user |
| `description` | TEXT | NULLABLE | |
| `created_at` | TIMESTAMP | NOT NULL, server_default=now() | |
| `updated_at` | TIMESTAMP | NOT NULL, server_default=now(), onupdate=now() | |

**Notes:**
- No DB-level unique constraint on `(user_id, name)` — uniqueness is enforced in `group_service.py` via a pre-check query.
- `CASCADE DELETE` means deleting a user deletes all their groups.
- Deleting a group does NOT delete prompts — they become ungrouped via FK `SET NULL` from the `prompts` table.

---

### 2.3 `tags`
**File:** `app/models/tag.py`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default uuid4 | |
| `user_id` | UUID | FK → users.id, NOT NULL, CASCADE DELETE | |
| `name` | VARCHAR(50) | NOT NULL | Unique per user, enforced at app layer |
| `created_at` | TIMESTAMP | NOT NULL, server_default=now() | |

**Notes:**
- No `updated_at` (tags are immutable once created).
- App-layer uniqueness check in `tag_service.py` → `get_tag_by_name`.
- Tags are also auto-created in `prompt_service.get_or_create_tag()`.

---

### 2.4 `prompts`
**File:** `app/models/prompt.py`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default uuid4 | |
| `user_id` | UUID | FK → users.id, NOT NULL, CASCADE DELETE | |
| `group_id` | UUID | FK → groups.id, NULLABLE, SET NULL on group delete | |
| `title` | VARCHAR(200) | NOT NULL | |
| `description` | TEXT | NULLABLE | |
| `prompt_content` | TEXT | NOT NULL | The actual prompt text |
| `is_favorite` | BOOLEAN | NOT NULL, default FALSE | |
| `usage_count` | INTEGER | NOT NULL, default 0 | Incremented on copy action |
| `last_used_at` | TIMESTAMP | NULLABLE | Set on copy action |
| `deleted_at` | TIMESTAMP | NULLABLE | NULL = active, set = soft-deleted |
| `created_at` | TIMESTAMP | NOT NULL, server_default=now() | |
| `updated_at` | TIMESTAMP | NOT NULL, server_default=now(), onupdate=now() | |

**Soft Delete Pattern:**
- Deleting a prompt sets `deleted_at = datetime.utcnow()`.
- All queries filter `Prompt.deleted_at.is_(None)`.
- Data is recoverable by clearing `deleted_at`.

**Key Query Pattern (list with filters):**
```sql
SELECT * FROM prompts
WHERE user_id = :user_id
  AND deleted_at IS NULL
  [AND (title ILIKE :q OR description ILIKE :q OR prompt_content ILIKE :q)]
  [AND group_id = :group_id]
  [AND is_favorite = :is_favorite]
  [AND id IN (
      SELECT prompt_id FROM prompt_tags pt
      JOIN tags t ON t.id = pt.tag_id
      WHERE t.name = :tag
  )]
ORDER BY created_at DESC;
```

---

### 2.5 `prompt_tags`
**File:** `app/models/prompt_tag.py`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `prompt_id` | UUID | PK (composite), FK → prompts.id, CASCADE DELETE | |
| `tag_id` | UUID | PK (composite), FK → tags.id, CASCADE DELETE | |

**Notes:**
- Composite primary key `(prompt_id, tag_id)` — no separate `id` column.
- Many-to-many junction table between `prompts` and `tags`.
- When updating a prompt's tags: all existing `PromptTag` rows for that prompt are deleted, then new ones inserted.
- `CASCADE DELETE` on both FKs: deleting a prompt or tag removes the link.

---

### 2.6 `refresh_tokens`
**File:** `app/models/refresh_token.py`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default uuid4 | |
| `user_id` | UUID | FK → users.id, NOT NULL, CASCADE DELETE | |
| `token_hash` | TEXT | NOT NULL, UNIQUE | bcrypt/hash of the refresh token |
| `expires_at` | TIMESTAMP | NOT NULL | When the token expires |
| `revoked_at` | TIMESTAMP | NULLABLE | NULL = active, set = revoked |
| `created_at` | TIMESTAMP | NOT NULL, server_default=now() | |

**Status:** Model defined and included in `__init__.py`, but not yet wired to any endpoint. Reserved for v2 refresh token implementation.

---

## 3. Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐
│   users     │       │refresh_tokens│
│─────────────│       │─────────────│
│ id (PK)     │──────>│ user_id (FK)│
│ username    │       └─────────────┘
│ email       │
│ password_   │       ┌─────────────┐
│   hash      │──────>│   groups    │
│ is_active   │       │─────────────│
│ created_at  │       │ id (PK)     │
│ updated_at  │       │ user_id (FK)│
└─────────────┘       │ name        │
       │              │ description │
       │              └──────┬──────┘
       │                     │ SET NULL
       │              ┌──────▼──────┐
       └─────────────>│   prompts   │
                      │─────────────│
                      │ id (PK)     │
                      │ user_id (FK)│
                      │ group_id(FK)│
                      │ title       │
                      │ description │
                      │ prompt_     │
                      │   content   │
                      │ is_favorite │
                      │ usage_count │
                      │ last_used_at│
                      │ deleted_at  │
                      └──────┬──────┘
                             │
                      ┌──────▼──────┐
                      │ prompt_tags │
                      │─────────────│
                      │ prompt_id(PK│
                      │   FK)       │
                      │ tag_id (PK  │
                      │   FK)       │
                      └──────┬──────┘
                             │
       ┌─────────────────────┘
       │
┌──────▼──────┐
│    tags     │
│─────────────│
│ id (PK)     │
│ user_id (FK)│
│ name        │
│ created_at  │
└─────────────┘
```

---

## 4. Cascade Behavior Summary

| Action | Effect |
|---|---|
| Delete `users` row | Cascades to: groups, tags, prompts, prompt_tags (via prompts), refresh_tokens |
| Delete `groups` row | prompts.group_id → SET NULL (prompts survive, ungrouped) |
| Delete `prompts` row | prompt_tags rows for that prompt → CASCADE DELETE |
| Delete `tags` row | prompt_tags rows for that tag → CASCADE DELETE |
| "Delete" prompt (app) | Sets `deleted_at` — no DB row deleted |

---

## 5. ORM Session Management

**Pattern:** Request-scoped sessions via FastAPI dependency injection.

```python
def get_db():
    db = SessionLocal()
    try:
        yield db        # route handler runs here
    finally:
        db.close()      # always closes, even on exception
```

**Config:**
```python
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
```

- `autocommit=False`: explicit `db.commit()` required after writes.
- `autoflush=False`: no implicit flushes, prevents surprising queries.

---

## 6. Indexes (Recommended Additions)

The current model does not define explicit indexes beyond PKs and UNIQUE constraints. For production performance, these should be added:

| Table | Column(s) | Reason |
|---|---|---|
| `prompts` | `user_id` | Every query filters by user |
| `prompts` | `user_id, deleted_at` | Composite for main list query |
| `prompts` | `is_favorite` | Favorite filter |
| `prompts` | `group_id` | Group filter |
| `prompt_tags` | `tag_id` | Tag join in filter query |
| `tags` | `user_id, name` | Tag lookup by name per user |
| `groups` | `user_id` | Group list per user |

---

## 7. Known Issues / Future Work

| Issue | Notes |
|---|---|
| No DB-level unique constraint on `(user_id, name)` in groups/tags | Race condition possible; add `UniqueConstraint` in migration |
| `refresh_tokens` table unused | Ready for v2 implementation |
| No database migrations tool configured | Add Alembic for schema migrations |
| `datetime.utcnow()` deprecated | Should use `datetime.now(timezone.utc)` in Python 3.12+ |
| Tags not returned in `PromptResponse` | Pydantic schema does not include `tags` field; requires relationship + schema update |
