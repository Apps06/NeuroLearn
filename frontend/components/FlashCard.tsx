/**
 * FlashCard Component
 * Individual flashcard with flip animation
 */
"use client";

import React, { useState } from "react";
import { Volume2, RotateCcw } from "lucide-react";

interface FlashCardProps {
  front: string;
  back: string;
  onSpeak?: (text: string) => void;
}

export default function FlashCard({ front, back, onSpeak }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSpeak?.(isFlipped ? back : front);
  };

  return (
    <div
      className="relative w-full h-64 cursor-pointer perspective-1000"
      onClick={handleFlip}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front of card */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-xl font-medium text-white text-center leading-relaxed">
            {front}
          </p>
          <button
            onClick={handleSpeak}
            className="absolute bottom-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
            title="Read aloud"
          >
            <Volume2 className="text-white" size={20} />
          </button>
          <div className="absolute bottom-4 left-4 text-white/60 text-sm flex items-center gap-1">
            <RotateCcw size={14} />
            Tap to flip
          </div>
        </div>

        {/* Back of card */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <p className="text-xl font-medium text-white text-center leading-relaxed">
            {back}
          </p>
          <button
            onClick={handleSpeak}
            className="absolute bottom-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
            title="Read aloud"
          >
            <Volume2 className="text-white" size={20} />
          </button>
          <div className="absolute bottom-4 left-4 text-white/60 text-sm flex items-center gap-1">
            <RotateCcw size={14} />
            Tap to flip
          </div>
        </div>
      </div>
    </div>
  );
}
