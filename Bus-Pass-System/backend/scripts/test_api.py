import requests
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("--- 1. Testing Health Endpoint ---")
    try:
        res = requests.get(f"{BASE_URL}/health")
        print("Health Status:", res.status_code, res.json())
    except Exception as e:
        print("Health failed:", e)
        sys.exit(1)

    print("\n--- 2. Registering New User ---")
    email = f"tester_{uuid.uuid4().hex[:6]}@test.com"
    payload = {
        "email": email,
        "password": "Password@123",
        "first_name": "API",
        "last_name": "Tester",
        "phone": "9876543210"
    }
    res = requests.post(f"{BASE_URL}/api/v1/auth/register", json=payload)
    print("Register Status:", res.status_code)
    register_json = res.json()
    print("Register Response:", register_json)

    token = None
    if res.status_code == 200:
        token = register_json.get("access_token")
    else:
        # Try to login with admin if registration fails
        print("Registration not successful, trying to login as admin...")

    if not token:
        print("\n--- 3. Logging in as Admin ---")
        login_data = {
            "username": "admin@smartbus.com",
            "password": "Admin@12345"
        }
        res = requests.post(f"{BASE_URL}/api/v1/auth/login", data=login_data)
        print("Login Status:", res.status_code)
        login_json = res.json()
        token = login_json.get("access_token")
        print("Login Token received:", token[:30] + "..." if token else None)
    else:
        print("Using registration token.")

    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 4. Getting Current User Info (/users/me) ---")
    res = requests.get(f"{BASE_URL}/api/v1/users/me", headers=headers)
    print("Me Status:", res.status_code, res.json())

    print("\n--- 5. Get Routes Count (Debug) ---")
    res = requests.get(f"{BASE_URL}/api/v1/debug/routes/count")
    print("Count Status:", res.status_code, res.json())

    print("\n--- 6. Get All Routes (Paginated, size=2) ---")
    res = requests.get(f"{BASE_URL}/api/v1/routes/", params={"page": 1, "page_size": 2})
    print("Routes Status:", res.status_code)
    routes_json = res.json()
    print("Routes Response Info:", {k: v for k, v in routes_json.items() if k != "items"})
    items = routes_json.get("items", [])
    print("First Route item:", items[0] if items else "No routes")

    route_id = None
    if items:
        route_id = items[0].get("id")

    print("\n--- 7. Search Route ('Katraj') ---")
    res = requests.get(f"{BASE_URL}/api/v1/routes/", params={"search": "Katraj", "page": 1, "page_size": 2})
    print("Search Status:", res.status_code)
    search_json = res.json()
    print("Search Response Info:", {k: v for k, v in search_json.items() if k != "items"})
    print("Search First Route item:", search_json.get("items", [])[0] if search_json.get("items") else "No matches")

    if route_id:
        print(f"\n--- 8. Get Route Schedules for Route ID: {route_id} ---")
        res = requests.get(f"{BASE_URL}/api/v1/routes/{route_id}/schedules", headers=headers)
        print("Schedules Status:", res.status_code)
        schedules = res.json()
        print(f"Schedules Count: {len(schedules)}")
        print("First Schedule:", schedules[0] if schedules else "No schedules")

    print("\n--- 9. Get Pass Types ---")
    res = requests.get(f"{BASE_URL}/api/v1/passes/types", headers=headers)
    print("Pass Types Status:", res.status_code)
    passes = res.json()
    print(f"Pass Types Count: {len(passes)}")
    print("First Pass Type:", passes[0] if passes else "No passes")

    print("\n--- 10. AI Chat Request ---")
    chat_payload = {"message": "Show me buses going from Katraj to Swargate"}
    res = requests.post(f"{BASE_URL}/api/v1/ai/chat", json=chat_payload, headers=headers)
    print("AI Chat Status:", res.status_code)
    print("AI Chat Response:", res.json())

if __name__ == "__main__":
    test_api()
