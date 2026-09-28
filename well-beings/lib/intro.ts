"use client";

/**
 * When the opening sunrise plays.
 *
 * Every time someone opens Arun: once per browser session, so opening the
 * app again tomorrow brings the sunrise back, but a reload or moving
 * between rooms does not. Two small records:
 *
 *   arun-intro-session (sessionStorage) "played": the sunrise has run in
 *     this tab. Gone when the tab or the installed app is closed.
 *   arun-intro-v1 (localStorage) "off": the person turned it off in
 *     Settings. Absent means on.
 *
 * The decision itself is made before the first paint by the inline script
 * in app/page.tsx (INTRO_BOOTSTRAP), which reads these same keys, so the
 * home screen never flashes before the sunrise covers it. That script also
 * skips the sunrise when a check-in in the last three days reported
 * thoughts of suicide or not feeling safe: on those days the plan and the
 * numbers come first, not an animation.
 */
export const INTRO_KEY = "arun-intro-v1";
export const INTRO_SESSION_KEY = "arun-intro-session";

const subscribers = new Set<() => void>();
let cache: boolean | null = null;

export function subscribeIntro(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function introWanted(): boolean {
  if (cache !== null) return cache;
  try {
    cache = window.localStorage.getItem(INTRO_KEY) !== "off";
  } catch {
    cache = true;
  }
  return cache;
}

export function setIntroWanted(on: boolean) {
  cache = on;
  try {
    if (on) window.localStorage.removeItem(INTRO_KEY);
    else window.localStorage.setItem(INTRO_KEY, "off");
  } catch {
    // Not remembered; applies to this visit.
  }
  subscribers.forEach((f) => f());
}

export function markIntroPlayed() {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "played");
  } catch {
    // Private mode: the sunrise may play again on reload, which is harmless.
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("wellbeings:delete-all", () => {
    cache = null;
    try {
      window.sessionStorage.removeItem(INTRO_SESSION_KEY);
    } catch {
      // Nothing to clear.
    }
    subscribers.forEach((f) => f());
  });
}
