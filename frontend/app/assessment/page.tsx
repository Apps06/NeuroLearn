"use client";

import React, { useState } from "react";
import { BookOpen, Search, Send, FileText, Loader2, AlertCircle } from "lucide-react";

export default function AssessmentPage() {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    answer: string;
    sources: string[];
    confidence_score: number;
  } | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assessment/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          grade_context: grade ? parseInt(grade) : undefined,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Assessment query failed:", error);
      alert("Failed to query assessment guidelines.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="text-cyan-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              NIMHANS Assessment Guide
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Ask questions about Specific Learning Disability (SLD) guidelines, assessment procedures, and accommodations based on standard protocols.
          </p>
        </header>

        {/* Search Layout */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Question
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="E.g., What are the accommodations for Dysgraphia?"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                />
              </div>
            </div>
            <div className="w-full md:w-32">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grade (Opt)
              </label>
              <input
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Class"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-cyan-500 outline-none transition"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="w-full md:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white font-semibold rounded-lg shadow transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                Ask
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {result && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 border-cyan-500 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="text-cyan-500" size={24} />
                  Guideline Response
                </h3>
                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                  {result.answer}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Confidence: {Math.round((result.confidence_score || 0) * 100)}%
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Sources: {result.sources?.length ? result.sources.join(", ") : "General Guidelines"}
                </span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <p>
                This tool provides information based on NIMHANS guidelines but does not replace professional clinical assessment. Please consult a qualified psychologist for an official diagnosis.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
