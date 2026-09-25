/**
 * How the safe place reads what someone tells it, and what it does next.
 *
 * This file is deliberately self-contained: no imports, no React, no storage.
 * Every rule that decides whether the app shows comfort, nudges someone
 * toward a person, or puts a phone number in front of them lives here as a
 * plain function, so it can be read in one sitting and tested with nothing
 * but Node (scripts/test-care.mjs). A rule that decides whether a crisis line
 * appears should never be buried inside a component.
 *
 * WHAT THIS IS NOT
 *
 * It is not a risk model. Nobody validated these thresholds, and suicide risk
 * is notoriously hard to predict even for instruments that were validated.
 * These are heuristics chosen to fail safe: when in doubt, the app offers
 * more support, never less, and it never tells anyone they are "low risk".
 * The levels are about what to show next, not about what a person is.
 *
 * WHY THE APP ASKS DIRECTLY
 *
 * When someone reports a heavy mood or very little hope, the check-in asks
 * plainly whether they are having thoughts of ending their life. That can
 * feel like a risky question to put in an app. The evidence says otherwise:
 * a review of the studies on asking found none that showed a significant
 * increase in suicidal ideation, and some that found asking reduced distress
 * (Dazzi et al. 2014, Psychological Medicine, doi:10.1017/S0033291714001299).
 * Not asking is the thing that leaves someone alone with it.
 */

/** 1 = really heavy … 5 = good. */
export type Score = 1 | 2 | 3 | 4 | 5;

/**
 * The answer to the one direct question. Absent when the question was not
 * asked, which is not the same as "no": a check-in with good mood and some
 * hope never asks it, and nothing downstream may read that silence as a
 * reassuring answer.
 */
export type Safety = "no" | "thoughts" | "unsafe";

export interface Arrival {
  /** ISO timestamp. More than one check-in a day is allowed and expected on
      a bad day; every one of them counts. */
  at: string;
  mood: Score;
  hope: Score;
  safety?: Safety;
}

/**
 * What the app should do next, in rising order of how much it steps in.
 *
 *   steady    comfort and something to bank for later
 *   low       comfort now, something the person saved, one small step
 *   heavy     a stretch of low days: say so, and point at a person
 *   thoughts  thoughts of suicide reported recently: the safety plan and a
 *             line to call go to the top of the screen and stay there
 *   urgent    "I don't feel safe": everything else gets out of the way
 */
export type CareLevel = "steady" | "low" | "heavy" | "thoughts" | "urgent";

export const CARE_ORDER: CareLevel[] = ["steady", "low", "heavy", "thoughts", "urgent"];

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/**
 * How long a report of suicidal thoughts keeps the safety plan pinned.
 *
 * Three days, not "until the next good check-in". Someone who said yes last
 * night and taps "okay" this morning has had one better morning, and the
 * period right after a crisis is the one clinicians watch most closely
 * (the reason the Safety Planning Intervention adds follow-up calls in the
 * days after an emergency visit: Stanley et al. 2018, JAMA Psychiatry,
 * doi:10.1001/jamapsychiatry.2018.1776). The plan staying visible costs
 * nothing on a good day.
 */
export const THOUGHTS_WINDOW_MS = 3 * DAY;

/** The window every "for a while now" judgement looks back over. */
export const PATTERN_WINDOW_DAYS = 14;

/** Asked only when it is relevant: a heavy mood, or very little hope. */
export function shouldAskSafety(mood: Score, hope: Score): boolean {
  return mood <= 2 || hope <= 2;
}

