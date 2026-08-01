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
        "Ten seconds a day is enough — this is the part of the app with the best evidence behind it.",
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
        ? "Not a verdict on you — a fortnight is a small window, and weeks are allowed to be bad. If it keeps sloping down, the burnout radar and your recovery quota are the two places to look."
        : "No real movement either way. Steady is a legitimate result, especially in a demanding stretch — it means recovery is keeping pace with load.";

  return { direction, series, recentAvg, priorAvg, delta, loggedDays, daysNeeded: 0, headline, detail };
}
