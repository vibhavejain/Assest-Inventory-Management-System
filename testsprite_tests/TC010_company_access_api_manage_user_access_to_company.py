import requests
import uuid

BASE_URL = "http://localhost:8787"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_company_access_api_manage_user_access_to_company():
    # Helper to create a company
    def create_company():
        resp = requests.post(
            f"{BASE_URL}/companies",
            json={"name": f"Test Company {uuid.uuid4()}"},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 201, f"Failed to create company: {resp.text}"
        company = resp.json()
        company_id = company.get("id") or resp.json().get("id")
        if not company_id:
            # try to get id from Location header or response json keys
            company_id = resp.json().get("id")
        return company_id

    # Helper to delete a company
    def delete_company(company_id):
        resp = requests.delete(f"{BASE_URL}/companies/{company_id}", timeout=TIMEOUT)
        assert resp.status_code == 200 or resp.status_code == 404

    # Helper to create a user
    def create_user():
        email = f"user_{uuid.uuid4()}@example.com"
        resp = requests.post(
            f"{BASE_URL}/users",
            json={"email": email, "name": "Test User"},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 201, f"Failed to create user: {resp.text}"
        user = resp.json()
        user_id = user.get("id") or resp.json().get("id")
        if not user_id:
            user_id = resp.json().get("id")
        return user_id

    # Helper to delete a user
    def delete_user(user_id):
        resp = requests.delete(f"{BASE_URL}/users/{user_id}", timeout=TIMEOUT)
        assert resp.status_code == 200 or resp.status_code == 404

    # Start test - create company and user
    company_id = None
    user_id = None
    access_id = None

    try:
        company_id = create_company()
        user_id = create_user()

        # 1. POST /companies/{companyId}/users to grant user access with user_id and role
        grant_payload = {"user_id": user_id, "role": "admin"}
        resp = requests.post(
            f"{BASE_URL}/companies/{company_id}/users",
            json=grant_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 201, f"Grant access failed: {resp.text}"

        # 2. POST validation: missing user_id or role should return 400
        invalid_payloads = [
            {},
            {"user_id": user_id},
            {"role": "admin"},
        ]
        for payload in invalid_payloads:
            resp = requests.post(
                f"{BASE_URL}/companies/{company_id}/users",
                json=payload,
                headers=HEADERS,
                timeout=TIMEOUT,
            )
            assert resp.status_code == 400

        # 3. GET /companies/{companyId}/users to list users with access
        resp = requests.get(
            f"{BASE_URL}/companies/{company_id}/users", timeout=TIMEOUT
        )
        assert resp.status_code == 200, f"List users failed: {resp.text}"
        users = resp.json()
        assert isinstance(users, list) or isinstance(users, dict), "Invalid users list"
        # Validate user is in the list with correct role
        user_found = False
        if isinstance(users, dict) and "users" in users:
            user_list = users["users"]
        else:
            user_list = users
        for u in user_list:
            if "user_id" in u and u["user_id"] == user_id and "role" in u and u["role"] == "admin":
                user_found = True
                break
        assert user_found, "Granted user not found in users list"

        # 4. GET /companies/{companyId}/users 404 scenario for non-existent company
        fake_company_id = str(uuid.uuid4())
        resp = requests.get(
            f"{BASE_URL}/companies/{fake_company_id}/users", timeout=TIMEOUT
        )
        assert resp.status_code == 404

        # 5. DELETE /companies/{companyId}/users/{userId} to revoke access
        resp = requests.delete(
            f"{BASE_URL}/companies/{company_id}/users/{user_id}", timeout=TIMEOUT
        )
        assert resp.status_code == 200, f"Revoke access failed: {resp.text}"

        # 6. DELETE 404 scenario - access already revoked or invalid ids
        resp = requests.delete(
            f"{BASE_URL}/companies/{company_id}/users/{user_id}", timeout=TIMEOUT
        )
        assert resp.status_code == 404, "Expected 404 when revoking non-existent access"

        fake_user_id = str(uuid.uuid4())
        resp = requests.delete(
            f"{BASE_URL}/companies/{company_id}/users/{fake_user_id}", timeout=TIMEOUT
        )
        assert resp.status_code == 404, "Expected 404 when revoking fake user access"

    finally:
        # Cleanup created user and company
        if user_id:
            delete_user(user_id)
        if company_id:
            delete_company(company_id)


test_company_access_api_manage_user_access_to_company()
