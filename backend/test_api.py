"""
test_api.py
───────────
Automated test suite for PromptNest API.

Before running:
1. Start FastAPI:
   uvicorn app.main:app --reload --port 8002

2. Run:
   python test_api.py
"""

import os
import uuid
import requests


BASE_URL = os.getenv("PROMPTNEST_BASE_URL", "http://127.0.0.1:8000")
API_URL = f"{BASE_URL}/api/v1"

passed = 0
failed = 0


def print_header(title):
    print(f"\n-- {title} " + "-" * (55 - len(title)))


def pass_test(message, extra=""):
    global passed
    passed += 1
    if extra:
        print(f"  PASS  {message}  -> {extra}")
    else:
        print(f"  PASS  {message}")


def fail_test(message, extra=""):
    global failed
    failed += 1
    if extra:
        print(f"  FAIL  {message}  -> {extra}")
    else:
        print(f"  FAIL  {message}")


def check(condition, message, extra=""):
    if condition:
        pass_test(message, extra)
    else:
        fail_test(message, extra)


def get_json(response):
    try:
        return response.json()
    except Exception:
        return {}


def prompt_items(data):
    if not isinstance(data, dict):
        return data
    return data.get("data", data.get("items", data))


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


print("\nPromptNest API - Automated Test Suite")
print(f"Server: {BASE_URL}\n")

unique = uuid.uuid4().hex[:8]

username = f"testuser_{unique}"
email = f"test_{unique}@example.com"
password = "test123"

access_token = None
user_id = None
group_id = None
tag_id = None
prompt_id = None
duplicate_prompt_id = None


# SERVER TESTS

print_header("SERVER")

try:
    r = requests.get(f"{BASE_URL}/")
    data = get_json(r)
    check(r.status_code == 200, "GET /", data.get("message"))
except Exception as e:
    fail_test("GET /", str(e))

try:
    r = requests.get(f"{BASE_URL}/health")
    data = get_json(r)
    check(r.status_code == 200, "GET /health", data.get("status"))
except Exception as e:
    fail_test("GET /health", str(e))

try:
    r = requests.get(f"{BASE_URL}/db-test")
    data = get_json(r)
    check(r.status_code == 200, "GET /db-test", data.get("message"))
except Exception as e:
    fail_test("GET /db-test", str(e))


# AUTH TESTS

print_header("AUTH - Register + Login + Me")

register_payload = {
    "username": username,
    "email": email,
    "password": password,
}

r = requests.post(f"{API_URL}/auth/register", json=register_payload)
register_data = get_json(r)

check(r.status_code == 201, "POST /auth/register", f"email={email}")
check(register_data.get("username") == username, "Registered username matches")
check(register_data.get("email") == email, "Registered email matches")
check("id" in register_data, "User ID returned")
check("password_hash" not in register_data, "Password hash not returned")

user_id = register_data.get("id")

login_payload = {
    "email": email,
    "password": password,
}

r = requests.post(f"{API_URL}/auth/login", json=login_payload)
login_data = get_json(r)

access_token = login_data.get("access_token")

check(r.status_code == 200, "POST /auth/login")
check(bool(access_token), "Access token returned", str(access_token)[:20] + "...")
check(login_data.get("token_type") == "bearer", "Token type is bearer")

r = requests.get(f"{API_URL}/auth/me", headers=auth_headers(access_token))
me_data = get_json(r)

check(r.status_code == 200, "GET /auth/me")
check(me_data.get("username") == username, "Me username matches")
check(me_data.get("email") == email, "Me email matches")
check(me_data.get("id") == user_id, "Me user ID matches register")


print_header("AUTH - Negative Checks")

r = requests.post(f"{API_URL}/auth/register", json={
    "username": username,
    "email": f"other_{unique}@example.com",
    "password": password,
})
check(r.status_code == 400, "Duplicate username blocked", get_json(r).get("detail"))

r = requests.post(f"{API_URL}/auth/register", json={
    "username": f"other_{unique}",
    "email": email,
    "password": password,
})
check(r.status_code == 400, "Duplicate email blocked", get_json(r).get("detail"))

r = requests.post(f"{API_URL}/auth/login", json={
    "email": email,
    "password": "wrongpassword",
})
check(r.status_code == 401, "Wrong password blocked", get_json(r).get("detail"))

r = requests.get(f"{API_URL}/auth/me")
check(r.status_code in [401, 403], "GET /auth/me without token blocked", str(r.status_code))


# GROUP TESTS

print_header("GROUPS")

group_payload = {
    "name": f"Learning Group {unique}",
    "description": "Group created by automated test",
}

r = requests.post(f"{API_URL}/groups/", json=group_payload, headers=auth_headers(access_token))
group_data = get_json(r)
group_id = group_data.get("id")

check(r.status_code == 201, "POST /groups/", group_data.get("name"))
check(bool(group_id), "Group ID returned")

