import requests
import uuid

BASE_URL = "http://localhost:8787"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_assets_api_list_update_and_delete_assets():
    # Helper function to create a company (required for asset creation)
    def create_company():
        company_data = {
            "name": f"Test Company {uuid.uuid4()}",
            "description": "Test company for assets",
            "status": "active",
        }
        resp = requests.post(f"{BASE_URL}/companies", json=company_data, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json().get("id") or resp.json().get("uuid") or resp.json().get("data", {}).get("id")

    # Helper function to delete a company
    def delete_company(company_id):
        requests.delete(f"{BASE_URL}/companies/{company_id}", headers=HEADERS, timeout=TIMEOUT)

    # Helper function to create an asset
    def create_asset(company_id):
        asset_data = {
            "name": f"Test Asset {uuid.uuid4()}",
            "company_id": company_id,
            "type": "hardware",
            "description": "Test asset",
            "status": "active",
        }
        resp = requests.post(f"{BASE_URL}/assets", json=asset_data, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json().get("id") or resp.json().get("uuid") or resp.json().get("data", {}).get("id")

    # Helper function to delete an asset
    def delete_asset(asset_id):
        requests.delete(f"{BASE_URL}/assets/{asset_id}", headers=HEADERS, timeout=TIMEOUT)

    # Start of test case
    company_id = None
    asset_id = None
    try:
        # Create company for asset association
        company_id = create_company()
        assert company_id is not None, "Failed to create company"

        # Create asset to update/delete
        asset_id = create_asset(company_id)
        assert asset_id is not None, "Failed to create asset"

        # 1) Verify GET /assets returns paginated assets list with filters
        params_list = [
            {},
            {"company_id": company_id},
            {"type": "hardware"},
            {"status": "active"},
            {"company_id": company_id, "type": "hardware", "status": "active"},
        ]
        for params in params_list:
            resp = requests.get(f"{BASE_URL}/assets", headers=HEADERS, params=params, timeout=TIMEOUT)
            assert resp.status_code == 200, f"GET /assets failed for params {params}"
            data = resp.json()
            assert isinstance(data, dict), "Response is not a JSON object"
            # Assume the response contains keys like 'items' or 'data' for assets list
            assets = data.get("items") or data.get("data") or data.get("assets") or []
            assert isinstance(assets, list), "Assets list is not an array"

        # 2) Test PATCH /assets/{id} to update asset
        update_data = {
            "status": "inactive",
            "description": "Updated asset description",
        }
        patch_resp = requests.patch(f"{BASE_URL}/assets/{asset_id}", json=update_data, headers=HEADERS, timeout=TIMEOUT)
        assert patch_resp.status_code == 200, "PATCH /assets/{id} failed for existing asset"
        patch_json = patch_resp.json()
        # Optionally check fields updated
        # If the API echoes updated asset, verify changed fields if present
        if isinstance(patch_json, dict):
            if "status" in patch_json:
                assert patch_json["status"] == update_data["status"]
            if "description" in patch_json:
                assert patch_json["description"] == update_data["description"]

        # 3) Test PATCH /assets/{id} with non-existent UUID returns 404
        fake_uuid = str(uuid.uuid4())
        patch_404_resp = requests.patch(f"{BASE_URL}/assets/{fake_uuid}", json=update_data, headers=HEADERS, timeout=TIMEOUT)
        assert patch_404_resp.status_code == 404, "PATCH /assets/{id} did not return 404 for non-existent asset"

        # 4) Test DELETE /assets/{id} for existing asset
        delete_resp = requests.delete(f"{BASE_URL}/assets/{asset_id}", headers=HEADERS, timeout=TIMEOUT)
        assert delete_resp.status_code == 200, "DELETE /assets/{id} failed for existing asset"

        # After deletion, asset_id is no longer valid
        asset_id = None

        # 5) Test DELETE /assets/{id} with non-existent UUID returns 404
        delete_404_resp = requests.delete(f"{BASE_URL}/assets/{fake_uuid}", headers=HEADERS, timeout=TIMEOUT)
        assert delete_404_resp.status_code == 404, "DELETE /assets/{id} did not return 404 for non-existent asset"

    finally:
        # Cleanup created resources if still present
        if asset_id:
            try:
                delete_asset(asset_id)
            except Exception:
                pass
        if company_id:
            try:
                delete_company(company_id)
            except Exception:
                pass


test_assets_api_list_update_and_delete_assets()