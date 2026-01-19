/**
 * Providers - Client-side providers wrapper
 * Wraps the app with necessary context providers
 */
"use client";

import { ReactNode } from "react";
import { SettingsProvider } from "@/hooks/useUserSettings";

export default function Providers({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}
