/**
 * ColorOverlay Component
 * Full-screen tinted overlay for reducing eye strain
 * Scientifically chosen colors to help dyslexic readers
 */
"use client";

import React from "react";
import { useSettings, getOverlayStyle } from "@/hooks/useUserSettings";

export default function ColorOverlay() {
  const { settings } = useSettings();
  
  if (settings.colorOverlay === "none") {
    return null;
  }

  const overlayStyle = getOverlayStyle(settings.colorOverlay, settings.overlayOpacity);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30"
      style={{
        backgroundColor: overlayStyle,
        mixBlendMode: "multiply",
      }}
      aria-hidden="true"
    />
  );
}
