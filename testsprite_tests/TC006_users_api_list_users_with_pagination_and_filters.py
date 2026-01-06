import requests
import uuid

BASE_URL = "http://localhost:8787"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def create_company():
    url = f"{BASE_URL}/companies"
    payload = {
        "name": f"TestCompany-{uuid.uuid4()}",
        "description": "Test company for user listing",
        "status": "active"
    }
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    assert resp.status_code == 201, f"Failed to create company: {resp.text}"
    data = resp.json()
    company_id = data.get("id") or data.get("data", {}).get("id")
    assert company_id is not None, "Company ID not found in response"
    return company_id

def create_user(company_id):
    url = f"{BASE_URL}/users"
    unique_email = f"user_{uuid.uuid4()}@example.com"
    payload = {
        "email": unique_email,
        "name": "Test User",
        "primary_company_id": company_id,
        "status": "active"
    }
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    assert resp.status_code == 201, f"Failed to create user: {resp.text}"
    data = resp.json()
    user_id = data.get("id") or data.get("data", {}).get("id")
    assert user_id is not None, "User ID not found in response"
    return user_id

def delete_user(user_id):
    url = f"{BASE_URL}/users/{user_id}"
    resp = requests.delete(url, headers=HEADERS, timeout=TIMEOUT)
    assert resp.status_code == 200 or resp.status_code == 404

def delete_company(company_id):
    url = f"{BASE_URL}/companies/{company_id}"
    resp = requests.delete(url, headers=HEADERS, timeout=TIMEOUT)
    assert resp.status_code == 200 or resp.status_code == 404

def test_users_api_list_with_pagination_and_filters():
    company_id = None
    user_id = None
    try:
        # Create a company for the user
        company_id = create_company()
        # Create user associated with this company
        user_id = create_user(company_id)

        # Test GET /users with no filters returns success and valid pagination structure
        url = f"{BASE_URL}/users"
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200
        resp_json = resp.json()
        data = resp_json.get("data") or resp_json
        assert isinstance(data, (dict, list)), "Expected data to be a dict or list"

        # If data is dict, check it has users/items/results list or is list
        if isinstance(data, dict):
            users_list = data.get("users") or data.get("items") or data.get("results")
            assert users_list is None or isinstance(users_list, list)
        else:
            users_list = data

        # Test GET /users with limit and offset
        params = {"limit": 1, "offset": 0}
        resp = requests.get(url, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200
        resp_json = resp.json()
        data = resp_json.get("data") or resp_json
        if isinstance(data, dict):
            users_list = data.get("users") or data.get("items") or data.get("results") or []
        else:
            users_list = data
        assert isinstance(users_list, list)
        assert len(users_list) <= 1

        # Test GET /users filtered by status
        params = {"status": "active"}
        resp = requests.get(url, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200
        resp_json = resp.json()
        data = resp_json.get("data") or resp_json
        if isinstance(data, dict):
            users_list = data.get("users") or data.get("items") or data.get("results") or []
        else:
            users_list = data
        assert all(user.get("status") == "active" for user in users_list if user.get("status") is not None)

        # Test GET /users filtered by company_id
        params = {"company_id": company_id}
        resp = requests.get(url, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200
        resp_json = resp.json()
        data = resp_json.get("data") or resp_json
        if isinstance(data, dict):
            users_list = data.get("users") or data.get("items") or data.get("results") or []
        else:
            users_list = data
        for user in users_list:
            user_company_id = user.get("primary_company_id") or user.get("company_id")
            assert user_company_id == company_id

        # Test GET /users with combined filters limit, offset, status and company_id
        params = {"limit": 2, "offset": 0, "status": "active", "company_id": company_id}
        resp = requests.get(url, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200
        resp_json = resp.json()
        data = resp_json.get("data") or resp_json
        if isinstance(data, dict):
            users_list = data.get("users") or data.get("items") or data.get("results") or []
        else:
            users_list = data
        assert len(users_list) <= 2
        for user in users_list:
            assert user.get("status") == "active"
            user_company_id = user.get("primary_company_id") or user.get("company_id")
            assert user_company_id == company_id

    finally:
        # Cleanup created resources
        if user_id:
            try:
                delete_user(user_id)
            except Exception:
                pass
        if company_id:
            try:
                delete_company(company_id)
            except Exception:
                pass

test_users_api_list_with_pagination_and_filters()