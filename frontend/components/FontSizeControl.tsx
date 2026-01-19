/**
 * FontSizeControl Component
 * Slider for adjusting text size across the application
 * Includes quick preset buttons and live preview
 */
"use client";

import React from "react";
import { Type, Minus, Plus } from "lucide-react";
import { useSettings } from "@/hooks/useUserSettings";

interface FontSizeControlProps {
  compact?: boolean; // For toolbar display
}

export default function FontSizeControl({ compact = false }: FontSizeControlProps) {
  const { settings, updateSettings } = useSettings();
  const { fontSize } = settings;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ fontSize: parseInt(e.target.value) });
  };

  const adjustSize = (delta: number) => {
    const newSize = Math.min(28, Math.max(14, fontSize + delta));
    updateSettings({ fontSize: newSize });
  };

  const presets = [
    { label: "S", value: 14 },
    { label: "M", value: 18 },
    { label: "L", value: 22 },
    { label: "XL", value: 26 },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => adjustSize(-2)}
          className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          title="Decrease font size"
        >
          <Minus size={16} className="text-gray-600 dark:text-gray-300" />
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-center">
          {fontSize}
        </span>
        <button
          onClick={() => adjustSize(2)}
          className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          title="Increase font size"
        >
          <Plus size={16} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center gap-2 mb-3">
        <Type className="text-blue-500" size={20} />
        <h3 className="font-semibold text-gray-900 dark:text-white">Font Size</h3>
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-gray-500">A</span>
        <input
          type="range"
          min="14"
          max="28"
          value={fontSize}
          onChange={handleSliderChange}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-lg text-gray-500">A</span>
      </div>

      {/* Presets */}
      <div className="flex gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => updateSettings({ fontSize: preset.value })}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              fontSize === preset.value
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div
        className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
      >
        Preview text at {fontSize}px
      </div>
    </div>
  );
}
