import requests

BASE_URL = "http://localhost:8787"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_create_company_with_valid_and_invalid_data():
    # Valid company data for creation
    valid_company_data = {
        "name": "Test Company Unique Name 12345",
        "description": "A test company created during automated testing.",
        "status": "active"
    }

    # Missing required field (name)
    invalid_company_data_missing_name = {
        "description": "Missing name field",
        "status": "active"
    }

    # The name for duplicate test (we'll create then try to create duplicate)
    duplicate_name = "Duplicate Company Name 12345"

    created_company_id = None
    created_duplicate_company_id = None

    try:
        # 1) Create a company with valid data -> expect 201 Created
        resp = requests.post(f"{BASE_URL}/companies", json=valid_company_data, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Expected 201 for valid company creation, got {resp.status_code}"
        json_body = resp.json()
        assert json_body.get("success") is True, "Response success flag not True for valid creation"
        created_company_id = json_body.get("data", {}).get("id")
        assert created_company_id is not None, "Created company ID not found in response"

        # 2) Create company with missing required field -> expect 400
        resp_missing_name = requests.post(f"{BASE_URL}/companies", json=invalid_company_data_missing_name,
                                          headers=HEADERS, timeout=TIMEOUT)
        assert resp_missing_name.status_code == 400, f"Expected 400 for missing name field, got {resp_missing_name.status_code}"
        json_missing = resp_missing_name.json()
        assert json_missing.get("success") is False or json_missing.get("success") is None or \
               (400 <= resp_missing_name.status_code < 500), "Expected failure flag for missing required data"

        # 3) Create a company first time with a fixed name for duplicate test
        resp_dup_first = requests.post(f"{BASE_URL}/companies",
                                       json={"name": duplicate_name, "description": "Duplicate test company", "status":"active"},
                                       headers=HEADERS, timeout=TIMEOUT)
        assert resp_dup_first.status_code == 201, f"Expected 201 creating initial company for duplicate test, got {resp_dup_first.status_code}"
        json_dup_first = resp_dup_first.json()
        assert json_dup_first.get("success") is True, "Response success flag not True for initial duplicate company creation"
        created_duplicate_company_id = json_dup_first.get("data", {}).get("id")
        assert created_duplicate_company_id is not None, "Created duplicate test company ID not found"

        # 4) Try creating another company with same duplicate_name -> expect 400 validation error for duplicate name
        resp_dup_second = requests.post(f"{BASE_URL}/companies",
                                        json={"name": duplicate_name, "description": "Duplicate second attempt", "status":"active"},
                                        headers=HEADERS, timeout=TIMEOUT)
        assert resp_dup_second.status_code == 400, f"Expected 400 for duplicate company name, got {resp_dup_second.status_code}"
        json_dup_second = resp_dup_second.json()
        assert json_dup_second.get("success") is False or json_dup_second.get("success") is None or \
               (400 <= resp_dup_second.status_code < 500), "Expected failure flag for duplicate name creation"

    finally:
        # Cleanup created companies if they exist
        if created_company_id:
            try:
                requests.delete(f"{BASE_URL}/companies/{created_company_id}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass
        if created_duplicate_company_id:
            try:
                requests.delete(f"{BASE_URL}/companies/{created_duplicate_company_id}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass


test_create_company_with_valid_and_invalid_data()