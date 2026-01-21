"use client";

import React, { useMemo } from "react";

interface BionicKaraokeTextProps {
  text: string;
  charIndex: number | null;
  isActive: boolean;
  className?: string;
}

export default function BionicKaraokeText({
  text,
  charIndex,
  isActive,
  className = "",
}: BionicKaraokeTextProps) {
  // Split text into words and track their character boundaries
  const wordsWithBoundaries = useMemo(() => {
    const words = text.split(/(\s+)/); // Keep whitespace
    let currentPos = 0;
    
    return words.map((word) => {
      const start = currentPos;
      const end = currentPos + word.length;
      currentPos = end;
      
      const isWord = /\S/.test(word);
      return { word, start, end, isWord };
    });
  }, [text]);

  return (
    <div
      className={`bionic-text text-lg leading-relaxed ${className}`}
      style={{
        fontFamily: "OpenDyslexic, Arial, sans-serif",
        letterSpacing: "0.05em",
        wordSpacing: "0.15em",
      }}
    >
      {wordsWithBoundaries.map((item, idx) => {
        if (!item.isWord) {
          return <span key={idx}>{item.word}</span>;
        }

        const isHighlighted =
          isActive &&
          charIndex !== null &&
          charIndex >= item.start &&
          charIndex < item.end;

        // Apply Bionic Bold logic
        const word = item.word;
        let boldPart = "";
        let normalPart = "";

        if (word.length <= 2) {
          boldPart = word;
        } else {
          const splitPoint = Math.ceil(word.length / 2);
          boldPart = word.slice(0, splitPoint);
          normalPart = word.slice(splitPoint);
        }

        return (
          <span
            key={idx}
            className={`transition-all duration-150 inline-block px-1 rounded mx-0.5 ${
              isHighlighted
                ? "bg-yellow-400 dark:bg-yellow-500 text-black font-bold scale-110 shadow-lg z-10 relative ring-2 ring-blue-400"
                : ""
            }`}
          >
            <b className="font-bold">{boldPart}</b>
            {normalPart}
          </span>
        );
      })}
    </div>
  );
}
