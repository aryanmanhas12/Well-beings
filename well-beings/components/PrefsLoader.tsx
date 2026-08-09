"use client";

import { useEffect } from "react";

/**
 * Preferences Persistence System
 * Loads theme, contrast, and scale from localStorage BEFORE first paint
 * to avoid flash of wrong theme (worst for accessibility users).
 * Must mount at root level before other components that use these preferences.
 */
export function PrefsLoader() {
  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem("well-beings-prefs") || "{}");
      const root = document.documentElement;

      // Apply theme (light/dark/auto)
      if (prefs.theme && prefs.theme !== "auto") {
        root.setAttribute("data-theme", prefs.theme);
      }

      // Apply high-contrast mode
      if (prefs.contrast) {
        root.setAttribute("data-contrast", "high");
      }

      // Apply text scale
      if (prefs.scale && prefs.scale !== 1) {
        root.style.setProperty("--scale", prefs.scale);
      }
    } catch (e) {
      // localStorage blocked or parse failed, use defaults
    }
  }, []);

  return null; // This component doesn't render anything
}

export function savePreferences(theme: string, contrast: boolean, scale: number) {
  const prefs = { theme, contrast, scale };
  localStorage.setItem("well-beings-prefs", JSON.stringify(prefs));

  const root = document.documentElement;
  if (theme !== "auto") {
    root.setAttribute("data-theme", theme);
  } else {
    root.removeAttribute("data-theme");
  }

  if (contrast) {
    root.setAttribute("data-contrast", "high");
  } else {
    root.removeAttribute("data-contrast");
  }

  root.style.setProperty("--scale", scale.toString());
}
