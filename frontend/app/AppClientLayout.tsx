/**
 * ClientLayout - Client-side wrapper for global components
 * Handles color overlay, keyboard shortcuts, and shortcuts modal
 */
"use client";

import React from "react";
import ColorOverlay from "@/components/ColorOverlay";
import ShortcutsModal from "@/components/ShortcutsModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { showingHelp, setShowingHelp } = useKeyboardShortcuts({
    onShowHelp: () => setShowingHelp(true),
    onCloseModal: () => setShowingHelp(false),
  });

  return (
    <>
      {/* Color Overlay for dyslexia support */}
      <ColorOverlay />
      
      {/* Main Content */}
      <main>{children}</main>
      
      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal isOpen={showingHelp} onClose={() => setShowingHelp(false)} />
    </>
  );
}
