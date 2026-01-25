"""
RAG (Retrieval-Augmented Generation) Service for NIMHANS Guidelines.
This enables Q&A strictly from the uploaded PDF document.
"""

import os
import logging
from app.config import get_settings

settings = get_settings()

try:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_community.vectorstores import Chroma
    from langchain_community.document_loaders import PyPDFLoader

    # NEW: Groq Import for Fallback
    from langchain_groq import ChatGroq
    
    # NEW: Modern Chain Imports (using langchain_classic on this environment)
    from langchain_classic.chains.retrieval import create_retrieval_chain
    from langchain_classic.chains.combine_documents import create_stuff_documents_chain
    from langchain_core.prompts import ChatPromptTemplate
    RAG_AVAILABLE = True
except ImportError as e:
    logging.warning(f"RAG dependencies missing: {e}. RAG features will be disabled.")
    RAG_AVAILABLE = False


class RAGService:
    def __init__(self, pdf_path: str = "data/nimhans_guidelines.pdf"):
        """
        Initialize RAG system with NIMHANS PDF or any available PDF in data/.
        """
        if not RAG_AVAILABLE:
            print("RAG Service is disabled due to missing dependencies.")
            return

        # NEW: Dynamic PDF path finding
        self.pdf_orig_path = pdf_path
        self.pdf_path = self._find_best_pdf(pdf_path)
        self.vector_store = None
        self.rag_chain = None
        self.source_document = os.path.basename(self.pdf_path) if self.pdf_path else "No PDF Found"

        # Initialize embeddings
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004", google_api_key=settings.GEMINI_API_KEY
        )

        # Initialize LLM (Primary: Gemini)
        model_name = settings.GEMINI_MODEL
        if "/" not in model_name:
            model_name = f"models/{model_name}"
            
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.1,
        )

        # Initialize Fallback LLM (Secondary: Groq)
        self.fallback_llm = ChatGroq(
            model_name=settings.GROQ_MODEL,
            groq_api_key=settings.GROQ_API_KEY,
            temperature=0.1
        ) if settings.GROQ_API_KEY else None

        if self.pdf_path:
            self._load_and_index_pdf()

    def _find_best_pdf(self, default_path: str) -> str:
        """Find the default PDF or the first PDF available in the data directory."""
        if os.path.exists(default_path) and os.path.isfile(default_path):
            return default_path
        
        data_dir = os.path.dirname(default_path) or "data"
        if os.path.exists(data_dir):
            # NEW: Filter for FILES only, avoid directories that might end in .pdf (like my chroma folders)
            pdfs = [os.path.join(data_dir, f) for f in os.listdir(data_dir) 
                    if f.lower().endswith(".pdf") and os.path.isfile(os.path.join(data_dir, f))]
            if pdfs:
                print(f"Using alternative PDF for RAG: {pdfs[0]}")
                return pdfs[0]
        
        return ""

    def _load_and_index_pdf(self):
        """Load PDF and create the modern LCEL RAG chain."""
        if not self.pdf_path or not os.path.exists(self.pdf_path):
            print(f"WARNING: No PDF found for indexing.")
            return

        # 1. Load PDF
        try:
            loader = PyPDFLoader(self.pdf_path)
            documents = loader.load()

            # 2. Split Text
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
            )
            chunks = text_splitter.split_documents(documents)

            # 3. Create Vector Store
            # Use a cleaner folder name (removing .pdf extension from folder name)
            safe_name = os.path.basename(self.pdf_path).replace(".pdf", "").replace(".", "_")
            self.vector_store = Chroma.from_documents(
                documents=chunks,
                embedding=self.embeddings,
                persist_directory=f"data/chroma_db_{safe_name}",
            )

            # 4. Create Retriever
            retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})

            # 5. Define Prompt used for both primary and fallback
            self.system_prompt = (
                "You are an expert assistant. "
                "Use the following pieces of retrieved context to answer the question. "
                "If the answer is not in the context, say you don't know and don't try to make up an answer. "
                "Keep the answer concise and strictly based on the provided context."
                "\n\n"
                "{context}"
            )
            
            prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", self.system_prompt),
                    ("human", "{input}"),
                ]
            )

            # 6. Create the Chain (Primary)
            question_answer_chain = create_stuff_documents_chain(self.llm, prompt)
            self.rag_chain = create_retrieval_chain(retriever, question_answer_chain)
            
            # 7. Create components for fallback (just storing retriever for now)
            self.retriever = retriever

            print(f"✓ RAG system initialized with {len(chunks)} chunks from {self.pdf_path}.")
        except Exception as e:
            logging.error(f"Failed to initialize RAG: {e}", exc_info=True)
            print(f"Failed to initialize RAG: {e}. Check logs for details.")

    async def query(self, question: str, grade_context: int = None) -> dict:
        """Query using the new invoke syntax with fallback support."""
        if not RAG_AVAILABLE or not self.rag_chain:
            # Fallback for when PDF is missing (Mocking NIMHANS knowledge)
            logging.warning("RAG chain not initialized. Using fallback response.")
            
            fallback_knowledge = {
                "reading": "For reading difficulties (Dyslexia), NIMHANS guidelines recommend: 1) Phonics-based instruction, 2) Multisensory techniques, 3) Large font and spacing (which this app provides).",
                "writing": "For writing difficulties (Dysgraphia), guidelines suggest: 1) Oral testing, 2) Allowing extra time, 3) Using speech-to-text software.",
                "attention": "For attention issues (ADHD), guidelines suggest: 1) Breaking tasks into small steps, 2) Frequent breaks (Pomodoro), 3) Minimal distractions in the environment.",
                "assessment": "Standard assessment involves: 1) IQ test (WISC), 2) Educational assessment (NIMHANS battery), 3) Exclusion of sensory deficits."
            }
            
            # Simple keyword matching for fallback
            message = "I couldn't verify this in any specific PDF document (file missing)."
            if self.pdf_path:
                 message = f"I indexed {self.source_document} but couldn't create a reliable query chain."
            
            answer = f"{message} However, general NIMHANS guidelines for SLD suggest ensuring early identification and providing remedial education."
            for key, val in fallback_knowledge.items():
                if key in question.lower():
                    answer = f"[FALLBACK KNOWLEDGE] {val}"
                    break
            
            return {
                "answer": answer,
                "sources": ["System Knowledge (PDF Missing)"],
                "confidence_score": 0.5,
                "source_doc": self.source_document
            }

        if grade_context:
            augmented_input = f"For Grade {grade_context} context: {question}"
        else:
            augmented_input = question

        try:
            # Try Primary (Gemini)
            result = await self.rag_chain.ainvoke({"input": augmented_input})
            return self._format_result(result)

        except Exception as e:
            logging.warning(f"Gemini RAG failed: {e}. Attempting fallback to Groq...")
            
            if self.fallback_llm and self.retriever:
                try:
                    # Recreate chain with Groq
                    prompt = ChatPromptTemplate.from_messages(
                        [
                            ("system", self.system_prompt),
                            ("human", "{input}"),
                        ]
                    )
                    groq_chain = create_stuff_documents_chain(self.fallback_llm, prompt)
                    fallback_rag_chain = create_retrieval_chain(self.retriever, groq_chain)
                    
                    result = await fallback_rag_chain.ainvoke({"input": augmented_input})
                    formatted = self._format_result(result)
                    formatted["source_doc"] = f"{self.source_document} (via Groq)"
                    return formatted
                    
                except Exception as groq_e:
                     return {
                        "answer": f"All AI services unavailable. Gemini Error: {str(e)}. Groq Error: {str(groq_e)}",
                        "sources": [],
                        "confidence_score": 0.0,
                    }
            else:
                 return {
                    "answer": f"Error querying NIMHANS guidelines (and no backup available): {str(e)}",
                    "sources": [],
                    "confidence_score": 0.0,
                }

    def _format_result(self, result: dict) -> dict:
        """Helper to format standard RAG result."""
        sources = []
        if "context" in result:
            for doc in result["context"]:
                page = doc.metadata.get("page", "Unknown")
                sources.append(f"Page {page + 1}")

        confidence = min(len(sources) * 0.3, 0.9)

        return {
            "answer": result["answer"],
            "sources": list(set(sources)),
            "confidence_score": confidence,
            "source_doc": self.source_document
        }


# Singleton instance
_rag_service = None


def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
