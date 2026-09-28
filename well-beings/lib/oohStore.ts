"use client";

/**
 * What the app remembers about Ooh, and nothing else: whether the person
 * turned Ooh off, and which pages' full narration they have already heard
 * (so a daily visitor gets one line, not the tour). Its own key so "Delete
 * all my data" can list it.
 */
export const OOH_KEY = "arun-ooh-v1";

export interface OohPrefs {
  hidden: boolean;
  seen: string[];
}

const EMPTY: OohPrefs = { hidden: false, seen: [] };
/* On the server Ooh is absent: the static HTML never has a character in it,
   and it appears once the client knows the person has not turned it off. */
export const OOH_SERVER: OohPrefs = { hidden: true, seen: [] };

let cache: OohPrefs | null = null;
const subscribers = new Set<() => void>();

export function subscribeOoh(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function readOoh(): OohPrefs {
  if (cache) return cache;
  try {
    const raw = JSON.parse(window.localStorage.getItem(OOH_KEY) || "null");
    cache = raw && typeof raw === "object" ? { hidden: raw.hidden === true, seen: Array.isArray(raw.seen) ? raw.seen.filter((x: unknown) => typeof x === "string") : [] } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: OohPrefs) {
  cache = next;
  try {
    window.localStorage.setItem(OOH_KEY, JSON.stringify(next));
  } catch {
    // Not remembered; it still applies for this visit.
  }
  subscribers.forEach((f) => f());
}

export function setOohHidden(hidden: boolean) {
  write({ ...readOoh(), hidden });
}

export function markOohSeen(id: string) {
  const p = readOoh();
  if (!p.seen.includes(id)) write({ ...p, seen: [...p.seen, id] });
}

if (typeof window !== "undefined") {
  window.addEventListener("wellbeings:delete-all", () => {
    cache = null;
    subscribers.forEach((f) => f());
  });
}
