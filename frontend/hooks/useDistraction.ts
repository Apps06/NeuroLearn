/**
 * useDistraction Hook - ADHD Anti-Distraction System
 * Detects when user switches tabs/windows and pauses timers
 *
 * WHY THIS MATTERS:
 * - ADHD students often tab-switch unconsciously
 * - This creates awareness of distraction patterns
 * - "Fragile Streak" psychology: fear of losing progress motivates focus
 */
import { useState, useEffect, useRef } from "react";

interface DistractionMetrics {
  isDistracted: boolean;
  distractionCount: number;
  totalFocusTime: number; // in seconds
  currentSessionTime: number;
  streakBroken: boolean;
}

export function useDistraction() {
  const [metrics, setMetrics] = useState<DistractionMetrics>({
    isDistracted: false,
    distractionCount: 0,
    totalFocusTime: 0,
    currentSessionTime: 0,
    streakBroken: false,
  });

  // Load from localStorage on mount (client-only) to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("neurolearn_distraction_metrics");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMetrics(prev => ({
            ...prev,
            ...parsed,
            isDistracted: false, // Reset distraction state on reload
            streakBroken: false,
          }));
        } catch (e) {
          console.error("Failed to parse saved metrics", e);
        }
      }
    }
  }, []);

  // Persist metrics to localStorage
  useEffect(() => {
    localStorage.setItem("neurolearn_distraction_metrics", JSON.stringify(metrics));
  }, [metrics]);

  const sessionStartTime = useRef<number>(Date.now());
  const lastFocusTime = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseStartTime = useRef<number | null>(null);
  const totalPausedTime = useRef<number>(0);

  useEffect(() => {
    /**
     * Visibility Change Listener
     */
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away (distracted)
        const now = Date.now();
        lastFocusTime.current = now;
        pauseStartTime.current = now;
        
        // Calculate focus duration before distraction
        // (Not strictly needed for session timer but good for analytics)
        
        setMetrics((prev) => ({
          ...prev,
          isDistracted: true,
          distractionCount: prev.distractionCount + 1,
          streakBroken: true,
        }));

        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // User returned
        const now = Date.now();
        if (pauseStartTime.current) {
          const pausedDuration = now - pauseStartTime.current;
          totalPausedTime.current += pausedDuration;
          pauseStartTime.current = null;
        }

        setMetrics((prev) => ({
          ...prev,
          isDistracted: false,
        }));

        // Resume the timer
        startSessionTimer();
      }
    };

    /**
     * Session Timer
     * Tracks continuous focus time (excluding paused/distracted time)
     */
    const startSessionTimer = () => {
      if (timerRef.current) return;

      timerRef.current = setInterval(() => {
        const now = Date.now();
        // Elapsed = (Now - Start) - Paused
        const elapsed = Math.floor(
          (now - sessionStartTime.current - totalPausedTime.current) / 1000
        );
        
        setMetrics((prev) => ({
          ...prev,
          currentSessionTime: elapsed,
          totalFocusTime: prev.totalFocusTime + 1, // Add 1s to total accumulator
        }));
      }, 1000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startSessionTimer();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * Reset streak warning (user acknowledges distraction)
   */
  const acknowledgeDistraction = () => {
    setMetrics((prev) => ({
      ...prev,
      streakBroken: false,
    }));
  };

  /**
   * Format time for display (MM:SS)
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return {
    ...metrics,
    acknowledgeDistraction,
    formatTime,
    focusTimeFormatted: formatTime(metrics.currentSessionTime),
  };
}
