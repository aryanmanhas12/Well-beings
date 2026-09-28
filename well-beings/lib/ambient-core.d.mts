/* Types for lib/ambient-core.mjs, plain JavaScript so it can render offline
   in a test page and be reused by Ronak without a build step. */

export const CHORDS: number[][];
export const BELL_NOTES: number[];
export const CHORD_SECONDS: number;
export function createAmbient(
  ctx: BaseAudioContext,
  destination?: AudioNode,
): { out: GainNode; chord(t: number, index: number): void; bell(t: number, midi: number, level?: number): void };
