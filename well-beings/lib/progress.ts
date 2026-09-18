import { CheckinEntry } from "./types";
import { dateKey } from "./scoring";

/**
 * The retention question, answered from evidence rather than instinct.
 *
 * A meta-analysis of 79 app trials found attrition was LOWER in trials with
 * no gamification features (Liu et al., 2025, JAMA Psychiatry) — points and
 * badges are associated with people leaving sooner, not staying. What does
 * predict people sticking with a mental-health app is perceiving that they
 * are improving (Hamitouche et al., 2024, Brighten study), and in-app mood
 * monitoring (Torous et al., 2019).
 *
 * So this file computes one honest thing: is your own trend going up? No
 * points, no badges, no streak-shaming. If the data isn't there yet, it says
 * so instead of inventing encouragement.
 */

/** Minimum logged days on each side before a comparison means anything. */
const MIN_PER_WINDOW = 3;
const WINDOW = 7;

export type ProgressDirection = "up" | "flat" | "down" | "insufficient";

export interface ProgressRead {
  direction: ProgressDirection;
  /** Daily scores, oldest→newest, null where nothing was logged. 1–5, higher is better. */
  series: (number | null)[];
  recentAvg: number | null;
  priorAvg: number | null;
  /** Change in points on the 1–5 scale, positive = better. */
  delta: number | null;
  loggedDays: number;
  /** How many more days of logging before the comparison becomes meaningful. */
  daysNeeded: number;
  headline: string;
  detail: string;
}

