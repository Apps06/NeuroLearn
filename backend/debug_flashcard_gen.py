import asyncio
import sys
import os

# Add current dir to path so we can import app modules
sys.path.append(os.getcwd())

from app.services.flashcard_service import flashcard_service

async def test():
    from app.config import get_settings
    settings = get_settings()
    print(f"--- AI Provider: {settings.AI_PROVIDER} ---")
    if settings.AI_PROVIDER == "groq" and not settings.GROQ_API_KEY:
        print("WARNING: GROQ_API_KEY is missing!")

    text = """
    The Mughal Empire was an early-modern empire in South Asia. 
    For some two centuries, the empire stretched from the outer fringes of the Indus basin in the west, 
    northern Afghanistan in the northwest, and Kashmir in the north, to the highlands of present-day Assam 
    and Bangladesh in the east, and the uplands of the Deccan plateau in South India. 
    
    The Mughal empire is conventionally said to have been founded in 1526 by Babur, 
    a warrior chieftain from what is today Uzbekistan, who employed aid from the neighboring Safavid 
    and Ottoman empires to defeat the Sultan of Delhi, Ibrahim Lodhi, in the First Battle of Panipat, 
    and to sweep down the plains of Upper India.
    """
    
    print("--- Sending Request to AI ---")
    try:
        cards = await flashcard_service.generate_flashcards(text)
        print(f"\n--- SUCCESS: Generated {len(cards)} cards ---")
        for i, card in enumerate(cards):
            print(f"{i+1}. F: {card['front']}")
            print(f"   B: {card['back']}")
            
    except Exception as e:
        print(f"\n--- ERROR ---")
        print(e)
        with open("error_log.txt", "w") as f:
            f.write(str(e))
            import traceback
            traceback.print_exc(file=f)

if __name__ == "__main__":
    asyncio.run(test())
