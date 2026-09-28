"use client";

/**
 * When the opening sunrise plays: every time someone opens Arun.
 *
 * The owner's rule, matching Ronak: the sunrise is permanent. There is no
 * switch to turn it off (the one that briefly existed is gone, and any
 * "off" it left on a device is cleared, so nobody is stuck without it);
 * "Skip" and "Without music" are on its first frame for anyone who wants
 * to be straight in.
 *
 * "Opening" means a visit, and a visit is either of these:
 *   - a new tab or a fresh launch of the installed app (sessionStorage is
 *     empty), or
 *   - coming back after AWAY_MS or more away. An installed app on an
 *     iPhone or iPad is rarely closed, only sent to the background, so
 *     going by the tab alone meant the sunrise hardly ever played there.
 * A reload, or moving between rooms, does not replay it.
 *
 * Two notes in sessionStorage, gone when the tab or app is closed:
 *   arun-intro-session "played": the sunrise has run in this visit.
 *   arun-intro-left: when the page was last hidden (ms since 1970).
 *
 * The one exception is safety, and it is deliberate: for three days after
 * a check-in reporting thoughts of suicide or not feeling safe, the plan
 * and the numbers come first, not an animation with a button in front of
 * them. The same rule is in INTRO_BOOTSTRAP in app/page.tsx, which makes
 * the first-paint decision from these same keys so nothing flashes.
 */
export const INTRO_KEY = "arun-intro-v1";
export const INTRO_SESSION_KEY = "arun-intro-session";
export const INTRO_LEFT_KEY = "arun-intro-left";
export const AWAY_MS = 20 * 60_000;

export function markIntroPlayed() {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "played");
    window.sessionStorage.removeItem(INTRO_LEFT_KEY);
  } catch {
    // Private mode: the sunrise may play again on reload, which is harmless.
  }
}

/** A check-in in the last three days reported thoughts of suicide or not feeling safe. */
export function introPausedForSafety(): boolean {
  try {
    const s = JSON.parse(window.localStorage.getItem("wellbeings-safe-v1") || "null");
    const a: { at?: string; safety?: string }[] = s && Array.isArray(s.arrivals) ? s.arrivals : [];
    const cut = Date.now() - 3 * 864e5;
    for (let i = a.length - 1; i >= 0; i--) {
      const x = a[i] || {};
      if (Date.parse(x.at ?? "") < cut) break;
      if (x.safety === "thoughts" || x.safety === "unsafe") return true;
    }
  } catch {
    // Unreadable: no reason to hold the sunrise back.
  }
  return false;
}

/**
 * Coming back to the page. Records when it was hidden, and on the way back
 * says whether it was away long enough to count as opening Arun again.
 */
export function watchReturns(onReturn: () => void): () => void {
  const onChange = () => {
    try {
      if (document.hidden) {
        window.sessionStorage.setItem(INTRO_LEFT_KEY, String(Date.now()));
        return;
      }
      const left = Number(window.sessionStorage.getItem(INTRO_LEFT_KEY));
      if (!left || Date.now() - left < AWAY_MS) return;
      window.sessionStorage.removeItem(INTRO_SESSION_KEY);
      window.sessionStorage.removeItem(INTRO_LEFT_KEY);
    } catch {
      return;
    }
    if (document.documentElement.dataset.intro === "pending" || introPausedForSafety()) return;
    onReturn();
  };
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

if (typeof window !== "undefined") {
  /* The off switch is gone; so is anything it left behind. */
  try {
    window.localStorage.removeItem(INTRO_KEY);
  } catch {
    // Nothing to clear.
  }
  window.addEventListener("wellbeings:delete-all", () => {
    try {
      window.sessionStorage.removeItem(INTRO_SESSION_KEY);
      window.sessionStorage.removeItem(INTRO_LEFT_KEY);
    } catch {
      // Nothing to clear.
    }
  });
}
