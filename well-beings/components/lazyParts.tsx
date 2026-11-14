"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";

/**
 * The parts of Arun that are not on the first screen, loaded as their own
 * files (Vercel's bundle-dynamic-imports rule): the wellbeing check and its
 * results, the Watch and Hope rooms, the daily plan, the game, and the
 * stage for One minute and the reel.
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
  game: () => import("./game/ScoopsGame"),
  minute: () => import("./minute/MinuteFlow"),
  reel: () => import("./minute/ReelFlow"),
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
/* The game is the biggest part by far and only for those who tap Play;
   it is fetched when idle like the rest, so it works offline once seen.
   If it cannot arrive, the same honest message, over the screen. */
function GameLoading() {
  return createPortal(
    <div className="game-loading" aria-busy="true">
      <span>Loading the city…</span>
    </div>,
    document.body,
  );
}
function GameOffline({ onClose }: { onClose: () => void; openUrgent: () => void }) {
  return createPortal(
    <div className="game-loading" role="status">
      <div style={{ maxWidth: 360, padding: 20, textAlign: "center" }}>
        <Unavailable />
        <button type="button" className="btn btn-quiet" onClick={onClose} style={{ color: "#FFD98A" }}>
          Back to Watch
        </button>
      </div>
    </div>,
    document.body,
  );
}
export const ScoopsGame = dynamic(
  () =>
    load
      .game()
      .then((m) => m.ScoopsGame)
      .catch(() => GameOffline),
  { loading: () => <GameLoading /> },
);

/* One minute and the reel. Their tiles and door are on Home, which is
   never split; what is split is the stage they open (and GSAP with it).
   Fetched when idle and again on a finger touching a tile, so a tap
   almost never waits. If it cannot arrive, the stage says so and the way
   back is one tap. */
function StageLoading() {
  return createPortal(
    <div className="game-loading stage-loading" aria-busy="true">
      <span className="sr-only">Loading…</span>
    </div>,
    document.body,
  );
}
function StageOffline({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div className="game-loading" role="status">
      <div style={{ maxWidth: 360, padding: 20, textAlign: "center" }}>
        <Unavailable />
        <button type="button" className="btn btn-quiet" onClick={onClose} style={{ color: "#FFD98A" }}>
          Back to Home
        </button>
      </div>
    </div>,
    document.body,
  );
}
export const MinuteFlow = dynamic(
  () =>
    load
      .minute()
      .then((m) => m.MinuteFlow)
      .catch(() => StageOffline as unknown as typeof import("./minute/MinuteFlow").MinuteFlow),
  { loading: () => <StageLoading /> },
);
export const ReelFlow = dynamic(
  () =>
    load
      .reel()
      .then((m) => m.ReelFlow)
      .catch(() => StageOffline as unknown as typeof import("./minute/ReelFlow").ReelFlow),
  { loading: () => <StageLoading /> },
);

let preloaded = false;
/** Fetch every split part once the phone is idle (bundle-preload, js-request-idle-callback). */
export function preloadParts() {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  const idle = (fn: () => void, timeout: number) => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(fn, { timeout });
    else setTimeout(fn, 600);
  };
  /* The stage for One minute and the reel brings GSAP with it (123 KB
     before compression). Fetched with the rest, it added about 80 ms of
     script on a phone slowed 4x to the second in which the page is still
     waking up (measured: 329 ms of script at load before it, 409 ms
     with). Nobody can tap a tension tile in that second, so it waits for
     a later idle moment, and a finger on a tile or the door fetches it at
     once anyway (preloadRoom). It is still here within a few seconds of a
     first visit, which is what makes it work offline afterwards. */
  /* One at a time, each in its own idle moment: together they were a
     single task of about 100 ms on that slowed phone. */
  const stage = () => {
    void load
      .minute()
      .catch(() => {})
      .then(() => idle(() => void load.reel().catch(() => {}), 2000));
  };
  idle(() => {
    for (const [name, f] of Object.entries(load)) if (name !== "minute" && name !== "reel") void f().catch(() => {});
  }, 1000);
  setTimeout(() => idle(stage, 3000), 3500);
}

/** A finger on a room's tab: fetch that room now (bundle-preload, on intent). */
export function preloadRoom(room: string) {
  if (room === "watch") void load.watch().catch(() => {});
  else if (room === "hope") void load.hope().catch(() => {});
  else if (room === "minute") void load.minute().catch(() => {});
  else if (room === "reel") void load.reel().catch(() => {});
}
