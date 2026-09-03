import { Tab } from "@/hooks/useWellBeings";

/** How long a card sits before the tour advances itself, and how long the
    statement deck holds a statement. One constant so the CSS progress bar,
    the tour and the deck can never drift apart — the bar's duration is set
    from this via the --deck-dwell custom property. */
export const TOUR_DWELL_MS = 7000;

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
    body: "Guided expressive writing. Prompts alternate between getting something out and looking at it again. That combination beat either one alone in trials.",
  },
  {
    id: "journal-rhythm",
    tab: "journal",
    selector: '[data-tour="journal-cadence"]',
    title: "Every day or two, not every week",
    body: "Sessions one to three days apart did measurably more than spaced-out ones. No streaks, no guilt, just the interval the research actually supports.",
  },
  {
    id: "interventions",
    tab: "plan",
    selector: '[data-tour="interventions"]',
    title: "Chosen from your answers",
    body: "Each card exists because something in your check-in flagged it. This isn’t a generic list. Tap through to see the actual paper behind each one.",
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
    id: "install",
    tab: "help",
    selector: '[data-tour="install-app"]',
    title: "You can install this as an app",
    body: "It runs from your home screen or dock in its own window, and works with no connection. Chrome shows an install icon in the address bar; Brave keeps it in the ☰ menu, and iPhones use Share then Add to Home Screen. This card gives you the one-tap button wherever the browser offers it.",
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

/** The front-door walkthrough, for someone who has just landed and has no
    profile yet. APP_TOUR explains a dashboard they haven't built; this one
    explains why they'd want to. It deliberately ends on the start button,
    so finishing the tour leaves the thumb on the thing to press next. */
export const WELCOME_TOUR: TourStep[] = [
  {
    id: "welcome-hero",
    selector: '[data-tour="welcome-hero"]',
    title: "What this actually is",
    body: "A five-minute check-in about sleep, mood, stress and workload. Then a daily system built from your answers, not a generic list.",
  },
  {
    id: "welcome-privacy",
    selector: '[data-tour="welcome-privacy"]',
    title: "Nothing leaves this phone",
    body: "No account, no server, no third parties. Everything lives in this browser and one tap deletes all of it.",
  },
  {
    id: "welcome-evidence",
    selector: '[data-tour="welcome-evidence"]',
    title: "Every claim shows its paper",
    body: "Each number here comes from a trial or meta-analysis you can open and read. And it says so plainly when the evidence is still young.",
  },
  {
    id: "welcome-preview",
    selector: '[data-tour="welcome-preview"]',
    title: "Want to look before you answer?",
    body: "This opens a sample profile with made-up answers, so you can see exactly what you get before telling it anything about yourself.",
  },
  {
    id: "welcome-help",
    selector: '[data-tour="help-now"]',
    title: "Help is never buried",
    body: "Crisis lines are one tap from every screen in the app, with no score or flag required to unlock them.",
  },
  {
    id: "welcome-install",
    selector: '[data-tour="welcome-install"]',
    title: "You can install it as an app",
    body: "It runs from your home screen or dock in its own window, with no address bar, and still works with no connection. Chrome shows an install icon in the address bar; Brave keeps it in the ☰ menu; iPhones use Share then Add to Home Screen. This card gives you the one-tap button wherever the browser offers one.",
  },
  {
    id: "welcome-start",
    selector: '[data-tour="welcome-start"]',
    title: "That's it — start here",
    body: "Mostly taps, about five minutes, and you can change any answer as you go. Your read-out comes at the end.",
  },
];

const SEEN_KEY = "wellbeings-tour-seen-v1";
const WELCOME_SEEN_KEY = "wellbeings-welcome-tour-v1";

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

/** Tracked separately from APP_TOUR: they answer different questions ("why
    would I start this?" vs "how does this dashboard work?"), so taking one
    should never suppress the other. Both default to "seen" when storage is
    unreadable, so a locked-down browser gets a quiet app rather than a
    walkthrough it can never dismiss for good. */
export function hasSeenWelcomeTour(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(WELCOME_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markWelcomeTourSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
  } catch {
    // Same fallback as above: replaying is harmless, crashing is not.
  }
}
