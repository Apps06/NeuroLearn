/**
 * useKeyboardShortcuts Hook
 * Global keyboard shortcut handler for quick navigation and actions
 */
"use client";

import { useEffect, useCallback, useState } from "react";

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export const defaultShortcuts: Omit<ShortcutAction, "action">[] = [
  { key: "?", description: "Show keyboard shortcuts" },
  { key: " ", description: "Start/pause timer (Focus page)" },
  { key: "r", description: "Toggle reading ruler (Reader page)" },
  { key: "s", description: "Read aloud / TTS (Reader page)" },
  { key: "Escape", description: "Close modals" },
  { key: "1", alt: true, description: "Go to Reader" },
  { key: "2", alt: true, description: "Go to Focus" },
  { key: "3", alt: true, description: "Go to Dashboard" },
];

interface UseKeyboardShortcutsOptions {
  onShowHelp?: () => void;
  onToggleTimer?: () => void;
  onToggleRuler?: () => void;
  onReadAloud?: () => void;
  onCloseModal?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onShowHelp,
    onToggleTimer,
    onToggleRuler,
    onReadAloud,
    onCloseModal,
    enabled = true,
  } = options;

  const [showingHelp, setShowingHelp] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, UNLESS modifiers are used
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput && !e.altKey && !e.ctrlKey) {
        // Only allow Escape for inputs
        if (e.key === "Escape" && onCloseModal) {
          onCloseModal();
        }
        return;
      }

      // Handle shortcuts
      switch (e.key) {
        case "?":
          e.preventDefault();
          if (onShowHelp) {
            onShowHelp();
          } else {
            setShowingHelp((prev) => !prev);
          }
          break;

        case " ":
          e.preventDefault();
          onToggleTimer?.();
          break;

        case "r":
        case "R":
          if (e.altKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onToggleRuler?.();
          }
          break;

        case "s":
        case "S":
          if (e.altKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onReadAloud?.();
          }
          break;

        case "Escape":
          e.preventDefault();
          onCloseModal?.();
          setShowingHelp(false);
          break;

        case "1":
          if (e.altKey) {
            e.preventDefault();
            window.location.href = "/reader";
          }
          break;

        case "2":
          if (e.altKey) {
            e.preventDefault();
            window.location.href = "/focus";
          }
          break;

        case "3":
          if (e.altKey) {
            e.preventDefault();
            window.location.href = "/dashboard";
          }
          break;
      }
    },
    [onShowHelp, onToggleTimer, onToggleRuler, onReadAloud, onCloseModal]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    showingHelp,
    setShowingHelp,
  };
}
