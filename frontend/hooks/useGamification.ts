/**
 * useGamification Hook - Centralized Gamification System
 * Manages points, levels, streaks, and rewards for ADHD Focus Suite
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";

export interface GamificationState {
  // Lifetime stats
  totalXP: number;
  totalPoints: number;
  completedTasks: number;
  streakDays: number;
  lastActiveDate: string;
  
  // Today's stats
  todayPoints: number;
  todayPointsLost: number;
  todayTasks: number;
  todayDistractions: number;
  todayFocusMinutes: number;
  todayPomodoros: number;
  
  // Computed
  level: number;
  xpToNextLevel: number;
  streakMultiplier: number;
}

const defaultState: GamificationState = {
  totalXP: 0,
  totalPoints: 0,
  completedTasks: 0,
  streakDays: 1,
  lastActiveDate: new Date().toISOString(),
  todayPoints: 0,
  todayPointsLost: 0,
  todayTasks: 0,
  todayDistractions: 0,
  todayFocusMinutes: 0,
  todayPomodoros: 0,
  level: 1,
  xpToNextLevel: 100,
  streakMultiplier: 1,
};

// Helper to get today's date string
const getTodayDateString = () => new Date().toISOString().split("T")[0];

export function useGamification() {
  const { currentStudent, user, loading: authLoading } = useAuth();
  const [state, setState] = useState<GamificationState>(defaultState);
  const [loading, setLoading] = useState(true);
  
  const userId = currentStudent?.id || user?.uid || null;
  
  // Toast notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: "reward" | "penalty" | "achievement" | "error";
    visible: boolean;
  } | null>(null);

  // Show notification toast
  const showNotification = useCallback((message: string, type: "reward" | "penalty" | "achievement" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Calculate level from XP
  const calculateLevel = (xp: number) => Math.floor(xp / 100) + 1;
  
  // Calculate XP needed for next level
  const calculateXPToNext = (xp: number) => 100 - (xp % 100);
  
  // Calculate streak multiplier (bonus for long streaks)
  const calculateStreakMultiplier = (days: number) => {
    if (days >= 30) return 2.0;
    if (days >= 14) return 1.5;
    if (days >= 7) return 1.25;
    return 1.0;
  };

  // Load user data from Firestore & LocalStorage
  useEffect(() => {
    // 1. Try to load from localStorage first for instant UI
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("neurolearn_gamification");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setState(prev => ({ ...defaultState, ...parsed }));
          setLoading(false);
        } catch (e) {
          console.error("Failed to parse local gamification data");
        }
      }
    }

    const loadData = async (targetId: string) => {
      try {
        setLoading(true);
        // Load main user doc
        const userDocRef = doc(db, "users", targetId);
        const userDoc = await getDoc(userDocRef);
        
        // Load today's stats
        const todayRef = doc(db, "users", targetId, "dailyStats", getTodayDateString());
        const todayDoc = await getDoc(todayRef);
        
        let userData = userDoc.exists() ? userDoc.data() : {};
        let todayData = todayDoc.exists() ? todayDoc.data() : {};
        
        // Initialize if new user
        if (!userDoc.exists()) {
          const initial = {
            totalXP: 0,
            totalPoints: 0,
            completedTasks: 0,
            streakDays: 1,
            lastActiveDate: new Date().toISOString(),
          };
          await setDoc(userDocRef, initial);
          userData = initial;
        }
        
        // Initialize today's stats if needed
        if (!todayDoc.exists()) {
          const todayInitial = {
            points: 0,
            pointsLost: 0,
            tasks: 0,
            distractions: 0,
            focusMinutes: 0,
            pomodoros: 0,
          };
          await setDoc(todayRef, todayInitial);
          todayData = todayInitial;
        }
        
        // Update streak if needed
        await updateStreakIfNeeded(targetId, userData);
        
        const totalXP = userData.totalXP || 0;
        const streakDays = userData.streakDays || 1;
        
        const newState = {
          totalXP,
          totalPoints: userData.totalPoints || 0,
          completedTasks: userData.completedTasks || 0,
          streakDays,
          lastActiveDate: userData.lastActiveDate || new Date().toISOString(),
          todayPoints: todayData.points || 0,
          todayPointsLost: todayData.pointsLost || 0,
          todayTasks: todayData.tasks || 0,
          todayDistractions: todayData.distractions || 0,
          todayFocusMinutes: todayData.focusMinutes || 0,
          todayPomodoros: todayData.pomodoros || 0,
          level: calculateLevel(totalXP),
          xpToNextLevel: calculateXPToNext(totalXP),
          streakMultiplier: calculateStreakMultiplier(streakDays),
        };

        setState(newState);
        localStorage.setItem("neurolearn_gamification", JSON.stringify(newState));

      } catch (error: any) {
        // OFFLINE FALLBACK: If Firebase fails, just use localStorage
        console.warn("Firebase offline, using local storage only:", error?.message);
        // State already loaded from localStorage above, just stop loading
      } finally {
        setLoading(false);
      }
    };

    if (authLoading) return;

    if (userId) {
      loadData(userId);
    } else {
      // Try anonymous sign-in, but don't block on failure
      signInAnonymously(auth).catch((error) => {
        console.warn("Anonymous auth failed, using offline mode:", error?.message);
        // Continue without auth - localStorage will handle everything
        setLoading(false);
      });
    }
  }, [userId, authLoading]);

  // Update streak based on last active date
  const updateStreakIfNeeded = async (uid: string, userData: any) => {
    const today = new Date();
    const lastActive = new Date(userData.lastActiveDate || today);
    
    const todayStr = today.toISOString().split("T")[0];
    const lastActiveStr = lastActive.toISOString().split("T")[0];
    
    if (todayStr === lastActiveStr) return; // Already active today
    
    const msPerDay = 24 * 60 * 60 * 1000;
    const todayMidnight = new Date(today.setHours(0, 0, 0, 0));
    const lastActiveMidnight = new Date(lastActive.setHours(0, 0, 0, 0));
    const diffDays = Math.round(Math.abs(todayMidnight.getTime() - lastActiveMidnight.getTime()) / msPerDay);
    
    let newStreak = userData.streakDays || 1;
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1; // Reset streak
    }
    
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
      streakDays: newStreak,
      lastActiveDate: new Date().toISOString(),
    });
  };

  // Award points for completing tasks
  const awardPoints = useCallback(async (amount: number, reason: string) => {
    const multipliedAmount = Math.round(amount * state.streakMultiplier);
    
    // Always update local state first (works offline)
    setState(prev => {
      const newXP = prev.totalXP + multipliedAmount;
      const newState = {
        ...prev,
        totalXP: newXP,
        totalPoints: prev.totalPoints + multipliedAmount,
        todayPoints: prev.todayPoints + multipliedAmount,
        level: calculateLevel(newXP),
        xpToNextLevel: calculateXPToNext(newXP),
      };
      localStorage.setItem("neurolearn_gamification", JSON.stringify(newState));
      return newState;
    });
    
    showNotification(`+${multipliedAmount} points! ${reason}`, "reward");
    
    // Try to sync to Firebase (optional)
    if (userId) {
      try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          totalXP: increment(multipliedAmount),
          totalPoints: increment(multipliedAmount),
          lastActiveDate: new Date().toISOString(),
        });
        
        const todayRef = doc(db, "users", userId, "dailyStats", getTodayDateString());
        await updateDoc(todayRef, {
          points: increment(multipliedAmount),
        });
      } catch (error) {
        console.warn("Firebase sync failed (offline mode):", error);
      }
    }
  }, [userId, state.streakMultiplier, showNotification]);

  // Deduct points for distractions (tab switching)
  const deductPoints = useCallback(async (amount: number, reason: string) => {
    // Always update local state first (works offline)
    setState(prev => {
      const newState = {
        ...prev,
        todayPointsLost: prev.todayPointsLost + amount,
        todayDistractions: prev.todayDistractions + 1,
      };
      localStorage.setItem("neurolearn_gamification", JSON.stringify(newState));
      return newState;
    });
    
    showNotification(`-${amount} points! ${reason}`, "penalty");
    
    // Try to sync to Firebase (optional)
    if (userId) {
      try {
        const todayRef = doc(db, "users", userId, "dailyStats", getTodayDateString());
        await updateDoc(todayRef, {
          pointsLost: increment(amount),
          distractions: increment(1),
        });
      } catch (error) {
        console.warn("Firebase sync failed (offline mode):", error);
      }
    }
  }, [userId, showNotification]);

  // Complete a task
  const completeTask = useCallback(async (xpReward: number) => {
    // Always update local state first (works offline)
    setState(prev => {
      const newState = {
        ...prev,
        completedTasks: prev.completedTasks + 1,
        todayTasks: prev.todayTasks + 1,
      };
      localStorage.setItem("neurolearn_gamification", JSON.stringify(newState));
      return newState;
    });
    
    await awardPoints(xpReward, "Task completed!");
    
    // Try to sync to Firebase (optional)
    if (userId) {
      try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          completedTasks: increment(1),
        });
        
        const todayRef = doc(db, "users", userId, "dailyStats", getTodayDateString());
        await updateDoc(todayRef, {
          tasks: increment(1),
        });
      } catch (error) {
        console.warn("Firebase sync failed (offline mode):", error);
      }
    }
  }, [userId, awardPoints]);

  // Complete a pomodoro session
  const completePomodoro = useCallback(async (minutes: number) => {
    // Always update local state first (works offline)
    setState(prev => {
      const newState = {
        ...prev,
        todayPomodoros: prev.todayPomodoros + 1,
        todayFocusMinutes: prev.todayFocusMinutes + minutes,
      };
      localStorage.setItem("neurolearn_gamification", JSON.stringify(newState));
      return newState;
    });
    
    await awardPoints(25, "Pomodoro completed!");
    
    // Try to sync to Firebase (optional)
    if (userId) {
      try {
        const todayRef = doc(db, "users", userId, "dailyStats", getTodayDateString());
        await updateDoc(todayRef, {
          pomodoros: increment(1),
          focusMinutes: increment(minutes),
        });
      } catch (error) {
        console.warn("Firebase sync failed (offline mode):", error);
      }
    }
  }, [userId, awardPoints]);

  // Add focus time
  const addFocusTime = useCallback(async (minutes: number) => {
    // Always update local state (works offline)
    setState(prev => {
      const newState = {
        ...prev,
        todayFocusMinutes: prev.todayFocusMinutes + minutes,
      };
      localStorage.setItem("neurolearn_gamification", JSON.stringify(newState));
      return newState;
    });
    
    // Try to sync to Firebase (optional)
    if (userId) {
      try {
        const todayRef = doc(db, "users", userId, "dailyStats", getTodayDateString());
        await updateDoc(todayRef, {
          focusMinutes: increment(minutes),
        });
      } catch (error) {
        // Silent fail for background tracking
      }
    }
  }, [userId]);

  return {
    ...state,
    loading,
    notification,
    awardPoints,
    deductPoints,
    completeTask,
    completePomodoro,
    addFocusTime,
  };
}
