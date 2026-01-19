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

    # NEW: Modern Chain Imports
    from langchain.chains.retrieval import create_retrieval_chain
    from langchain.chains.combine_documents import create_stuff_documents_chain
    from langchain_core.prompts import ChatPromptTemplate
    RAG_AVAILABLE = True
except ImportError as e:
    logging.warning(f"RAG dependencies missing: {e}. RAG features will be disabled.")
    RAG_AVAILABLE = False


class RAGService:
    def __init__(self, pdf_path: str = "data/nimhans_guidelines.pdf"):
        """
        Initialize RAG system with NIMHANS PDF.
        """
        if not RAG_AVAILABLE:
            print("RAG Service is disabled due to missing dependencies.")
            return

        self.pdf_path = pdf_path
        self.vector_store = None
        self.rag_chain = None  # Renamed from qa_chain to reflect new type

        # Initialize embeddings
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001", google_api_key=settings.GEMINI_API_KEY
        )

        # Initialize LLM
        self.llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.1,
        )

        self._load_and_index_pdf()

    def _load_and_index_pdf(self):
        """Load PDF and create the modern LCEL RAG chain."""
        if not os.path.exists(self.pdf_path):
            print(f"WARNING: NIMHANS PDF not found at {self.pdf_path}")
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
            self.vector_store = Chroma.from_documents(
                documents=chunks,
                embedding=self.embeddings,
                persist_directory="data/chroma_db",
            )

            # 4. Create Retriever
            retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})

            # 5. Define Prompt (Required for new chains)
            system_prompt = (
                "You are an expert medical assistant for NIMHANS guidelines. "
                "Use the following pieces of retrieved context to answer the question. "
                "If the answer is not in the context, say you don't know. "
                "Keep the answer concise and strictly based on the provided context."
                "\n\n"
                "{context}"
            )

            prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", system_prompt),
                    ("human", "{input}"),
                ]
            )

            # 6. Create the Chain (The Modern Way)
            question_answer_chain = create_stuff_documents_chain(self.llm, prompt)
            self.rag_chain = create_retrieval_chain(retriever, question_answer_chain)

            print(f"✓ RAG system initialized with {len(chunks)} chunks.")
        except Exception as e:
            print(f"Failed to initialize RAG: {e}")

    def query(self, question: str, grade_context: int = None) -> dict:
        """Query using the new invoke syntax."""
        if not RAG_AVAILABLE or not self.rag_chain:
            return {
                "answer": "RAG system not initialized (dependencies missing or PDF load failed).",
                "sources": [],
                "confidence_score": 0.0,
            }

        if grade_context:
            augmented_input = f"For Class {grade_context} students: {question}"
        else:
            augmented_input = question

        try:
            # NEW: Invoke expects "input", not "query"
            result = self.rag_chain.invoke({"input": augmented_input})

            # Extract sources (Key is now "context", not "source_documents")
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
            }

        except Exception as e:
            return {
                "answer": f"Error querying NIMHANS guidelines: {str(e)}",
                "sources": [],
                "confidence_score": 0.0,
            }


# Singleton instance
_rag_service = None


def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
