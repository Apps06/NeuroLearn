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

  const sessionStartTime = useRef<number>(Date.now());
  const lastFocusTime = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    /**
     * Visibility Change Listener
     * Uses Page Visibility API to detect tab switches
     */
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away (distracted)
        const focusDuration = Math.floor(
          (Date.now() - lastFocusTime.current) / 1000
        );

        setMetrics((prev) => ({
          ...prev,
          isDistracted: true,
          distractionCount: prev.distractionCount + 1,
          totalFocusTime: prev.totalFocusTime + focusDuration,
          streakBroken: true, // Trigger warning modal
        }));

        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // User returned (refocused)
        lastFocusTime.current = Date.now();

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
     * Tracks continuous focus time in current session
     */
    const startSessionTimer = () => {
      if (timerRef.current) return; // Prevent duplicate timers

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - sessionStartTime.current) / 1000
        );
        setMetrics((prev) => ({
          ...prev,
          currentSessionTime: elapsed,
        }));
      }, 1000);
    };

    // Attach visibility listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Start initial timer
    startSessionTimer();

    // Cleanup on unmount
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