function sortedDesc(arrivals: Arrival[]): Arrival[] {
  return [...arrivals].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

function within(arrivals: Arrival[], now: Date, ms: number): Arrival[] {
  const from = now.getTime() - ms;
  return arrivals.filter((a) => {
    const t = Date.parse(a.at);
    return Number.isFinite(t) && t >= from && t <= now.getTime() + HOUR;
  });
}

/**
 * The level the app responds at right now.
 *
 * Order matters and runs from most to least serious, so a single "unsafe"
 * can never be averaged away by a run of good days, and a run of heavy days
 * is never hidden by one okay check-in.
 */
export function careLevel(arrivals: Arrival[], now: Date = new Date()): CareLevel {
  if (!arrivals.length) return "steady";
  const recent = sortedDesc(arrivals);
  const latest = recent[0];

  if (latest.safety === "unsafe") return "urgent";
  if (latest.safety === "thoughts") return "thoughts";

  /* An "unsafe" earlier inside the window, followed by a calmer check-in,
     lands on "thoughts" rather than "urgent": the full-screen interruption is
     for the moment it is reported, and the plan staying pinned is for the
     days after. */
  const windowed = within(recent, now, THOUGHTS_WINDOW_MS);
  if (windowed.some((a) => a.safety === "thoughts" || a.safety === "unsafe")) return "thoughts";

  if (isSustainedLow(recent, now)) return "heavy";
  if (latest.mood <= 2 || latest.hope <= 2) return "low";
  return "steady";
}

/**
 * "It's been heavy for a while."
 *
 * Three or more check-ins in the last fortnight with hope at 2 or below, or
 * the last five check-ins (at least three of them) averaging a mood of 2 or
 * below. Hope gets its own, lower bar because hopelessness is the part of
 * low mood most consistently tied to suicidal thinking in the research
 * literature, and because a person can report an "okay" mood while seeing no
 * way forward at all.
 */
export function isSustainedLow(arrivals: Arrival[], now: Date = new Date()): boolean {
  const recent = sortedDesc(within(arrivals, now, PATTERN_WINDOW_DAYS * DAY));
  if (recent.filter((a) => a.hope <= 2).length >= 3) return true;
  const lastFive = recent.slice(0, 5);
  if (lastFive.length >= 3) {
    const mean = lastFive.reduce((s, a) => s + a.mood, 0) / lastFive.length;
    if (mean <= 2) return true;
  }
  return false;
}

export interface DayPoint {
  /** YYYY-MM-DD, local time. */
  date: string;
  /** The lowest of the day, not the average. A day with one terrible hour
      and one fine one was not a fine day, and averaging it into one would
      hide exactly what a care team would want to see. */
  mood: Score | null;
  hope: Score | null;
  thoughts: boolean;
  unsafe: boolean;
}

export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** One point per calendar day, oldest first, including empty days. */
export function dailyPattern(arrivals: Arrival[], now: Date = new Date(), days = PATTERN_WINDOW_DAYS): DayPoint[] {
  const out: DayPoint[] = [];
  const byDay = new Map<string, Arrival[]>();
  for (const a of arrivals) {
    const t = new Date(a.at);
    if (Number.isNaN(t.getTime())) continue;
    const k = localDateKey(t);
    byDay.set(k, [...(byDay.get(k) || []), a]);
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = localDateKey(d);
    const list = byDay.get(k) || [];
    out.push({
      date: k,
      mood: list.length ? (Math.min(...list.map((a) => a.mood)) as Score) : null,
      hope: list.length ? (Math.min(...list.map((a) => a.hope)) as Score) : null,
      thoughts: list.some((a) => a.safety === "thoughts" || a.safety === "unsafe"),
      unsafe: list.some((a) => a.safety === "unsafe"),
    });
  }
  return out;
}

export type Trend = "lower" | "higher" | "similar" | "unknown";

/**
 * Hope this week against hope the week before.
 *
 * Needs at least two check-ins in each week, and a whole point of difference
 * on a five-point scale, before it says anything. Two data points and a
 * decimal are how a tracker ends up telling someone they are "getting worse"
 * on the strength of one bad Tuesday.
 */
export function hopeTrend(arrivals: Arrival[], now: Date = new Date()): Trend {
  const t = now.getTime();
  const thisWeek = arrivals.filter((a) => {
    const x = Date.parse(a.at);
    return x > t - 7 * DAY && x <= t + HOUR;
  });
  const lastWeek = arrivals.filter((a) => {
    const x = Date.parse(a.at);
    return x > t - 14 * DAY && x <= t - 7 * DAY;
  });
  if (thisWeek.length < 2 || lastWeek.length < 2) return "unknown";
  const mean = (xs: Arrival[]) => xs.reduce((s, a) => s + a.hope, 0) / xs.length;
  const diff = mean(thisWeek) - mean(lastWeek);
  if (diff <= -1) return "lower";
  if (diff >= 1) return "higher";
  return "similar";
}

/* ─────────────────────────────────────────────────────────────
   The care-team summary.

   This is the whole of what Wellbeings can tell a professional, and it only
   ever leaves the phone because the person pressed a button and chose where
   it goes. There is no server here to send it anywhere else. The text is
   written to be read by a clinician in thirty seconds and by the person
   sending it without a glossary, which is why it uses the app's own words
   ("really heavy", "can't see a way forward") beside every number.
   ───────────────────────────────────────────────────────────── */

export const MOOD_WORDS: Record<Score, string> = {
  1: "Really heavy",
  2: "Low",
  3: "Getting through",
  4: "Okay",
  5: "Good",
};

export const HOPE_WORDS: Record<Score, string> = {
  1: "I can't see a way forward",
  2: "Hard to picture",
  3: "Not sure",
  4: "Some light",
  5: "Hopeful",
};

export interface SummaryInput {
  arrivals: Arrival[];
  safetyPlanWritten: boolean;
  safetyPlanUpdatedAt?: string;
  note?: string;
  now?: Date;
  /** Formats a date for the reader's locale. Injected so tests are stable. */
  formatDate?: (d: Date) => string;
}

export interface CareSummary {
  schema: "wellbeings.care-summary/1";
  generatedAt: string;
  windowDays: number;
  checkins: number;
  mood: { mean: number | null; lowest: Score | null; scale: "1-5, 1 = really heavy" };
  hope: { mean: number | null; lowest: Score | null; trend: Trend; scale: "1-5, 1 = can't see a way forward" };
  thoughtsReported: number;
  unsafeReported: number;
  lastThoughtsAt: string | null;
  safetyPlan: { written: boolean; updatedAt: string | null };
  daily: DayPoint[];
  note: string | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function buildCareSummary(input: SummaryInput): CareSummary {
  const now = input.now ?? new Date();
  const recent = within(input.arrivals, now, PATTERN_WINDOW_DAYS * DAY);
  const mean = (k: "mood" | "hope") =>
    recent.length ? round1(recent.reduce((s, a) => s + a[k], 0) / recent.length) : null;
  const lowest = (k: "mood" | "hope") => (recent.length ? (Math.min(...recent.map((a) => a[k])) as Score) : null);
  const flagged = sortedDesc(recent).filter((a) => a.safety === "thoughts" || a.safety === "unsafe");
  return {
    schema: "wellbeings.care-summary/1",
    generatedAt: now.toISOString(),
    windowDays: PATTERN_WINDOW_DAYS,
    checkins: recent.length,
    mood: { mean: mean("mood"), lowest: lowest("mood"), scale: "1-5, 1 = really heavy" },
    hope: { mean: mean("hope"), lowest: lowest("hope"), trend: hopeTrend(input.arrivals, now), scale: "1-5, 1 = can't see a way forward" },
    thoughtsReported: flagged.length,
    unsafeReported: recent.filter((a) => a.safety === "unsafe").length,
    lastThoughtsAt: flagged[0]?.at ?? null,
    safetyPlan: { written: input.safetyPlanWritten, updatedAt: input.safetyPlanUpdatedAt ?? null },
    daily: dailyPattern(input.arrivals, now),
    note: input.note?.trim() ? input.note.trim() : null,
  };
}

const TREND_WORDS: Record<Trend, string> = {
  lower: "Lower than the week before.",
  higher: "Higher than the week before.",
  similar: "About the same as the week before.",
  unknown: "",
};

/** The same summary as plain text, for a message, an email or a copy. */
export function careSummaryText(input: SummaryInput): string {
  const s = buildCareSummary(input);
  const fmt = input.formatDate ?? ((d: Date) => d.toDateString());
  const lines: string[] = [];
  lines.push(`My Wellbeings check-in summary, shared by me on ${fmt(new Date(s.generatedAt))}.`);
  lines.push("");
  if (!s.checkins) {
    lines.push(`No check-ins in the last ${s.windowDays} days.`);
  } else {
    lines.push(`Last ${s.windowDays} days: ${s.checkins} check-in${s.checkins === 1 ? "" : "s"}.`);
    lines.push(
      `How I've been arriving (1 = really heavy, 5 = good): average ${s.mood.mean}, lowest ${s.mood.lowest} (${MOOD_WORDS[s.mood.lowest as Score]}).`
    );
    lines.push(
      `How the days ahead look (1 = can't see a way forward, 5 = hopeful): average ${s.hope.mean}, lowest ${s.hope.lowest} (${HOPE_WORDS[s.hope.lowest as Score]}). ${TREND_WORDS[s.hope.trend]}`.trim()
    );
    if (s.thoughtsReported) {
      lines.push(
        `Thoughts of ending my life: reported on ${s.thoughtsReported} check-in${s.thoughtsReported === 1 ? "" : "s"}, most recently ${fmt(new Date(s.lastThoughtsAt as string))}.` +
          (s.unsafeReported ? ` On ${s.unsafeReported} of those I said I did not feel safe.` : "")
      );
    } else {
      lines.push("Thoughts of ending my life: not reported in this period.");
    }
  }
  lines.push(
    s.safetyPlan.written
      ? `Safety plan: written${s.safetyPlan.updatedAt ? `, last updated ${fmt(new Date(s.safetyPlan.updatedAt))}` : ""}.`
      : "Safety plan: not written yet."
  );
  if (s.note) {
    lines.push("");
    lines.push(`A note from me: ${s.note}`);
  }
  lines.push("");
  lines.push(
    "This was put together by the Wellbeings app on my own phone and sent by me. The app has no server and keeps no copy anywhere else. It is a self-report, not a clinical assessment."
  );
  return lines.join("\n");
}

/* ─────────────────────────────────────────────────────────────
   The dawn: how much lighter today's sky is.

   Each small thing someone does for themselves today (checking in,
   breathing, writing one good thing) lifts the sun a step. Five steps is a
   full sunrise. It resets at midnight to the night sky, never to a broken
   streak: there is nothing here to lose, only something to add to. Loss
   framing is the part of streak mechanics that turns a comfort app into one
   more thing someone is failing at.
   ───────────────────────────────────────────────────────────── */

export const DAWN_STEPS = 5;

export function dawnLevel(stepsToday: number): number {
  return Math.max(0, Math.min(DAWN_STEPS, stepsToday)) / DAWN_STEPS;
}
