/**
 * BackgroundSounds Component
 * Ambient sound player for focus enhancement
 * Helps ADHD students concentrate with white noise, rain, or lo-fi music
 */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Music, CloudRain, Wind, Trees } from "lucide-react";

type SoundType = "none" | "whitenoise" | "rain" | "lofi" | "nature";

interface SoundOption {
  id: SoundType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const soundOptions: SoundOption[] = [
  { id: "none", label: "Off", icon: <VolumeX size={20} />, description: "No sound" },
  { id: "whitenoise", label: "White Noise", icon: <Wind size={20} />, description: "Consistent background hum" },
  { id: "rain", label: "Rain", icon: <CloudRain size={20} />, description: "Gentle rainfall" },
  { id: "lofi", label: "Lo-Fi", icon: <Music size={20} />, description: "Chill beats" },
  { id: "nature", label: "Nature", icon: <Trees size={20} />, description: "Forest ambience" },
];

export default function BackgroundSounds() {
  const [currentSound, setCurrentSound] = useState<SoundType>("none");
  const [volume, setVolume] = useState(0.5);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Generate white noise using Web Audio API
  const generateWhiteNoise = (audioContext: AudioContext): AudioBufferSourceNode => {
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const whiteNoise = audioContext.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    
    return whiteNoise;
  };

  // Generate brown noise for rain-like sound
  const generateBrownNoise = (audioContext: AudioContext): AudioBufferSourceNode => {
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Amplify
    }
    
    const brownNoise = audioContext.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;
    
    return brownNoise;
  };

  // Generate pink noise for nature sounds
  const generatePinkNoise = (audioContext: AudioContext): AudioBufferSourceNode => {
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // Compensate for gain
      b6 = white * 0.115926;
    }
    
    const pinkNoise = audioContext.createBufferSource();
    pinkNoise.buffer = noiseBuffer;
    pinkNoise.loop = true;
    
    return pinkNoise;
  };

  // Generate lo-fi style drone
  const generateLofi = (audioContext: AudioContext): OscillatorNode => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 220; // A3 note
    
    // Add slight modulation for warmth
    const lfo = audioContext.createOscillator();
    lfo.frequency.value = 0.5;
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    lfo.start();
    
    return oscillator;
  };

  const stopSound = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch { /* ignore */ }
      sourceRef.current = null;
    }
  };

  const playSound = (soundType: SoundType) => {
    stopSound();
    
    if (soundType === "none") return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    
    if (!gainNodeRef.current) {
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(ctx.destination);
    }
    gainNodeRef.current.gain.value = volume;

    let source: AudioBufferSourceNode | OscillatorNode;
    
    switch (soundType) {
      case "whitenoise":
        source = generateWhiteNoise(ctx);
        break;
      case "rain":
        source = generateBrownNoise(ctx);
        break;
      case "nature":
        source = generatePinkNoise(ctx);
        break;
      case "lofi":
        source = generateLofi(ctx);
        break;
      default:
        return;
    }
    
    source.connect(gainNodeRef.current);
    source.start();
    sourceRef.current = source;
  };

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Handle sound change
  const handleSoundChange = (soundType: SoundType) => {
    setCurrentSound(soundType);
    playSound(soundType);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-3 rounded-full shadow-lg transition ${
          currentSound !== "none"
            ? "bg-purple-500 text-white"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        }`}
        title="Background Sounds"
      >
        {currentSound !== "none" ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute top-14 right-0 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 z-50 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-right-2 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Ambiance Sounds
            </h3>
            {currentSound !== "none" && (
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                Playing: {soundOptions.find(o => o.id === currentSound)?.label}
              </span>
            )}
          </div>
          
          {/* Sound Options */}
          <div className="space-y-2 mb-4">
            {soundOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSoundChange(option.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition ${
                  currentSound === option.id
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {option.icon}
                <div className="text-left">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs opacity-70">{option.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          {currentSound !== "none" && (
            <div className="flex items-center gap-2">
              <VolumeX size={16} className="text-gray-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <Volume2 size={16} className="text-gray-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
