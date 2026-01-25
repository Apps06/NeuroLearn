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
    Role: Expert Academic Tutor.
    Task: Generate {max_cards} high-quality study flashcards from the provided text.
    Target Audience: Student revising for an exam.
    
    Guidelines:
    1. **Front (Question)**: Create varied question types:
       - Conceptual: "Explain the concept of..."
       - Relational: "What is the relationship between X and Y?"
       - Definitional: "Define [Term]."
       - Cause/Effect: "What happens when...?"
    
    2. **Back (Answer)**: Provide clear, accurate, and comprehensive answers.
       - Avoid one-word answers unless it's a strict factual recall.
       - If the answer is complex, break it down briefly.
    
    3. **Content**: extracting only the most important information. discard fluff.
    
    SOURCE TEXT:
    {text}
    
    OUTPUT FORMAT:
    Respond ONLY with a valid JSON array of objects. No markdown, no explanations outside JSON.
    [
        {{"front": "Question here?", "back": "Detailed answer here."}},
        {{"front": "Another question?", "back": "Another answer."}}
    ]
    """
    
    try:
        response = await ai_service.generate_raw(prompt)
        
        if not response or response.strip() == "":
            print("[ERROR Flashcard] Empty response from AI")
            return []
        
        # Robust JSON extraction
        json_str = response.strip()
        if "```" in json_str:
            # Remove markdown code blocks
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            else:
                json_str = json_str.split("```")[1].split("```")[0].strip()
        
        # Extract JSON from response - find first [ and last ]
        start_idx = json_str.find("[")
        end_idx = json_str.rfind("]")
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = json_str[start_idx:end_idx + 1]
            try:
                flashcards = json.loads(json_str)
                return flashcards[:max_cards]
            except json.JSONDecodeError as je:
                print(f"[FLASHCARD FILTER] JSON Decode Error: {je}")
                # Try to blindly fix common JSON errors if needed, or just return empty
                return []
        else:
            print(f"[FLASHCARD ERROR] No JSON array found in response: {response[:100]}...")
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
