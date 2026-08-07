import { Tab } from "@/hooks/useWellBeings";

export interface TourStep {
  id: string;
  /** Switch to this tab before hunting for the target, if it isn't already active. */
  tab?: Tab;
  /** Matches a `data-tour="…"` attribute already on the element to spotlight. */
  selector: string;
  title: string;
  body: string;
}

/** The guided walkthrough for the main app screen — one step per feature
    that isn't self-explanatory on sight. Order follows the tab bar left to
    right, ending on Help & privacy since that's the safest place to land. */
export const APP_TOUR: TourStep[] = [
  {
    id: "tabs",
    selector: '[data-tour="tabs"]',
    title: "Five places to look",
    body: "Today's plan, your bigger system, the burnout radar, the evidence behind all of it, and help — always one tap away.",
  },
  {
    id: "checkin",
    tab: "today",
    selector: '[data-tour="daily-checkin"]',
    title: "Ten seconds a day",
    body: "Mood, energy, last night's sleep. This is what feeds the trend below and the burnout radar — the more you log, the more the app actually knows.",
  },
  {
    id: "trend",
    tab: "today",
    selector: '[data-tour="trend"]',
    title: "Your own trend, not a leaderboard",
    body: "No points or streak-shaming — just whether this week is better than last. That's deliberate: research on these apps found gamification predicts people leaving sooner, not staying.",
  },
  {
    id: "habits",
    tab: "today",
    selector: '[data-tour="habits"]',
    title: "Habits that forgive a missed day",
    body: "Anchored to routines you already have. Missing one day doesn't reset anything — the research on habit formation says it genuinely doesn't matter.",
  },
  {
    id: "journal",
    tab: "journal",
    selector: '[data-tour="journal-write"]',
    title: "The part with the longest evidence behind it",
    body: "Guided expressive writing. Prompts alternate between getting something out and looking at it again — that combination beat either one alone in trials.",
  },
  {
    id: "journal-rhythm",
    tab: "journal",
    selector: '[data-tour="journal-cadence"]',
    title: "Every day or two, not every week",
    body: "Sessions 1–3 days apart did measurably more than spaced-out ones. No streaks, no guilt — just the interval the research actually supports.",
  },
  {
    id: "interventions",
    tab: "plan",
    selector: '[data-tour="interventions"]',
    title: "Chosen from your answers",
    body: "Each card exists because something in your check-in flagged it — not a generic list. Tap through to see the actual paper behind each one.",
  },
  {
    id: "recovery",
    tab: "plan",
    selector: '[data-tour="recovery-quota"]',
    title: "Recovery is scheduled, not leftover",
    body: "Four distinct kinds of recovery — detach, relax, master, control. They don't substitute for each other, so the quota covers all four.",
  },
  {
    id: "radar",
    tab: "burnout",
    selector: '[data-tour="radar"]',
    title: "Where your drain is heading",
    body: "This reads your last check-ins as a trend, not a single score — so a rough Tuesday doesn't look like a crisis.",
  },
  {
    id: "evidence",
    tab: "library",
    selector: '[data-tour="effect-scale"]',
    title: "What the numbers actually mean",
    body: "Research reports \"effect sizes\" that read like code. Tap this open once and every card on this page gets easier to trust.",
  },
  {
    id: "display",
    tab: "help",
    selector: '[data-tour="display-settings"]',
    title: "Make it readable for you",
    body: "Light or dark, three text sizes, and a high-contrast mode. Set once and it sticks to this device.",
  },
  {
    id: "companion",
    tab: "help",
    selector: '[data-tour="companion-screener"]',
    title: "This app has a companion",
    body: "Well-Beings is the day-to-day journal. If something looks more serious, the Psych Screener next to it runs the fuller clinical picture and can point you to real help.",
  },
  {
    id: "help-now",
    selector: '[data-tour="help-now"]',
    title: "Never buried, ever",
    body: "This button reaches crisis lines from anywhere in the app, in one tap, with no score or flag required to unlock it. That's the whole tour — go take your check-in.",
  },
];

const SEEN_KEY = "wellbeings-tour-seen-v1";

/** localStorage only, matching the rest of the app — the tour "seen" flag
    never leaves the device either. */
export function hasTakenTour(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markTourTaken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage can be unavailable (private browsing, quota). The tour just
    // replays next time, which is a harmless fallback, not a crash.
  }
}
