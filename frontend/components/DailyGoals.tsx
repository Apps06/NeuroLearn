/**
 * DailyGoals Component
 * Set and track daily study targets with visual progress
 */
"use client";

import React, { useState } from "react";
import { Target, Trophy, Flame, Edit2, Check } from "lucide-react";
import { useSettings } from "@/hooks/useUserSettings";

interface DailyGoalsProps {
  currentStudyMinutes: number;
  currentTasksCompleted: number;
  streakDays: number;
}

export default function DailyGoals({
  currentStudyMinutes,
  currentTasksCompleted,
  streakDays,
}: DailyGoalsProps) {
  const { settings, updateSettings } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [tempStudyGoal, setTempStudyGoal] = useState(settings.dailyStudyGoal);
  const [tempTaskGoal, setTempTaskGoal] = useState(settings.dailyTaskGoal);

  const studyProgress = Math.min(100, (currentStudyMinutes / settings.dailyStudyGoal) * 100);
  const taskProgress = Math.min(100, (currentTasksCompleted / settings.dailyTaskGoal) * 100);
  
  const studyGoalMet = currentStudyMinutes >= settings.dailyStudyGoal;
  const taskGoalMet = currentTasksCompleted >= settings.dailyTaskGoal;

  const handleSave = () => {
    updateSettings({
      dailyStudyGoal: tempStudyGoal,
      dailyTaskGoal: tempTaskGoal,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Daily Goals
          </h2>
        </div>
        
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {isEditing ? (
            <Check className="text-green-500" size={20} />
          ) : (
            <Edit2 className="text-gray-500" size={20} />
          )}
        </button>
      </div>

      {/* Streak Display */}
      <div className="flex items-center gap-3 mb-6 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
        <Flame className="text-orange-500" size={28} />
        <div>
          <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {streakDays}
          </span>
          <span className="text-gray-600 dark:text-gray-400 ml-2">
            day streak
          </span>
        </div>
      </div>

      {/* Study Time Goal */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            Study Time
          </span>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={tempStudyGoal}
                onChange={(e) => setTempStudyGoal(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-right"
                min="10"
                max="480"
              />
              <span className="text-gray-500 text-sm">min</span>
            </div>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">
              {currentStudyMinutes} / {settings.dailyStudyGoal} min
            </span>
          )}
        </div>
        
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              studyGoalMet
                ? "bg-gradient-to-r from-green-400 to-green-500"
                : "bg-gradient-to-r from-blue-400 to-blue-500"
            }`}
            style={{ width: `${studyProgress}%` }}
          />
        </div>
        
        {studyGoalMet && (
          <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400 text-sm">
            <Trophy size={16} />
            Goal achieved!
          </div>
        )}
      </div>

      {/* Tasks Goal */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            Tasks Completed
          </span>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={tempTaskGoal}
                onChange={(e) => setTempTaskGoal(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-right"
                min="1"
                max="50"
              />
              <span className="text-gray-500 text-sm">tasks</span>
            </div>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">
              {currentTasksCompleted} / {settings.dailyTaskGoal}
            </span>
          )}
        </div>
        
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              taskGoalMet
                ? "bg-gradient-to-r from-green-400 to-green-500"
                : "bg-gradient-to-r from-purple-400 to-purple-500"
            }`}
            style={{ width: `${taskProgress}%` }}
          />
        </div>
        
        {taskGoalMet && (
          <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400 text-sm">
            <Trophy size={16} />
            Goal achieved!
          </div>
        )}
      </div>
    </div>
  );
}
