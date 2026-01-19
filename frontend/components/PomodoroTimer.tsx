/**
 * PomodoroTimer Component
 * 25-minute work / 5-minute break cycles with visual countdown
 * Integrates with distraction tracking to pause during breaks
 */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Zap } from "lucide-react";
import { useSettings } from "@/hooks/useUserSettings";

type TimerMode = "work" | "break";

interface PomodoroTimerProps {
  onBreakStart?: () => void;
  onBreakEnd?: () => void;
  onSessionComplete?: () => void;
}

export default function PomodoroTimer({
  onBreakStart,
  onBreakEnd,
  onSessionComplete,
}: PomodoroTimerProps) {
  const { settings } = useSettings();
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroWorkDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notifications
  useEffect(() => {
    // Create a simple beep using Web Audio API
    audioRef.current = new Audio();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update time when settings change (only when not running)
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(
        mode === "work"
          ? settings.pomodoroWorkDuration * 60
          : settings.pomodoroBreakDuration * 60
      );
    }
  }, [settings.pomodoroWorkDuration, settings.pomodoroBreakDuration, mode, isRunning]);

  // Play notification sound
  const playNotification = useCallback(() => {
    try {
      // Use Web Audio API for a simple beep
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = mode === "work" ? 800 : 600;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log("Audio notification not available");
    }
  }, [mode]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    playNotification();
    
    if (mode === "work") {
      // Work session complete - start break
      setCompletedSessions((prev) => prev + 1);
      setMode("break");
      setTimeLeft(settings.pomodoroBreakDuration * 60);
      onBreakStart?.();
      onSessionComplete?.();
    } else {
      // Break complete - back to work
      setMode("work");
      setTimeLeft(settings.pomodoroWorkDuration * 60);
      onBreakEnd?.();
    }
    
    setIsRunning(false);
  }, [mode, settings, onBreakStart, onBreakEnd, onSessionComplete, playNotification]);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, handleTimerComplete]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const totalTime =
    mode === "work"
      ? settings.pomodoroWorkDuration * 60
      : settings.pomodoroBreakDuration * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    setMode("work");
    setTimeLeft(settings.pomodoroWorkDuration * 60);
  };

  // Toggle play/pause
  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
      {/* Mode Indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {mode === "work" ? (
          <>
            <Zap className="text-orange-500" size={24} />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Focus Time
            </span>
          </>
        ) : (
          <>
            <Coffee className="text-green-500" size={24} />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Break Time
            </span>
          </>
        )}
      </div>

      {/* Circular Progress Timer */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={2 * Math.PI * 88}
            strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${
              mode === "work" ? "text-orange-500" : "text-green-500"
            }`}
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900 dark:text-white font-mono">
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {mode === "work" ? "until break" : "until focus"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleReset}
          className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          title="Reset"
        >
          <RotateCcw className="text-gray-600 dark:text-gray-300" size={24} />
        </button>
        
        <button
          onClick={toggleTimer}
          className={`p-4 rounded-full text-white transition transform hover:scale-105 ${
            mode === "work"
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
          title={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
        </button>
        
        <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
          <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
            {completedSessions}
          </span>
        </div>
      </div>

      {/* Session counter */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
        {completedSessions} pomodoro{completedSessions !== 1 ? "s" : ""} completed today
      </p>
    </div>
  );
}
