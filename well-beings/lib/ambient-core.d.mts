/* Types for lib/ambient-core.mjs, plain JavaScript so it can render offline
   in a test page and be reused by Ronak without a build step. */

export type Mood = "morning" | "day" | "night";

export const CHORDS: number[][];
export const BELL_NOTES: number[];
export const CHORD_SECONDS: number;
export const MOODS: Mood[];
export const PAD_LEVEL: Record<Mood, number>;
export function moodForHour(hour: number): Mood;
export function createAmbient(
  ctx: BaseAudioContext,
  destination?: AudioNode,
  options?: { deferRoom?: boolean },
): {
  out: GainNode;
  chord(t: number, index: number, level?: number): void;
  bell(t: number, midi: number, level?: number): void;
  scene(t: number, index: number, mood: Mood, rnd?: () => number, parts?: { piano?: boolean; water?: boolean; birds?: boolean }): void;
  key(t: number, midi: number, vel: number, dur: number, pan?: number, rnd?: () => number): void;
};
