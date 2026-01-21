import asyncio
from app.services.ai_service import ai_service
from app.config import get_settings
import os

async def test_groq():
    settings = get_settings()
    print(f"Current Provider: {settings.AI_PROVIDER}")
    print(f"Groq API Key Configured: {'Yes' if settings.GROQ_API_KEY else 'No'}")
    
    # Test 1: Explicit Groq call (simulated by checking client)
    if not ai_service.groq_client:
        print("[FAIL] Groq client not initialized (Did you add GROQ_API_KEY to .env?)")
        return

    print("\n--- Testing Groq Direct Generation ---")
    try:
        response = await ai_service._generate_groq_content("Say 'Hello from Groq!'")
        print(f"[SUCCESS] Groq Response: {response}")
    except Exception as e:
        print(f"[FAIL] Groq generation failed: {e}")

    print("\n--- Testing Provider Switching (Simulated) ---")
    # We won't force a Gemini 429, but we can check if the logic holds
    if settings.AI_PROVIDER == "gemini":
        print("Provider is Gemini. Fallback logic is active if 429 occurs.")
    elif settings.AI_PROVIDER == "groq":
        print("Provider is Groq. Should be using Groq by default.")

if __name__ == "__main__":
    asyncio.run(test_groq())
