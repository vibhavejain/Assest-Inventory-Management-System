import requests

BASE_URL = "http://localhost:8787"
USERS_ENDPOINT = f"{BASE_URL}/users"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_users_api_create_user_valid_and_invalid():
    created_user_id = None
    email = "testuser_valid@example.com"
    invalid_email = "invalidemail"
    # Valid user data to create
    valid_user_data = {
        "email": email,
        "name": "Valid Test User"
    }
    # Attempt to create a valid user
    try:
        resp = requests.post(USERS_ENDPOINT, json=valid_user_data, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Expected 201 for valid user creation, got {resp.status_code}"
        resp_json = resp.json()
        assert resp_json.get("success") is True, "API success flag must be True on valid creation"
        user_id = resp_json.get("data", {}).get("id")
        assert user_id is not None, "Response data should contain user id"
        created_user_id = user_id

        # Try creating user missing required 'email'
        invalid_user_data_missing_email = {"name": "User Missing Email"}
        resp_missing_email = requests.post(USERS_ENDPOINT, json=invalid_user_data_missing_email, headers=HEADERS, timeout=TIMEOUT)
        assert resp_missing_email.status_code == 400, f"Expected 400 for missing email, got {resp_missing_email.status_code}"
        resp_missing_email_json = resp_missing_email.json()
        assert resp_missing_email_json.get("success") is False or resp_missing_email_json.get("success") is None or resp_missing_email.status_code == 400, \
            "API success flag should indicate failure or 400 status when missing required fields"

        # Try creating user missing required 'name'
        invalid_user_data_missing_name = {"email": "missingname@example.com"}
        resp_missing_name = requests.post(USERS_ENDPOINT, json=invalid_user_data_missing_name, headers=HEADERS, timeout=TIMEOUT)
        assert resp_missing_name.status_code == 400, f"Expected 400 for missing name, got {resp_missing_name.status_code}"
        resp_missing_name_json = resp_missing_name.json()
        assert resp_missing_name_json.get("success") is False or resp_missing_name_json.get("success") is None or resp_missing_name.status_code == 400, \
            "API success flag should indicate failure or 400 status when missing required fields"

        # Try creating user with duplicate email (the one we just created)
        duplicate_email_data = {
            "email": email,
            "name": "Duplicate User"
        }
        resp_duplicate = requests.post(USERS_ENDPOINT, json=duplicate_email_data, headers=HEADERS, timeout=TIMEOUT)
        assert resp_duplicate.status_code == 400, f"Expected 400 for duplicate email, got {resp_duplicate.status_code}"
        resp_duplicate_json = resp_duplicate.json()
        assert resp_duplicate_json.get("success") is False or resp_duplicate_json.get("success") is None or resp_duplicate.status_code == 400, \
            "API success flag should indicate failure or 400 status when duplicate email is sent"

    finally:
        # Cleanup: delete the created user if exists
        if created_user_id:
            try:
                delete_resp = requests.delete(f"{USERS_ENDPOINT}/{created_user_id}", headers=HEADERS, timeout=TIMEOUT)
                assert delete_resp.status_code == 200, f"Expected 200 on user delete cleanup, got {delete_resp.status_code}"
                delete_resp_json = delete_resp.json()
                assert delete_resp_json.get("success") is True, "API success flag must be True on user delete"
            except Exception:
                pass


test_users_api_create_user_valid_and_invalid()