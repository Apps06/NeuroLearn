/**
 * Dashboard Page - Progress Visualization
 * Shows study statistics, achievements, and daily goals
 */
"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Flame,
  Target,
  Clock,
  CheckCircle2,
  Star,
  Zap,
  BookOpen,
  Award,
  TrendingUp,
} from "lucide-react";
import { useFirebase } from "@/hooks/useFirebase";
import DailyGoals from "@/components/DailyGoals";

// Achievement definitions
const achievements = [
  {
    id: "first_step",
    name: "First Step",
    description: "Complete your first task",
    icon: <Star className="text-yellow-500" size={24} />,
    requirement: 1,
    type: "tasks",
  },
  {
    id: "focused_five",
    name: "Focused Five",
    description: "Complete 5 tasks in one day",
    icon: <Target className="text-blue-500" size={24} />,
    requirement: 5,
    type: "tasks",
  },
  {
    id: "task_master",
    name: "Task Master",
    description: "Complete 50 total tasks",
    icon: <CheckCircle2 className="text-green-500" size={24} />,
    requirement: 50,
    type: "totalTasks",
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: <Flame className="text-orange-500" size={24} />,
    requirement: 7,
    type: "streak",
  },
  {
    id: "month_champion",
    name: "Month Champion",
    description: "Maintain a 30-day streak",
    icon: <Trophy className="text-purple-500" size={24} />,
    requirement: 30,
    type: "streak",
  },
  {
    id: "xp_hunter",
    name: "XP Hunter",
    description: "Earn 500 XP",
    icon: <Zap className="text-yellow-500" size={24} />,
    requirement: 500,
    type: "xp",
  },
  {
    id: "xp_master",
    name: "XP Master",
    description: "Earn 2000 XP",
    icon: <Award className="text-blue-500" size={24} />,
    requirement: 2000,
    type: "xp",
  },
  {
    id: "bookworm",
    name: "Bookworm",
    description: "Use the Reader 10 times",
    icon: <BookOpen className="text-cyan-500" size={24} />,
    requirement: 10,
    type: "readerUses",
  },
];

// Mock data for weekly stats (would come from Firebase in production)
const weeklyData = [
  { day: "Mon", minutes: 45, tasks: 3 },
  { day: "Tue", minutes: 60, tasks: 5 },
  { day: "Wed", minutes: 30, tasks: 2 },
  { day: "Thu", minutes: 75, tasks: 6 },
  { day: "Fri", minutes: 50, tasks: 4 },
  { day: "Sat", minutes: 20, tasks: 1 },
  { day: "Sun", minutes: 40, tasks: 3 },
];

export default function DashboardPage() {
  const { userProgress, loading } = useFirebase();
  const [todayStats, setTodayStats] = useState({ minutes: 0, tasks: 0 });

  // Calculate today's stats from session storage or similar
  useEffect(() => {
    const storedStats = sessionStorage.getItem("neurolearn_today_stats");
    if (storedStats) {
      setTodayStats(JSON.parse(storedStats));
    }
  }, []);

  // Calculate XP level
  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 100) + 1;
  };

  const calculateXPProgress = (xp: number) => {
    return (xp % 100);
  };

  // Check if achievement is earned
  const isAchievementEarned = (achievement: typeof achievements[0]) => {
    if (!userProgress) return false;
    switch (achievement.type) {
      case "tasks":
        return todayStats.tasks >= achievement.requirement;
      case "totalTasks":
        return userProgress.completedTasks >= achievement.requirement;
      case "streak":
        return userProgress.streakDays >= achievement.requirement;
      case "xp":
        return userProgress.totalXP >= achievement.requirement;
      default:
        return false;
    }
  };

  const maxMinutes = Math.max(...weeklyData.map((d) => d.minutes));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="text-indigo-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Progress Dashboard
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* XP Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-yellow-500" size={24} />
              <span className="text-gray-600 dark:text-gray-400">Total XP</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {userProgress?.totalXP || 0}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Level {calculateLevel(userProgress?.totalXP || 0)}</span>
                <span>{calculateXPProgress(userProgress?.totalXP || 0)}/100 XP</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                  style={{ width: `${calculateXPProgress(userProgress?.totalXP || 0)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tasks Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="text-green-500" size={24} />
              <span className="text-gray-600 dark:text-gray-400">Tasks Done</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {userProgress?.completedTasks || 0}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {todayStats.tasks} today
            </div>
          </div>

          {/* Streak Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="text-orange-500" size={24} />
              <span className="text-gray-600 dark:text-gray-400">Streak</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {userProgress?.streakDays || 0} days
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Keep it going! 🔥
            </div>
          </div>

          {/* Study Time Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-blue-500" size={24} />
              <span className="text-gray-600 dark:text-gray-400">Today</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {todayStats.minutes} min
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Study time logged
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Weekly Activity Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Weekly Activity
            </h2>
            <div className="flex items-end justify-between h-40 gap-2">
              {weeklyData.map((day) => (
                <div key={day.day} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all duration-500"
                    style={{ height: `${(day.minutes / maxMinutes) * 100}%`, minHeight: 8 }}
                  />
                  <span className="text-xs text-gray-500 mt-2">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              Total: {weeklyData.reduce((sum, d) => sum + d.minutes, 0)} minutes this week
            </div>
          </div>

          {/* Daily Goals */}
          <DailyGoals
            currentStudyMinutes={todayStats.minutes}
            currentTasksCompleted={todayStats.tasks}
            streakDays={userProgress?.streakDays || 0}
          />
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="text-yellow-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Achievements
            </h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            {achievements.map((achievement) => {
              const earned = isAchievementEarned(achievement);
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition ${
                    earned
                      ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                      : "border-gray-200 dark:border-gray-700 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {achievement.icon}
                    <span className={`font-semibold ${earned ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
                      {achievement.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {achievement.description}
                  </p>
                  {earned && (
                    <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                      ✓ Unlocked!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
