import requests
import time

try:
    start = time.time()
    response = requests.get("http://127.0.0.1:8001/api/map-data")
    if response.status_code == 200:
        data = response.json()
        print(f"Status Code: {response.status_code}")
        print(f"Record Count: {len(data)}")
        print(f"Time Taken: {time.time() - start:.2f}s")
    else:
        print(f"Error: {response.status_code}")
except Exception as e:
    print(f"Request failed: {e}")
