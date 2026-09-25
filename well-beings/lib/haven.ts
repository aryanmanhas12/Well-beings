/**
 * Storage for the safe place: check-ins, the hope box, good things, the
 * safety plan and an optional care-team contact.
 *
 * WHY A SECOND KEY
 *
 * `wellbeings-v1` holds the lifestyle check and its plan, and it is written
 * whole on every tap. The safe place is used differently: in short visits,
 * sometimes several a night, and it can hold photos. Folding photos into the
 * main key would turn every habit tick into a rewrite of several hundred
 * kilobytes. So the safe place has its own key, and photos have their own
 * again, and each is written only when its own contents change.
 *
 * Neither key is ever renamed once shipped. A rename is a silent delete of
 * whatever someone put in their hope box, which is the one kind of data loss
 * this app cannot afford.
 *
 * WHAT THIS DOES NOT DO
 *
 * Nothing here leaves the device. The care-team contact is stored so the
 * app can pre-fill a message the person chooses to send; the app never sends
 * anything itself, because there is nowhere for it to send to.
 */
import type { Arrival } from "./care";
import type { Region } from "./types";

export const HAVEN_KEY = "wellbeings-safe-v1";
export const PHOTOS_KEY = "wellbeings-photos-v1";

export type HopeKind = "people" | "ahead" | "moments" | "through" | "sounds";

export interface HopeItem {
  id: string;
  kind: HopeKind;
  text: string;
  /** Only for "sounds": a link to a song or video that helps. */
  url?: string;
  at: string;
}

export interface GoodThings {
  /** YYYY-MM-DD. One entry per day; writing again the same day adds to it. */
  date: string;
  items: string[];
}

export interface PlanContact {
  name: string;
  phone: string;
}

/**
 * The Stanley–Brown Safety Planning Intervention, in its own order.
 *
 * The order is the intervention, not a layout choice: start with what you
 * can do alone, then people who lift you without needing to know, then
 * people you tell, then professionals, then making where you are safer. Each
 * step is there for when the one before it has not been enough. The wording
 * is this app's, kept close to the published template (Stanley & Brown,
 * Cognitive and Behavioral Practice, 2012).
 */
export interface SafetyPlan {
  warningSigns: string;
  coping: string;
  distractions: string;
  helpers: PlanContact[];
  professionals: PlanContact[];
  saferSurroundings: string;
  reason: string;
  updatedAt?: string;
}

export type CareRole = "therapist" | "doctor" | "trusted";

export interface CareTeam {
  name: string;
  role: CareRole;
  phone?: string;
  email?: string;
  /** When the person read what gets shared and agreed to it. */
  agreedAt: string;
  /** Offer to send a summary when things have been heavy. It is an offer:
      the person still sees exactly what would be sent and presses send. */
  nudge: boolean;
}

export interface Photo {
  id: string;
  /** A downscaled JPEG as a data URL, never the original file. */
  src: string;
  caption: string;
  at: string;
}

export interface HavenState {
  v: 1;
  arrivals: Arrival[];
  goodThings: GoodThings[];
  hope: HopeItem[];
  /** Written on a steadier day, for a heavier one. */
  letter: { text: string; at: string } | null;
  plan: SafetyPlan;
  care: CareTeam | null;
  /** Today's small acts, for the dawn. Reset when the date changes. */
  dawn: { date: string; steps: string[] };
  region: Region | null;
  introSeen: boolean;
  lastVisit: string | null;
}

export const EMPTY_PLAN: SafetyPlan = {
  warningSigns: "",
  coping: "",
  distractions: "",
  helpers: [],
  professionals: [],
  saferSurroundings: "",
  reason: "",
};

export const EMPTY_HAVEN: HavenState = {
  v: 1,
  arrivals: [],
  goodThings: [],
  hope: [],
  letter: null,
  plan: EMPTY_PLAN,
  care: null,
  dawn: { date: "", steps: [] },
  region: null,
  introSeen: false,
  lastVisit: null,
};

/** How many check-ins are kept. A year of several a day is still small;
    the cap exists so a stuck finger can never fill the storage quota. */
