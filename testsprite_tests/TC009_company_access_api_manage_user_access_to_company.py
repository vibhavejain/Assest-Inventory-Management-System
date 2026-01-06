import requests

BASE_URL = "http://localhost:8787"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_company_access_api_manage_user_access_to_company():
    # Helper function to create a company
    def create_company():
        url = f"{BASE_URL}/companies"
        payload = {"name": "Test Company for Access API"}
        resp = requests.post(url, json=payload, timeout=TIMEOUT, headers=HEADERS)
        assert resp.status_code == 201
        data = resp.json()
        company_id = data.get('data', data).get('id')
        assert company_id is not None, f"Company ID not found in response: {data}"
        return company_id

    # Helper function to delete a company
    def delete_company(company_id):
        url = f"{BASE_URL}/companies/{company_id}"
        resp = requests.delete(url, timeout=TIMEOUT)
        # As per PRD, delete company returns 200 or 404
        assert resp.status_code in (200, 404)

    # Helper function to create a user
    def create_user():
        url = f"{BASE_URL}/users"
        # Use a unique email to avoid duplicate conflicts
        import uuid
        unique_email = f"testuser-{uuid.uuid4()}@example.com"
        payload = {"email": unique_email, "name": "Test User"}
        resp = requests.post(url, json=payload, timeout=TIMEOUT, headers=HEADERS)
        assert resp.status_code == 201
        data = resp.json()
        user_id = data.get('data', data).get('id')
        assert user_id is not None, f"User ID not found in response: {data}"
        return user_id

    # Helper function to delete a user
    def delete_user(user_id):
        url = f"{BASE_URL}/users/{user_id}"
        resp = requests.delete(url, timeout=TIMEOUT)
        # User delete returns 200 or 404
        assert resp.status_code in (200, 404)

    # Create company and user for testing
    company_id = create_company()
    user_id = create_user()

    try:
        # 1. Verify GET /companies/{companyId}/users lists users with access or 404 if company not found
        url_get_users = f"{BASE_URL}/companies/{company_id}/users"
        resp_get_users = requests.get(url_get_users, timeout=TIMEOUT, headers=HEADERS)
        assert resp_get_users.status_code == 200
        data_get_users = resp_get_users.json()
        assert "data" in data_get_users

        # Also test GET with non-existent companyId (random uuid)
        import uuid
        fake_company_id = str(uuid.uuid4())
        url_get_fake = f"{BASE_URL}/companies/{fake_company_id}/users"
        resp_get_fake = requests.get(url_get_fake, timeout=TIMEOUT, headers=HEADERS)
        assert resp_get_fake.status_code == 404

        # 2. Verify POST /companies/{companyId}/users grants access with valid data returning 201 or 400 for validation errors
        url_post_access = f"{BASE_URL}/companies/{company_id}/users"
        payload_valid = {"user_id": user_id, "role": "ADMIN"}
        resp_post = requests.post(url_post_access, json=payload_valid, timeout=TIMEOUT, headers=HEADERS)
        assert resp_post.status_code == 201
        data_post = resp_post.json()
        # According to instructions, extract id but POST returns no user-company ID, only 201
        # entity_id may or may not be returned depending on API - no confirmation in PRD so skip assert on id

        # Test POST with invalid data (missing role)
        payload_invalid = {"user_id": user_id}
        resp_post_invalid = requests.post(url_post_access, json=payload_invalid, timeout=TIMEOUT, headers=HEADERS)
        assert resp_post_invalid.status_code == 400

        # 3. Verify DELETE /companies/{companyId}/users/{userId} revokes access returning 200 or 404 if access not found
        url_delete_access = f"{BASE_URL}/companies/{company_id}/users/{user_id}"
        resp_delete = requests.delete(url_delete_access, timeout=TIMEOUT)
        assert resp_delete.status_code == 204, f"Expected 204 No Content, got {resp_delete.status_code}"

        # Deleting again should return 404 because access not found
        resp_delete_again = requests.delete(url_delete_access, timeout=TIMEOUT)
        assert resp_delete_again.status_code == 404

    finally:
        # Cleanup: revoke access if exists (ignore errors)
        try:
            requests.delete(f"{BASE_URL}/companies/{company_id}/users/{user_id}", timeout=TIMEOUT)
        except Exception:
            pass
        # Delete user and company
        delete_user(user_id)
        delete_company(company_id)


test_company_access_api_manage_user_access_to_company()