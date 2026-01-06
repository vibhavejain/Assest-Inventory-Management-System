import requests
import uuid

BASE_URL = "http://localhost:8787"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def create_company():
    url = f"{BASE_URL}/companies"
    payload = {
        "name": f"Test Company {uuid.uuid4()}",
        "description": "Company for user filter test",
        "status": "active"
    }
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    resp_json = resp.json()
    assert 'id' in resp_json, f"Company creation response missing 'id': {resp_json}"
    return resp_json.get("id")

def delete_company(company_id):
    url = f"{BASE_URL}/companies/{company_id}"
    try:
        resp = requests.delete(url, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 404):
            resp.raise_for_status()
    except requests.HTTPError:
        pass

def create_user(email, name, company_id=None, status=None):
    url = f"{BASE_URL}/users"
    payload = {
        "email": email,
        "name": name
    }
    if company_id:
        payload["primary_company_id"] = company_id
    if status:
        payload["status"] = status
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    resp_json = resp.json()
    assert 'id' in resp_json, f"User creation response missing 'id': {resp_json}"
    return resp_json.get("id")

def delete_user(user_id):
    url = f"{BASE_URL}/users/{user_id}"
    try:
        resp = requests.delete(url, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code not in (200, 404):
            resp.raise_for_status()
    except requests.HTTPError:
        pass

def test_users_api_list_users_with_filters_and_pagination():
    company_id = None
    user_ids = []
    try:
        # Create a company for filtering users by company_id
        company_id = create_company()
        assert company_id, "Failed to create company for user filter test"

        # Create users with different statuses and associated to the company
        user_active_in_company = create_user(f"active_user_{uuid.uuid4()}@example.com", "Active User", company_id, "active")
        user_inactive_in_company = create_user(f"inactive_user_{uuid.uuid4()}@example.com", "Inactive User", company_id, "inactive")
        user_active_no_company = create_user(f"active_no_company_{uuid.uuid4()}@example.com", "Active No Company", None, "active")

        user_ids.extend([user_active_in_company, user_inactive_in_company, user_active_no_company])

        # Test GET /users without filters (default pagination)
        url = f"{BASE_URL}/users"
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Unexpected status code: {resp.status_code}"
        resp_json = resp.json()
        assert "users" in resp_json or isinstance(resp_json, list), "Response does not contain users list"
        # Pagination fields might be present, check at least users list count <= limit default 50
        users_list = resp_json.get("users") if isinstance(resp_json, dict) else resp_json
        assert isinstance(users_list, list), "Users list is not a list"
        assert len(users_list) <= 50, "Default limit exceeded 50"

        # Test GET /users with limit and offset
        params = {"limit": 1, "offset": 1}
        resp = requests.get(url, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200
        resp_json = resp.json()
        filtered_users = resp_json.get("users") if isinstance(resp_json, dict) else resp_json
        assert isinstance(filtered_users, list)
        assert len(filtered_users) <= 1

        # Test filtering by status = active
        params = {"status": "active"}
        resp = requests.get(url, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200
        resp_json = resp.json()
        filtered_users = resp_json.get("users") if isinstance(resp_json, dict) else resp_json
        assert all(user.get("status") == "active" for user in filtered_users if "status" in user)

        # Test filtering by company_id
        params = {"company_id": company_id}
        resp = requests.get(url, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200
        resp_json = resp.json()
        filtered_users = resp_json.get("users") if isinstance(resp_json, dict) else resp_json
        # All users should have primary_company_id == company_id or be associated accordingly
        assert all(user.get("primary_company_id") == company_id or user.get("company_id") == company_id for user in filtered_users if ("primary_company_id" in user or "company_id" in user))

        # Test filtering by company_id and status combined
        params = {"company_id": company_id, "status": "active"}
        resp = requests.get(url, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200
        resp_json = resp.json()
        filtered_users = resp_json.get("users") if isinstance(resp_json, dict) else resp_json
        assert all(((user.get("primary_company_id") == company_id or user.get("company_id") == company_id) and user.get("status") == "active") for user in filtered_users if ("primary_company_id" in user or "company_id" in user) and "status" in user)

    finally:
        # Cleanup created users
        for uid in user_ids:
            delete_user(uid)
        if company_id:
            delete_company(company_id)

test_users_api_list_users_with_filters_and_pagination()
