import { JournalEntry } from "./journal";
import { Lang } from "./i18n";
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
  /** UI language. The check-in stays English either way — see lib/i18n.ts. */
  lang: Lang;
  /**
   * Whether a citation rides along with every claim, or waits to be asked for.
   *
   * Defaults to off. Sourcing everything was the honest instinct, but in
   * practice a citation under each of five result cards, each plan item and
   * each statement turns into visual noise people stop reading — which
   * defeats the purpose of citing at all. Off means "one tap away", never
   * "gone": every place that hides one shows a control to open it.
   */
  showCitations: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  planIntensity: "balanced",
  calmMode: false,
  theme: "auto",
  scale: 1,
  contrast: false,
  lang: "en",
  showCitations: false,
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
  /* data-lang drives the Devanagari font stack in globals.css; lang= is what
     screen readers and hyphenation actually read. Both, or neither works. */
  root.setAttribute("data-lang", s.lang);
  root.setAttribute("lang", s.lang);
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
