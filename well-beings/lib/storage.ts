import { JournalEntry } from "./journal";
import { CheckinEntry, PlanIntensity, Profile } from "./types";

const KEY = "wellbeings-v1";

export type Theme = "auto" | "light" | "dark";

export interface Settings {
  planIntensity: PlanIntensity;
  calmMode: boolean;
  theme: Theme;
  /** Root font multiplier — 1 / 1.15 / 1.35, matching the screener's scale. */
  scale: number;
  contrast: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  planIntensity: "balanced",
  calmMode: false,
  theme: "auto",
  scale: 1,
  contrast: false,
};

export interface PersistedState {
  profile: Profile | null;
  checkins: Record<string, CheckinEntry>;
  habitsDone: Record<string, string[]>;
  weeklyDone: Record<string, boolean>;
  journal: JournalEntry[];
  crisis: boolean;
  settings: Settings;
}

/**
 * Display prefs are applied to <html> directly, not through React state.
 * They decide what the FIRST paint looks like, and a flash of the wrong
 * theme is worst for exactly the person who changed the setting because
 * they otherwise couldn't read the page.
 */
export function applyDisplayPrefs(s: Settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (s.theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", s.theme);
  if (s.contrast) root.setAttribute("data-contrast", "high");
  else root.removeAttribute("data-contrast");
  root.style.setProperty("--scale", String(s.scale));
}

export function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || "null");
    if (!saved) return null;
    return {
      profile: saved.profile ?? null,
      checkins: saved.checkins ?? {},
      habitsDone: saved.habitsDone ?? {},
      weeklyDone: saved.weeklyDone ?? {},
      journal: Array.isArray(saved.journal) ? saved.journal : [],
      crisis: !!saved.crisis,
      settings: { ...DEFAULT_SETTINGS, ...(saved.settings ?? {}) },
    };
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode, quota) — fail silently, nothing to persist to
  }
}

export function clearState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
