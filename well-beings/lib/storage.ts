import { CheckinEntry, PlanIntensity, Profile } from "./types";

const KEY = "wellbeings-v1";

export interface Settings {
  planIntensity: PlanIntensity;
  calmMode: boolean;
}

export const DEFAULT_SETTINGS: Settings = { planIntensity: "balanced", calmMode: false };

export interface PersistedState {
  profile: Profile | null;
  checkins: Record<string, CheckinEntry>;
  habitsDone: Record<string, string[]>;
  weeklyDone: Record<string, boolean>;
  crisis: boolean;
  settings: Settings;
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
