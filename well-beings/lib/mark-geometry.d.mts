/* Types for lib/mark-geometry.mjs, which stays plain JavaScript so the Node
   icon scripts can import it without a build step. */

export type MarkDetail = "full" | "medium" | "tiny";

export const VIEWBOX: string;
export const STANDALONE_VIEWBOX: string;
export const SUN: string;
export const FRAME: string;
export const SKY: { y: number; h: number; fill: string }[];
export const MOUNTAINS: { d: string; fill: string }[];
export const FRAME_PATH: string;
export function rays(detail?: MarkDetail): { i: number; x1: number; y1: number; x2: number; y2: number }[];
export function rayLit(i: number, lit?: number): boolean;
export function detailFor(px: number): MarkDetail;
export function markSvgBody(o?: { detail?: MarkDetail; lit?: number; frame?: string }): string;
