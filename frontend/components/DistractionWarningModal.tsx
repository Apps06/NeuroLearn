/**
 * DistractionWarningModal - Tab-Switch Warning
 * Shows when user returns after leaving the focus tab
 * Displays points lost and motivational message
 */
"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Flame, X } from "lucide-react";

interface DistractionWarningModalProps {
  isOpen: boolean;
  pointsLost: number;
  distractionCount: number;
  onAcknowledge: () => void;
}

const motivationalMessages = [
  "Every champion was once a contender who refused to give up!",
  "Focus is a muscle. The more you use it, the stronger it gets!",
  "You've got this! One task at a time.",
  "Distractions are speed bumps, not roadblocks!",
  "Your future self will thank you for staying focused!",
  "Small steps lead to big achievements!",
  "The only way to finish is to keep going!",
];

export default function DistractionWarningModal({
  isOpen,
  pointsLost,
  distractionCount,
  onAcknowledge,
}: DistractionWarningModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [message] = useState(
    () => motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Play warning sound
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 400;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (e) {
        // Audio not available
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`relative bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-red-200 dark:border-red-800 transform transition-all duration-300 ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onAcknowledge}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Warning Icon with Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-25" />
            <div className="relative bg-gradient-to-br from-red-500 to-orange-500 p-4 rounded-full">
              <AlertTriangle size={40} className="text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Focus Lost! 😢
        </h2>

        {/* Points Lost Display */}
        <div className="bg-red-100 dark:bg-red-900/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
            <Flame size={24} className="animate-pulse" />
            <span className="text-3xl font-bold">-{pointsLost}</span>
            <span className="text-lg">points</span>
          </div>
          <p className="text-center text-sm text-red-500 dark:text-red-400 mt-1">
            You switched tabs {distractionCount} time{distractionCount !== 1 ? "s" : ""} today
          </p>
        </div>

        {/* Motivational Message */}
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6 italic">
          &ldquo;{message}&rdquo;
        </p>

        {/* Get Back Button */}
        <button
          onClick={onAcknowledge}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Get Back to Focus!
          <ArrowRight size={20} />
        </button>

        {/* Streak Warning */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          💡 Stay focused to protect your streak and earn bonus points!
        </p>
      </div>
    </div>
  );
}
