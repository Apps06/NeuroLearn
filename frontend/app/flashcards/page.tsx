/**
 * Flashcards Page - AI-Generated Flashcards with Spaced Repetition
 */
"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
} from "lucide-react";
import FlashCard from "@/components/FlashCard";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  difficulty: number; // 1-5 (easiness factor for SM-2)
  nextReview: Date;
  repetitions: number;
}

export default function FlashcardsPage() {
  const [inputText, setInputText] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Generate flashcards from text using AI
  const generateFlashcards = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/flashcards/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputText }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const cards: Flashcard[] = data.flashcards.map(
          (fc: { front: string; back: string }, idx: number) => ({
            id: idx + 1,
            front: fc.front,
            back: fc.back,
            difficulty: 2.5,
            nextReview: new Date(),
            repetitions: 0,
          })
        );
        setFlashcards(cards);
        setCurrentIndex(0);
      } else {
        // Fallback: Generate simple flashcards locally
        generateLocalFlashcards();
      }
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
      generateLocalFlashcards();
    } finally {
      setLoading(false);
    }
  };

  // Local fallback flashcard generation
  const generateLocalFlashcards = () => {
    const sentences = inputText
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 20);
    
    const cards: Flashcard[] = sentences.slice(0, 10).map((sentence, idx) => {
      const words = sentence.trim().split(" ");
      const keyWord = words.find((w) => w.length > 5) || words[0];
      return {
        id: idx + 1,
        front: `What does this mean: "${sentence.trim()}"?`,
        back: `Key concept: ${keyWord}`,
        difficulty: 2.5,
        nextReview: new Date(),
        repetitions: 0,
      };
    });

    if (cards.length === 0) {
      cards.push({
        id: 1,
        front: "No content provided",
        back: "Please enter text to generate flashcards",
        difficulty: 2.5,
        nextReview: new Date(),
        repetitions: 0,
      });
    }

    setFlashcards(cards);
    setCurrentIndex(0);
  };

  // SM-2 Spaced Repetition Algorithm
  const handleResponse = (quality: number) => {
    // quality: 0-5 (0=complete blackout, 5=perfect)
    setFlashcards((prev) => {
      const updated = [...prev];
      const card = { ...updated[currentIndex] };

      if (quality >= 3) {
        // Correct response
        if (card.repetitions === 0) {
          card.nextReview = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day
        } else if (card.repetitions === 1) {
          card.nextReview = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000); // 6 days
        } else {
          const interval = card.difficulty * card.repetitions;
          card.nextReview = new Date(
            Date.now() + interval * 24 * 60 * 60 * 1000
          );
        }
        card.repetitions += 1;
      } else {
        // Incorrect response - reset
        card.repetitions = 0;
        card.nextReview = new Date();
      }

      // Adjust difficulty
      card.difficulty = Math.max(
        1.3,
        card.difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      );

      updated[currentIndex] = card;
      return updated;
    });

    // Move to next card
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Text-to-Speech
  const handleSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-cyan-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Flashcards
          </h1>
        </div>

        {/* Input Section */}
        {flashcards.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-yellow-500" size={20} />
              <p className="text-gray-600 dark:text-gray-400">
                Paste your study material and AI will generate flashcards with spaced repetition!
              </p>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your notes, textbook content, or any learning material here..."
              className="w-full h-40 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-cyan-500"
            />

            <button
              onClick={generateFlashcards}
              disabled={loading || !inputText.trim()}
              className="mt-4 w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating Flashcards...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Flashcards
                </>
              )}
            </button>
          </div>
        )}

        {/* Flashcard Display */}
        {flashcards.length > 0 && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Card {currentIndex + 1} of {flashcards.length}
              </span>
              <button
                onClick={() => {
                  setFlashcards([]);
                  setInputText("");
                }}
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                New Set
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
                }}
              />
            </div>

            {/* Card */}
            <FlashCard
              front={flashcards[currentIndex].front}
              back={flashcards[currentIndex].back}
              onSpeak={handleSpeak}
            />

            {/* Navigation & Rating */}
            <div className="flex items-center justify-between">
              {/* Navigation */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() =>
                    setCurrentIndex(
                      Math.min(flashcards.length - 1, currentIndex + 1)
                    )
                  }
                  disabled={currentIndex === flashcards.length - 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Rating Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleResponse(1)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                >
                  <ThumbsDown size={18} />
                  Hard
                </button>
                <button
                  onClick={() => handleResponse(3)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
                >
                  <Lightbulb size={18} />
                  Okay
                </button>
                <button
                  onClick={() => handleResponse(5)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                >
                  <ThumbsUp size={18} />
                  Easy
                </button>
              </div>
            </div>

            {/* Spaced Repetition Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 Rate how well you knew the answer. Cards you find hard will appear more often!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
