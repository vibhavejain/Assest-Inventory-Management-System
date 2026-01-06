import requests
import uuid

BASE_URL = "http://localhost:8787"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_companies_api_get_update_delete_by_id():
    company_name = f"Test Company {uuid.uuid4()}"
    company_data_create = {
        "name": company_name,
        "description": "Temporary test company",
        "status": "active"
    }
    # Create a company to test GET, PATCH, DELETE with valid id
    create_resp = requests.post(f"{BASE_URL}/companies", json=company_data_create, headers=HEADERS, timeout=TIMEOUT)
    assert create_resp.status_code == 201

    # Since POST response body may not contain id, we retrieve it by querying companies
    get_list_resp = requests.get(f"{BASE_URL}/companies", headers=HEADERS, timeout=TIMEOUT)
    assert get_list_resp.status_code == 200
    companies_list = get_list_resp.json() if isinstance(get_list_resp.json(), list) else []

    company_id = None
    for comp in companies_list:
        if comp.get("name") == company_name:
            company_id = comp.get("id")
            break
    assert company_id is not None, "Created company ID not found in list"

    try:
        # Test GET /companies/{id} with valid id
        get_resp = requests.get(f"{BASE_URL}/companies/{company_id}", headers=HEADERS, timeout=TIMEOUT)
        assert get_resp.status_code == 200
        get_json = get_resp.json()
        data = get_json if isinstance(get_json, dict) else {}
        assert data.get("id") == company_id
        assert data.get("name") == company_data_create["name"]

        # Test GET /companies/{id} with invalid id
        invalid_id = str(uuid.uuid4())
        get_invalid_resp = requests.get(f"{BASE_URL}/companies/{invalid_id}", headers=HEADERS, timeout=TIMEOUT)
        assert get_invalid_resp.status_code == 404

        # Test PATCH /companies/{id} to update company fields with valid id
        patch_payload = {"description": "Updated description", "status": "inactive"}
        patch_resp = requests.patch(f"{BASE_URL}/companies/{company_id}", json=patch_payload, headers=HEADERS, timeout=TIMEOUT)
        assert patch_resp.status_code == 200
        patch_json = patch_resp.json()
        patched_data = patch_json if isinstance(patch_json, dict) else {}
        assert patched_data.get("id") == company_id

        # Confirm update reflected via GET
        get_after_patch_resp = requests.get(f"{BASE_URL}/companies/{company_id}", headers=HEADERS, timeout=TIMEOUT)
        assert get_after_patch_resp.status_code == 200
        after_patch_json = get_after_patch_resp.json()
        after_patch_data = after_patch_json if isinstance(after_patch_json, dict) else {}
        assert after_patch_data.get("description") == patch_payload["description"]
        assert after_patch_data.get("status") == patch_payload["status"]

        # Test PATCH /companies/{id} with invalid id returns 404
        patch_invalid_resp = requests.patch(f"{BASE_URL}/companies/{invalid_id}", json=patch_payload, headers=HEADERS, timeout=TIMEOUT)
        assert patch_invalid_resp.status_code == 404

        # Test DELETE /companies/{id} with valid id deletes the company
        delete_resp = requests.delete(f"{BASE_URL}/companies/{company_id}", headers=HEADERS, timeout=TIMEOUT)
        assert delete_resp.status_code == 200

        # Confirm company no longer exists
        get_after_delete_resp = requests.get(f"{BASE_URL}/companies/{company_id}", headers=HEADERS, timeout=TIMEOUT)
        assert get_after_delete_resp.status_code == 404

        # Test DELETE /companies/{id} with invalid id returns 404
        delete_invalid_resp = requests.delete(f"{BASE_URL}/companies/{invalid_id}", headers=HEADERS, timeout=TIMEOUT)
        assert delete_invalid_resp.status_code == 404

    finally:
        # Cleanup: Try delete in case company still exists (if test failed before delete)
        requests.delete(f"{BASE_URL}/companies/{company_id}", headers=HEADERS, timeout=TIMEOUT)

test_companies_api_get_update_delete_by_id()
