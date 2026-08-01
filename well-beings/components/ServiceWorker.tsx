"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker.
 *
 * Scope is derived from the document's own base path rather than hardcoded,
 * so this works at the root locally and under /Well-beings/ on Pages.
 *
 * Deliberately silent: no "install our app" banner. The evidence on app
 * retention says nagging is not what keeps people around, and a mental-health
 * tool interrupting someone to promote itself is exactly the wrong instinct.
 * The browser's own install affordance is enough.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // isSecureContext covers https plus the loopback origins browsers already
    // treat as secure (localhost, 127.0.0.1, ::1) — checking the hostname by
    // hand missed those and silently skipped registration.
    if (!window.isSecureContext) return;

    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const register = () => {
      navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {
        // Offline support is a bonus; the app is fully usable without it.
      });
    };

    // Wait for load so registration never competes with first paint.
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