const MAX_ARRIVALS = 1200;

export function planIsWritten(p: SafetyPlan): boolean {
  const filled = [p.warningSigns, p.coping, p.distractions, p.saferSurroundings, p.reason].filter((s) => s.trim()).length;
  return filled + (p.helpers.length ? 1 : 0) + (p.professionals.length ? 1 : 0) >= 2;
}

export function loadHaven(): HavenState {
  if (typeof window === "undefined") return EMPTY_HAVEN;
  try {
    const raw = JSON.parse(window.localStorage.getItem(HAVEN_KEY) || "null");
    if (!raw || typeof raw !== "object") return EMPTY_HAVEN;
    return {
      v: 1,
      arrivals: Array.isArray(raw.arrivals) ? raw.arrivals : [],
      goodThings: Array.isArray(raw.goodThings) ? raw.goodThings : [],
      hope: Array.isArray(raw.hope) ? raw.hope : [],
      letter: raw.letter && typeof raw.letter.text === "string" ? raw.letter : null,
      plan: { ...EMPTY_PLAN, ...(raw.plan || {}) },
      care: raw.care && typeof raw.care.name === "string" ? raw.care : null,
      dawn: raw.dawn && Array.isArray(raw.dawn.steps) ? raw.dawn : { date: "", steps: [] },
      region: raw.region ?? null,
      introSeen: !!raw.introSeen,
      lastVisit: raw.lastVisit ?? null,
    };
  } catch {
    return EMPTY_HAVEN;
  }
}

export function saveHaven(s: HavenState) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = s.arrivals.length > MAX_ARRIVALS ? { ...s, arrivals: s.arrivals.slice(-MAX_ARRIVALS) } : s;
    window.localStorage.setItem(HAVEN_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or blocked. Nothing to fall back to without a server;
    // the in-memory state still works for this visit.
  }
}

export function loadPhotos(): Photo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(PHOTOS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/** Returns false when the browser refused the write, almost always because
    storage is full, so the caller can say so instead of pretending. */
export function savePhotos(p: Photo[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PHOTOS_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

/* Two small flags that are not the safe place's, but that "delete all my
   data" has never removed: whether the dashboard tour was taken, and the
   welcome tour that the safe place replaced. Neither is personal, and
   leaving them behind after promising "all" was still a broken promise. */
const TOUR_KEYS = ["wellbeings-tour-seen-v1", "wellbeings-welcome-tour-v1"];

export function clearHaven() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HAVEN_KEY);
    window.localStorage.removeItem(PHOTOS_KEY);
    for (const k of TOUR_KEYS) window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
}

/**
 * Where someone probably is, from their clock rather than from asking.
 *
 * The time zone is read on the device and never leaves it. It decides only
 * which helplines are shown first, and the person can change it in one tap
 * on the Reach out screen. Time zones that do not map to a region with its
 * own list get the international directory rather than a guess.
 */
export function guessRegion(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "in";
    if (tz === "Europe/London" || tz === "Europe/Belfast") return "uk";
    if (tz.startsWith("Australia/")) return "au";
    if (tz === "Pacific/Auckland" || tz === "Pacific/Chatham") return "nz";
    if (
      /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal|Moncton|Whitehorse|Yellowknife|Iqaluit)/.test(tz)
    )
      return "ca";
    if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana|Kentucky)/.test(tz) || tz.startsWith("Pacific/Honolulu"))
      return "us";
    return tz ? "intl" : "in";
  } catch {
    return "in";
  }
}

let seq = 0;
export function newId(): string {
  seq += 1;
  return `${Date.now().toString(36)}${seq.toString(36)}`;
}

/**
 * Shrinks a photo to something localStorage can hold.
 *
 * 720px on the long edge at JPEG quality 0.72 lands most phone photos at
 * 60–120 KB as a data URL, so eight of them fit comfortably inside the
 * 5 MB most browsers allow per origin, alongside everything else. The
 * original never gets stored, and nothing is uploaded: the resize happens
 * on a canvas in this tab.
 */
export function downscalePhoto(file: File, maxEdge = 720, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("no canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    img.src = url;
  });
}
