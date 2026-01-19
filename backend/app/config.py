"""
Configuration management for NeuroLearn Backend
Handles environment variables and API keys securely
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    This approach follows security best practices by keeping secrets out of code.
    """

    # API Keys
    GEMINI_API_KEY: str
    AI4BHARAT_API_KEY: str = ""  # Optional, fallback to Web Speech API

    # Application Settings
    APP_NAME: str = "NeuroLearn API"
    DEBUG: bool = True

    # CORS Settings (Allow Next.js frontend)
    FRONTEND_URL: str = "http://localhost:3000"

    # Gemini Model Configuration
    # Using Flash 1.5 for cost-efficiency and speed
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Indian Context Settings
    DEFAULT_LANGUAGE: str = "hi"  # Hindi for AI4Bharat
    DEFAULT_VOICE: str = "en-IN"  # Indian English accent

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance to avoid repeated file reads.
    The @lru_cache decorator ensures we only load .env once.
    """
    return Settings()
