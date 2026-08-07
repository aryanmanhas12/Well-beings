/**
 * The journal — Well-Beings' core, and what separates it from the screener.
 *
 * This is expressive writing, and the research is specific enough to design
 * against rather than guess at:
 *
 *  · It works, modestly and durably. Across 31 randomised trials (N=4,012),
 *    expressive writing reduced depression, anxiety and stress — a small
 *    effect (g = −0.12), but one that HELD at follow-up (Guo, 2022).
 *
 *  · The effect is DELAYED. Benefits showed up at follow-up, not immediately
 *    after writing. So the app must not promise you'll feel better tonight —
 *    it says so out loud, because a tool that over-promises gets abandoned
 *    the first evening it doesn't deliver.
 *
 *  · Short gaps beat long ones. Sessions 1–3 days apart produced
 *    significantly stronger effects than weekly-or-longer (Guo, 2022). That
 *    single finding sets the app's whole cadence: it nudges toward every
 *    other day, never "journal daily or lose your streak".
 *
 *  · Disclosure PLUS reappraisal beats either alone (Lu et al., 2010). So
 *    prompts alternate: one asks what happened and how it felt, the next
 *    asks what it might mean or how else it could be read.
 *
 *  · Gratitude and "best possible self" are the most reliably beneficial of
 *    the positive techniques (Hoult et al., 2025) — so they're in the
 *    rotation, but not the whole of it, since positive-only writing shows
 *    weaker effects on distress than disclosure does.
 */

export type PromptKind = "disclosure" | "reappraisal" | "gratitude" | "future";

export interface JournalPrompt {
  id: string;
  kind: PromptKind;
  /** Shown as the writing prompt itself. */
  text: string;
  /** One line on why this prompt exists — shown on demand, never forced. */
  why: string;
}

export interface JournalEntry {
  /** ISO timestamp — entries are keyed by this, so several a day is fine. */
  at: string;
  promptId: string;
  kind: PromptKind;
  text: string;
  /** Word count, kept so trends can be shown without re-reading the text. */
  words: number;
}

export const KIND_LABEL: Record<PromptKind, string> = {
  disclosure: "Get it out",
  reappraisal: "Look again",
  gratitude: "What held up",
  future: "Where this goes",
};

/**
 * The rotation deliberately alternates disclosure → reappraisal, because the
 * combination outperformed either alone. Gratitude and future-self prompts
 * are interleaved rather than clustered, so a hard week never opens with
 * "name three good things", which reads as dismissive when things are bad.
 */
export const PROMPTS: JournalPrompt[] = [
  {
    id: "d1",
    kind: "disclosure",
    text: "What's been sitting heaviest this week? Write about it properly — what happened, and how it actually felt. No one reads this but you.",
    why: "Writing about a stressful experience in emotional detail is the original expressive-writing instruction, and the one with the most evidence behind it.",
  },
  {
    id: "r1",
    kind: "reappraisal",
    text: "Take what you just wrote about, or whatever's loudest right now. What's another way of reading it — one a friend might offer you?",
    why: "Cognitive reappraisal on top of emotional disclosure beat either one on its own in head-to-head trials.",
  },
  {
    id: "g1",
    kind: "gratitude",
    text: "Three things that held up this week. They can be small — a person, a meal, a moment the day stopped being awful.",
    why: "Gratitude writing has the most consistent benefits of any positive-writing technique for wellbeing and mood.",
  },
  {
    id: "d2",
    kind: "disclosure",
    text: "Something you've been carrying and haven't said out loud. Start anywhere. Grammar doesn't matter here.",
    why: "The benefit comes from the disclosure itself, not the writing quality — trials found no relationship with how well-written the entry was.",
  },
  {
    id: "r2",
    kind: "reappraisal",
    text: "Think of something that went badly recently. What did it actually cost you — and what, if anything, did you learn that you'd keep?",
    why: "Benefit-finding is a reappraisal technique: not pretending it was good, just checking whether anything usable came out of it.",
  },
  {
    id: "f1",
    kind: "future",
    text: "Picture a version of the next year where things went about as well as they realistically could. What is that person's ordinary Tuesday like?",
    why: "The \"best possible self\" exercise is, alongside gratitude, the most reliably beneficial positive-writing technique tested.",
  },
  {
    id: "d3",
    kind: "disclosure",
    text: "What's draining you that you haven't admitted is draining you?",
    why: "Naming a stressor in writing is associated with reduced rumination about it later.",
  },
  {
    id: "r3",
    kind: "reappraisal",
    text: "What are you being harder on yourself about than you'd be on anyone else?",
    why: "Self-distancing — viewing your own situation as you'd view someone else's — is a well-supported reappraisal move.",
  },
];

/** Milliseconds in a day, used for the cadence maths below. */
const DAY = 86_400_000;

/**
 * Picks the next prompt. Rotates through the list rather than randomising,
 * so the disclosure → reappraisal pairing survives — random selection would
 * frequently serve two disclosures in a row and lose the combination effect.
 */
export function nextPrompt(entries: JournalEntry[]): JournalPrompt {
  if (!entries.length) return PROMPTS[0];
  const last = entries[entries.length - 1];
  const i = PROMPTS.findIndex((p) => p.id === last.promptId);
  return PROMPTS[(i + 1) % PROMPTS.length];
}

export interface JournalCadence {
  /** Whole days since the last entry; null when there's never been one. */
  daysSince: number | null;
  /** True when it's been long enough that a nudge is honest rather than nagging. */
  dueSoon: boolean;
  message: string;
}

export function readCadence(entries: JournalEntry[]): JournalCadence {
  if (!entries.length) {
    return {
      daysSince: null,
      dueSoon: false,
      message:
        "Nothing written yet. Fifteen minutes is the classic dose, but a few honest sentences count — the research found writing quality didn't matter, only that you were honest.",
    };
  }
  const last = new Date(entries[entries.length - 1].at).getTime();
  const daysSince = Math.floor((Date.now() - last) / DAY);

  if (daysSince <= 0)
    return { daysSince, dueSoon: false, message: "Written today. The effect tends to show up later, not tonight — that's normal." };
  if (daysSince <= 3)
    return {
      daysSince,
      dueSoon: daysSince >= 2,
      message: `${daysSince} day${daysSince === 1 ? "" : "s"} since your last entry. Every 1–3 days is the interval that worked best in trials.`,
    };
  return {
    daysSince,
    dueSoon: true,
    message: `${daysSince} days since your last entry. No guilt intended — but sessions closer together did measurably more than spaced-out ones.`,
  };
}

/** Words written in the last 14 days, for the quiet progress line. */
export function recentWords(entries: JournalEntry[]): number {
  const cutoff = Date.now() - 14 * DAY;
  return entries.filter((e) => new Date(e.at).getTime() >= cutoff).reduce((n, e) => n + e.words, 0);
}

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * Words that, in a journal entry, are worth responding to rather than
 * silently storing. This is deliberately NOT a screener and not a risk
 * score: it's a small, transparent keyword check whose only job is to make
 * sure the crisis card is offered to someone who just wrote something
 * frightening. False positives are acceptable here; a missed one is not.
 */
const CONCERN_PATTERNS = [
  /\bkill(ing)? myself\b/i,
  /\bend (my|it) (life|all)\b/i,
  /\bsuicid/i,
  /\bbetter off dead\b/i,
  /\bwant to die\b/i,
  /\bhurt(ing)? myself\b/i,
  /\bself[- ]harm/i,
  /\bno reason to (live|go on)\b/i,
];

export function mentionsCrisis(text: string): boolean {
  return CONCERN_PATTERNS.some((re) => re.test(text));
}
