import requests
from datetime import datetime

BASE_URL = "http://localhost:8787"
TIMEOUT = 30

def test_TC001_health_check_api_returns_service_status_and_timestamp():
    url = f"{BASE_URL}/health"
    headers = {
        "Accept": "application/json"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert resp.status_code == 200

    json_resp = resp.json()
    assert json_resp.get("success") == True, "Response 'success' flag is not True"
    data = json_resp.get("data")
    assert data is not None, "Response 'data' field missing"

    status = data.get("status")
    timestamp = data.get("timestamp")

    assert status == "ok", f"Expected status 'ok', got '{status}'"
    assert isinstance(timestamp, str) and len(timestamp) > 0, "Timestamp field missing or empty"

    # Validate timestamp as ISO 8601 date-time format
    try:
        datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    except ValueError:
        assert False, f"Timestamp '{timestamp}' is not in valid ISO 8601 date-time format"

test_TC001_health_check_api_returns_service_status_and_timestamp()