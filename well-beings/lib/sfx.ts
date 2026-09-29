"use client";

/**
 * Interface sounds: the small, soft clicks and chimes that answer a tap,
 * and Ooh's voice while it talks. The same sounds as Ronak, so the two
 * sister apps sound like one family: the CC0 "soft" pack of uisfx
 * (public/sounds/LICENSE.txt), each cue over in 0.15 to 0.3 s and matched
 * in loudness.
 *
 * Separate from the music (lib/ambient.ts), on purpose: the music runs in
 * a context tuned for smooth playback, which on phones adds tens of
 * milliseconds of delay, and a tap sound that lands late feels broken.
 * This context asks for the lowest delay the device has.
 *
 *   - Fetched on the first tap, not on load: nobody pays for sounds they
 *     switched off. The nine used most come first, the rest when idle.
 *   - A sound not yet loaded is skipped, not queued: a late sound is worse
 *     than none.
 *   - Silent on the urgent screen and for any phone-number link. Calling a
 *     helpline is serious; it makes no sound.
 *   - On iPhone and iPad the page's audio is marked "ambient", so the
 *     ring/silent switch silences it, and it mixes with whatever else is
 *     playing instead of stopping it.
 *   - Off in Settings under "Sounds" (arun-sfx-v1 = "off").
 */
export const SFX_KEY = "arun-sfx-v1";

export type Sfx =
  | "press"
  | "select"
  | "typing"
  | "forward"
  | "back"
  | "open"
  | "close"
  | "progress-step"
  | "wake"
  | "toggle-on"
  | "toggle-off"
  | "expand"
  | "collapse"
  | "check"
  | "success"
  | "delete"
  | "complete";

const CORE: Sfx[] = ["press", "select", "typing", "forward", "back", "open", "close", "progress-step", "wake"];
const REST: Sfx[] = ["toggle-on", "toggle-off", "expand", "collapse", "check", "success", "delete", "complete"];
/* Ronak's levels: the typing blip is the quietest, because it repeats. */
const VOL: Partial<Record<Sfx, number>> = { typing: 0.16, press: 0.3, select: 0.38, wake: 0.3, complete: 0.3 };

const BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sounds/`;

let actx: AudioContext | null = null;
const bufs = new Map<Sfx, AudioBuffer>();
const loading = new Set<Sfx>();
let cache: boolean | null = null;
const subscribers = new Set<() => void>();

export function subscribeSfx(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function sfxWanted(): boolean {
  if (cache !== null) return cache;
  try {
    cache = window.localStorage.getItem(SFX_KEY) !== "off";
  } catch {
    cache = true;
  }
  return cache;
}

export function setSfxWanted(on: boolean) {
  cache = on;
  try {
    if (on) window.localStorage.removeItem(SFX_KEY);
    else window.localStorage.setItem(SFX_KEY, "off");
  } catch {
    // Not remembered; applies to this visit.
  }
  subscribers.forEach((f) => f());
  if (on) {
    unlockSfx();
    setTimeout(() => sfx("toggle-on"), 120);
  }
}

function fetchBuf(n: Sfx) {
  if (!actx || bufs.has(n) || loading.has(n)) return;
  loading.add(n);
  const c = actx;
  fetch(`${BASE}${n}.mp3?v=1`)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
    .then((a) => new Promise<AudioBuffer>((ok, no) => c.decodeAudioData(a, ok, no)))
    .then((b) => {
      bufs.set(n, b);
    })
    .catch(() => {
      loading.delete(n);
    });
}

/** Called from inside a tap: the browser's permission to make sound. */
export function unlockSfx() {
  if (typeof window === "undefined" || !sfxWanted()) return;
  if (actx) {
    if (actx.state === "suspended") void actx.resume().catch(() => {});
    return;
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "ambient";
  } catch {
    // Older Safari: nothing to set.
  }
  try {
    actx = new AC({ latencyHint: "interactive" });
  } catch {
    actx = null;
    return;
  }
  CORE.forEach(fetchBuf);
  const later = () => REST.forEach(fetchBuf);
  if ("requestIdleCallback" in window) window.requestIdleCallback(later, { timeout: 4000 });
  else setTimeout(later, 1500);
}

function crisisUp() {
  return !!document.querySelector(".urgent");
}

/**
 * Play one sound. `rate` shifts the pitch (Ooh's voice is higher when
 * surprised, lower when caring); `gain` scales the volume.
 */
export function sfx(n: Sfx, rate?: number, gain = 1) {
  if (typeof window === "undefined" || !sfxWanted() || !actx || crisisUp()) return;
  const b = bufs.get(n);
  if (!b) {
    fetchBuf(n);
    return;
  }
  if (actx.state === "suspended") void actx.resume().catch(() => {});
  try {
    const src = actx.createBufferSource();
    const g = actx.createGain();
    src.buffer = b;
    if (rate) src.playbackRate.value = rate;
    g.gain.value = (VOL[n] ?? 0.32) * gain;
    src.connect(g);
    g.connect(actx.destination);
    src.start();
  } catch {
    // A sound is never worth an error.
  }
}

if (typeof window !== "undefined") {
  /* Not heard in the background: a hidden tab frees the audio hardware. */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && actx?.state === "running") void actx.suspend().catch(() => {});
  });
  window.addEventListener("wellbeings:delete-all", () => {
    cache = null;
    subscribers.forEach((f) => f());
  });
}
