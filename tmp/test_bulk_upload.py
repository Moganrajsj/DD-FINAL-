import requests
import os
from openpyxl import Workbook

# Configuration
API_URL = "http://localhost:5000/api/seller/bulk-upload"
USER_ID = 1 # Trying ID 1

def create_test_excel(filename):
    wb = Workbook()
    ws = wb.active
    ws.title = "Product Data"
    
    # Headers
    headers = [
        "Product Name*", "Description", "Price*", "Stock Quantity", 
        "Min Order Qty", "Category Name*", "Location", "Price Trend %"
    ]
    ws.append(headers)
    
    # Valid Row
    ws.append(["Valid Bulk Product", "A valid product from test script", 999.99, 100, 10, "Machinery", "Mumbai", 1.5])
    
    # Invalid Row: Missing Name
    ws.append(["", "Missing name row", 100.0, 10, 1, "Apparel & Fashion", "Delhi", 0.0])
    
    # Invalid Row: Wrong Category
    ws.append(["Bad Category Product", "Category doesn't exist", 500.0, 5, 1, "NonExistentCategory", "Pune", 0.0])
    
    wb.save(filename)
    print(f"Test file '{filename}' created.")

def test_bulk_upload(filename):
    for uid in range(1, 11):
        with open(filename, 'rb') as f:
            files = {'file': (filename, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            data = {'user_id': uid}
            
            try:
                response = requests.post(API_URL, files=files, data=data)
                if response.status_code == 200:
                    print(f"SUCCESS with User ID: {uid}")
                    print("Response JSON:")
                    import json
                    print(json.dumps(response.json(), indent=2))
                    return True
                else:
                    print(f"Failed with User ID: {uid} - {response.json().get('error')}")
            except Exception as e:
                print(f"Error: {e}")
    return False

if __name__ == "__main__":
    fname = "bulk_upload_test.xlsx"
    create_test_excel(fname)
    if not test_bulk_upload(fname):
        print("Could not find a valid user with company association in IDs 1-10")
    # Cleanup
    if os.path.exists(fname):
        os.remove(fname)
