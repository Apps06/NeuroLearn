/**
 * PomodoroSettings - Timer Customization Modal
 * Allows users to customize work/break durations and preferences
 */
"use client";

import React from "react";
import { X, Clock, Coffee, Moon } from "lucide-react";
import { useSettings } from "@/hooks/useUserSettings";

interface PomodoroSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const presets = [
  { name: "Quick Focus", work: 15, break: 3, icon: "⚡" },
  { name: "Classic", work: 25, break: 5, icon: "🍅" },
  { name: "Deep Work", work: 50, break: 10, icon: "🧠" },
  { name: "Study Session", work: 45, break: 15, icon: "📚" },
];

export default function PomodoroSettings({ isOpen, onClose }: PomodoroSettingsProps) {
  const { settings, updateSettings } = useSettings();

  if (!isOpen) return null;

  const handlePresetSelect = (work: number, breakTime: number) => {
    updateSettings({
      pomodoroWorkDuration: work,
      pomodoroBreakDuration: breakTime,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={24} className="text-orange-500" />
            Pomodoro Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Presets */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset.work, preset.break)}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  settings.pomodoroWorkDuration === preset.work &&
                  settings.pomodoroBreakDuration === preset.break
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-orange-300"
                }`}
              >
                <span className="text-2xl mb-1 block">{preset.icon}</span>
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {preset.name}
                </span>
                <span className="text-xs text-gray-500 block">
                  {preset.work}m / {preset.break}m
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Work Duration Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              Work Duration
            </label>
            <span className="text-lg font-bold text-orange-500">
              {settings.pomodoroWorkDuration} min
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="90"
            step="5"
            value={settings.pomodoroWorkDuration}
            onChange={(e) =>
              updateSettings({ pomodoroWorkDuration: parseInt(e.target.value) })
            }
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5 min</span>
            <span>90 min</span>
          </div>
        </div>

        {/* Break Duration Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Coffee size={16} className="text-green-500" />
              Break Duration
            </label>
            <span className="text-lg font-bold text-green-500">
              {settings.pomodoroBreakDuration} min
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={settings.pomodoroBreakDuration}
            onChange={(e) =>
              updateSettings({ pomodoroBreakDuration: parseInt(e.target.value) })
            }
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 min</span>
            <span>30 min</span>
          </div>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-6">
          <div className="flex items-center gap-2">
            <Moon size={20} className="text-purple-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              Sound Notifications
            </span>
          </div>
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.soundEnabled ? "bg-purple-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.soundEnabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
