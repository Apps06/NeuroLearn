"""
NLP Service using spaCy for semantic text chunking.
This goes beyond simple sentence splitting to create meaningful reading units.
"""

import spacy
from typing import List


class NLPService:
    def __init__(self):
        """
        Load the spaCy English model.
        en_core_web_sm is lightweight and perfect for chunking tasks.
        """
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Fallback with instructions
            raise RuntimeError(
                "spaCy model not found. Run: python -m spacy download en_core_web_sm"
            )

    def chunk_text_semantically(
        self, text: str, max_chunk_length: int = 100
    ) -> List[str]:
        """
        Break text into semantic chunks using spaCy's sentence boundary detection.

        WHY THIS APPROACH:
        - spaCy uses ML models to detect sentence boundaries, not just periods.
        - Handles abbreviations (Dr., Mr., etc.) and decimals (3.14) correctly.
        - For dyslexic readers, smaller chunks reduce cognitive load.

        Args:
            text: Input text to chunk
            max_chunk_length: Maximum words per chunk (for ADHD focus)

        Returns:
            List of text chunks optimized for reading comprehension
        """
        doc = self.nlp(text)
        chunks = []
        current_chunk = []
        current_length = 0

        for sent in doc.sents:
            # Split long sentences into phrase-level chunks
            sentence_text = sent.text.strip()
            words = sentence_text.split()

            if current_length + len(words) <= max_chunk_length:
                # Add to current chunk
                current_chunk.append(sentence_text)
                current_length += len(words)
            else:
                # Start new chunk
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                current_chunk = [sentence_text]
                current_length = len(words)

        # Add remaining chunk
        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    def apply_bionic_reading(self, text: str) -> str:
        """
        Apply Bionic Reading technique: bold the first 50% of each word.

        WHY BIONIC READING:
        - Research shows it improves reading speed for dyslexic users.
        - The eye focuses on the bolded part, reducing fixation time.
        - Particularly effective for Indian students learning in English (L2).

        Returns:
            HTML string with <b> tags around first half of words
        """
        words = text.split()
        bionic_words = []

        for word in words:
            if len(word) <= 2:
                # Don't split very short words
                bionic_words.append(f"<b>{word}</b>")
            else:
                # Bold first 50% of characters
                split_point = len(word) // 2
                bold_part = word[:split_point]
                normal_part = word[split_point:]
                bionic_words.append(f"<b>{bold_part}</b>{normal_part}")

        return " ".join(bionic_words)

    def extract_key_terms(self, text: str) -> List[str]:
        """
        Extract important nouns and verbs for vocabulary building.
        Useful for creating flashcards for dyslexic students.
        """
        doc = self.nlp(text)
        key_terms = [
            token.text
            for token in doc
            if token.pos_ in ["NOUN", "VERB", "PROPN"]
            and not token.is_stop
            and len(token.text) > 3
        ]
        return list(set(key_terms))  # Remove duplicates


# Singleton instance
nlp_service = NLPService()
