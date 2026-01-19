/**
 * StreakTimer Component
 * Displays focus timer and distraction warnings for ADHD users
 */
"use client";

import React from "react";
import { useDistraction } from "@/hooks/useDistraction";
import { AlertCircle, Timer, Zap } from "lucide-react";

export default function StreakTimer() {
  const {
    isDistracted,
    distractionCount,
    currentSessionTime,
    streakBroken,
    acknowledgeDistraction,
    focusTimeFormatted,
  } = useDistraction();

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Focus Timer Display */}
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors ${
          isDistracted ? "bg-red-500 text-white" : "bg-green-500 text-white"
        }`}
      >
        <Timer size={20} />
        <span className="font-mono text-lg font-bold">
          {focusTimeFormatted}
        </span>
        <Zap size={16} />
      </div>

      {/* Distraction Count Badge */}
      {distractionCount > 0 && (
        <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Distractions: {distractionCount}
        </div>
      )}

      {/* Streak Broken Warning Modal */}
      {streakBroken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500" size={32} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Streak Paused!
              </h3>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You switched away from your task. Remember:{" "}
              <strong>focus builds momentum!</strong>
            </p>

            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 <strong>ADHD Tip:</strong> Close unnecessary tabs before
                starting. One task at a time works best!
              </p>
            </div>

            <button
              onClick={acknowledgeDistraction}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition"
            >
              Got it - Resume Focus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