r = requests.get(f"{API_URL}/groups/", headers=auth_headers(access_token))
groups_data = get_json(r)

check(r.status_code == 200, "GET /groups/")
check(isinstance(prompt_items(groups_data), list), "Groups response contains data")

r = requests.get(f"{API_URL}/groups/{group_id}", headers=auth_headers(access_token))
single_group = get_json(r)

check(r.status_code == 200, "GET /groups/{group_id}")
check(single_group.get("id") == group_id, "Single group ID matches")

r = requests.put(
    f"{API_URL}/groups/{group_id}",
    json={"name": f"Updated Group {unique}", "description": "Updated description"},
    headers=auth_headers(access_token),
)
updated_group = get_json(r)

check(r.status_code == 200, "PUT /groups/{group_id}")
check(updated_group.get("name") == f"Updated Group {unique}", "Group name updated")


# TAG TESTS

print_header("TAGS")

tag_payload = {
    "name": f"python-{unique}",
}

r = requests.post(f"{API_URL}/tags/", json=tag_payload, headers=auth_headers(access_token))
tag_data = get_json(r)
tag_id = tag_data.get("id")

check(r.status_code == 201, "POST /tags/", tag_data.get("name"))
check(bool(tag_id), "Tag ID returned")

r = requests.get(f"{API_URL}/tags/", headers=auth_headers(access_token))
tags_data = get_json(r)

check(r.status_code == 200, "GET /tags/")
check(isinstance(prompt_items(tags_data), list), "Tags response contains data")

r = requests.get(f"{API_URL}/tags/{tag_id}", headers=auth_headers(access_token))
single_tag = get_json(r)

check(r.status_code == 200, "GET /tags/{tag_id}")
check(single_tag.get("id") == tag_id, "Single tag ID matches")


# PROMPT TESTS

print_header("PROMPTS")

prompt_payload = {
    "title": f"Test Prompt {unique}",
    "description": "Prompt created by automated test",
    "prompt_content": "Explain Python decorators in simple words.",
    "group_id": group_id,
    "tag_names": [f"python-{unique}", f"learning-{unique}"],
}

r = requests.post(f"{API_URL}/prompts/", json=prompt_payload, headers=auth_headers(access_token))
prompt_data = get_json(r)
prompt_id = prompt_data.get("id")

check(r.status_code == 201, "POST /prompts/", prompt_data.get("title"))
check(bool(prompt_id), "Prompt ID returned")
check(prompt_data.get("group_id") == group_id, "Prompt group ID matches")
check(prompt_data.get("usage_count") == 0, "Prompt usage count starts at 0")

r = requests.get(f"{API_URL}/prompts/", headers=auth_headers(access_token))
prompts_data = get_json(r)

check(r.status_code == 200, "GET /prompts/")
check(isinstance(prompt_items(prompts_data), list), "Prompts response contains items")

r = requests.get(f"{API_URL}/prompts/{prompt_id}", headers=auth_headers(access_token))
single_prompt = get_json(r)

check(r.status_code == 200, "GET /prompts/{prompt_id}")
check(single_prompt.get("id") == prompt_id, "Single prompt ID matches")

r = requests.put(
    f"{API_URL}/prompts/{prompt_id}",
    json={
        "title": f"Updated Prompt {unique}",
        "is_favorite": True,
        "tag_names": [f"updated-{unique}"],
    },
    headers=auth_headers(access_token),
)
updated_prompt = get_json(r)

check(r.status_code == 200, "PUT /prompts/{prompt_id}")
check(updated_prompt.get("title") == f"Updated Prompt {unique}", "Prompt title updated")
check(updated_prompt.get("is_favorite") is True, "Prompt favorite updated")

r = requests.post(f"{API_URL}/prompts/{prompt_id}/copy", headers=auth_headers(access_token))
copied_prompt = get_json(r)

check(r.status_code == 200, "POST /prompts/{prompt_id}/copy")
check(copied_prompt.get("usage_count", 0) >= 1, "Prompt usage count increased")

r = requests.post(f"{API_URL}/prompts/{prompt_id}/favorite", headers=auth_headers(access_token))
favorite_prompt = get_json(r)

check(r.status_code == 200, "POST /prompts/{prompt_id}/favorite")
check(favorite_prompt.get("is_favorite") is True, "Prompt marked favorite")

r = requests.delete(f"{API_URL}/prompts/{prompt_id}/favorite", headers=auth_headers(access_token))
unfavorite_prompt = get_json(r)

check(r.status_code == 200, "DELETE /prompts/{prompt_id}/favorite")
check(unfavorite_prompt.get("is_favorite") is False, "Prompt marked unfavorite")

r = requests.post(f"{API_URL}/prompts/{prompt_id}/duplicate", headers=auth_headers(access_token))
duplicate_prompt = get_json(r)
duplicate_prompt_id = duplicate_prompt.get("id")

