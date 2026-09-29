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

function ensureContext(): boolean {
  if (ctx && engine) return true;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  try {
    ctx = new AC({ latencyHint: "playback" });
  } catch {
    return false;
  }
  engine = createAmbient(ctx, ctx.destination, { deferRoom: true });
  return true;
}

function update() {
  if (typeof window === "undefined") return;
  const play = shouldPlay();
  if (play) {
    if (!ensureContext() || !ctx) return;
    if (suspendTimer) {
      clearTimeout(suspendTimer);
      suspendTimer = null;
    }
    void ctx.resume().then(() => {
      if (ctx?.state === "running") detachUnlock();
      if (!ctx || !engine) return;
      if (!shouldPlay()) {
        /* Turned off between the tap and the context waking: stay silent. */
        void ctx.suspend();
        return;
      }
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

/* Bowl tones for the sunrise, timed to the opening: the first as the sun
   clears the hills, then one per pair of petals as they open (the CSS
   opens petal i at 1.8s + i x 0.08s), rising through the pentatonic, and
   a last high one as the words arrive. Seconds after the tap. */
export const SUNRISE_BELLS: [number, number][] = [
  [0.35, 62],
  [1.8, 74],
  [1.96, 76],
  [2.12, 78],
  [2.28, 81],
  [2.6, 83],
  [3.3, 86],
];
const SUNRISE_FADE = 3.2;

/**
 * Starts the music together with the sunrise. Called from the tap that
 * wakes the sun, so it is inside the browser's permission to play. It
 * resolves once sound is actually running (or after 400 ms if it cannot
 * start, so the sunrise never waits on audio), and the caller starts the
 * animation at that moment: the swell and the bells land on the picture.
 */
export async function playSunrise(): Promise<void> {
  if (typeof window === "undefined") return;
  unlocked = true;
  if (!soundWanted() || !ensureContext() || !ctx || !engine) return;
  const c = ctx;
  const e = engine;
  try {
    await Promise.race([c.resume(), new Promise((r) => setTimeout(r, 400))]);
  } catch {
    return;
  }
  if (c.state !== "running" || !shouldPlay()) return;
  detachUnlock();
  const t = c.currentTime + 0.03;
  const g = e.out.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(Math.min(g.value, 0.0001), t);
  g.linearRampToValueAtTime(VOLUME, t + SUNRISE_FADE);
  /* The harmony starts on the sunrise, unless it is already going (the
     opening replayed from Settings), in which case only the bells join. */
  if (!timer) {
    nextChord = t;
    chordIndex = 0;
    schedule();
  }
  for (const [at, midi] of SUNRISE_BELLS) e.bell(t + at, midi, 0.034);
  notify();
}

/** A single soft bowl tone, for Ooh's bubbles. Only when music is playing. */
export function chime() {
  if (!ctx || !engine || !soundPlaying()) return;
  engine.bell(ctx.currentTime + 0.05, BELL_NOTES[Math.floor(Math.random() * 3) + 2], 0.022);
}

/* The first tap or key anywhere is the browser's permission to make sound.
   Several event types, because iOS unlocks audio on touchend and click but
   not on pointerdown. */
const UNLOCK_EVENTS = ["pointerup", "touchend", "click", "keydown"];
/* Listening stops only once sound is confirmed running: an older iPhone
   does not count the first touch event as permission, and dropping the
   listeners on it left the music silent until something else nudged it. */
function unlock(e: Event) {
  /* A tap on a control that is itself about the music ("Without music",
     the speaker) must not start it on the way to switching it off: a tap
     arrives as pointerup and then click, and the music would begin in
     between. Those controls carry data-sound-control and decide alone. */
  if ((e.target as Element | null)?.closest?.("[data-sound-control]")) return;
  unlocked = true;
  update();
  notify();
}
function detachUnlock() {
  for (const t of UNLOCK_EVENTS) window.removeEventListener(t, unlock, true);
}
if (typeof window !== "undefined") {
  for (const t of UNLOCK_EVENTS) window.addEventListener(t, unlock, true);
  document.addEventListener("visibilitychange", update);
  window.addEventListener("wellbeings:delete-all", resetSoundPref);
}
