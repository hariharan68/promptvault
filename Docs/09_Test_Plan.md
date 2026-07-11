# Test Plan Document
# PromptNest

**Version:** 1.0  
**Date:** 2026-07-09  
**Test file:** `backend/test_api.py`  
**Current result:** 73/73 tests passing

---

## 1. Test Strategy

PromptNest v1.0 uses **black-box integration testing** via HTTP requests against a running backend. Tests call the real FastAPI server with a real PostgreSQL database — no mocking, no in-memory substitutes.

### 1.1 Approach
- Single test file (`test_api.py`) using the `requests` library.
- Sequential execution — tests share state (a registered user, created resources).
- Each run creates a unique user (`testuser_<uuid8>`) to avoid cross-run conflicts.
- No test framework (pytest, unittest) — custom `pass_test()`/`fail_test()` helpers.
- Server must be running before test execution.

### 1.2 Pre-Requisites
1. PostgreSQL running with `promptnest` database accessible.
2. FastAPI backend running: `uvicorn app.main:app --reload --port 8000`
3. Python packages installed: `pip install requests`

### 1.3 Test Execution
```bash
cd backend
python test_api.py
```

---

## 2. Test Coverage

### 2.1 Server Tests (3 tests)

| Test | Endpoint | Assertion |
|---|---|---|
| GET / | Root endpoint | HTTP 200 + message |
| GET /health | Health check | HTTP 200 + `status: healthy` |
| GET /db-test | DB connectivity | HTTP 200 + success message |

---

### 2.2 Auth Tests — Happy Path (11 tests)

| Test | Endpoint | Assertion |
|---|---|---|
| Register | POST /auth/register | HTTP 201 |
| Username matches | — | `register_data.username == username` |
| Email matches | — | `register_data.email == email` |
| User ID returned | — | `"id" in register_data` |
| Password not exposed | — | `"password_hash" not in register_data` |
| Login | POST /auth/login | HTTP 200 |
| Token returned | — | `bool(access_token)` |
| Token type | — | `token_type == "bearer"` |
| Get me | GET /auth/me | HTTP 200 |
| Me username | — | matches registered username |
| Me user ID | — | matches register response ID |

---

### 2.3 Auth Tests — Negative Cases (4 tests)

| Test | Endpoint | Assertion |
|---|---|---|
| Duplicate username | POST /auth/register | HTTP 400 |
| Duplicate email | POST /auth/register | HTTP 400 |
| Wrong password | POST /auth/login | HTTP 401 |
| No token on /me | GET /auth/me | HTTP 401 or 403 |

---

### 2.4 Groups Tests (8 tests)

| Test | Endpoint | Assertion |
|---|---|---|
| Create group | POST /groups/ | HTTP 201 |
| Group ID returned | — | `bool(group_id)` |
| List groups | GET /groups/ | HTTP 200, list type |
| Groups is list | — | `isinstance(groups_data, list)` |
| Get single group | GET /groups/{id} | HTTP 200 |
| Group ID matches | — | `single_group.id == group_id` |
| Update group | PUT /groups/{id} | HTTP 200 |
| Name updated | — | `updated_group.name == new_name` |

---

### 2.5 Tags Tests (6 tests)

| Test | Endpoint | Assertion |
|---|---|---|
| Create tag | POST /tags/ | HTTP 201 |
| Tag ID returned | — | `bool(tag_id)` |
| List tags | GET /tags/ | HTTP 200 |
| Tags is list | — | `isinstance(tags_data, list)` |
| Get single tag | GET /tags/{id} | HTTP 200 |
| Tag ID matches | — | `single_tag.id == tag_id` |

---

### 2.6 Prompts Tests — CRUD (21 tests)

| Test | Endpoint | Assertion |
|---|---|---|
| Create prompt | POST /prompts/ | HTTP 201 |
| Prompt ID returned | — | `bool(prompt_id)` |
| Group ID matches | — | `prompt_data.group_id == group_id` |
| Usage count starts 0 | — | `usage_count == 0` |
| List prompts | GET /prompts/ | HTTP 200 |
| Prompts is list | — | `isinstance(prompts_data, list)` |
| Get single prompt | GET /prompts/{id} | HTTP 200 |
| Single prompt ID | — | `single_prompt.id == prompt_id` |
| Update prompt | PUT /prompts/{id} | HTTP 200 |
| Title updated | — | `updated_prompt.title == new_title` |
| Favorite updated | — | `updated_prompt.is_favorite is True` |
| Copy prompt | POST /prompts/{id}/copy | HTTP 200 |
| Usage count incremented | — | `usage_count >= 1` |
| Favorite prompt | POST /prompts/{id}/favorite | HTTP 200 |
| is_favorite true | — | `favorite_prompt.is_favorite is True` |
| Unfavorite prompt | DELETE /prompts/{id}/favorite | HTTP 200 |
| is_favorite false | — | `unfavorite_prompt.is_favorite is False` |
| Duplicate prompt | POST /prompts/{id}/duplicate | HTTP 201 |
| Duplicate ID returned | — | `bool(duplicate_prompt_id)` |
| Duplicate is new | — | `duplicate_id != original_id` |
| Delete prompt | DELETE /prompts/{id} | HTTP 200 |
| Deleted not found | GET /prompts/{id} | HTTP 404 |

---