check(r.status_code == 201, "POST /prompts/{prompt_id}/duplicate")
check(bool(duplicate_prompt_id), "Duplicate prompt ID returned")
check(duplicate_prompt_id != prompt_id, "Duplicate prompt has new ID")

r = requests.delete(f"{API_URL}/prompts/{prompt_id}", headers=auth_headers(access_token))
delete_data = get_json(r)

check(r.status_code == 200, "DELETE /prompts/{prompt_id}", delete_data.get("message"))

r = requests.get(f"{API_URL}/prompts/{prompt_id}", headers=auth_headers(access_token))
check(r.status_code == 404, "Deleted prompt no longer found")


# PROMPT FILTER TESTS

print_header("PROMPT FILTERS")

filter_prompt_payload = {
    "title": f"FilterTest Prompt {unique}",
    "description": "Filter test description",
    "prompt_content": "Filter test content",
    "group_id": group_id,
    "tag_names": [f"filter-tag-{unique}"],
}

r = requests.post(f"{API_URL}/prompts/", json=filter_prompt_payload, headers=auth_headers(access_token))
filter_prompt_data = get_json(r)
filter_prompt_id = filter_prompt_data.get("id")

check(r.status_code == 201, "POST /prompts/ (filter test prompt)", filter_prompt_data.get("title"))

r = requests.get(f"{API_URL}/prompts/?q=FilterTest", headers=auth_headers(access_token))
q_results = get_json(r)
q_results = prompt_items(q_results)
check(r.status_code == 200, "GET /prompts/?q= returns 200")
check(any(p.get("id") == filter_prompt_id for p in q_results), "q search returns created prompt")

r = requests.get(f"{API_URL}/prompts/?group_id={group_id}", headers=auth_headers(access_token))
group_results = get_json(r)
group_results = prompt_items(group_results)
check(r.status_code == 200, "GET /prompts/?group_id= returns 200")
check(any(p.get("id") == filter_prompt_id for p in group_results), "group_id filter returns created prompt")

r = requests.get(f"{API_URL}/prompts/?tag=filter-tag-{unique}", headers=auth_headers(access_token))
tag_results = get_json(r)
tag_results = prompt_items(tag_results)
check(r.status_code == 200, "GET /prompts/?tag= returns 200")
check(any(p.get("id") == filter_prompt_id for p in tag_results), "tag filter returns created prompt")

r = requests.post(f"{API_URL}/prompts/{filter_prompt_id}/favorite", headers=auth_headers(access_token))
check(r.status_code == 200, "POST /prompts/{filter_prompt_id}/favorite (setup for filter test)")

r = requests.get(f"{API_URL}/prompts/?is_favorite=true", headers=auth_headers(access_token))
fav_results = get_json(r)
fav_results = prompt_items(fav_results)
check(r.status_code == 200, "GET /prompts/?is_favorite=true returns 200")
check(any(p.get("id") == filter_prompt_id for p in fav_results), "is_favorite=true filter returns favorited prompt")

r = requests.get(f"{API_URL}/prompts/?q=FilterTest&is_favorite=true", headers=auth_headers(access_token))
combined_results = get_json(r)
combined_results = prompt_items(combined_results)
check(r.status_code == 200, "GET /prompts/?q=&is_favorite=true returns 200")
check(any(p.get("id") == filter_prompt_id for p in combined_results), "Combined q+is_favorite filter works")

r = requests.delete(f"{API_URL}/prompts/{filter_prompt_id}", headers=auth_headers(access_token))
check(r.status_code == 200, "DELETE /prompts/{filter_prompt_id} (filter test prompt)")

r = requests.get(f"{API_URL}/prompts/?q=FilterTest", headers=auth_headers(access_token))
after_delete_results = get_json(r)
after_delete_results = prompt_items(after_delete_results)
check(r.status_code == 200, "GET /prompts/?q= after delete returns 200")
check(
    not any(p.get("id") == filter_prompt_id for p in after_delete_results),
    "Deleted prompt not in search results",
)


# NEGATIVE PROTECTED ROUTE TESTS

print_header("PROTECTED ROUTES")

r = requests.get(f"{API_URL}/groups/")
check(r.status_code in [401, 403], "Groups without token blocked", str(r.status_code))

r = requests.get(f"{API_URL}/tags/")
check(r.status_code in [401, 403], "Tags without token blocked", str(r.status_code))

r = requests.get(f"{API_URL}/prompts/")
check(r.status_code in [401, 403], "Prompts without token blocked", str(r.status_code))


# FINAL RESULT

total = passed + failed

print("\n" + "=" * 60)
print(f"Results: {passed} passed | {failed} failed | {total} total")

if failed == 0:
    print("\nAll tests passed. PromptNest backend is working correctly.\n")
else:
    print("\nSome tests failed. Check the failed lines above.\n")
