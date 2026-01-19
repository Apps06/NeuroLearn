"""
Flashcard Service - AI-generated flashcards from text
Uses Gemini to create question-answer pairs
"""

import json
import re
from typing import List, Dict
from app.services.ai_service import ai_service


async def generate_flashcards(text: str, max_cards: int = 10) -> List[Dict[str, str]]:
    """
    Generate flashcards from input text using Gemini AI.
    
    Args:
        text: The source text to generate flashcards from
        max_cards: Maximum number of flashcards to generate
    
    Returns:
        List of flashcard dicts with 'front' and 'back' keys
    """
    prompt = f"""
    You are an educational content creator. Generate {max_cards} flashcards from the following text.
    Each flashcard should have a clear question on the front and a concise answer on the back.
    Focus on key concepts, definitions, and important facts.
    
    TEXT:
    {text}
    
    Respond ONLY with a JSON array of objects, each with 'front' and 'back' keys.
    Example format:
    [
        {{"front": "What is photosynthesis?", "back": "The process by which plants convert sunlight into energy"}},
        {{"front": "Define democracy", "back": "A system of government where citizens participate in decision-making"}}
    ]
    
    Generate exactly {max_cards} flashcards. Return ONLY the JSON array, no other text.
    """
    
    try:
        response = await ai_service.generate_raw(prompt)
        
        if not response or response.strip() == "":
            print("[ERROR Flashcard] Empty response from AI")
            return []
        
        # Extract JSON from response - find first [ and last ]
        start_idx = response.find("[")
        end_idx = response.rfind("]")
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = response[start_idx:end_idx + 1]
            try:
                flashcards = json.loads(json_str)
                return flashcards[:max_cards]
            except json.JSONDecodeError as je:
                print(f"[FLASHCARD FILTER] JSON Decode Error: {je}")
                return []
        else:
            print("[FLASHCARD ERROR] No JSON array found")
            return []
            
    except Exception as e:
        print(f"Flashcard generation error: {e}")
        import traceback
        traceback.print_exc()
        return []


# Singleton instance
flashcard_service = type('FlashcardService', (), {
    'generate_flashcards': staticmethod(generate_flashcards)
})()
