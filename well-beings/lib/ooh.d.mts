/* Types for lib/ooh.mjs, which stays plain JavaScript so Ronak's vanilla
   app can import it without a build step. */

export type OohMood = "hello" | "ooh" | "happy" | "calm" | "listen" | "care" | "think" | "sleepy";

export const INK: string;
export const SUN: string;
export const SUN_LIGHT: string;
export const PEACH: string;
export const PINK: string;
export const LILAC: string;
export const CREAM: string;
export const MOUTH: string;
export const MOODS: OohMood[];
export const OOH_CSS: string;
export function oohBody(mood?: OohMood): string;
export function oohSvg(o?: { mood?: OohMood; size?: number; label?: string }): string;