function dayScore(c: CheckinEntry | undefined): number | null {
  if (!c) return null;
  const vals = [c.mood, c.energy, c.sleep].filter((v): v is number => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function readProgress(checkins: Record<string, CheckinEntry>): ProgressRead {
  const series: (number | null)[] = [];
  for (let i = WINDOW * 2 - 1; i >= 0; i--) series.push(dayScore(checkins[dateKey(-i)]));

  const prior = series.slice(0, WINDOW).filter((v): v is number => v != null);
  const recent = series.slice(WINDOW).filter((v): v is number => v != null);
  const loggedDays = prior.length + recent.length;

  if (recent.length < MIN_PER_WINDOW || prior.length < MIN_PER_WINDOW) {
    const shortfall =
      Math.max(0, MIN_PER_WINDOW - recent.length) + Math.max(0, MIN_PER_WINDOW - prior.length);
    return {
      direction: "insufficient",
      series,
      recentAvg: recent.length ? avg(recent) : null,
      priorAvg: prior.length ? avg(prior) : null,
      delta: null,
      loggedDays,
      daysNeeded: shortfall,
      headline: loggedDays === 0 ? "Nothing logged yet" : `${loggedDays} day${loggedDays === 1 ? "" : "s"} logged`,
      detail:
        `A trend needs about ${shortfall} more check-in${shortfall === 1 ? "" : "s"} before it means anything. ` +
        "Ten seconds a day is enough, and this is the part of the app with the best evidence behind it.",
    };
  }

  const recentAvg = avg(recent);
  const priorAvg = avg(prior);
  const delta = recentAvg - priorAvg;
  // 0.3 of a point on a 1–5 scale: below this, day-to-day noise explains it.
  const direction: ProgressDirection = delta >= 0.3 ? "up" : delta <= -0.3 ? "down" : "flat";

  const headline =
    direction === "up"
      ? "Your last week is better than the one before"
      : direction === "down"
        ? "This week is running lower than last"
        : "Holding steady";

  const detail =
    direction === "up"
      ? "That's the direction that matters, and noticing it matters too: people who can see their own improvement are the ones who keep going. Whatever you changed, keep it."
      : direction === "down"
        ? "Not a verdict on you. A fortnight is a small window, and weeks are allowed to be bad. If it keeps sloping down, the burnout radar and your recovery quota are the two places to look."
        : "No real movement either way. Steady is a legitimate result, especially in a demanding stretch. It means recovery is keeping pace with load.";

  return { direction, series, recentAvg, priorAvg, delta, loggedDays, daysNeeded: 0, headline, detail };
}

/* ─────────────────────────────────────────────────────────────────────────
   Per-dimension trends
   ─────────────────────────────────────────────────────────────────────────
   readProgress above averages mood, energy and sleep into one number, which
   answers "am I going up?" and hides which of the three moved. Those come
   apart constantly: sleep sliding while mood holds is a different situation
   from mood sliding while sleep holds, and the advice differs.

   The harder problem this block exists to solve is overreading. Three data
   points that happen to slope is not a trend, and a tool that announces one
   from noise teaches people to distrust it. So a direction is only reported
   when three separate conditions hold at once:

     enough data     at least 3 logged days in each 7-day window
     a real gap      the change clears 0.5 on a 1-5 scale, which is wider
                     than the 0.3 used for the combined score because a
                     single dimension is noisier than an average of three
     consistency     the recent window's own days agree with the direction,
                     so one very bad Tuesday cannot produce a "declining"

   That last condition is what separates the three categories the read-out
   names: a ONE-OFF (a single day away from the pattern), a REPEATED DIP
   (several days, no settled direction) and a TREND (a consistent slope).
   Only the third is described as a direction, and even then in hedged
   language: nothing here claims one dimension caused another, because
   nothing in three weeks of self-reported data could establish that.
   ───────────────────────────────────────────────────────────────────────── */

export type TrendKind = "trend-up" | "trend-down" | "steady" | "one-off" | "repeated" | "insufficient";

export interface DimensionTrend {
  key: "mood" | "energy" | "sleep";
  label: string;
  kind: TrendKind;
  /** Change in points on the 1-5 scale, positive = better. Null when unknown. */
  delta: number | null;
  /** Plain-language line. Never asserts cause. */
  note: string;
}

const LABELS: Record<DimensionTrend["key"], string> = {
  mood: "Mood",
  energy: "Energy",
  sleep: "Sleep",
};

/** Wider than the combined score's 0.3: one dimension bounces more than an
    average of three, so the bar for calling it a direction has to be higher. */
const DIM_THRESHOLD = 0.5;

export function readDimensionTrends(checkins: Record<string, CheckinEntry>): DimensionTrend[] {
  return (["sleep", "energy", "mood"] as const).map((key) => {
    const series: (number | null)[] = [];
    for (let i = WINDOW * 2 - 1; i >= 0; i--) {
      const v = checkins[dateKey(-i)]?.[key];
      series.push(typeof v === "number" ? v : null);
    }

    const prior = series.slice(0, WINDOW).filter((v): v is number => v != null);
    const recent = series.slice(WINDOW).filter((v): v is number => v != null);

    if (recent.length < MIN_PER_WINDOW || prior.length < MIN_PER_WINDOW) {
      return {
        key,
        label: LABELS[key],
        kind: "insufficient" as const,
        delta: null,
        note: "Not enough logged days yet to say anything either way.",
      };
    }

    const recentAvg = avg(recent);
    const delta = recentAvg - avg(prior);
    const worse = delta <= -DIM_THRESHOLD;
    const better = delta >= DIM_THRESHOLD;

    if (!worse && !better) {
      return {
        key,
        label: LABELS[key],
        kind: "steady" as const,
        delta,
        note: "Holding about where it was. Steady is a result, not an absence of one.",
      };
    }

    /* Is the recent window actually consistent, or is one outlier carrying
       the whole difference? Recomputed without its most extreme day: if the
       gap collapses, this was an event, not a direction. */
    const extreme = worse ? Math.min(...recent) : Math.max(...recent);
    const withoutExtreme = recent.filter((v, i) => i !== recent.indexOf(extreme));
    const robust =
      withoutExtreme.length >= 2 &&
      Math.abs(avg(withoutExtreme) - avg(prior)) >= DIM_THRESHOLD * 0.6;

    if (!robust) {
      return {
        key,
        label: LABELS[key],
        kind: "one-off" as const,
        delta,
        note: `One day is doing most of the work in that difference. That reads as a single bad day rather than a direction, and a single day is allowed.`,
      };
    }

    // Consistent enough to name, still hedged: "appears to" not "is".
    const agreeing = recent.filter((v) => (worse ? v < avg(prior) : v > avg(prior))).length;
    if (agreeing < Math.ceil(recent.length / 2)) {
      return {
        key,
        label: LABELS[key],
        kind: "repeated" as const,
        delta,
        note: "Up and down rather than heading one way. Worth watching for another week before reading anything into it.",
      };
    }

    return {
      key,
      label: LABELS[key],
      kind: worse ? ("trend-down" as const) : ("trend-up" as const),
      delta,
      note: worse
        ? `Lower across most of the last week than the week before. That is a pattern rather than a bad day, which makes it worth a look.`
        : `Higher across most of the last week than the week before. Whatever changed, it appears to be working.`,
    };
  });
}

/** A sentence naming what moved with what, when two dimensions shifted the
    same way. Deliberately correlational: "appears to coincide with" is the
    strongest claim two weeks of self-report can carry, and "X caused Y" is
    not available at any sample size here. */
export function coincidenceNote(trends: DimensionTrend[]): string | null {
  const moving = trends.filter((t) => t.kind === "trend-up" || t.kind === "trend-down");
  if (moving.length < 2) return null;
  const down = moving.filter((t) => t.kind === "trend-down").map((t) => t.label.toLowerCase());
  const up = moving.filter((t) => t.kind === "trend-up").map((t) => t.label.toLowerCase());
  if (down.length >= 2)
    return `${down.slice(0, -1).join(", ")} and ${down[down.length - 1]} moved down together. They often travel with each other, so it may be one thing showing up in two places rather than two problems. This cannot tell you which way round it goes.`;
  if (up.length >= 2)
    return `${up.slice(0, -1).join(", ")} and ${up[up.length - 1]} moved up together, which is the usual pattern when something is genuinely working.`;
  return `${up[0]} rose while ${down[0]} fell. That combination appears to coincide rather than to explain itself, and a fortnight is too short to say more.`;
}
