import requests
import json
import random
import string

BASE_URL = "http://localhost:5000"

def get_random_string(length):
    return ''.join(random.choice(strings.ascii_lowercase) for _ in range(length))

def test_auto_assignment():
    print("--- Testing Auto-Assignment Logic ---")
    
    # 1. Ensure we have at least one buyer manager
    # (Manual step: designate a user as manager via database or UI)
    # For testing, we'll assume there is one.
    
    # 2. Submit a high-value inquiry
    high_value_data = {
        "product_id": 1,
        "product_name": "Test High Value Product",
        "buyer_id": 2, # Assuming user 2 exists
        "buyer_name": "Test Buyer",
        "buyer_email": "buyer@test.com",
        "quantity": "500", # High value (>100)
        "message": "Bulk order for export. Please quote for contract."
    }
    
    print(f"Submitting high-value inquiry: {high_value_data['quantity']} units...")
    response = requests.post(f"{BASE_URL}/api/inquiries", json=high_value_data)
    
    if response.status_code == 201:
        result = response.json()
        inquiry_id = result.get('id')
        print(f"Success! Inquiry created with ID: {inquiry_id}")
        
        # 3. Check if a manager was assigned
        # Since we're in admin, we can check via the admin endpoint
        # (Assuming we have an admin session or can skip auth for this test)
        # For now, let's just check the response if it includes it
        if 'manager_id' in result and result['manager_id']:
            print(f"Manager Assigned: ID {result['manager_id']}")
        else:
            print("No manager assigned in response. Checking via admin API...")
            admin_resp = requests.get(f"{BASE_URL}/api/admin/inquiries")
            if admin_resp.status_code == 200:
                inqs = admin_resp.json()
                for inq in inqs:
                    if inq['id'] == inquiry_id:
                        if inq.get('manager_id'):
                            print(f"Confirmed: Manager {inq['manager_name']} (ID {inq['manager_id']}) assigned.")
                        else:
                            print("Verification FAILED: No manager assigned to high-value inquiry.")
    else:
        print(f"Error creating inquiry: {response.text}")

if __name__ == "__main__":
    try:
        import requests as _
    except ImportError:
        print("Installing requests...")
        import os
        os.system("pip install requests")
    
    import string as strings # Fix for get_random_string
    test_auto_assignment()
