/**
 * TaskCelebration - Celebration Animation Component
 * Shows confetti/celebration when completing tasks
 */
"use client";

import React, { useEffect, useState } from "react";
import { Star, Trophy, PartyPopper } from "lucide-react";

interface TaskCelebrationProps {
  show: boolean;
  xpAwarded: number;
  isAllComplete?: boolean;
  onComplete: () => void;
}

export default function TaskCelebration({
  show,
  xpAwarded,
  isAllComplete,
  onComplete,
}: TaskCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96E6A1", "#DDA0DD"][
          Math.floor(Math.random() * 6)
        ],
      }));
      setConfetti(particles);

      // Auto-dismiss after animation
      const timer = setTimeout(() => {
        onComplete();
        setConfetti([]);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Confetti */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti"
          style={{
            left: `${particle.x}%`,
            animationDelay: `${particle.delay}s`,
            top: "-10px",
          }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: particle.color }}
          />
        </div>
      ))}

      {/* Celebration Message */}
      <div className="animate-bounce-slow bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 p-1 rounded-2xl shadow-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
          {isAllComplete ? (
            <>
              <PartyPopper size={48} className="text-yellow-500 mx-auto mb-3 animate-pulse" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🎉 All Tasks Complete! 🎉
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Amazing work! You earned
              </p>
            </>
          ) : (
            <>
              <Trophy size={48} className="text-yellow-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Task Complete! ✨
              </h3>
            </>
          )}
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <Star size={24} className="text-yellow-400 animate-spin-slow" />
            <span className="text-3xl font-bold text-yellow-500">+{xpAwarded} XP</span>
            <Star size={24} className="text-yellow-400 animate-spin-slow" />
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 2.5s ease-out forwards;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 0.5s ease-in-out;
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
