/**
 * Root Layout - Global app wrapper
 * CRITICAL: This file MUST import globals.css for Tailwind to work
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // ← THIS IS CRITICAL - DO NOT REMOVE
import Link from "next/link";
import { BookOpen, Target, FileQuestion, LayoutDashboard, BookMarked, Users } from "lucide-react";
import Providers from "./Providers";
import ClientLayout from "./AppClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NeuroLearn - Adaptive Learning for Students",
  description: "AI-powered platform for students with ADHD and Dyslexia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* OpenDyslexic font for dyslexia support */}
        <link
          href="https://fonts.cdnfonts.com/css/opendyslexic"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {/* Navigation Bar */}
          <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold text-blue-600">
                  NeuroLearn
                </Link>

                <div className="flex gap-4 md:gap-6">
                  <Link
                    href="/reader"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 transition"
                  >
                    <BookOpen size={20} />
                    <span className="hidden sm:inline">Reader</span>
                  </Link>
                  <Link
                    href="/focus"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 transition"
                  >
                    <Target size={20} />
                    <span className="hidden sm:inline">Focus</span>
                  </Link>
                  <Link
                    href="/flashcards"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-cyan-600 transition"
                  >
                    <BookMarked size={20} />
                    <span className="hidden sm:inline">Flashcards</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition"
                  >
                    <LayoutDashboard size={20} />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <Link
                    href="/assessment"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-green-600 transition"
                  >
                    <FileQuestion size={20} />
                    <span className="hidden sm:inline">Assessment</span>
                  </Link>
                  <Link
                    href="/students"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-pink-600 transition"
                  >
                    <Users size={20} />
                    <span className="hidden sm:inline">Portal</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Client-side components wrapper */}
          <ClientLayout>{children}</ClientLayout>

          {/* Footer */}
          <footer className="bg-gray-100 dark:bg-gray-900 py-6 mt-12">
            <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                NeuroLearn - Empowering Indian Students with Learning Differences
              </p>
              <p className="mt-2">
                Built with Next.js, FastAPI, Gemini AI & AI4Bharat TTS
              </p>
              <p className="mt-1 text-xs">
                Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">?</kbd> for keyboard shortcuts
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
