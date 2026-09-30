"use client";

/**
 * When the opening sunrise plays: every time someone opens Arun.
 *
 * The owner's rule, matching Ronak: the sunrise is permanent and shows on
 * every visit, each time with a new line (lib/introLines.ts). It is never
 * forced on anyone: "Skip", "Need help now" and "Without music" are on its
 * first frame, and Escape closes it. There is no switch to turn it off (the
 * one that briefly existed is gone, and any "off" it left is cleared).
 *
 * A visit is either of these:
 *   - loading the page at all: a new tab, a fresh launch of the installed
 *     app, or a reload. (A reload used not to count; the owner kept opening
 *     Arun that way and finding no sunrise, so now it counts.)
 *   - coming back after AWAY_MS or more away. An installed app on an iPhone
 *     or iPad is rarely closed, only sent to the background, so going by
 *     loads alone meant the sunrise hardly ever played there. This was 20
 *     minutes; "every time I open it" meant far sooner, so it is now two.
 * Moving between rooms, or to a guide and back, does not replay it.
 *
 * Coming back does NOT replay it when the person left for something Arun
 * sent them to: a helpline call or text (a tel: or sms: link), or the
 * camera or photo picker for the hope box. Someone returning from a crisis
 * call should land where they were, not on a sunrise with a button in
 * front of it. Nor while the urgent screen is open.
 *
 * The other exception is safety, and it is deliberate: for three days after
 * a check-in reporting thoughts of suicide or not feeling safe, the plan
 * and the numbers come first, not an animation. The same rule is in
 * INTRO_BOOTSTRAP in app/page.tsx, which decides before the first paint so
 * nothing flashes.
 *
 * sessionStorage, gone when the tab or app is closed:
 *   arun-intro-left: when the page was last hidden (ms since 1970).
 *   arun-intro-hold: set when leaving for a call, a text or the camera.
 *   arun-intro-session: only the end-to-end tests set it ("e2e"), so their
 *     suites start past the sunrise; the app itself never reads another value.
 */
export const INTRO_KEY = "arun-intro-v1";
export const INTRO_SESSION_KEY = "arun-intro-session";
export const INTRO_LEFT_KEY = "arun-intro-left";
export const INTRO_HOLD_KEY = "arun-intro-hold";
export const AWAY_MS = 2 * 60_000;

export function markIntroPlayed() {
  try {
    window.sessionStorage.removeItem(INTRO_LEFT_KEY);
    window.sessionStorage.removeItem(INTRO_HOLD_KEY);
  } catch {
    // Private mode: nothing to tidy.
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

/* Leaving for a call, a text or the camera: remember it, so coming back is
   not treated as opening Arun again. */
const LEAVES_FOR = "a[href^='tel:'], a[href^='sms:'], input[type='file']";
function noteLeavingFor(e: Event) {
  if (!(e.target as Element | null)?.closest?.(LEAVES_FOR)) return;
  try {
    window.sessionStorage.setItem(INTRO_HOLD_KEY, "1");
  } catch {
    // Not remembered: at worst the sunrise plays on the way back, with Skip.
  }
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
      const held = window.sessionStorage.getItem(INTRO_HOLD_KEY) === "1";
      window.sessionStorage.removeItem(INTRO_HOLD_KEY);
      if (!left || Date.now() - left < AWAY_MS || held) return;
      window.sessionStorage.removeItem(INTRO_LEFT_KEY);
    } catch {
      return;
    }
    if (document.documentElement.dataset.intro === "pending" || document.querySelector(".urgent") || introPausedForSafety()) return;
    onReturn();
  };
  document.addEventListener("visibilitychange", onChange);
  document.addEventListener("click", noteLeavingFor, true);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
    document.removeEventListener("click", noteLeavingFor, true);
  };
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
      window.sessionStorage.removeItem(INTRO_LEFT_KEY);
      window.sessionStorage.removeItem(INTRO_HOLD_KEY);
    } catch {
      // Nothing to clear.
    }
  });
}
