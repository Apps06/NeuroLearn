"""
AI Service using Google Gemini for text simplification and task breakdown.
This is the "brain" of NeuroLearn's adaptive features.
"""

import google.generativeai as genai
from groq import Groq
from typing import List, Dict, Optional
from app.config import get_settings
from app.models.schemas import MicroTask
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.api_core import exceptions

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
        
        # Initialize Groq client
        self.groq_client = None
        if settings.GROQ_API_KEY:
            self.groq_client = Groq(api_key=settings.GROQ_API_KEY)

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

        prompt = f"""Role: Education expert for learning disabilities (dyslexia).
Task: Simplify text for Indian students (reading age -2 years).
Level: {level_prompts.get(level, level_prompts['moderate'])}
Rules: Simple words, short sentences, explain technical terms in (), Indian context, active voice.

Text: {text}

Output: Simplified text only."""

        try:
            return await self._generate_content_with_retry(prompt)
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
        prompt = f"""Role: ADHD coach for Indian students.
STUDENT GRADE: {grade_level}
TASK DESCRIPTION:
{vague_task}

GOAL: Break this task into 5-7 specific micro-tasks (10-20 min each).
REQUIREMENTS:
- Start with easiest task first (build momentum).
- Each task should be specific and actionable.
- Use Indian educational context (NCERT, CBSE, boards).
- Include small rewards or breaks between tasks.
- Output ONLY valid JSON array. No markdown, no commentary, no explanation.

OUTPUT FORMAT (strict JSON array):
[
  {{"step": 1, "task": "specific action here", "minutes": 10, "xp": 10}},
  {{"step": 2, "task": "next specific action", "minutes": 15, "xp": 15}},
  ...
]

IMPORTANT: Return ONLY the JSON array, nothing else."""

        try:
            # Use the retry wrapper with Groq fallback
            response_text = await self._generate_content_with_retry(prompt)
            
            print(f"[DEBUG] Raw AI response:\n{response_text}\n")
            
            # Parse JSON response
            import json

            # Robust JSON extraction
            json_str = response_text.strip()
            if "```" in json_str:
                # Remove markdown code blocks
                if "```json" in json_str:
                    json_str = json_str.split("```json")[1].split("```")[0].strip()
                else:
                    json_str = json_str.split("```")[1].split("```")[0].strip()
            else:
                # Find the first [ and last ]
                start_idx = json_str.find("[")
                end_idx = json_str.rfind("]")
                if start_idx != -1 and end_idx != -1:
                    json_str = json_str[start_idx : end_idx + 1]
            
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

            # Ensure we have at least 3 tasks
            if len(micro_tasks) < 3:
                raise ValueError("AI returned fewer than 3 tasks")
                
            return micro_tasks

        except Exception as e:
            # Fallback: create basic breakdown with multiple steps
            import traceback
            err_msg = traceback.format_exc()
            print(f"[ERROR] Task breakdown failure: {e}\n{err_msg}")
            
            # Create a better fallback with multiple generic steps
            task_short = vague_task[:50] if len(vague_task) > 50 else vague_task
            return [
                MicroTask(
                    step_number=1,
                    description=f"Gather materials needed for: {task_short}",
                    estimated_minutes=10,
                    xp_reward=10,
                ),
                MicroTask(
                    step_number=2,
                    description=f"Research and outline main points",
                    estimated_minutes=15,
                    xp_reward=15,
                ),
                MicroTask(
                    step_number=3,
                    description=f"Write first draft",
                    estimated_minutes=20,
                    xp_reward=20,
                ),
                MicroTask(
                    step_number=4,
                    description=f"Review and edit your work",
                    estimated_minutes=10,
                    xp_reward=10,
                ),
                MicroTask(
                    step_number=5,
                    description=f"Final polish and submit",
                    estimated_minutes=10,
                    xp_reward=15,
                ),
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
            return await self._generate_content_with_retry(prompt)
        except Exception as e:
            print(f"!!! GEMINI GENERATE_RAW CRASH !!!: {e}")
            import traceback
            traceback.print_exc()
            return ""

    async def _generate_groq_content(self, prompt: str) -> str:
        """Generate content using Groq API"""
        if not self.groq_client:
            raise ValueError("Groq API key not configured")
            
        try:
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=settings.GROQ_MODEL,
                temperature=0.5,
                max_tokens=1024,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Groq API error: {e}")
            raise e

    @retry(
        retry=retry_if_exception_type(exceptions.ResourceExhausted),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def _generate_content_with_retry(self, prompt: str) -> str:
        """
        Helper to run generation with:
        1. Rate limit retry logic
        2. Auto-fallback to Groq if Gemini fails/exhausts quota
        3. Configurable provider switching
        """
        # Strategy:
        # 1. Check configured provider
        # 2. If 'groq', tries Groq.
        # 3. If 'gemini', tries Gemini. If Gemini throws ResourceExhausted, 
        #    and Groq is available, switch to Groq for this request.

        provider = settings.AI_PROVIDER
        
        # Force fallback to Groq if Gemini is configured but 429s are likely
        # (handing below in exception)
        
        if provider == "groq":
            if self.groq_client:
                return await self._generate_groq_content(prompt)
            else:
                print("Groq configured but client not initialized. Falling back to Gemini.")
        
        # Default Gemini Path
        try:
            import asyncio
            from functools import partial
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                partial(
                    self.model.generate_content, 
                    prompt, 
                    safety_settings=self.safety_settings
                )
            )
            return response.text.strip()
            
        except exceptions.ResourceExhausted:
            print("[WARN] Gemini quota exhausted (429). Attempting fallback to Groq...")
            if self.groq_client:
                return await self._generate_groq_content(prompt)
            raise


# Singleton instance
ai_service = AIService()
