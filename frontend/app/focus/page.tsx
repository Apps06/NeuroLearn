/**
 * ADHD Focus Suite Page - MODULE B
 * Task breakdown, Pomodoro timer, gamification, and distraction detection
 */
"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Target,
  Trophy,
  Timer,
  Lock,
  Settings,
  Flame,
  Zap,
} from "lucide-react";
import StreakTimer from "@/components/StreakTimer";
import PomodoroTimer from "@/components/PomodoroTimer";
import PomodoroSettings from "@/components/PomodoroSettings";
import BackgroundSounds from "@/components/BackgroundSounds";
import DistractionWarningModal from "@/components/DistractionWarningModal";
import GameNotification from "@/components/GameNotification";
import TaskCelebration from "@/components/TaskCelebration";
import { useGamification } from "@/hooks/useGamification";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { TaskBreakdownResponse, MicroTask } from "@/lib/types";

const DISTRACTION_PENALTY = 10; // Points lost per tab switch

export default function FocusPage() {
  const [vagueTask, setVagueTask] = useState("");
  const [gradeLevel, setGradeLevel] = useState(8);
  const [taskData, setTaskData] = useState<TaskBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timerMode, setTimerMode] = useState<"streak" | "pomodoro">("streak");
  const [showSettings, setShowSettings] = useState(false);
  
  // Distraction detection state
  const [showDistractionModal, setShowDistractionModal] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0);
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationXP, setCelebrationXP] = useState(0);
  const [isAllComplete, setIsAllComplete] = useState(false);

  const {
    totalXP,
    level,
    streakDays,
    streakMultiplier,
    todayDistractions,
    notification,
    completeTask,
    deductPoints,
    completePomodoro,
  } = useGamification();

  // Tab visibility detection for distraction tracking
  // Tab visibility detection for distraction tracking
  const lastHiddenTime = React.useRef(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the tab
        lastHiddenTime.current = Date.now();
      } else {
        // User returned - check if they were away long enough
        const now = Date.now();
        const awayDuration = now - lastHiddenTime.current;
        
        // Only penalize if we have a valid start time and were away > 5s
        if (lastHiddenTime.current > 0 && awayDuration > 5000) {
          // Deduct points and show warning
          deductPoints(DISTRACTION_PENALTY, "Tab switch detected!");
          setDistractionCount((prev) => prev + 1);
          setShowDistractionModal(true);
        }
        
        // Reset
        lastHiddenTime.current = 0;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [deductPoints]);

  // Toggle timer via keyboard shortcut
  const toggleTimer = useCallback(() => {
    // Timer toggle handled by PomodoroTimer component
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleTimer: toggleTimer,
  });

  /**
   * Request task breakdown from backend
   */
  const handleBreakdown = async () => {
    if (!vagueTask.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/focus/breakdown`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vague_task: vagueTask,
            user_grade: gradeLevel,
          }),
        }
      );

      const data = await response.json();
      setTaskData(data);
      setCompletedTasks(new Set());
      setCurrentTaskIndex(0);
    } catch (error) {
      console.error("Breakdown error:", error);
      alert("Failed to break down task. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle task completion - sequential progression
   */
  const handleCompleteTask = async (task: MicroTask, index: number) => {
    // Can only complete the current task
    if (index !== currentTaskIndex) return;
    
    // Already completed
    if (completedTasks.has(task.step_number)) return;

    const newCompleted = new Set(completedTasks);
    newCompleted.add(task.step_number);
    setCompletedTasks(newCompleted);

    // Award XP
    await completeTask(task.xp_reward);

    // Show celebration
    setCelebrationXP(task.xp_reward);
    
    // Check if all tasks completed
    if (taskData && newCompleted.size === taskData.micro_tasks.length) {
      setIsAllComplete(true);
      // Bonus XP for completing all without excessive distractions
      if (distractionCount < 3) {
        await completeTask(50); // Bonus!
        setCelebrationXP(task.xp_reward + 50);
      }
    } else {
      setIsAllComplete(false);
      // Move to next task
      setCurrentTaskIndex((prev) => prev + 1);
    }
    
    setShowCelebration(true);
  };

  // Handle Pomodoro session complete
  const handlePomodoroComplete = () => {
    completePomodoro(25);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Distraction Warning Modal */}
      <DistractionWarningModal
        isOpen={showDistractionModal}
        pointsLost={DISTRACTION_PENALTY}
        distractionCount={distractionCount}
        onAcknowledge={() => setShowDistractionModal(false)}
      />

      {/* Game Notification Toast */}
      {notification && (
        <GameNotification
          message={notification.message}
          type={notification.type}
          visible={notification.visible}
        />
      )}

      {/* Task Celebration */}
      <TaskCelebration
        show={showCelebration}
        xpAwarded={celebrationXP}
        isAllComplete={isAllComplete}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Pomodoro Settings Modal */}
      <PomodoroSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Timer Selection - Fixed Position (Moved to Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
        {/* Streak Timer (shown when streak mode) */}
        {timerMode === "streak" && <StreakTimer />}

        {/* Timer Mode Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex gap-1">
          <button
            onClick={() => setTimerMode("streak")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              timerMode === "streak"
                ? "bg-green-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Streak
          </button>
          <button
            onClick={() => setTimerMode("pomodoro")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition ${
              timerMode === "pomodoro"
                ? "bg-orange-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Timer size={14} className="inline mr-1" />
            Pomodoro
          </button>
          {timerMode === "pomodoro" && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Settings"
            >
              <Settings size={16} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Background Sounds */}
        <BackgroundSounds />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header with Enhanced Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="text-purple-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ADHD Focus Suite
            </h1>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-3">
            {/* Streak */}
            <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg font-medium">
              <Flame size={18} />
              {streakDays} day{streakDays !== 1 ? "s" : ""}
              {streakMultiplier > 1 && (
                <span className="text-xs bg-orange-500 text-white px-1 rounded ml-1">
                  {streakMultiplier}x
                </span>
              )}
            </div>

            {/* Level */}
            <div className="flex items-center gap-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg font-medium">
              <Zap size={18} />
              Lvl {level}
            </div>

            {/* XP Display */}
            <div className="flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-bold">
              <Trophy size={20} />
              {totalXP} XP
            </div>
          </div>
        </div>

        {/* Distractions Warning (if any) */}
        {todayDistractions > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-red-600 dark:text-red-400">
              ⚠️ {todayDistractions} distraction{todayDistractions !== 1 ? "s" : ""} today - stay focused!
            </span>
            <span className="text-sm text-red-500">
              Points lost: {todayDistractions * DISTRACTION_PENALTY}
            </span>
          </div>
        )}

        {/* Pomodoro Timer (shown when pomodoro mode) */}
        {timerMode === "pomodoro" && (
          <div className="mb-6">
            <PomodoroTimer onSessionComplete={handlePomodoroComplete} />
          </div>
        )}

        {/* Input Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What do you need to do? (Be as vague as you want!)
          </label>
          <textarea
            value={vagueTask}
            onChange={(e) => setVagueTask(e.target.value)}
            placeholder="Example: Finish my history project on the Mughal Empire"
            className="w-full h-24 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500"
          />

          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Grade:
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(parseInt(e.target.value))}
              className="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            onClick={handleBreakdown}
            disabled={loading || !vagueTask.trim()}
            className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Breaking it down...
              </>
            ) : (
              "Break Into Micro-Tasks"
            )}
          </button>
        </div>

        {/* Motivational Message */}
        {taskData && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4 mb-6 shadow-lg">
            <p className="text-lg font-semibold text-center">
              {taskData.motivational_message}
            </p>
            <p className="text-sm text-center mt-2 opacity-90">
              Total Time: ~{taskData.total_estimated_time} minutes
            </p>
          </div>
        )}

        {/* Micro-Tasks List with Sequential Progression */}
        {taskData && (
          <div className="space-y-4">
            {taskData.micro_tasks.map((task, index) => {
              const isCompleted = completedTasks.has(task.step_number);
              const isCurrent = index === currentTaskIndex;
              const isLocked = index > currentTaskIndex && !isCompleted;

              return (
                <div
                  key={task.step_number}
                  onClick={() => !isLocked && handleCompleteTask(task, index)}
                  className={`relative overflow-hidden group bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm transition-all duration-300 border-2 ${
                    isCompleted
                      ? "opacity-60 border-green-300 dark:border-green-700"
                      : isCurrent
                      ? "border-purple-400 dark:border-purple-600 shadow-lg shadow-purple-100 dark:shadow-purple-900/20 cursor-pointer hover:-translate-y-1"
                      : isLocked
                      ? "opacity-50 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                      : "border-transparent hover:border-purple-200 cursor-pointer"
                  }`}
                >
                  {/* Lock overlay for future tasks */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/50 flex items-center justify-center">
                      <Lock size={24} className="text-gray-400" />
                    </div>
                  )}

                  {/* Current task indicator */}
                  {isCurrent && !isCompleted && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                  )}

                  <div className="flex items-start gap-4">
                    {/* Completion Icon */}
                    {isCompleted ? (
                      <CheckCircle2
                        className="text-green-500 mt-1 flex-shrink-0"
                        size={24}
                      />
                    ) : isCurrent ? (
                      <div className="relative mt-1 flex-shrink-0">
                        <Circle className="text-purple-400" size={24} />
                        <div className="absolute inset-0 animate-ping">
                          <Circle className="text-purple-400 opacity-50" size={24} />
                        </div>
                      </div>
                    ) : (
                      <Circle
                        className="text-gray-300 mt-1 flex-shrink-0"
                        size={24}
                      />
                    )}

                    {/* Task Details */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className={`text-lg font-semibold ${
                            isCompleted
                              ? "line-through text-gray-500"
                              : isCurrent
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          Step {task.step_number}: {task.description}
                        </h3>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ~{task.estimated_minutes} min
                        </span>
                      </div>

                      {/* XP Reward Badge */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-sm px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          <Trophy size={12} />
                          {isCompleted ? "Earned" : "Earn"} {task.xp_reward} XP
                        </span>
                        
                        {isCurrent && !isCompleted && (
                          <span className="text-sm text-purple-500 animate-pulse">
                            👆 Click to complete!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Summary */}
        {taskData && taskData.micro_tasks.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Progress: {completedTasks.size} / {taskData.micro_tasks.length}{" "}
                tasks
              </span>
              <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${
                      (completedTasks.size / taskData.micro_tasks.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* All complete message */}
            {completedTasks.size === taskData.micro_tasks.length && (
              <div className="mt-4 text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-600 dark:text-green-400 font-semibold text-lg">
                  🎉 Amazing work! All tasks completed!
                </p>
                <button
                  onClick={() => {
                    setTaskData(null);
                    setVagueTask("");
                    setCompletedTasks(new Set());
                    setCurrentTaskIndex(0);
                    setDistractionCount(0);
                  }}
                  className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
                >
                  Start a new task →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Keyboard shortcut hint */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
            Space
          </kbd>{" "}
          to start/pause timer • Stay on this tab to keep your points!
        </p>
      </div>
    </div>
  );
}
