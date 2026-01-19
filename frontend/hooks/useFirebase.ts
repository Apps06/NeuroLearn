/**
 * useFirebase Hook - Gamification & Progress Tracking
 * Manages user XP, completed tasks, and streak tracking in Firestore
 */
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { UserProgress } from "@/lib/types";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

export function useFirebase() {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to calculate and update streak
  const handleStreakUpdate = async (user: any, currentProgress: UserProgress) => {
    const today = new Date();
    const lastActive = new Date(currentProgress.lastActiveDate);

    // Normalize to YYYY-MM-DD to ignore time
    const todayStr = today.toISOString().split("T")[0];
    const lastActiveStr = lastActive.toISOString().split("T")[0];

    // If already active today, no streak update needed
    if (todayStr === lastActiveStr) return;

    const msPerDay = 24 * 60 * 60 * 1000;
    // Calculate difference in days roughly (reset to midnight)
    const todayMidnight = new Date(today.setHours(0, 0, 0, 0));
    const lastActiveMidnight = new Date(lastActive.setHours(0, 0, 0, 0));
    
    const diffTime = Math.abs(todayMidnight.getTime() - lastActiveMidnight.getTime());
    const diffDays = Math.round(diffTime / msPerDay);

    let newStreak = currentProgress.streakDays;

    if (diffDays === 1) {
      // Consecutive day: Increment streak
      newStreak += 1;
    } else if (diffDays > 1) {
      // Missed a day or more: Reset to 1 (since they are active now)
      newStreak = 1;
    }
    // If diffDays is 0, we handled it above (return)

    // Update Firestore
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        streakDays: newStreak,
        lastActiveDate: new Date().toISOString(),
      });

      // Update local state
      setUserProgress((prev) =>
        prev
          ? {
              ...prev,
              streakDays: newStreak,
              lastActiveDate: new Date().toISOString(),
            }
          : null
      );
    } catch (error) {
      console.error("Failed to update streak:", error);
    }
  };

  /**
   * Load user progress from Firestore
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, load progress
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data() as UserProgress;
            setUserProgress(data);
            // Check and update streak immediately
            handleStreakUpdate(user, data);
          } else {
            // Initialize new user
            const initialProgress: UserProgress = {
              userId: user.uid,
              totalXP: 0,
              completedTasks: 0,
              streakDays: 1, // Start with 1 day streak for new user active today
              lastActiveDate: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialProgress);
            setUserProgress(initialProgress);
          }
        } catch (error) {
          console.error("Error loading user progress:", error);
        }
        setLoading(false);
      } else {
        // No user, sign in anonymously to track progress
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged will trigger again
        } catch (error) {
          console.error("Anonymous auth failed:", error);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Award XP for completing a task
   */
  const awardXP = async (xpAmount: number) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);

      await updateDoc(userDocRef, {
        totalXP: increment(xpAmount),
        completedTasks: increment(1),
        lastActiveDate: new Date().toISOString(),
      });

      // Update local state
      setUserProgress((prev) =>
        prev
          ? {
              ...prev,
              totalXP: prev.totalXP + xpAmount,
              completedTasks: prev.completedTasks + 1,
            }
          : null
      );
    } catch (error) {
      console.error("Error awarding XP:", error);
    }
  };

  /**
   * Manual trigger if needed (currently auto-handled)
   */
  const updateStreak = async () => {
    if (userProgress && auth.currentUser) {
        handleStreakUpdate(auth.currentUser, userProgress);
    }
  };

  return {
    userProgress,
    loading,
    awardXP,
    updateStreak,
  };
}
