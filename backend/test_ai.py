import requests
import json

print("="*60)
print("TESTING AI SERVICE DIRECTLY")
print("="*60)

base_url = "http://localhost:8000"

# Test 1: Health check
print("\n[1] Health Check...")
try:
    resp = requests.get(f"{base_url}/", timeout=5)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print(f"API Model: {data.get('services', {}).get('ai', 'Unknown')}")
except Exception as e:
    print(f"ERROR: {e}")

# Test 2: Flashcard Generation
print("\n[2] Flashcard Generation...")
try:
    test_text = "The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration. Chloroplasts are found in plant cells and perform photosynthesis."
    resp = requests.post(
        f"{base_url}/api/flashcards/generate",
        json={"text": test_text, "max_cards": 3},
        timeout=60
    )
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print(f"Response: {json.dumps(data, indent=2)}")
except Exception as e:
    print(f"ERROR: {e}")

# Test 3: Text Simplification
print("\n[3] Text Simplification...")
try:
    resp = requests.post(
        f"{base_url}/api/reader/simplify",
        json={"text": "Photosynthesis is the biochemical process.", "simplification_level": "moderate"},
        timeout=60
    )
    print(f"Status: {resp.status_code}")
    data = resp.json()
    print(f"Response: {json.dumps(data, indent=2)}")
except Exception as e:
    print(f"ERROR: {e}")

print("\n" + "="*60)
