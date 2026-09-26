"use client";

import { useState, useSyncExternalStore } from "react";
import { ArunMark } from "./ArunMark";
import { INSTALL_KEY, SNOOZE_DAYS } from "@/lib/install";

/**
 * Installing Arun as an app.
 *
 * A "get our app" banner is the wrong instinct for a mental-health tool,
 * which is why none of this interrupts: a quiet card on the Here tab that
 * one tap puts away for a month, and a row in Settings that is always there.
 * What did not hold was the assumption that the browser's own install
 * control is findable. Chrome puts an icon in the address bar, Brave keeps
 * it in the menu, iOS has no prompt at all, and Instagram's in-app browser,
 * where a lot of people will first open this from Aryan's posts, cannot
 * install anything.
 *
 * The `beforeinstallprompt` event is captured at MODULE level, not per
 * component. It fires once, early, and a card that mounts later (Settings,
 * the daily plan's Help tab) would otherwise never see it and wrongly say
 * no prompt was available.
 *
 * Three honest states, and it never lies about which one you are in:
 *   installed  already running standalone, so there is nothing to offer.
 *   ready      the browser handed over a prompt; one tap installs.
 *   manual     no prompt is coming, so name the real steps for this browser
 *              rather than show a button that would do nothing.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState = "installed" | "ready" | "manual";
type Platform = "ios" | "in-app" | "brave" | "firefox" | "edge" | "chrome" | "other";

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
    // Without preventDefault the browser may discard it, and the button
    // would have nothing to replay.
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

function snapshot(): InstallState {
  if (installedFlag || standalone()) return "installed";
  return deferred ? "ready" : "manual";
}

/* Everything that reads navigator or storage goes through
   useSyncExternalStore with an explicit server value. Rendering it directly
   produced a hydration mismatch once already (React #418). */
const noopSubscribe = () => () => {};

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  /* In-app browsers first: they carry Safari's or Chrome's user agent too,
     and sending someone to a Share menu that has no "Add to Home Screen"
     is worse than no instruction. */
  if (/Instagram|FBAN|FBAV|FB_IAB|Line\/|Snapchat|LinkedInApp/i.test(ua)) return "in-app";
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  // Brave copies Chrome's user agent; the navigator.brave probe is the only
  // reliable way to tell them apart.
  if ("brave" in navigator) return "brave";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Edg\//.test(ua)) return "edge";
  if (/Chrome\//.test(ua)) return "chrome";
  return "other";
}

let platformCache: Platform | null = null;
function platformSnapshot(): Platform {
  return (platformCache ??= detectPlatform());
}

function snoozedSnapshot(): boolean {
  try {
    const at = JSON.parse(window.localStorage.getItem(INSTALL_KEY) || "null")?.notNowAt;
    return typeof at === "string" && Date.now() - Date.parse(at) < SNOOZE_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

export function useInstall() {
  const state = useSyncExternalStore(subscribe, snapshot, () => "manual" as InstallState);
  const platform = useSyncExternalStore(noopSubscribe, platformSnapshot, () => null);
  /* Server value true: the Here card is simply absent from the static HTML
     and appears once the client knows it has not been put away. */
  const snoozed = useSyncExternalStore(subscribe, snoozedSnapshot, () => true);

  async function install(): Promise<boolean> {
    if (!deferred) return false;
    const e = deferred;
    await e.prompt();
    const { outcome } = await e.userChoice;
    // Single use: once shown it cannot be replayed, so drop it and fall back
    // to the manual steps rather than leave a button that silently no-ops.
    deferred = null;
    if (outcome === "accepted") installedFlag = true;
    notify();
    return outcome === "accepted";
  }

  function notNow() {
    try {
      window.localStorage.setItem(INSTALL_KEY, JSON.stringify({ notNowAt: new Date().toISOString() }));
    } catch {
      // Not remembered; it still goes away for this visit.
    }
    notify();
  }

  return { state, platform, snoozed, install, notNow };
}

/* ── the steps, per browser ───────────────────────────────────────────── */

function ShareGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: "-2px" }}>
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