### 2.7 Prompt Filter Tests (15 tests)

Filter-specific prompt created: title `"FilterTest Prompt <uuid>"`, group=`group_id`, tag=`filter-tag-<uuid>`.

| Test | Endpoint | Assertion |
|---|---|---|
| Create filter prompt | POST /prompts/ | HTTP 201 |
| q search 200 | GET /prompts/?q=FilterTest | HTTP 200 |
| q search finds prompt | — | `any(p.id == filter_prompt_id)` |
| group_id filter 200 | GET /prompts/?group_id=<uuid> | HTTP 200 |
| group_id finds prompt | — | `any(p.id == filter_prompt_id)` |
| tag filter 200 | GET /prompts/?tag=filter-tag-<uuid> | HTTP 200 |
| tag finds prompt | — | `any(p.id == filter_prompt_id)` |
| Favorite for test | POST /prompts/{id}/favorite | HTTP 200 |
| is_favorite filter 200 | GET /prompts/?is_favorite=true | HTTP 200 |
| is_favorite finds prompt | — | `any(p.id == filter_prompt_id)` |
| combined filter 200 | GET /prompts/?q=FilterTest&is_favorite=true | HTTP 200 |
| combined finds prompt | — | `any(p.id == filter_prompt_id)` |
| Delete filter prompt | DELETE /prompts/{id} | HTTP 200 |
| After delete search 200 | GET /prompts/?q=FilterTest | HTTP 200 |
| Deleted not in results | — | `not any(p.id == filter_prompt_id)` |

---

### 2.8 Protected Routes Tests (3 tests)

| Test | Endpoint | Assertion |
|---|---|---|
| Groups without token | GET /groups/ | HTTP 401 or 403 |
| Tags without token | GET /tags/ | HTTP 401 or 403 |
| Prompts without token | GET /prompts/ | HTTP 401 or 403 |

---

## 3. Test Result Summary

```
Total: 73 tests
Sections: SERVER (3), AUTH (15), GROUPS (8), TAGS (6), PROMPTS (21), FILTERS (15), PROTECTED (3), PROMPTS (21-corrected)

Current status: 73 passed | 0 failed
```

---

## 4. Test Gaps (Not Yet Covered)

### 4.1 Auth Edge Cases
- [ ] Register with password longer than 72 bytes
- [ ] Register with invalid email format
- [ ] Register with empty username/email/password
- [ ] Login with non-existent email
- [ ] Access with expired JWT token
- [ ] Access with tampered/corrupted JWT token

### 4.2 Groups
- [ ] Create group with duplicate name (negative test)
- [ ] Update group to existing name (negative test)
- [ ] Delete group — verify prompts become ungrouped (group_id = null)
- [ ] Access another user's group (expect 404)
- [ ] Create group without authentication (expect 401)

### 4.3 Tags
- [ ] Create duplicate tag (negative test)
- [ ] Access another user's tag (expect 404)
- [ ] Tag auto-creation during prompt creation

### 4.4 Prompts
- [ ] Create prompt with missing required `title` (expect 422)
- [ ] Create prompt with missing required `prompt_content` (expect 422)
- [ ] Create prompt with invalid `group_id` UUID
- [ ] Access another user's prompt (expect 404)
- [ ] Update prompt with empty `tag_names` array (should remove all tags)
- [ ] Duplicate a prompt that has been soft-deleted (expect 404)
- [ ] Copy a soft-deleted prompt (expect 404)
- [ ] Favorite a soft-deleted prompt (expect 404)
- [ ] Search with special regex characters in `q` param

### 4.5 Filters
- [ ] `?is_favorite=false` — returns non-favorited prompts only
- [ ] Multiple tags on one prompt, filter by each
- [ ] `?group_id=<uuid>` with no matching prompts — returns empty list
- [ ] `?q=` (empty string) — should return all (not filter)
- [ ] Combined 3-param filter (q + group_id + tag)

### 4.6 Missing Test Types
- **Unit tests** — Service functions in isolation (mocked DB)
- **Frontend tests** — Component rendering (React Testing Library)
- **Performance tests** — Response time with 1000+ prompts
- **Load tests** — Concurrent users (Locust, k6)

---

## 5. How to Add a New Test

Append to `test_api.py` following the pattern:

```python
print_header("MY NEW SECTION")

# Make the request
r = requests.get(f"{API_URL}/prompts/", headers=auth_headers(access_token))
data = get_json(r)

# Assert
check(r.status_code == 200, "GET /prompts/ returns 200")
check(isinstance(data, list), "Response is a list")
check(len(data) >= 0, "Has expected data", f"count={len(data)}")
```

**Helper functions:**
- `check(condition, message, extra="")` — passes or fails a test
- `auth_headers(token)` — returns `{"Authorization": "Bearer <token>"}`
- `get_json(response)` — safe JSON parse

---

## 6. CI/CD Integration Notes

To run tests in CI:
1. Start a PostgreSQL instance with database `promptnest`.
2. Run `alembic upgrade head` (or equivalent schema setup).
3. Start FastAPI: `uvicorn app.main:app --port 8000 &`
4. Wait for server ready: `curl --retry 5 --retry-delay 1 http://127.0.0.1:8000/health`
5. Run tests: `python test_api.py`
6. Check exit code: add `sys.exit(1 if failed > 0 else 0)` to `test_api.py`.
