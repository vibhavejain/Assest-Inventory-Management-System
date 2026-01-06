import requests
import uuid

BASE_URL = "http://localhost:8787"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

def test_assets_api_create_list_update_delete():
    # Helper function to create a company (required for asset creation)
    def create_company():
        company_payload = {
            "name": f"Test Company {uuid.uuid4()}"
        }
        resp = requests.post(f"{BASE_URL}/companies", json=company_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 201
        resp_json = resp.json()
        assert resp_json.get("success") is True
        company_id = resp_json.get("data", {}).get("id")
        assert company_id is not None
        return company_id

    # Helper function to delete a company
    def delete_company(company_id):
        resp = requests.delete(f"{BASE_URL}/companies/{company_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code in (200, 404)  # 404 if already deleted or not found

    # Create a company for asset association
    company_id = create_company()

    asset_id = None
    try:
        # 1. POST /assets - Create asset with required fields
        asset_payload = {
            "name": f"Test Asset {uuid.uuid4()}",
            "company_id": company_id,
            "type": "Laptop"
        }
        resp = requests.post(f"{BASE_URL}/assets", json=asset_payload, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code == 201:
            resp_json = resp.json()
            assert resp_json.get("success") is True
            data = resp_json.get("data", {})
            asset_id = data.get("id")
            assert asset_id is not None
            assert data.get("name") == asset_payload["name"]
            assert data.get("company_id") == company_id
            assert data.get("type") == "Laptop"
        elif resp.status_code == 400:
            # Validation errors
            resp_json = resp.json()
            assert resp_json.get("success") is False or resp_json.get("success") is None

        else:
            assert False, f"Unexpected POST /assets status code: {resp.status_code}"

        # 2. GET /assets - List assets with pagination and filters
        # Query with limit and offset and filter company_id
        params = {
            "limit": 10,
            "offset": 0,
            "company_id": company_id,
            "type": "Laptop"
        }
        resp = requests.get(f"{BASE_URL}/assets", headers=HEADERS, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200
        resp_json = resp.json()
        assert resp_json.get("success") is True
        data = resp_json.get("data")
        # data can be a list or object with pagination; assert list presence
        assert data is not None

        # Proceed only if asset was created successfully
        if asset_id:
            # 3. PATCH /assets/{id} - Update asset returns 200 or 404
            update_payload = {
                "description": "Updated description"
            }
            resp = requests.patch(f"{BASE_URL}/assets/{asset_id}", json=update_payload, headers=HEADERS, timeout=TIMEOUT)
            if resp.status_code == 200:
                resp_json = resp.json()
                assert resp_json.get("success") is True
                data = resp_json.get("data", {})
                assert data.get("id") == asset_id
            elif resp.status_code == 404:
                resp_json = resp.json()
                # According to instructions, success should be checked even for 404? Spec not explicit, but likely success false.
                assert resp_json.get("success") is False or resp_json.get("success") is None
            else:
                assert False, f"Unexpected PATCH /assets/{asset_id} status code: {resp.status_code}"

            # 4. DELETE /assets/{id} - returns 200 or 404, assets with activity history may not be deleted (intentional)
            resp = requests.delete(f"{BASE_URL}/assets/{asset_id}", headers=HEADERS, timeout=TIMEOUT)
            if resp.status_code == 200:
                resp_json = resp.json()
                assert resp_json.get("success") is True
            elif resp.status_code == 404:
                resp_json = resp.json()
                assert resp_json.get("success") is False or resp_json.get("success") is None
            else:
                assert False, f"Unexpected DELETE /assets/{asset_id} status code: {resp.status_code}"
            asset_id = None  # Mark as deleted so no double delete in finally
    finally:
        # Cleanup asset if still exists
        if asset_id:
            requests.delete(f"{BASE_URL}/assets/{asset_id}", headers=HEADERS, timeout=TIMEOUT)
        # Cleanup company
        delete_company(company_id)

test_assets_api_create_list_update_delete()