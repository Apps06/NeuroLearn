import requests
import json

url = "http://localhost:8000/api/focus/breakdown"
data = {
    "vague_task": "finish history assignment of writing 100 word essay",
    "user_grade": 8
}

response = requests.post(url, json=data)
print("Status Code:", response.status_code)
print("\nResponse JSON:")
print(json.dumps(response.json(), indent=2))
