/**
 * ADHD Focus Suite Page - MODULE B
 * Task breakdown, Pomodoro timer, streak tracking, and gamification
 */
"use client";

import React, { useState, useCallback } from "react";
import { CheckCircle2, Circle, Loader2, Target, Trophy, Timer } from "lucide-react";
import StreakTimer from "@/components/StreakTimer";
import PomodoroTimer from "@/components/PomodoroTimer";
import BackgroundSounds from "@/components/BackgroundSounds";
import { useFirebase } from "@/hooks/useFirebase";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { TaskBreakdownResponse, MicroTask } from "@/lib/types";

export default function FocusPage() {
  const [vagueTask, setVagueTask] = useState("");
  const [gradeLevel, setGradeLevel] = useState(8);
  const [taskData, setTaskData] = useState<TaskBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [timerMode, setTimerMode] = useState<"streak" | "pomodoro">("streak");
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  const { userProgress, awardXP } = useFirebase();

  // Toggle timer via keyboard shortcut
  const toggleTimer = useCallback(() => {
    setPomodoroRunning((prev) => !prev);
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
    } catch (error) {
      console.error("Breakdown error:", error);
      alert("Failed to break down task. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark task as complete and award XP
   */
  const handleToggleTask = async (task: MicroTask) => {
    const newCompleted = new Set(completedTasks);

    if (completedTasks.has(task.step_number)) {
      newCompleted.delete(task.step_number);
    } else {
      newCompleted.add(task.step_number);
      await awardXP(task.xp_reward);
      
      // Update session stats for dashboard
      const storedStats = sessionStorage.getItem("neurolearn_today_stats");
      const stats = storedStats ? JSON.parse(storedStats) : { minutes: 0, tasks: 0 };
      stats.tasks += 1;
      sessionStorage.setItem("neurolearn_today_stats", JSON.stringify(stats));
    }

    setCompletedTasks(newCompleted);
  };

  // Handle Pomodoro session complete
  const handlePomodoroComplete = () => {
    const storedStats = sessionStorage.getItem("neurolearn_today_stats");
    const stats = storedStats ? JSON.parse(storedStats) : { minutes: 0, tasks: 0 };
    stats.minutes += 25; // Add 25 minutes for completed pomodoro
    sessionStorage.setItem("neurolearn_today_stats", JSON.stringify(stats));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Timer Selection - Fixed Position */}
      <div className="fixed top-20 right-4 z-40 flex flex-col gap-3">
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
        </div>

        {/* Background Sounds */}
        <BackgroundSounds />
      </div>

      {/* Streak Timer (shown when streak mode) */}
      {timerMode === "streak" && <StreakTimer />}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="text-purple-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ADHD Focus Suite
            </h1>
          </div>

          {/* XP Display */}
          {userProgress && (
            <div className="flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-bold">
              <Trophy size={20} />
              {userProgress.totalXP} XP
            </div>
          )}
        </div>

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
            className="mt-4 w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
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

        {/* Micro-Tasks List */}
        {taskData && (
          <div className="space-y-4">
            {taskData.micro_tasks.map((task) => {
              const isCompleted = completedTasks.has(task.step_number);

              return (
                <div
                  key={task.step_number}
                  onClick={() => handleToggleTask(task)}
                  className={`bg-white dark:bg-gray-800 rounded-lg p-5 shadow-lg cursor-pointer transition transform hover:scale-[1.02] ${
                    isCompleted ? "opacity-60 border-2 border-green-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Completion Icon */}
                    {isCompleted ? (
                      <CheckCircle2
                        className="text-green-500 mt-1 flex-shrink-0"
                        size={24}
                      />
                    ) : (
                      <Circle
                        className="text-gray-400 mt-1 flex-shrink-0"
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
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          Step {task.step_number}: {task.description}
                        </h3>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ~{task.estimated_minutes} min
                        </span>
                      </div>

                      {isCompleted && (
                        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                          <Trophy size={16} />+{task.xp_reward} XP earned!
                        </div>
                      )}
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
          </div>
        )}

        {/* Keyboard shortcut hint */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Space</kbd> to start/pause timer
        </p>
      </div>
    </div>
  );
}

