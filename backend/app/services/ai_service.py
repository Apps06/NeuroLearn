"""
AI Service using Google Gemini for text simplification and task breakdown.
This is the "brain" of NeuroLearn's adaptive features.
"""

import google.generativeai as genai
from typing import List, Dict
from app.config import get_settings
from app.models.schemas import MicroTask

settings = get_settings()


class AIService:
    def __init__(self):
        """
        Initialize Gemini API client.
        Using Flash 1.5 model for optimal speed/cost balance.
        """
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

        # Safety settings for educational content
        self.safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_ONLY_HIGH",
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_ONLY_HIGH",
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE", # or "BLOCK_ONLY_HIGH"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_ONLY_HIGH",
            },
        ]

    async def simplify_text(self, text: str, level: str = "moderate") -> str:
        """
        Use Gemini to simplify complex academic text for dyslexic students.

        WHY GEMINI FLASH 1.5:
        - Multimodal capabilities (future: can process images from textbooks)
        - Low latency (~500ms for 100 tokens)
        - Cost-effective for Indian student pricing
        - Understands Indian English context

        Args:
            text: Complex text to simplify
            level: 'light', 'moderate', or 'heavy' simplification

        Returns:
            Simplified text maintaining core meaning
        """
        level_prompts = {
            "light": "slightly simpler vocabulary, keep sentence structure",
            "moderate": "simpler words and shorter sentences",
            "heavy": "very simple words, very short sentences, explain complex terms",
        }

        prompt = f"""You are an expert educator specializing in learning disabilities.
Simplify this text for Indian students with dyslexia (reading age may be 2-3 years below grade level).

Simplification level: {level_prompts.get(level, level_prompts['moderate'])}

RULES:
1. Replace complex words (utilize → use, comprehend → understand)
2. Break compound sentences into simple ones
3. Keep technical terms but add brief explanations in parentheses
4. Maintain cultural context relevant to India
5. Use active voice instead of passive voice

Original text:
{text}

Simplified version:"""

        try:
            response = self.model.generate_content(
                prompt, safety_settings=self.safety_settings
            )
            return response.text.strip()
        except Exception as e:
            # Fallback: return original if API fails
            print(f"Gemini API error: {e}")
            return text

    async def break_down_task(
        self, vague_task: str, grade_level: int = 8
    ) -> List[MicroTask]:
        """
        Decompose a vague task into ADHD-friendly micro-steps.

        WHY TASK BREAKDOWN FOR ADHD:
        - Executive dysfunction makes large tasks overwhelming
        - Micro-tasks provide dopamine hits upon completion
        - Time estimates help with time blindness (common in ADHD)

        Args:
            vague_task: User's original task description
            grade_level: Student's grade for age-appropriate complexity

        Returns:
            List of 5-7 micro-tasks with time estimates
        """
        prompt = f"""You are an ADHD coach for Indian students.
Break down this vague task into 5-7 micro-tasks.

Task: {vague_task}
Student Grade: {grade_level}

REQUIREMENTS:
1. Each micro-task should take 10-20 minutes (ADHD attention span)
2. Start with the EASIEST task (builds momentum)
3. Be specific (not "research history" but "open NCERT textbook to Chapter 3")
4. Include Indian context (e.g., use NCERT, not generic textbooks)
5. Add a tiny reward/break between tasks

Format as JSON:
[
  {{"step": 1, "task": "...", "minutes": 15, "xp": 10}},
  ...
]

Output ONLY the JSON array, no other text."""

        try:
            response = self.model.generate_content(
                prompt, safety_settings=self.safety_settings
            )

            # Parse JSON response
            import json

            # Clean response of markdown
            text = response.text
            print(f"[DEBUG] Raw Gemini response:\n{text}\n")
            
            start_idx = text.find("[")
            end_idx = text.rfind("]")
            
            if start_idx == -1 or end_idx == -1:
                print(f"[ERROR] No JSON array found in response")
                raise ValueError("No JSON array found in response")
                
            json_str = text[start_idx : end_idx + 1]
            print(f"[DEBUG] Extracted JSON string:\n{json_str}\n")
            
            tasks_json = json.loads(json_str)

            micro_tasks = []
            for idx, task_data in enumerate(tasks_json, 1):
                micro_tasks.append(
                    MicroTask(
                        step_number=idx,
                        description=task_data.get("task", ""),
                        estimated_minutes=task_data.get("minutes", 15),
                        xp_reward=task_data.get("xp", 10),
                    )
                )

            return micro_tasks

        except Exception as e:
            # Fallback: create basic breakdown
            print(f"Task breakdown error: {e}")
            import traceback
            traceback.print_exc()
            return [
                MicroTask(
                    step_number=1,
                    description=f"Start working on: {vague_task}",
                    estimated_minutes=20,
                    xp_reward=10,
                )
            ]

    async def generate_motivational_message(self, task_context: str) -> str:
        """
        Generate encouraging message for ADHD students.
        Uses positive reinforcement psychology.
        """
        prompt = f"""Generate a 1-sentence motivational message for an Indian student with ADHD about to start this task:
"{task_context}"

Make it:
- Encouraging but not patronizing
- Culturally relevant to India
- Emphasizes progress over perfection
- Max 15 words

Example: "Small steps lead to big victories. You've got this! 🎯"

Message:"""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except:
            return "Break it down, knock it out! 💪"

    async def generate_raw(self, prompt: str) -> str:
        """
        Generate raw text response from Gemini for general purposes.
        Used by flashcard service and other features needing raw AI output.
        """
        try:
            response = self.model.generate_content(
                prompt, safety_settings=self.safety_settings
            )
            return response.text.strip()
        except Exception as e:
            print(f"Gemini generate_raw error: {e}")
            return ""


# Singleton instance
ai_service = AIService()
