"use client";

import { useSyncExternalStore } from "react";

/**
 * The install affordance.
 *
 * The app used to rely entirely on the browser's own install control, on the
 * reasoning that a "get our app" banner is exactly the wrong instinct for a
 * mental-health tool. That reasoning still holds for *banners*, which is why
 * this is a quiet card rather than anything that interrupts. What didn't hold
 * is the assumption that the browser's affordance is findable: Chrome puts an
 * install icon in the address bar, Brave deliberately doesn't and keeps it in
 * the ☰ menu, and on iOS there is no prompt at all.
 *
 * Two things this file gets right that the first version didn't:
 *
 * 1. The event is captured at MODULE level, not per component.
 *    `beforeinstallprompt` fires once, early, while someone is still on the
 *    welcome screen. A component that only mounts later (the Help tab lives
 *    behind a finished check-in) would never see it and would wrongly claim
 *    no prompt was available. Capturing on import and holding the event means
 *    whichever card mounts, whenever, gets the real state.
 *
 * 2. It renders in both places — the front door and Help — because the Help
 *    tab is unreachable until the five-minute check-in is done, so putting it
 *    there alone hid it from exactly the person who wants to install it.
 *
 * Three honest states, and it never lies about which one you're in:
 *   installed  already running standalone, so there is nothing to offer.
 *   ready      Chromium handed us a prompt; one tap installs.
 *   manual     no prompt is coming, so name the real menu path rather than
 *              show a button that would do nothing.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type State = "installed" | "ready" | "manual";

/* ── module-level capture ─────────────────────────────────────────────── */

let deferred: BeforeInstallPromptEvent | null = null;
let installedFlag = false;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((f) => f());
}

function standalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari predates display-mode and uses a non-standard navigator flag.
  const ios = (window.navigator as { standalone?: boolean }).standalone === true;
  return window.matchMedia?.("(display-mode: standalone)").matches || ios;
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Holding it is the whole point: without preventDefault the browser may
    // discard it, and then the button below would have nothing to replay.
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installedFlag = true;
    deferred = null;
    notify();
  });
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/** Server snapshot is "manual": the safe, non-committal state, and it means
    the markup never claims a prompt exists before the client knows. */
function snapshot(): State {
  if (installedFlag || standalone()) return "installed";
  return deferred ? "ready" : "manual";
}

function useInstallState(): State {
  return useSyncExternalStore(subscribe, snapshot, () => "manual" as State);
}

/* The hint depends on navigator, which the server doesn't have. Rendering it
   directly produced a hydration mismatch (React #418): the server emitted an
   empty string and the client emitted the real instruction. Routing it through
   the same store gives React an explicit server snapshot to hydrate against
   and a client value to swap in afterwards, which is exactly what this API is
   for. `noopSubscribe` is module-level so its identity is stable across
   renders and React never resubscribes. */
const noopSubscribe = () => () => {};

function useManualHint(): string {
  return useSyncExternalStore(noopSubscribe, manualHint, () => "");
}

/** The menu path differs per browser, and a wrong instruction is worse than
    none — so this only names a path when the browser is actually identifiable. */
function manualHint(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "On iPhone or iPad: tap Share, then “Add to Home Screen”.";
  // Brave copies Chrome's user-agent, so the navigator.brave probe is the only
  // reliable way to tell them apart and not send you to the wrong menu.
  if ("brave" in navigator)
    return "In Brave: open the ☰ menu (top right), then “Install Well-Beings…”. Brave keeps it there instead of in the address bar. On Brave for Android it's ⋮ → “Add to Home screen”.";
  if (/Firefox\//.test(ua))
    return "Firefox on desktop doesn’t install web apps. Chrome, Edge or Brave will, and Firefox on Android does it via ⋮ → Install.";
  if (/Edg\//.test(ua)) return "In Edge: ⋯ menu → Apps → “Install this site as an app”.";
  if (/Chrome\//.test(ua))
    return "In Chrome: the install icon in the address bar, or ⋮ menu → Cast, save and share → “Install page as app”.";
  return "Look for “Install” or “Add to Home Screen” in your browser’s menu.";
}

/* ── component ────────────────────────────────────────────────────────── */

export function InstallApp({
  tourAnchor = "install-app",
  compact = false,
}: {
  /** Distinct anchors so the welcome tour and the app tour can each point at
      their own copy without the spotlight finding the wrong one. */
  tourAnchor?: string;
  /** The welcome screen's right column is 320px, so it gets the short copy. */
  compact?: boolean;
}) {
  const state = useInstallState();
  const hint = useManualHint();

  async function install() {
    if (!deferred) return;
    const e = deferred;
    await e.prompt();
    const { outcome } = await e.userChoice;
    // Single-use: once shown it cannot be replayed, so drop it and fall back
    // to the manual path rather than leaving a button that silently no-ops.
    deferred = null;
    if (outcome === "accepted") installedFlag = true;
    notify();
  }

  return (
    <div className="card" data-tour={tourAnchor} style={{ padding: compact ? 16 : 20, marginBottom: 18 }}>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 500,
          fontSize: compact ? 14 : 15,
          marginBottom: 8,
        }}
      >
        Install it as an app
      </div>

      {state === "installed" ? (
        <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", textWrap: "pretty" }}>
          Already installed. You’re running it as an app right now, which is why there’s no address bar.
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--color-neutral-400)",
              marginBottom: 12,
              textWrap: "pretty",
            }}
          >
            {compact
              ? "Runs from your home screen in its own window, works with no connection, and still keeps everything on this device."
              : "Adds it to your home screen or dock and opens it in its own window, with no address bar. It still runs entirely on this device and still works with no connection. Installing changes nothing about what it stores or sends, which is nothing either way."}
          </div>

          {state === "ready" ? (
            <button className="btn btn-primary" onClick={install} style={{ fontSize: 12.5 }}>
              Install Well-Beings
            </button>
          ) : (
            <div
              style={{
                fontSize: 12,
                color: "var(--color-neutral-500)",
                borderLeft: "2px solid var(--color-accent-800)",
                paddingLeft: 10,
                textWrap: "pretty",
              }}
            >
              {hint}
            </div>
          )}
        </>
      )}
    </div>
  );
}
