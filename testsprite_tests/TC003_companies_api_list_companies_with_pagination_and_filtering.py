import requests

BASE_URL = "http://localhost:8787"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_companies_api_list_pagination_and_filtering():
    # To test pagination and filtering, first create companies with different statuses to ensure filter works
    created_company_ids = []

    def create_company(name, status):
        payload = {"name": name, "status": status}
        resp = requests.post(f"{BASE_URL}/companies", json=payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Failed to create company '{name}': {resp.text}"
        company_id = resp.json().get("data", {}).get("id")
        assert company_id is not None, f"Company ID missing in response for '{name}'"
        return company_id

    def delete_company(company_id):
        resp = requests.delete(f"{BASE_URL}/companies/{company_id}", headers=HEADERS, timeout=TIMEOUT)
        # 200 is expected on successful delete, 404 if already deleted/not found
        assert resp.status_code in (200, 404), f"Failed to delete company {company_id}: {resp.text}"

    try:
        # Create three companies with status 'active' and 'inactive'
        id_active_1 = create_company("TestCompanyActive1_TC003", "active")
        id_active_2 = create_company("TestCompanyActive2_TC003", "active")
        id_inactive = create_company("TestCompanyInactive_TC003", "inactive")
        created_company_ids.extend([id_active_1, id_active_2, id_inactive])

        # 1. Verify GET /companies returns a list with default pagination
        resp = requests.get(f"{BASE_URL}/companies", timeout=TIMEOUT)
        assert resp.status_code == 200, f"GET /companies failed: {resp.text}"
        json_data = resp.json()
        assert json_data.get("success") is True, f"Response 'success' field false: {resp.text}"
        data = json_data.get("data")
        assert data is not None, "Response 'data' field missing"
        assert isinstance(data, list), f"Data expected to be list but got {type(data)}"

        # 2. Test limit and offset query parameters
        # Use limit=1 to force pagination and offset=1 to get second record
        params_limit = {"limit": 1}
        resp_limit = requests.get(f"{BASE_URL}/companies", params=params_limit, timeout=TIMEOUT)
        assert resp_limit.status_code == 200, f"GET /companies with limit failed: {resp_limit.text}"
        json_limit = resp_limit.json()
        assert json_limit.get("success") is True
        data_limit = json_limit.get("data")
        assert isinstance(data_limit, list)
        assert len(data_limit) <= 1, f"Limit parameter did not restrict results: {len(data_limit)}"

        params_offset = {"limit": 1, "offset": 1}
        resp_offset = requests.get(f"{BASE_URL}/companies", params=params_offset, timeout=TIMEOUT)
        assert resp_offset.status_code == 200, f"GET /companies with offset failed: {resp_offset.text}"
        json_offset = resp_offset.json()
        assert json_offset.get("success") is True
        data_offset = json_offset.get("data")
        assert isinstance(data_offset, list)
        assert len(data_offset) <= 1, f"Offset parameter did not work correctly: {len(data_offset)}"

        # 3. Verify filtering by status
        params_status_active = {"status": "active"}
        resp_status_active = requests.get(f"{BASE_URL}/companies", params=params_status_active, timeout=TIMEOUT)
        assert resp_status_active.status_code == 200, f"GET /companies with status filter failed: {resp_status_active.text}"
        json_status_active = resp_status_active.json()
        assert json_status_active.get("success") is True
        data_status_active = json_status_active.get("data")
        assert isinstance(data_status_active, list)
        # Check that every returned company has status 'active'
        for company in data_status_active:
            assert company.get("status") == "active", f"Company status expected 'active' but got {company.get('status')}"

        params_status_inactive = {"status": "inactive"}
        resp_status_inactive = requests.get(f"{BASE_URL}/companies", params=params_status_inactive, timeout=TIMEOUT)
        assert resp_status_inactive.status_code == 200, f"GET /companies with status filter failed: {resp_status_inactive.text}"
        json_status_inactive = resp_status_inactive.json()
        assert json_status_inactive.get("success") is True
        data_status_inactive = json_status_inactive.get("data")
        assert isinstance(data_status_inactive, list)
        # Check that every returned company has status 'inactive'
        for company in data_status_inactive:
            assert company.get("status") == "inactive", f"Company status expected 'inactive' but got {company.get('status')}"

    finally:
        for cid in created_company_ids:
            try:
                delete_company(cid)
            except Exception:
                pass  # Ignore delete errors during cleanup


test_companies_api_list_pagination_and_filtering()