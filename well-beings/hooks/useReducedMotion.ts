"use client";

import { useSyncExternalStore } from "react";

/**
 * `prefers-reduced-motion`, read as an external store rather than into state.
 *
 * The server has no matchMedia, so computing this during render would make the
 * first client render disagree with the server markup for exactly the people
 * who set the preference. useSyncExternalStore is built for this: it takes a
 * separate server snapshot (false), then subscribes for real.
 *
 * Shared by the statement deck and the tour — both auto-advance on a timer,
 * and both must stop doing that when someone has asked for less motion. The
 * SSR-safety reasoning is the whole point of this file, so it lives once.
 */
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia?.(MOTION_QUERY);
  if (!mq) return () => {};
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(MOTION_QUERY).matches ?? false,
    () => false
  );
}
