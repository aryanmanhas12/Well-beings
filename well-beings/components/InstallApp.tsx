"use client";

import { useEffect, useState } from "react";

/**
 * The install affordance.
 *
 * The app used to rely entirely on the browser's own install control, on the
 * reasoning that a "get our app" banner is exactly the wrong instinct for a
 * mental-health tool. That reasoning still holds for *banners* and it is why
 * this is a quiet row in Help rather than anything that interrupts. What
 * didn't hold is the assumption that the browser's affordance is findable:
 * Chrome puts an install icon in the address bar, but Brave hides it behind
 * the ⋮ menu, and on iOS there is no prompt at all — Safari requires Share ▸
 * Add to Home Screen, which nobody discovers by accident.
 *
 * So there are three states, and the component never lies about which one
 * you're in:
 *
 *   installed  — already running standalone, so there is nothing to do.
 *   ready      — Chromium fired beforeinstallprompt; one tap installs.
 *   manual     — no prompt is coming (Safari, Firefox, or Chromium that has
 *                not yet decided you're engaged enough). Show the real menu
 *                path instead of a button that would do nothing.
 *
 * `beforeinstallprompt` is Chromium-only and fires once. It has to be
 * captured and preventDefault()'d the moment it arrives, or the browser may
 * discard it, which is why the listener is registered in an effect on mount
 * rather than lazily when someone opens Help.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type State = "installed" | "ready" | "manual";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari predates display-mode and uses a non-standard navigator flag.
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return window.matchMedia?.("(display-mode: standalone)").matches || iosStandalone;
}

/** The menu path differs per browser, and a wrong instruction is worse than
    none — so this only names a path when the browser is actually identifiable. */
function manualHint(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  // Brave ships a navigator.brave probe; it is the only reliable way to tell
  // it apart from Chrome, whose user-agent it deliberately mimics.
  const isBrave = "brave" in navigator;
  if (isIOS) return "On iPhone or iPad: tap Share, then “Add to Home Screen”.";
  if (isBrave) return "In Brave: open the ☰ menu, then “Install Well-Beings…”. Brave keeps it there rather than in the address bar.";
  if (/Firefox\//.test(ua)) return "Firefox on desktop doesn’t install web apps. Chrome, Edge or Brave will, and so will Firefox on Android via ⋮ → Install.";
  if (/Edg\//.test(ua)) return "In Edge: ⋯ menu → Apps → “Install this site as an app”.";
  if (/Chrome\//.test(ua)) return "In Chrome: ⋮ menu → Cast, save and share → “Install page as app”, or use the install icon in the address bar.";
  return "Look for “Install” or “Add to Home Screen” in your browser’s menu.";
}

export function InstallApp() {
  const [state, setState] = useState<State>("manual");
  const [hint, setHint] = useState("");
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (isStandalone()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("installed");
      return;
    }
    setHint(manualHint());

    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep it, so the button below can replay it later
      setPrompt(e as BeforeInstallPromptEvent);
      setState("ready");
    };
    const onInstalled = () => {
      setState("installed");
      setPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    // The event is single-use: once shown, it cannot be replayed, so drop it
    // and fall back to the manual path rather than leaving a dead button.
    setPrompt(null);
    if (outcome === "accepted") {
      setState("installed");
    } else {
      setState("manual");
      setResult("No problem. You can install it later from your browser’s menu.");
    }
  }

  return (
    <div className="card" data-tour="install-app" style={{ padding: 20, marginBottom: 18 }}>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 8 }}>
        Install it as an app
      </div>

      {state === "installed" ? (
        <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", textWrap: "pretty" }}>
          Already installed. You’re running it as an app right now, which is why there’s no browser bar.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginBottom: 12, textWrap: "pretty" }}>
            Adds it to your home screen or dock and opens it in its own window, with no address bar. It still
            runs entirely on this device, still works with no connection, and installing changes nothing about
            what it stores or sends. Nothing is sent either way.
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

          {result && (
            <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)", marginTop: 10 }}>{result}</div>
          )}
        </>
      )}
    </div>
  );
}
