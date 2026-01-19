/**
 * BionicText Component
 * Renders text with Bionic Reading formatting for dyslexic users
 */
"use client";

import React from "react";

interface BionicTextProps {
  html: string;
  className?: string;
}

export default function BionicText({ html, className = "" }: BionicTextProps) {
  return (
    <div
      className={`bionic-text text-lg leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        fontFamily: "OpenDyslexic, Arial, sans-serif", // Dyslexia-friendly font
        letterSpacing: "0.05em", // Slight spacing aids reading
        wordSpacing: "0.15em",
      }}
    />
  );
}
