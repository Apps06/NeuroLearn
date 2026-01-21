/**
 * GameNotification - Toast Notification Component
 * Shows reward/penalty notifications for gamification events
 */
"use client";

import React from "react";
import { Trophy, AlertTriangle, Star, XCircle } from "lucide-react";

interface GameNotificationProps {
  message: string;
  type: "reward" | "penalty" | "achievement" | "error";
  visible: boolean;
}

export default function GameNotification({ message, type, visible }: GameNotificationProps) {
  if (!visible) return null;

  const config = {
    reward: {
      icon: <Trophy size={20} />,
      bg: "bg-gradient-to-r from-green-500 to-emerald-600",
      text: "text-white",
    },
    penalty: {
      icon: <AlertTriangle size={20} />,
      bg: "bg-gradient-to-r from-red-500 to-orange-600",
      text: "text-white",
    },
    achievement: {
      icon: <Star size={20} />,
      bg: "bg-gradient-to-r from-yellow-400 to-amber-500",
      text: "text-yellow-900",
    },
    error: {
      icon: <XCircle size={20} />,
      bg: "bg-red-600",
      text: "text-white",
    },
  };

  const { icon, bg, text } = config[type];

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div
        className={`${bg} ${text} px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold`}
      >
        {icon}
        <span>{message}</span>
      </div>
    </div>
  );
}
