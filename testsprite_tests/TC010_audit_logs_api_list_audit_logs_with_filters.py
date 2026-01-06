import requests
import uuid

BASE_URL = "http://localhost:8787"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}

def create_company():
    url = f"{BASE_URL}/companies"
    payload = {"name": f"Test Company {uuid.uuid4()}"}
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    assert data.get("success") is True
    company_id = data.get("data", {}).get("id")
    assert company_id is not None
    return company_id

def delete_company(company_id):
    url = f"{BASE_URL}/companies/{company_id}"
    resp = requests.delete(url, headers=HEADERS, timeout=TIMEOUT)
    if resp.status_code == 404:
        return
    resp.raise_for_status()
    data = resp.json()
    assert data.get("success") is True

def test_audit_logs_api_list_audit_logs_with_filters():
    company_id = None
    try:
        # Create a company to use its id for company_id parameter (required)
        company_id = create_company()

        # First, get audit logs without filters but with company_id param
        params = {"company_id": company_id, "limit": 10, "offset": 0}
        resp = requests.get(f"{BASE_URL}/audit-logs", headers=HEADERS, params=params, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        assert data.get("success") is True
        audit_logs = data.get("data", {}).get("items") if "items" in data.get("data", {}) else data.get("data")
        assert audit_logs is not None

        # If audit logs exist, test filter by entity_type and entity_id
        if audit_logs and isinstance(audit_logs, list) and len(audit_logs) > 0:
            first_log = audit_logs[0]
            entity_type = first_log.get("entity_type")
            entity_id = first_log.get("entity_id")
            # Filter by entity_type only
            params_filter_entity_type = {"company_id": company_id, "entity_type": entity_type, "limit": 10}
            resp_ft = requests.get(f"{BASE_URL}/audit-logs", headers=HEADERS, params=params_filter_entity_type, timeout=TIMEOUT)
            resp_ft.raise_for_status()
            data_ft = resp_ft.json()
            assert data_ft.get("success") is True
            audit_logs_ft = data_ft.get("data", {}).get("items") if "items" in data_ft.get("data", {}) else data_ft.get("data")
            assert audit_logs_ft is not None
            if isinstance(audit_logs_ft, list):
                for log in audit_logs_ft:
                    assert log.get("entity_type") == entity_type

            # Filter by entity_id only
            if entity_id:
                params_filter_entity_id = {"company_id": company_id, "entity_id": entity_id, "limit": 10}
                resp_fid = requests.get(f"{BASE_URL}/audit-logs", headers=HEADERS, params=params_filter_entity_id, timeout=TIMEOUT)
                resp_fid.raise_for_status()
                data_fid = resp_fid.json()
                assert data_fid.get("success") is True
                audit_logs_fid = data_fid.get("data", {}).get("items") if "items" in data_fid.get("data", {}) else data_fid.get("data")
                assert audit_logs_fid is not None
                if isinstance(audit_logs_fid, list):
                    for log in audit_logs_fid:
                        assert log.get("entity_id") == entity_id

            # Filter by both entity_type and entity_id
            if entity_type and entity_id:
                params_filter_both = {
                    "company_id": company_id,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "limit": 10,
                }
                resp_fb = requests.get(f"{BASE_URL}/audit-logs", headers=HEADERS, params=params_filter_both, timeout=TIMEOUT)
                resp_fb.raise_for_status()
                data_fb = resp_fb.json()
                assert data_fb.get("success") is True
                audit_logs_fb = data_fb.get("data", {}).get("items") if "items" in data_fb.get("data", {}) else data_fb.get("data")
                assert audit_logs_fb is not None
                if isinstance(audit_logs_fb, list):
                    for log in audit_logs_fb:
                        assert log.get("entity_type") == entity_type
                        assert log.get("entity_id") == entity_id

        else:
            # No audit logs - test that filtering still returns success and empty list (if applicable)
            filter_params = {
                "company_id": company_id,
                "entity_type": "non-existent-type",
                "entity_id": str(uuid.uuid4()),
                "limit": 10,
            }
            resp_empty = requests.get(f"{BASE_URL}/audit-logs", headers=HEADERS, params=filter_params, timeout=TIMEOUT)
            resp_empty.raise_for_status()
            data_empty = resp_empty.json()
            assert data_empty.get("success") is True
            audit_logs_empty = data_empty.get("data", {}).get("items") if "items" in data_empty.get("data", {}) else data_empty.get("data")
            if isinstance(audit_logs_empty, list):
                assert len(audit_logs_empty) == 0

    finally:
        if company_id:
            delete_company(company_id)

test_audit_logs_api_list_audit_logs_with_filters()