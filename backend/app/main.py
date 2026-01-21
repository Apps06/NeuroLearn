"""
FastAPI Main Application - Entry point for NeuroLearn Backend
Handles CORS, routing, and API documentation
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.models.schemas import (
    TextSimplificationRequest,
    TextSimplificationResponse,
    SimplifiedChunk,
    TaskBreakdownRequest,
    TaskBreakdownResponse,
    VoiceRequest,
    VoiceResponse,
    RAGQueryRequest,
    RAGQueryResponse,
    FlashcardRequest,
    FlashcardResponse,
    FlashcardItem,
)
from app.services.nlp_service import nlp_service
from app.services.ai_service import ai_service
from app.services.voice_service import voice_service
from app.services.rag_service import get_rag_service
from app.services.flashcard_service import generate_flashcards

settings = get_settings()

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered adaptive learning API for students with ADHD and Dyslexia",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc UI
)

# CORS Configuration
# WHY: Next.js frontend runs on different port (3000), needs cross-origin access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "https://neurolearn.vercel.app",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "NeuroLearn API is running",
        "version": "1.0.0",
        "services": {
            "nlp": "spaCy",
            "ai": "Google Gemini Flash 1.5",
            "tts": "AI4Bharat + Web Speech API fallback",
            "rag": "LangChain + ChromaDB",
        },
    }


@app.post("/api/reader/simplify", response_model=TextSimplificationResponse)
async def simplify_text(request: TextSimplificationRequest):
    """
    MODULE A: Dyslexia Reader Endpoint

    Process flow:
    1. Chunk text using spaCy (semantic boundaries)
    2. Simplify each chunk using Gemini
    3. Apply Bionic Reading formatting
    4. Return structured chunks for frontend rendering
    """
    try:
        # Step 1: Semantic chunking
        chunks = nlp_service.chunk_text_semantically(request.text)

        # Step 2 & 3: Simplify and format each chunk
        simplified_chunks = []
        for chunk in chunks:
            # Simplify with Gemini
            simplified = await ai_service.simplify_text(
                chunk, request.simplification_level
            )

            # Apply Bionic Reading
            bionic_html = nlp_service.apply_bionic_reading(simplified)

            simplified_chunks.append(
                SimplifiedChunk(
                    original=chunk, simplified=simplified, bionic_html=bionic_html
                )
            )

        return TextSimplificationResponse(
            chunks=simplified_chunks, audio_available=True  # TTS handled separately
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reader/tts", response_model=VoiceResponse)
async def generate_audio(request: VoiceRequest):
    """
    Text-to-Speech endpoint with Indian accent support.
    Tries AI4Bharat first, falls back to client-side TTS.
    """
    try:
        result = await voice_service.generate_speech(request.text, request.language)

        return VoiceResponse(
            audio_base64=result.get("audio_base64"),
            audio_url=result.get("audio_url"),
            success=result["success"],
            message=result["message"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/focus/breakdown", response_model=TaskBreakdownResponse)
async def break_down_task(request: TaskBreakdownRequest):
    """
    MODULE B: ADHD Focus Suite - Task Decomposition

    Takes a vague task and returns actionable micro-tasks.
    """
    try:
        # Generate micro-tasks using Gemini
        micro_tasks = await ai_service.break_down_task(
            request.vague_task, request.user_grade or 8
        )

        # Calculate total time
        total_time = sum(task.estimated_minutes for task in micro_tasks)

        # Generate motivational message
        motivation = await ai_service.generate_motivational_message(request.vague_task)

        return TaskBreakdownResponse(
            micro_tasks=micro_tasks,
            total_estimated_time=total_time,
            motivational_message=motivation,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/assessment/query", response_model=RAGQueryResponse)
async def query_nimhans(request: RAGQueryRequest):
    """
    MODULE C: RAG Assessment Endpoint

    Query NIMHANS guidelines using Retrieval-Augmented Generation.
    Ensures all answers come from the authoritative PDF.
    """
    try:
        rag = get_rag_service()
        result = await rag.query(request.query, request.grade_context)

        return RAGQueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            confidence_score=result["confidence_score"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/flashcards/generate", response_model=FlashcardResponse)
async def generate_flashcards_endpoint(request: FlashcardRequest):
    """
    MODULE D: Flashcard Generation

    Uses AI to generate flashcards from provided text content.
    Supports spaced repetition learning.
    """
    try:
        flashcards_data = await generate_flashcards(request.text, request.max_cards)
        
        flashcards = [
            FlashcardItem(front=fc["front"], back=fc["back"])
            for fc in flashcards_data
        ]

        return FlashcardResponse(
            flashcards=flashcards,
            source_text_length=len(request.text),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    """
    Detailed health check for monitoring.
    Useful for deployment platforms like Render.
    """
    return {
        "status": "healthy",
        "nlp_model": "en_core_web_sm loaded" if nlp_service.nlp else "not loaded",
        "ai_model": settings.GEMINI_MODEL,
        "rag_initialized": getattr(get_rag_service(), "rag_chain", None) is not None,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)

