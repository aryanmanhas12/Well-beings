import { localKey, mondayOf } from "./daily-lines";

/**
 * Good things someone chose to keep: one line, a date, nothing else.
 *
 * Its own localStorage key rather than a field on `wellbeings-v1`, and that
 * is deliberate. The front door has to work for someone who has never done
 * the check-in, so it cannot depend on the profile existing, and keeping it
 * out of the big persisted object means saving a good thing can never race a
 * check-in save and overwrite it. "Delete everything" clears both (see
 * clearState in lib/storage.ts).
 */

const KEY = "arun-light-v1";
/* A year of daily entries. Older ones drop off the end rather than the
   store growing until the quota bites and every save silently fails. */
const MAX_KEPT = 400;
export const MAX_LENGTH = 500;

export interface GoodThing {
  id: string;
  /** Local YYYY-MM-DD it was kept on. */
  date: string;
  text: string;
  at: string;
}

export const LIGHT_KEY = KEY;

export function loadGoodThings(): GoodThing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw)
      ? raw.filter((g) => g && typeof g.text === "string" && typeof g.date === "string")
      : [];
  } catch {
    return [];
  }
}

function save(list: GoodThing[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_KEPT)));
  } catch {
    // Private mode or a full quota. The entry still shows for this visit.
  }
}

export function keepGoodThing(text: string, now = new Date()): GoodThing[] {
  const clean = text.trim().slice(0, MAX_LENGTH);
  const list = loadGoodThings();
  if (!clean) return list;
  const next = [
    ...list,
    { id: `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`, date: localKey(now), text: clean, at: now.toISOString() },
  ];
  save(next);
  return next;
}

export function removeGoodThing(id: string): GoodThing[] {
  const next = loadGoodThings().filter((g) => g.id !== id);
  save(next);
  return next;
}

/** Everything kept since this week's Monday. */
export function thisWeek(list: GoodThing[], now = new Date()): GoodThing[] {
  const monday = mondayOf(now);
  return list.filter((g) => g.date >= monday);
}

/* The fanlight has four coloured panes around the sun. Each good thing kept
   this week lights one, so four lights the whole window. Counted per thing
   and not per day on purpose: a streak counts the days you missed, and this
   only ever counts what you noticed. */
export const PANES = 4;

export function panesLit(list: GoodThing[], now = new Date()): number {
  return Math.min(PANES, thisWeek(list, now).length);
}
