/**
 * ShortcutsModal Component
 * Displays available keyboard shortcuts to the user
 */
"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";
import { defaultShortcuts } from "@/hooks/useKeyboardShortcuts";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const formatKey = (shortcut: (typeof defaultShortcuts)[0]) => {
    const parts = [];
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.shift) parts.push("Shift");
    
    let key = shortcut.key;
    if (key === " ") key = "Space";
    if (key === "Escape") key = "Esc";
    parts.push(key);
    
    return parts.join(" + ");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Keyboard className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="text-gray-500" size={20} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <table className="w-full">
            <tbody>
              {defaultShortcuts.map((shortcut, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <td className="py-3 pr-4">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                      {formatKey(shortcut)}
                    </kbd>
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-300">
                    {shortcut.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-center text-sm text-gray-500 dark:text-gray-400">
          Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd> anytime to show this help
        </div>
      </div>
    </div>
  );
}
