"use client";

/**
 * A light physical tick for taps, room changes and Ooh's new lines.
 *
 * Two ways a phone can be made to tick from a web page, and only two:
 *
 *   navigator.vibrate(): Android and most other browsers. Works for any
 *   tap, and after the first tap for scrolling too (the browser remembers
 *   the page has been interacted with).
 *
 *   iPhone and iPad have no vibrate(). Since Safari 17.4, toggling an
 *   <input type="checkbox" switch> gives the system haptic, and it does so
 *   only inside a tap. So on Apple devices there is a tick for taps and
 *   none while scrolling; nothing a web page can do changes that.
 *
 * Kept deliberately small (8 to 14 ms): a nudge that says "that happened",
 * never a buzz. Rate-limited so a long scroll is not a drum roll. Off in
 * Settings under "Vibration", remembered as arun-haptics-v1 = "off".
 */
export const HAPTICS_KEY = "arun-haptics-v1";

export type TickKind = "light" | "select" | "success";
const PATTERNS: Record<TickKind, number | number[]> = {
  light: 8,
  select: 12,
  success: [12, 70, 18],
};
const MIN_GAP_MS = 60;

let cache: boolean | null = null;
let lastAt = 0;
let iosSwitch: HTMLLabelElement | null = null;
const subscribers = new Set<() => void>();

export function subscribeHaptics(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function hapticsWanted(): boolean {
  if (cache !== null) return cache;
  try {
    cache = window.localStorage.getItem(HAPTICS_KEY) !== "off";
  } catch {
    cache = true;
  }
  return cache;
}

export function setHapticsWanted(on: boolean) {
  cache = on;
  try {
    if (on) window.localStorage.removeItem(HAPTICS_KEY);
    else window.localStorage.setItem(HAPTICS_KEY, "off");
  } catch {
    // Not remembered; applies to this visit.
  }
  subscribers.forEach((f) => f());
  if (on) tick("success");
}

function appleSwitch(): HTMLLabelElement | null {
  if (iosSwitch) return iosSwitch;
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.id = "arun-haptic-switch";
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  const label = document.createElement("label");
  label.htmlFor = input.id;
  label.setAttribute("aria-hidden", "true");
  const wrap = document.createElement("div");
  wrap.className = "haptic-switch";
  wrap.style.cssText = "position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);opacity:0;pointer-events:none;left:-9999px;top:0";
  wrap.append(input, label);
  /* The page never hears these clicks: they are not the person's. */
  wrap.addEventListener("click", (e) => e.stopPropagation());
  document.body.append(wrap);
  iosSwitch = label;
  return label;
}

/* Clicking a label in Safari also FOCUSES its control. That was the bug
   behind "Ooh's Go to Hope does nothing" on iPhone and iPad: every tap
   ticked this switch, focus landed on a hidden <input>, Ooh took that for
   typing and put the narrator bar away in the middle of the tap, and the
   tap arrived at a button that no longer existed. So focus goes straight
   back to wherever it was, and nothing on the page ever sees it move. */
function clickKeepingFocus(label: HTMLLabelElement) {
  const before = document.activeElement as HTMLElement | null;
  label.click();
  const input = label.control;
  if (input && document.activeElement === input) {
    if (before && before !== document.body && before.isConnected) before.focus({ preventScroll: true });
    else input.blur();
  }
}

/** A tick, if the person wants them and the device can. */
export function tick(kind: TickKind = "select") {
  if (typeof window === "undefined" || !hapticsWanted()) return;
  const now = Date.now();
  if (now - lastAt < MIN_GAP_MS) return;
  lastAt = now;
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(PATTERNS[kind]);
      return;
    }
    /* Apple: only inside a tap, or it does nothing (and costs nothing). */
    const active = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation?.isActive;
    const sw = active ? appleSwitch() : null;
    if (sw) clickKeepingFocus(sw);
  } catch {
    // No haptics here. The visual feedback carries it.
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("wellbeings:delete-all", () => {
    cache = null;
    subscribers.forEach((f) => f());
  });
}
