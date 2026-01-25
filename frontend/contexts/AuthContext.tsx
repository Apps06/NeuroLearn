/**
 * AuthContext - Firebase Authentication Context
 * Manages parent/teacher authentication and student linking
 */
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "parent" | "teacher" | "student";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  linkedStudents: string[]; // Array of student IDs
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  grade: number;
  parentId: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  students: StudentProfile[];
  currentStudent: StudentProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  signInWithGoogle: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  addStudent: (name: string, grade: number) => Promise<string>;
  selectStudent: (studentId: string) => void;
  refreshStudents: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile and students
  const loadProfile = async (firebaseUser: User) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        setProfile(profileData);

        // Load linked students
        if (profileData.linkedStudents && profileData.linkedStudents.length > 0) {
          const studentProfiles: StudentProfile[] = [];
          for (const studentId of profileData.linkedStudents) {
            const studentDoc = await getDoc(doc(db, "students", studentId));
            if (studentDoc.exists()) {
              studentProfiles.push({
                id: studentDoc.id,
                ...studentDoc.data(),
              } as StudentProfile);
            }
          }
          setStudents(studentProfiles);
          
          // Auto-select first student
          if (studentProfiles.length > 0 && !currentStudent) {
            setCurrentStudent(studentProfiles[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setProfile(null);
        setStudents([]);
        setCurrentStudent(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with email/password
  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email/password
  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      const newProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email || email,
        displayName,
        role,
        linkedStudents: [],
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "users", result.user.uid), newProfile);
      setProfile(newProfile);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (role: UserRole) => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists
      const userDocRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new profile
        const newProfile: UserProfile = {
          uid: result.user.uid,
          email: result.user.email || "",
          displayName: result.user.displayName || "User",
          role,
          linkedStudents: [],
          createdAt: new Date().toISOString(),
        };
        
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      } else {
        setProfile(userDoc.data() as UserProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
    setStudents([]);
    setCurrentStudent(null);
  };

  // Add a new student
  const addStudent = async (name: string, grade: number): Promise<string> => {
    if (!user || !profile) throw new Error("Not authenticated");

    const studentId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newStudent: StudentProfile = {
      id: studentId,
      name,
      grade,
      parentId: user.uid,
      createdAt: new Date().toISOString(),
    };

    // Create student document
    await setDoc(doc(db, "students", studentId), newStudent);
    
    // Also create a basic user entry for gamification
    await setDoc(doc(db, "users", studentId), {
      totalXP: 0,
      totalPoints: 0,
      completedTasks: 0,
      streakDays: 1,
      lastActiveDate: new Date().toISOString(),
      linkedParentId: user.uid,
      isStudent: true,
      studentName: name,
    });

    // Link student to parent
    await updateDoc(doc(db, "users", user.uid), {
      linkedStudents: arrayUnion(studentId),
    });

    // Update local state
    setStudents((prev) => [...prev, newStudent]);
    setProfile((prev) => prev ? {
      ...prev,
      linkedStudents: [...prev.linkedStudents, studentId],
    } : null);

    // Auto-select if first student
    if (students.length === 0) {
      setCurrentStudent(newStudent);
    }

    return studentId;
  };

  // Select a student
  const selectStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      setCurrentStudent(student);
      // Store in localStorage for persistence
      localStorage.setItem("neurolearn_current_student", studentId);
    }
  };

  // Refresh students list
  const refreshStudents = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        students,
        currentStudent,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        addStudent,
        selectStudent,
        refreshStudents,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
