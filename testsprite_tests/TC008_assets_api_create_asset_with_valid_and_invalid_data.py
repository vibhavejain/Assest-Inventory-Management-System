import requests
import uuid

BASE_URL = "http://localhost:8787"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def create_company(name):
    payload = {"name": name}
    resp = requests.post(f"{BASE_URL}/companies", json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    company_id = data.get("id")
    assert company_id is not None, "Company ID not returned on creation"
    return company_id

def delete_company(company_id):
    requests.delete(f"{BASE_URL}/companies/{company_id}", headers=HEADERS, timeout=TIMEOUT)

def delete_asset(asset_id):
    requests.delete(f"{BASE_URL}/assets/{asset_id}", headers=HEADERS, timeout=TIMEOUT)

def test_assets_api_create_asset_with_valid_and_invalid_data():
    # Create a company to use as valid company_id
    company_name = f"TestCompany-{uuid.uuid4()}"
    company_id = None
    asset_id = None
    try:
        company_id = create_company(company_name)

        # Test valid asset creation
        valid_asset_payload = {
            "name": "Valid Asset",
            "company_id": company_id,
            "type": "Laptop",
            "description": "Valid asset description",
            "status": "available"
        }
        resp = requests.post(f"{BASE_URL}/assets", json=valid_asset_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Valid asset creation failed with status {resp.status_code}"
        asset_data = resp.json()
        asset_id = asset_data.get("id")
        assert asset_id is not None, "Asset ID not returned on creation"

        # Test invalid asset creation - missing required fields
        invalid_payloads = [
            {},  # empty
            {"name": "AssetWithoutCompanyIdAndType"},
            {"company_id": company_id, "type": "Laptop"},  # missing name
            {"name": "AssetMissingCompanyId", "type": "Laptop"},
            {"name": "AssetMissingType", "company_id": company_id},
            {"name": "", "company_id": company_id, "type": "Laptop"},  # empty name
            {"name": "Valid Name", "company_id": "invalid-uuid", "type": "Laptop"},  # invalid uuid format
        ]

        for payload in invalid_payloads:
            resp = requests.post(f"{BASE_URL}/assets", json=payload, headers=HEADERS, timeout=TIMEOUT)
            assert resp.status_code == 400, f"Invalid payload {payload} did not return 400 but {resp.status_code}"

        # Test company not found scenario - use a random UUID that does not exist
        non_existent_company_id = str(uuid.uuid4())
        payload = {
            "name": "AssetForNonExistentCompany",
            "company_id": non_existent_company_id,
            "type": "Tablet"
        }
        resp = requests.post(f"{BASE_URL}/assets", json=payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Asset creation with non-existent company_id did not return 400 but {resp.status_code}"

    finally:
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

test_assets_api_create_asset_with_valid_and_invalid_data()