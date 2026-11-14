export type ReelPart = "morning" | "day" | "night";
export function reelPart(now: Date): ReelPart;
export function reelKey(now: Date): string;
export function reelNumber(now: Date): number;
export interface ReelDoorStrings {
  door: string;
  doorSub: string;
  doorOpen: string;
  doorSeen: string;
  next: Record<ReelPart, string>;
  again: string;
}
export const REEL_DOOR: Record<"en" | "hinglish", ReelDoorStrings>;
