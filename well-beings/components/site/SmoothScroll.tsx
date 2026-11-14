"use client";

import { useEffect } from "react";

/**
 * Eased wheel scrolling on the long reading pages, for a mouse only.
 *
 * Lenis (darkroomengineering/lenis, MIT), added in November 2026 at the
 * owner's request to use it. It is decoration, so it is kept where
 * decoration is harmless and nowhere else:
 *
 *   - Only the guides and About (PageShell decides). Never the app at "/",
 *     which is a check-in, a safety plan and helplines; never Support
 *     lines; never a page someone may be crossing in a hurry.
 *   - Only for a mouse or trackpad (hover: hover, pointer: fine). A finger
 *     keeps the phone's own scrolling, which Lenis leaves alone anyway.
 *   - Never under prefers-reduced-motion, and it is torn down if that is
 *     switched on while the page is open.
 *   - Fetched when the page is idle, as its own small file, so the reading
 *     pages stay as light on first paint as they were (they are the pages a
 *     search engine samples).
 *   - In-page links are left to the browser (anchors off): the skip link
 *     must move focus as well as the scroll, and only the browser's own
 *     jump does both.
 *
 * Lenis animates the real scroll position rather than faking one, so
 * sticky headers, find-in-page and Ooh's narrator bar (which does its
 * arithmetic on scrollY) behave as before.
 */
export function SmoothScroll() {
  useEffect(() => {
    const mouse = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mouse.matches || still.matches) return;
    let lenis: { destroy: () => void } | null = null;
    let gone = false;
    const start = () => {
      void import("lenis")
        .then(({ default: Lenis }) => {
          if (gone || still.matches) return;
          lenis = new Lenis({ autoRaf: true, anchors: false });
        })
        .catch(() => {
          /* Offline before it was ever fetched: the page scrolls as pages do. */
        });
    };
    const ric = typeof window.requestIdleCallback === "function";
    const idle = ric ? window.requestIdleCallback(start, { timeout: 2000 }) : window.setTimeout(start, 800);
    const stop = () => {
      if (!still.matches) return;
      lenis?.destroy();
      lenis = null;
    };
    still.addEventListener("change", stop);
    return () => {
      gone = true;
      if (ric) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      still.removeEventListener("change", stop);
      lenis?.destroy();
    };
  }, []);
  return null;
}
