"use client";

import dynamic from "next/dynamic";

/**
 * The parts of Arun that are not on the first screen, loaded as their own
 * files (Vercel's bundle-dynamic-imports rule): the wellbeing check and its
 * results, the Watch and Hope rooms and the daily plan.
 * Less script to read before the first screen answers a tap. (Settings
 * stays in: it is on every screen, holds "Delete all my data", and must
 * open the instant it is tapped. So does the video sheet: small, and it
 * opens straight from a tap on Here.)
 *
 * NOT split, on purpose: Here, the Plan room's safety plan, Reach out, the
 * urgent screen and the help dialog. Those hold the plan, the people and
 * the helpline numbers, and must never wait on a network that may be gone.
 *
 * Every split part is fetched as soon as the phone is idle after the page
 * opens (preloadParts, within a second), and a room's part is fetched the
 * moment a finger touches its tab (preloadRoom), so it is almost always
 * already here; the service worker keeps it for offline use. If a tap does
 * beat it, a quiet placeholder holds the space. If it cannot arrive at all
 * (offline before it ever loaded), the place says so honestly and offers
 * to try again, instead of waiting for ever.
 */
const load = {
  chat: () => import("./ChatScreen"),
  results: () => import("./ResultsScreen"),
  watch: () => import("./haven/WatchTab"),
  hope: () => import("./haven/HopeTab"),
  daily: () => import("./AppScreen"),
};

function Loading({ tall = false }: { tall?: boolean }) {
  return (
    <div className="part-loading" aria-busy="true" style={{ minHeight: tall ? 420 : 160 }}>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/* Offline before this part ever arrived: say so, keep the way to the plan
   and the numbers open, and let it try again when the signal is back. */
function Unavailable() {
  return (
    <section className="panel part-offline" role="status">
      <h2 style={{ fontSize: 20, margin: 0 }}>This part needs a connection the first time</h2>
      <p className="panel-lede" style={{ margin: "8px 0 12px" }}>
        You&apos;re offline, and this part of Arun hasn&apos;t been saved to your phone yet. Your safety plan, your
        people and the helpline numbers work offline.
      </p>
      <button type="button" className="btn btn-sun" onClick={() => window.location.reload()}>
        Try again
      </button>
    </section>
  );
}
const or = <T,>(p: Promise<T>) => p.catch(() => Unavailable as unknown as T);

export const ChatScreen = dynamic(() => or(load.chat().then((m) => m.ChatScreen)), { loading: () => <Loading tall /> });
export const ResultsScreen = dynamic(() => or(load.results().then((m) => m.ResultsScreen)), { loading: () => <Loading tall /> });
export const WatchTab = dynamic(() => or(load.watch().then((m) => m.WatchTab)), { loading: () => <Loading tall /> });
export const HopeTab = dynamic(() => or(load.hope().then((m) => m.HopeTab)), { loading: () => <Loading tall /> });
export const AppScreen = dynamic(() => or(load.daily().then((m) => m.AppScreen)), { loading: () => <Loading tall /> });

let preloaded = false;
/** Fetch every split part once the phone is idle (bundle-preload, js-request-idle-callback). */
export function preloadParts() {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  const go = () => {
    for (const f of Object.values(load)) void f().catch(() => {});
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(go, { timeout: 1000 });
  else setTimeout(go, 600);
}

/** A finger on a room's tab: fetch that room now (bundle-preload, on intent). */
export function preloadRoom(room: string) {
  if (room === "watch") void load.watch().catch(() => {});
  else if (room === "hope") void load.hope().catch(() => {});
}
