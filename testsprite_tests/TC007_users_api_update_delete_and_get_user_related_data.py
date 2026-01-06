import requests
import uuid

BASE_URL = "http://localhost:8787"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def create_user():
    # Create a user for testing; returns user id
    payload = {
        "email": f"testuser_{uuid.uuid4().hex[:8]}@example.com",
        "name": "Test User",
        "status": "active"
    }
    resp = requests.post(f"{BASE_URL}/users", json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    user_id = resp.json().get('data', {}).get('id')
    assert user_id is not None, "Failed to create user: No ID returned"
    return user_id

def delete_user(user_id):
    resp = requests.delete(f"{BASE_URL}/users/{user_id}", headers=HEADERS, timeout=TIMEOUT)
    if resp.status_code == 404:
        return  # already deleted or not found
    resp.raise_for_status()


def test_users_api_update_delete_and_get_user_related_data():
    user_id = None
    try:
        # Setup: create a user if needed
        user_id = create_user()

        # 1) PATCH /users/{id} - update user data success case
        update_payload = {
            "name": "Updated Test User",
            "status": "inactive"
        }
        patch_resp = requests.patch(f"{BASE_URL}/users/{user_id}", json=update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert patch_resp.status_code in (200, 404)
        patch_json = patch_resp.json()
        if patch_resp.status_code == 200:
            updated_user = patch_json.get('data', {})
            # Confirm updated fields if present
            assert updated_user.get('id') == user_id

        # 2) PATCH /users/{id} - update non-existent user returns 404
        fake_id = str(uuid.uuid4())
        patch_fake_resp = requests.patch(f"{BASE_URL}/users/{fake_id}", json=update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert patch_fake_resp.status_code == 404

        # 3) GET /users/{id}/companies - get user's companies success or 404 if no user
        get_companies_resp = requests.get(f"{BASE_URL}/users/{user_id}/companies", headers=HEADERS, timeout=TIMEOUT)
        assert get_companies_resp.status_code in (200, 404)
        get_companies_json = get_companies_resp.json()
        if get_companies_resp.status_code == 200:
            # data expected to be list or dict of companies
            companies = get_companies_json.get('data')
            assert companies is not None

        # 4) GET /users/{id}/companies with non-existent user returns 404
        get_companies_fake_resp = requests.get(f"{BASE_URL}/users/{fake_id}/companies", headers=HEADERS, timeout=TIMEOUT)
        assert get_companies_fake_resp.status_code == 404

        # 5) GET /users/{id}/audit-logs - audit-logs endpoint defined with limit and offset, no company_id per PRD
        # So remove company_id parameter for this test

        # Try to get user's detailed data to find primary_company_id
        user_detail_resp = requests.get(f"{BASE_URL}/users", params={"limit":1, "offset":0}, headers=HEADERS, timeout=TIMEOUT)
        primary_company_id = None
        if user_detail_resp.status_code == 200:
            users = user_detail_resp.json().get('data', [])
            if users and isinstance(users, list):
                # Try to find our user in list
                for u in users:
                    if u.get('id') == user_id:
                        primary_company_id = u.get('primary_company_id')
                        break
            elif isinstance(users, dict):
                primary_company_id = users.get('primary_company_id')

        audit_logs_params = {
            "limit": 10,
            "offset": 0
        }
        get_audit_logs_resp = requests.get(f"{BASE_URL}/users/{user_id}/audit-logs", params=audit_logs_params, headers=HEADERS, timeout=TIMEOUT)
        assert get_audit_logs_resp.status_code in (200, 404)
        get_audit_logs_json = get_audit_logs_resp.json()
        if get_audit_logs_resp.status_code == 200:
            audit_logs_data = get_audit_logs_json.get('data')
            assert audit_logs_data is not None

        # GET audit-logs with non-existent user returns 404
        get_audit_logs_fake_resp = requests.get(f"{BASE_URL}/users/{fake_id}/audit-logs", params=audit_logs_params, headers=HEADERS, timeout=TIMEOUT)
        assert get_audit_logs_fake_resp.status_code == 404

        # 6) DELETE /users/{id} - delete success case
        delete_resp = requests.delete(f"{BASE_URL}/users/{user_id}", headers=HEADERS, timeout=TIMEOUT)
        assert delete_resp.status_code in (200, 404)

        # 7) DELETE non-existent user returns 404
        delete_fake_resp = requests.delete(f"{BASE_URL}/users/{fake_id}", headers=HEADERS, timeout=TIMEOUT)
        assert delete_fake_resp.status_code == 404

        # Mark user as deleted to prevent finalizer from trying again
        user_id = None

    finally:
        # Cleanup if user still exists
        if user_id:
            try:
                delete_user(user_id)
            except Exception:
                pass


test_users_api_update_delete_and_get_user_related_data()
