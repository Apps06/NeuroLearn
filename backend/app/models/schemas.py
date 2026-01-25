"""
Pydantic models for request/response validation.
These ensure type safety and automatic API documentation.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class TextSimplificationRequest(BaseModel):
    """Request model for Dyslexia Reader text processing"""

    text: str = Field(..., description="Complex text to be simplified")
    simplification_level: str = Field(
        default="moderate",
        description="Level of simplification: 'light', 'moderate', 'heavy'",
    )


class SimplifiedChunk(BaseModel):
    """Individual text chunk with bionic formatting metadata"""

    original: str
    simplified: str
    bionic_html: str  # HTML with bold tags for first 50% of words


class TextSimplificationResponse(BaseModel):
    """Response containing processed text chunks"""

    chunks: List[SimplifiedChunk]
    audio_available: bool = Field(description="Whether TTS audio generation succeeded")
    audio_url: Optional[str] = None


class TaskBreakdownRequest(BaseModel):
    """Request for ADHD task decomposition"""

    vague_task: str = Field(..., example="Prepare history project on Mughal Empire")
    user_grade: Optional[int] = Field(
        default=8, description="Student's grade level for age-appropriate breakdown"
    )


class MicroTask(BaseModel):
    """Individual micro-task with time estimate"""

    step_number: int
    description: str
    estimated_minutes: int
    xp_reward: int = 10  # Gamification points


class TaskBreakdownResponse(BaseModel):
    """Response containing micro-tasks and motivation"""

    micro_tasks: List[MicroTask]
    total_estimated_time: int
    motivational_message: str


class VoiceRequest(BaseModel):
    """Request for Text-to-Speech generation"""

    text: str
    language: str = "en"  # 'en' for Indian English, 'hi' for Hindi
    accent: str = "IN"  # Indian accent


class VoiceResponse(BaseModel):
    """Response containing audio data or URL"""

    audio_base64: Optional[str] = None
    audio_url: Optional[str] = None
    success: bool
    message: str


class RAGQueryRequest(BaseModel):
    """Request for querying NIMHANS guidelines"""

    query: str = Field(
        ..., example="What is the screening protocol for Class 8 students?"
    )
    grade_context: Optional[int] = None


class RAGQueryResponse(BaseModel):
    """Response from RAG system with source attribution"""

    answer: str
    sources: List[str] = Field(description="Page numbers or sections from the source PDF")
    confidence_score: float = Field(
        ge=0.0, le=1.0, description="Confidence in answer accuracy (0-1)"
    )
    source_doc: Optional[str] = Field(None, description="The document name used for retrieval")


class FlashcardItem(BaseModel):
    """Individual flashcard with front and back content"""

    front: str = Field(description="Question or prompt on the flashcard front")
    back: str = Field(description="Answer or explanation on the flashcard back")


class FlashcardRequest(BaseModel):
    """Request for AI-generated flashcards"""

    text: str = Field(..., description="Source text to generate flashcards from")
    max_cards: int = Field(default=10, description="Maximum number of cards to generate")


class FlashcardResponse(BaseModel):
    """Response containing generated flashcards"""

    flashcards: List[FlashcardItem]
    source_text_length: int

