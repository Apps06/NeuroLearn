/**
 * Home Page - Landing page with feature highlights
 */
"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Target,
  FileQuestion,
  Sparkles,
  Brain,
  Volume2,
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: <BookOpen size={48} className="text-blue-500" />,
      title: "Dyslexia Reader",
      description:
        "Text simplification with Bionic Reading and Indian-accented TTS",
      link: "/reader",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Target size={48} className="text-purple-500" />,
      title: "ADHD Focus Suite",
      description:
        "Break tasks into micro-steps with anti-distraction technology",
      link: "/focus",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <FileQuestion size={48} className="text-green-500" />,
      title: "NIMHANS Assessment",
      description: "Query official screening guidelines with RAG technology",
      link: "/assessment",
      color: "from-green-500 to-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Brain size={48} className="text-blue-600" />
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            NeuroLearn
          </h1>
        </div>

        <p className="text-2xl text-gray-700 dark:text-gray-300 mb-4">
          Adaptive Learning for Indian Students
        </p>

        <div className="flex items-center justify-center gap-2 text-lg text-gray-600 dark:text-gray-400 mb-12">
          <Sparkles size={20} className="text-yellow-500" />
          <span>Powered by AI • Designed for ADHD & Dyslexia</span>
          <Sparkles size={20} className="text-yellow-500" />
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {features.map((feature, idx) => (
            <Link key={idx} href={feature.link}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition transform hover:scale-105 cursor-pointer">
                <div
                  className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center`}
                >
                  {feature.icon}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>

                <div className="mt-6 text-blue-600 dark:text-blue-400 font-medium">
                  Try it now →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Technology Stack */}
        <div className="mt-20 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Powered by Cutting-Edge Technology
          </h2>

          <div className="grid md:grid-cols-4 gap-6 text-left">
            <div>
              <div className="text-blue-600 font-semibold mb-2">AI Model</div>
              <div className="text-gray-700 dark:text-gray-300">
                Google Gemini Flash 1.5
              </div>
            </div>
            <div>
              <div className="text-purple-600 font-semibold mb-2">
                NLP Engine
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                spaCy (English)
              </div>
            </div>
            <div>
              <div className="text-green-600 font-semibold mb-2">
                Voice Tech
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                AI4Bharat TTS (Indian Accent)
              </div>
            </div>
            <div>
              <div className="text-pink-600 font-semibold mb-2">RAG System</div>
              <div className="text-gray-700 dark:text-gray-300">
                LangChain + ChromaDB
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
