/**
 * useSettings Hook - Global User Preferences
 * Manages font size, color overlay, and other accessibility settings
 * Persists to localStorage for cross-session retention
 */
"use client";

import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";

export type OverlayColor = "none" | "blue" | "yellow" | "pink" | "peach";

export interface UserSettings {
  fontSize: number; // 14-28px
  colorOverlay: OverlayColor;
  overlayOpacity: number; // 0.1-0.4
  soundEnabled: boolean;
  readingRulerEnabled: boolean;
  pomodoroWorkDuration: number; // minutes
  pomodoroBreakDuration: number; // minutes
  dailyStudyGoal: number; // minutes
  dailyTaskGoal: number; // number of tasks
}

const defaultSettings: UserSettings = {
  fontSize: 18,
  colorOverlay: "none",
  overlayOpacity: 0.15,
  soundEnabled: true,
  readingRulerEnabled: false,
  pomodoroWorkDuration: 25,
  pomodoroBreakDuration: 5,
  dailyStudyGoal: 60,
  dailyTaskGoal: 5,
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const STORAGE_KEY = "neurolearn_settings";

export function SettingsProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.warn("Failed to load settings:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.warn("Failed to save settings:", error);
      }
    }
  }, [settings, isLoaded]);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    // Return default values if not within provider
    return {
      settings: defaultSettings,
      updateSettings: () => {},
      resetSettings: () => {},
    };
  }
  return context;
}

// Color overlay CSS values
export const overlayColors: Record<OverlayColor, string> = {
  none: "transparent",
  blue: "rgba(173, 216, 230, VAR_OPACITY)", // Light blue - calming
  yellow: "rgba(255, 255, 224, VAR_OPACITY)", // Light yellow - reduces contrast
  pink: "rgba(255, 182, 193, VAR_OPACITY)", // Light pink - warm
  peach: "rgba(255, 218, 185, VAR_OPACITY)", // Peach - soft warm
};

export function getOverlayStyle(color: OverlayColor, opacity: number): string {
  if (color === "none") return "transparent";
  return overlayColors[color].replace("VAR_OPACITY", opacity.toString());
}
