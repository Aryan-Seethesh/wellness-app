import httpx

response = httpx.post(
    "http://127.0.0.1:8000/auth/register",
    json={
        "name": "Test User",
        "email": "test4@test.com",
        "password": "securepass123",
        "age": 28,
        "weight_kg": 65,
        "height_cm": 168,
        "fitness_goal": "general_fitness"
    }
)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
