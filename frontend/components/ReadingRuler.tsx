/**
 * ReadingRuler Component
 * Translucent horizontal line that follows the cursor to help track reading position
 * Especially helpful for users with dyslexia
 */
"use client";

import React, { useState, useEffect, useCallback } from "react";

interface ReadingRulerProps {
  enabled: boolean;
  height?: number; // Height of the ruler in pixels
  color?: string; // Color of the ruler overlay
}

export default function ReadingRuler({
  enabled,
  height = 40,
  color = "rgba(255, 255, 0, 0.25)",
}: ReadingRulerProps) {
  const [mouseY, setMouseY] = useState<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMouseY(e.clientY);
  }, []);

  useEffect(() => {
    if (enabled) {
      document.addEventListener("mousemove", handleMouseMove);
    }
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [enabled, handleMouseMove]);

  if (!enabled || mouseY === null) {
    return null;
  }

  return (
    <>
      {/* Top overlay - dims content above cursor */}
      <div
        className="fixed left-0 right-0 pointer-events-none z-40 transition-all duration-75"
        style={{
          top: 0,
          height: Math.max(0, mouseY - height / 2),
          backgroundColor: "rgba(0, 0, 0, 0.08)",
        }}
      />
      
      {/* Ruler line - highlights current reading line */}
      <div
        className="fixed left-0 right-0 pointer-events-none z-40 transition-all duration-75"
        style={{
          top: mouseY - height / 2,
          height: height,
          backgroundColor: color,
          boxShadow: "0 0 10px rgba(255, 255, 0, 0.3)",
          borderTop: "2px solid rgba(255, 200, 0, 0.5)",
          borderBottom: "2px solid rgba(255, 200, 0, 0.5)",
        }}
      />
      
      {/* Bottom overlay - dims content below cursor */}
      <div
        className="fixed left-0 right-0 bottom-0 pointer-events-none z-40 transition-all duration-75"
        style={{
          top: mouseY + height / 2,
          backgroundColor: "rgba(0, 0, 0, 0.08)",
        }}
      />
    </>
  );
}
