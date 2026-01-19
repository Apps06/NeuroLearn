"""
Voice Service for Indian-accented Text-to-Speech.
Uses AI4Bharat (Bhashini) API with fallback to browser-based TTS.
"""

import requests
import base64
from typing import Optional, Dict
from app.config import get_settings

settings = get_settings()


class VoiceService:
    def __init__(self):
        """
        Initialize TTS service with AI4Bharat endpoints.

        WHY AI4BHARAT:
        - Government-backed Indian language technology initiative
        - Natural Indian English accent (vs. American/British in Google TTS)
        - Supports multiple Indian languages (future: Hindi, Tamil, etc.)
        - Free for educational use (as of 2024)
        """
        self.bhashini_url = (
            "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
        )
        self.api_key = settings.AI4BHARAT_API_KEY

    async def generate_speech_ai4bharat(
        self, text: str, language: str = "en"
    ) -> Optional[str]:
        """
        Generate speech using AI4Bharat's TTS pipeline.

        Args:
            text: Text to convert to speech
            language: Language code ('en' for English, 'hi' for Hindi)

        Returns:
            Base64-encoded audio (WAV format) or None if failed
        """
        if not self.api_key:
            return None

        # AI4Bharat payload structure
        payload = {
            "pipelineTasks": [
                {
                    "taskType": "tts",
                    "config": {
                        "language": {"sourceLanguage": language},
                        "serviceId": "ai4bharat/indic-tts",
                        "gender": "female",  # More natural for educational content
                        "samplingRate": 16000,
                    },
                }
            ],
            "inputData": {"input": [{"source": text}]},
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                self.bhashini_url, json=payload, headers=headers, timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                # Extract audio from response
                audio_content = (
                    data.get("pipelineResponse", [{}])[0]
                    .get("audio", [{}])[0]
                    .get("audioContent")
                )
                return audio_content  # Already base64 encoded
            else:
                print(f"AI4Bharat error: {response.status_code}")
                return None

        except Exception as e:
            print(f"TTS generation failed: {e}")
            return None

    async def generate_speech_fallback(self, text: str) -> Dict[str, any]:
        """
        Fallback response for client-side Web Speech API.

        WHY FALLBACK:
        - AI4Bharat may have rate limits or downtime
        - Browser's speechSynthesis API is reliable backup
        - Still provides Indian English accent via 'en-IN' voice

        Returns:
            Instructions for frontend to use Web Speech API
        """
        return {
            "use_client_tts": True,
            "text": text,
            "voice_params": {
                "lang": "en-IN",  # Indian English accent
                "rate": 0.9,  # Slightly slower for dyslexic readers
                "pitch": 1.0,
                "volume": 1.0,
            },
            "message": "Using browser Text-to-Speech (Indian English accent)",
        }

    async def generate_speech(self, text: str, language: str = "en") -> Dict[str, any]:
        """
        Main TTS method with intelligent fallback strategy.

        Returns:
            Dict with either audio_base64 or client_tts instructions
        """
        # Try AI4Bharat first
        audio_base64 = await self.generate_speech_ai4bharat(text, language)

        if audio_base64:
            return {
                "success": True,
                "audio_base64": audio_base64,
                "format": "wav",
                "message": "Audio generated via AI4Bharat TTS",
            }
        else:
            # Fallback to client-side TTS
            fallback_data = await self.generate_speech_fallback(text)
            return {"success": True, **fallback_data}


# Singleton instance
voice_service = VoiceService()
