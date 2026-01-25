/**
 * Students Page - Manage Linked Students
 * Parent/Teacher can add students and view their dashboards
 */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  User,
  GraduationCap,
  ChevronRight,
  Loader2,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentsPage() {
  const router = useRouter();
  const { profile, students, addStudent, selectStudent, signOut, loading } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState(8);
  const [adding, setAdding] = useState(false);

  // Redirect if not logged in
  if (!loading && !profile) {
    router.push("/login");
    return null;
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    setAdding(true);
    try {
      await addStudent(newStudentName, newStudentGrade);
      setNewStudentName("");
      setNewStudentGrade(8);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to add student");
    } finally {
      setAdding(false);
    }
  };

  const handleViewDashboard = (studentId: string) => {
    selectStudent(studentId);
    router.push(`/dashboard?studentId=${studentId}`);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="text-purple-600" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Students
              </h1>
              <p className="text-gray-500">
                Welcome, {profile?.displayName} ({profile?.role})
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Students List */}
        <div className="space-y-4 mb-6">
          {students.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-lg">
              <User size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Students Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Add your first student to start tracking their progress
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition"
              >
                <Plus size={20} />
                Add First Student
              </button>
            </div>
          ) : (
            students.map((student) => (
              <div
                key={student.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {student.name}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-500">
                        <GraduationCap size={16} />
                        <span>Grade {student.grade}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDashboard(student.id)}
                    className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition group-hover:translate-x-1"
                  >
                    <TrendingUp size={18} />
                    View Dashboard
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Student Button */}
        {students.length > 0 && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 font-medium border-2 border-dashed border-purple-200 dark:border-purple-800 hover:border-purple-400"
          >
            <Plus size={20} />
            Add Another Student
          </button>
        )}

        {/* Add Student Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Student
            </h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Enter student's name"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Grade Level
                </label>
                <select
                  value={newStudentGrade}
                  onChange={(e) => setNewStudentGrade(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !newStudentName.trim()}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Plus size={18} />
                      Add Student
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/focus")}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition text-left"
          >
            <span className="text-2xl mb-2 block">🎯</span>
            <span className="font-medium text-gray-900 dark:text-white">Focus Suite</span>
            <span className="text-sm text-gray-500 block">Task breakdown & timers</span>
          </button>
          <button
            onClick={() => router.push("/reader")}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition text-left"
          >
            <span className="text-2xl mb-2 block">📖</span>
            <span className="font-medium text-gray-900 dark:text-white">Dyslexia Reader</span>
            <span className="text-sm text-gray-500 block">Text simplification & TTS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
