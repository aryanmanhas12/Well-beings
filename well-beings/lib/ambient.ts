"use client";

import { BELL_NOTES, CHORD_SECONDS, createAmbient } from "./ambient-core.mjs";

/**
 * The music player: one AudioContext for the whole visit, and the rules
 * for when it plays.
 *
 * It plays when all of these hold:
 *   - the person has not turned it off (arun-sound-v1, "off" when off);
 *   - they have tapped or pressed a key once, because browsers refuse to
 *     start sound before that, and a page that makes noise the instant it
 *     opens is the wrong first impression for this app anyway;
 *   - the tab is visible;
 *   - nothing is holding it: a video playing (two soundtracks at once), or
 *     the microphone listening (it would transcribe the music).
 *
 * It starts silent and fades in over six seconds, and fades out over about
 * two when anything above stops holding. It lives at module level, so
 * moving between pages inside the app never restarts it.
 *
 * On iPhone and iPad web audio follows the ring/silent switch. That is left
 * alone on purpose: someone who has silenced their phone meant it.
 */

export const SOUND_KEY = "arun-sound-v1";
const VOLUME = 0.7;
const LOOKAHEAD = 30;

type Engine = ReturnType<typeof createAmbient>;

let ctx: AudioContext | null = null;
let engine: Engine | null = null;
let unlocked = false;
let nextChord = 0;
let chordIndex = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let suspendTimer: ReturnType<typeof setTimeout> | null = null;
const holds = new Set<string>();
const subscribers = new Set<() => void>();
let prefCache: boolean | null = null;

function notify() {
  subscribers.forEach((f) => f());
}

export function subscribeSound(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/** Whether the person wants music. On unless they turned it off. */
export function soundWanted(): boolean {
  if (prefCache !== null) return prefCache;
  try {
    prefCache = window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    prefCache = true;
  }
  return prefCache;
}

export function setSoundWanted(on: boolean) {
  prefCache = on;
  try {
    if (on) window.localStorage.removeItem(SOUND_KEY);
    else window.localStorage.setItem(SOUND_KEY, "off");
  } catch {
    // Not remembered; it still applies for this visit.
  }
  /* Turning it on is itself a tap, which is all a browser asks for. */
  if (on) unlocked = true;
  update();
  notify();
}

/** For "Delete all my data": forget the preference in memory too. */
export function resetSoundPref() {
  prefCache = null;
  update();
  notify();
}

export function hold(reason: string) {
  holds.add(reason);
  update();
}

export function release(reason: string) {
  holds.delete(reason);
  update();
}

function shouldPlay() {
  return unlocked && soundWanted() && holds.size === 0 && typeof document !== "undefined" && !document.hidden;
}

function schedule() {
  if (!ctx || !engine) return;
  if (ctx.state === "running") {
    if (nextChord < ctx.currentTime) nextChord = ctx.currentTime + 0.1;
    while (nextChord < ctx.currentTime + LOOKAHEAD) {
      engine.chord(nextChord, chordIndex++);
      /* One or two bowl tones inside each chord, at unhurried moments. */
      const bells = Math.random() < 0.55 ? 1 : 2;
      for (let b = 0; b < bells; b++) {
        engine.bell(nextChord + 3 + Math.random() * (CHORD_SECONDS - 5), BELL_NOTES[Math.floor(Math.random() * BELL_NOTES.length)]);
      }
      nextChord += CHORD_SECONDS;
    }
  }
  timer = setTimeout(schedule, 5000);
}

function update() {
  if (typeof window === "undefined") return;
  const play = shouldPlay();
  if (play) {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      try {
        ctx = new AC({ latencyHint: "playback" });
      } catch {
        return;
      }
      engine = createAmbient(ctx);
    }
    if (suspendTimer) {
      clearTimeout(suspendTimer);
      suspendTimer = null;
    }
    void ctx.resume().then(() => {
      if (!ctx || !engine || !shouldPlay()) return;
      const g = engine.out.gain;
      g.cancelScheduledValues(ctx.currentTime);
      g.setValueAtTime(g.value, ctx.currentTime);
      g.linearRampToValueAtTime(VOLUME, ctx.currentTime + 6);
      if (!timer) schedule();
      notify();
    });
  } else if (ctx && engine && ctx.state === "running") {
    const g = engine.out.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.setTargetAtTime(0, ctx.currentTime, 0.5);
    if (suspendTimer) clearTimeout(suspendTimer);
    suspendTimer = setTimeout(() => {
      suspendTimer = null;
      if (!shouldPlay() && ctx) {
        void ctx.suspend();
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        notify();
      }
    }, 2500);
  }
}

/** Whether sound is actually coming out right now. */
export function soundPlaying(): boolean {
  return !!ctx && ctx.state === "running" && shouldPlay();
}

/** A single soft bowl tone, for Ooh's bubbles. Only when music is playing. */
export function chime() {
  if (!ctx || !engine || !soundPlaying()) return;
  engine.bell(ctx.currentTime + 0.05, BELL_NOTES[Math.floor(Math.random() * 3) + 2], 0.022);
}

/* The first tap or key anywhere is the browser's permission to make sound.
   Several event types, because iOS unlocks audio on touchend and click but
   not on pointerdown. */
if (typeof window !== "undefined") {
  const unlock = () => {
    unlocked = true;
    update();
    notify();
    for (const t of ["pointerup", "touchend", "click", "keydown"]) window.removeEventListener(t, unlock, true);
  };
  for (const t of ["pointerup", "touchend", "click", "keydown"]) window.addEventListener(t, unlock, true);
  document.addEventListener("visibilitychange", update);
  window.addEventListener("wellbeings:delete-all", resetSoundPref);
}
