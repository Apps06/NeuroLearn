/**
 * Dashboard Page - Per-Student Progress Visualization
 * Shows study statistics, achievements, and daily goals for selected student
 */
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  AlertTriangle,
  Download,
  User,
} from "lucide-react";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
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
    id: "focus_master",
    name: "Focus Master",
    description: "Zero distractions in a session",
    icon: <Award className="text-blue-500" size={24} />,
    requirement: 0,
    type: "distractions",
  },
  {
    id: "bookworm",
    name: "Bookworm",
    description: "Complete 10 reading sessions",
    icon: <BookOpen className="text-cyan-500" size={24} />,
    requirement: 10,
    type: "readerUses",
  },
];

interface StudentData {
  totalXP: number;
  completedTasks: number;
  streakDays: number;
  lastActiveDate: string;
  studentName?: string;
}

interface DailyStats {
  date: string;
  points: number;
  pointsLost: number;
  tasks: number;
  distractions: number;
  focusMinutes: number;
  pomodoros: number;
}

// Main export with Suspense wrapper
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading dashboard...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const { profile, currentStudent } = useAuth();
  
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current Firebase user ID as fallback
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load student data
  useEffect(() => {
    const loadData = async () => {
      // 1. Try to load from localStorage FIRST for instant UI (Offline Support)
      if (typeof window !== "undefined") {
        const localData = localStorage.getItem("neurolearn_gamification");
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            // Transform local state to match dashboard interfaces
            const localStudent: StudentData = {
              totalXP: parsed.totalXP || 0,
              completedTasks: parsed.completedTasks || 0,
              streakDays: parsed.streakDays || 0,
              lastActiveDate: parsed.lastActiveDate || new Date().toISOString(),
              studentName: currentStudent?.name || "Student",
            };
            setStudentData(localStudent);

            const localToday: DailyStats = {
              date: new Date().toISOString().split("T")[0],
              points: parsed.todayPoints || 0,
              pointsLost: parsed.todayPointsLost || 0,
              tasks: parsed.todayTasks || 0,
              distractions: parsed.todayDistractions || 0,
              focusMinutes: parsed.todayFocusMinutes || 0,
              pomodoros: parsed.todayPomodoros || 0,
            };
            setTodayStats(localToday);
            setLoading(false); // Show data immediately
          } catch (e) {
            console.error("Failed to load local dashboard data", e);
          }
        }
      }

      // Priority: studentId from URL > currentStudent > current Firebase user
      const targetId = studentId || currentStudent?.id || currentUserId;
      if (!targetId) {
        // If no ID but we have local data, we're good. Otherwise stop loading.
        if (!localStorage.getItem("neurolearn_gamification")) setLoading(false);
        return;
      }

      try {
        // Load student user data
        const userDoc = await getDoc(doc(db, "users", targetId));
        if (userDoc.exists()) {
          setStudentData(prev => ({ ...prev, ...(userDoc.data() as StudentData) }));
        }

        // Load weekly stats
        const today = new Date();
        const statsRef = collection(db, "users", targetId, "dailyStats");
        const statsQuery = query(statsRef, orderBy("__name__", "desc"), limit(7));
        const statsSnapshot = await getDocs(statsQuery);
        
        const stats: DailyStats[] = [];
        statsSnapshot.forEach((doc) => {
          stats.push({
            date: doc.id,
            ...doc.data(),
          } as DailyStats);
        });
        
        if (stats.length > 0) {
            setWeeklyStats(stats.reverse());
        }

        // Get today's stats (overwrite local if server has it, or merge?)
        // Actually, for offline-first, local might be newer. 
        // We'll stick with local for "today" to reflect instant changes.
      } catch (error) {
        console.warn("Dashboard offline/error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentId, currentStudent, currentUserId]);

  // Calculate XP level
  const calculateLevel = (xp: number) => Math.floor(xp / 100) + 1;
  const calculateXPProgress = (xp: number) => xp % 100;

  // Check if achievement is earned
  const isAchievementEarned = (achievement: typeof achievements[0]) => {
    if (!studentData) return false;
    switch (achievement.type) {
      case "tasks":
        return (todayStats?.tasks || 0) >= achievement.requirement;
      case "totalTasks":
        return studentData.completedTasks >= achievement.requirement;
      case "streak":
        return studentData.streakDays >= achievement.requirement;
      case "xp":
        return studentData.totalXP >= achievement.requirement;
      case "distractions":
        return todayStats && todayStats.distractions === 0 && todayStats.tasks > 0;
      default:
        return false;
    }
  };

  // Export report
  const handleExport = () => {
    const studentName = currentStudent?.name || studentData?.studentName || "Student";
    const report = {
      student: studentName,
      generatedAt: new Date().toISOString(),
      summary: {
        totalXP: studentData?.totalXP || 0,
        completedTasks: studentData?.completedTasks || 0,
        streakDays: studentData?.streakDays || 0,
        level: calculateLevel(studentData?.totalXP || 0),
      },
      weeklyStats,
      achievementsEarned: achievements.filter(isAchievementEarned).map(a => a.name),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studentName.replace(/\s+/g, "_")}_progress_report.json`;
    a.click();
  };

  const maxMinutes = Math.max(...weeklyStats.map((d) => d.focusMinutes || 0), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const displayName = currentStudent?.name || studentData?.studentName || "Student";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-indigo-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Progress Dashboard
              </h1>
              {(profile?.role === "parent" || profile?.role === "teacher") && (
                <div className="flex items-center gap-2 text-gray-500">
                  <User size={16} />
                  <span>Viewing: {displayName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition"
          >
            <Download size={18} className="text-purple-600" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">Export Report</span>
          </button>
        </div>

        {/* Distraction Alert */}
        {todayStats && todayStats.distractions > 3 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">
                High Distraction Alert
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {displayName} had {todayStats.distractions} distractions today, losing {todayStats.pointsLost || 0} points
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* XP Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-yellow-500" size={24} />
              <span className="text-gray-600 dark:text-gray-400">Total XP</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {studentData?.totalXP || 0}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Level {calculateLevel(studentData?.totalXP || 0)}</span>
                <span>{calculateXPProgress(studentData?.totalXP || 0)}/100 XP</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                  style={{ width: `${calculateXPProgress(studentData?.totalXP || 0)}%` }}
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
              {studentData?.completedTasks || 0}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {todayStats?.tasks || 0} today
            </div>
          </div>

          {/* Streak Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="text-orange-500" size={24} />
              <span className="text-gray-600 dark:text-gray-400">Streak</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {studentData?.streakDays || 0} days
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
              {todayStats?.focusMinutes || 0} min
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {todayStats?.pomodoros || 0} pomodoros
            </div>
          </div>
        </div>

        {/* Distractions Stats (for parents/teachers) */}
        {(profile?.role === "parent" || profile?.role === "teacher") && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" />
                Distraction Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {todayStats?.distractions || 0}
                  </div>
                  <div className="text-sm text-red-500">Today&apos;s Distractions</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {todayStats?.pointsLost || 0}
                  </div>
                  <div className="text-sm text-red-500">Points Lost</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-green-500" />
                Points Earned
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {todayStats?.points || 0}
                  </div>
                  <div className="text-sm text-green-500">Today&apos;s Points</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(todayStats?.points || 0) - (todayStats?.pointsLost || 0)}
                  </div>
                  <div className="text-sm text-green-500">Net Points</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Weekly Activity Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Weekly Activity
            </h2>
            <div className="flex items-end justify-between h-40 gap-2">
              {weeklyStats.length > 0 ? (
                weeklyStats.map((day) => (
                  <div key={day.date} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${((day.focusMinutes || 0) / maxMinutes) * 100}%`,
                        minHeight: 8,
                      }}
                    />
                    <span className="text-xs text-gray-500 mt-2">
                      {new Date(day.date).toLocaleDateString("en", { weekday: "short" })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="w-full text-center text-gray-500">
                  No activity data yet
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              Total: {weeklyStats.reduce((sum, d) => sum + (d.focusMinutes || 0), 0)} minutes this week
            </div>
          </div>

          {/* Daily Goals */}
          <DailyGoals
            currentStudyMinutes={todayStats?.focusMinutes || 0}
            currentTasksCompleted={todayStats?.tasks || 0}
            streakDays={studentData?.streakDays || 0}
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
                      : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {achievement.icon}
                    <span
                      className={`font-semibold ${
                        earned ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {achievement.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {achievement.description}
                  </p>
                  {earned && (
                    <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Unlocked!
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