function Steps({ platform }: { platform: Platform | null }) {
  if (!platform) return null;
  if (platform === "ios")
    return (
      <ol className="install-steps">
        <li>
          Tap <strong>Share</strong> <ShareGlyph /> at the bottom of Safari (top right on iPad).
        </li>
        <li>
          Scroll down and choose <strong>Add to Home Screen</strong>.
        </li>
        <li>
          Tap <strong>Add</strong>. Arun appears on your home screen with the sunrise icon.
        </li>
      </ol>
    );
  if (platform === "in-app")
    return (
      <ol className="install-steps">
        <li>This page is open inside another app, which can&apos;t install anything.</li>
        <li>
          Tap the <strong>⋯</strong> menu and choose <strong>Open in browser</strong> (Chrome or Safari).
        </li>
        <li>Come back to this card there, and install from it.</li>
      </ol>
    );
  const line: Record<Exclude<Platform, "ios" | "in-app">, string> = {
    brave: "In Brave: open the ☰ menu, then “Install Arun”. On Android it's ⋮ → “Add to Home screen”.",
    firefox: "Firefox on a computer can't install web apps; Chrome, Edge or Brave can. On Android: ⋮ → “Install”.",
    edge: "In Edge: ⋯ menu → Apps → “Install this site as an app”.",
    chrome: "In Chrome: the install icon at the right of the address bar, or ⋮ menu → “Add to Home screen” / “Install”.",
    other: "Look for “Install” or “Add to Home Screen” in your browser's menu.",
  };
  return <p className="install-hint">{line[platform]}</p>;
}

function AppTile() {
  return (
    <span className="install-tile" aria-hidden="true">
      <ArunMark width={40} frame="#FFF1DE" />
    </span>
  );
}

/* ── the Here tab card ────────────────────────────────────────────────── */

export function InstallPanel({ style }: { style?: React.CSSProperties }) {
  const { state, platform, snoozed, install, notNow } = useInstall();
  const [done, setDone] = useState(false);

  if (done)
    return (
      <section className="panel install-panel" aria-labelledby="install-title" style={style}>
        <h2 id="install-title">Arun is on your home screen</h2>
        <p className="saved-note" role="status" style={{ fontSize: 14 }}>
          Open it from there any time. Everything you keep stays on this phone, as before.
        </p>
      </section>
    );
  if (state === "installed" || snoozed) return null;

  return (
    <section className="panel install-panel" aria-labelledby="install-title" style={style}>
      <div className="install-head">
        <AppTile />
        <h2 id="install-title">Keep Arun on your home screen</h2>
      </div>
      <p className="panel-lede">
        One tap away on a hard day, in its own quiet window. It works with no signal, and installing changes nothing
        about what it keeps: everything still stays on this phone.
      </p>
      {state === "manual" && <Steps platform={platform} />}
      <div className="btn-row" style={{ marginTop: 12 }}>
        {state === "ready" && (
          <button type="button" className="btn btn-sun" onClick={async () => setDone(await install())}>
            Install Arun
          </button>
        )}
        <button type="button" className="btn btn-quiet" onClick={notNow}>
          Not now
        </button>
      </div>
    </section>
  );
}

/* ── the Settings row, always there ───────────────────────────────────── */

export function InstallRow() {
  const { state, platform, install } = useInstall();
  return (
    <div className="install-row" role="group" aria-labelledby="install-row-title">
      <div className="install-head">
        <AppTile />
        <div>
          <p id="install-row-title" style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            Install Arun as an app
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--color-neutral-600)" }}>
            {state === "installed" ? "Installed. You're using the app right now." : "Home screen, its own window, works offline."}
          </p>
        </div>
      </div>
      {state === "ready" && (
        <button type="button" className="btn btn-sun" onClick={() => void install()} style={{ marginTop: 10 }}>
          Install Arun
        </button>
      )}
      {state === "manual" && <Steps platform={platform} />}
    </div>
  );
}

/* ── the daily plan's Help tab keeps its card ─────────────────────────── */

export function InstallApp() {
  return (
    <div className="card" data-tour="install-app" style={{ padding: 20, marginBottom: 18 }}>
      <InstallRow />
    </div>
  );
}
