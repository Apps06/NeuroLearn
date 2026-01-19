/**
 * Dyslexia Reader Page - MODULE A
 * Text simplification with bionic reading, Indian-accented TTS, and accessibility features
 */
"use client";

import React, { useState, useCallback } from "react";
import { Volume2, Loader2, BookOpen, Palette, Eye, Settings2 } from "lucide-react";
import BionicText from "@/components/BionicText";
import ReadingRuler from "@/components/ReadingRuler";
import FontSizeControl from "@/components/FontSizeControl";
import ExportButton from "@/components/ExportButton";
import { useSettings, OverlayColor } from "@/hooks/useUserSettings";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { TextSimplificationResponse } from "@/lib/types";

const overlayOptions: { color: OverlayColor; label: string; bg: string }[] = [
  { color: "none", label: "None", bg: "bg-white dark:bg-gray-800" },
  { color: "blue", label: "Blue", bg: "bg-blue-100" },
  { color: "yellow", label: "Yellow", bg: "bg-yellow-100" },
  { color: "pink", label: "Pink", bg: "bg-pink-100" },
  { color: "peach", label: "Peach", bg: "bg-orange-100" },
];

export default function ReaderPage() {
  const [inputText, setInputText] = useState("");
  const [simplifiedData, setSimplifiedData] =
    useState<TextSimplificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [simplificationLevel, setSimplificationLevel] = useState<
    "light" | "moderate" | "heavy"
  >("moderate");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { settings, updateSettings } = useSettings();

  // Reading ruler toggle via keyboard
  const toggleRuler = useCallback(() => {
    updateSettings({ readingRulerEnabled: !settings.readingRulerEnabled });
  }, [settings.readingRulerEnabled, updateSettings]);

  // TTS function for keyboard shortcut
  const handleReadAloud = useCallback(() => {
    if (simplifiedData && !isPlaying) {
      handlePlayAudio();
    }
  }, [simplifiedData, isPlaying]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleRuler: toggleRuler,
    onReadAloud: handleReadAloud,
  });

  // Ensure voices are loaded
  React.useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  /**
   * Submit text for simplification
   */
  const handleSimplify = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reader/simplify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText,
            simplification_level: simplificationLevel,
          }),
        }
      );

      const data = await response.json();
      setSimplifiedData(data);
      
      // Auto-play audio after simplification
      if (data && data.chunks && data.chunks.length > 0) {
        // Short timeout to allow state update
        setTimeout(() => {
          handlePlayAudio(data); // Pass data directly to avoid stale state
        }, 500);
      }
    } catch (error) {
      console.error("Simplification error:", error);
      alert("Failed to simplify text. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Play audio using TTS
   */
  /**
   * Play audio using TTS
   */
  const handlePlayAudio = async (dataToPlay?: any) => {
    // If called from onClick, dataToPlay will be the event object
    // If called directly, it will be the data object
    const actualData = (dataToPlay && dataToPlay.chunks) ? dataToPlay : simplifiedData;
    
    if (!actualData) return;

    setIsPlaying(true);
    const fullText = actualData.chunks.map((c: any) => c.simplified).join(" ");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reader/tts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fullText, language: "en" }),
        }
      );

      const data = await response.json();

      if (data.use_client_tts) {
        console.log("Using client TTS fallback", data.voice_params);
        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.lang = data.voice_params.lang;
        utterance.rate = data.voice_params.rate;
        utterance.pitch = data.voice_params.pitch;
        
        // Explicitly try to find an Indian voice
        const voices = window.speechSynthesis.getVoices();
        const indianVoice = voices.find(v => v.lang.includes('IN')) || voices.find(v => v.lang.startsWith('en'));
        if (indianVoice) utterance.voice = indianVoice;

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = (e) => {
             console.error("TTS Playback Error", e);
             setIsPlaying(false);
        };
        window.speechSynthesis.speak(utterance);
      } else if (data.audio_base64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
        audio.onended = () => setIsPlaying(false);
        audio.play();
      }
    } catch (error) {
      console.error("TTS error:", error);
      // Fallback to Web Speech API
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.lang = "en-IN";
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Get simplified text for export
  const getExportContent = () => {
    if (!simplifiedData) return "";
    return simplifiedData.chunks.map((c) => c.simplified).join("\n\n");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Reading Ruler */}
      <ReadingRuler enabled={settings.readingRulerEnabled} />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dyslexia Reader
            </h1>
          </div>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              showSettings
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Settings2 size={20} />
            Settings
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Font Size Control */}
              <FontSizeControl />

              {/* Color Overlay Options */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="text-purple-500" size={20} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Color Overlay
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Reduces eye strain for dyslexic readers
                </p>
                <div className="flex flex-wrap gap-2">
                  {overlayOptions.map((option) => (
                    <button
                      key={option.color}
                      onClick={() => updateSettings({ colorOverlay: option.color })}
                      className={`px-3 py-2 rounded-lg border-2 transition ${
                        settings.colorOverlay === option.color
                          ? "border-purple-500 ring-2 ring-purple-200"
                          : "border-gray-200 dark:border-gray-600"
                      } ${option.bg}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Opacity Slider */}
                {settings.colorOverlay !== "none" && (
                  <div className="mt-4">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Opacity: {Math.round(settings.overlayOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.4"
                      step="0.05"
                      value={settings.overlayOpacity}
                      onChange={(e) =>
                        updateSettings({ overlayOpacity: parseFloat(e.target.value) })
                      }
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Reading Ruler Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="text-yellow-500" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Reading Ruler
                  </h3>
                  <p className="text-sm text-gray-500">
                    Highlight line to track reading position (Press R to toggle)
                  </p>
                </div>
              </div>
              <button
                onClick={toggleRuler}
                className={`relative w-14 h-8 rounded-full transition ${
                  settings.readingRulerEnabled ? "bg-yellow-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.readingRulerEnabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Simplification Level Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Simplification Level
          </label>
          <div className="flex gap-2">
            {(["light", "moderate", "heavy"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setSimplificationLevel(level)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  simplificationLevel === level
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Input Textarea */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste complex text from your textbook here..."
          className="w-full h-40 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500"
          style={{ fontSize: `${settings.fontSize}px` }}
        />

        {/* Simplify Button */}
        <button
          onClick={handleSimplify}
          disabled={loading || !inputText.trim()}
          className="mt-4 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Processing...
            </>
          ) : (
            "Simplify Text"
          )}
        </button>

        {/* Simplified Output */}
        {simplifiedData && (
          <div
            className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
            style={{ fontSize: `${settings.fontSize}px` }}
          >
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Simplified Text
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePlayAudio}
                  disabled={isPlaying}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  <Volume2 size={20} />
                  {isPlaying ? "Playing..." : "Listen"}
                </button>
                <ExportButton
                  content={getExportContent()}
                  title="Simplified Notes"
                />
              </div>
            </div>

            {simplifiedData.chunks.map((chunk, idx) => (
              <div
                key={idx}
                className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <BionicText html={chunk.bionic_html} />
              </div>
            ))}

            {/* Keyboard hint */}
            <p className="text-sm text-gray-500 text-center mt-4">
              Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Alt+S</kbd> to read aloud,{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Alt+R</kbd> to toggle reading ruler
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

