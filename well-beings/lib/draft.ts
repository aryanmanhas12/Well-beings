import { buildFlow } from "./chatFlow";
import { Depth } from "./lifestyle";
import { FlowCtx, Question } from "./types";

/**
 * Surviving a refresh mid-check-in.
 *
 * The bug this file fixes: answers lived only in a ref, and the one call that
 * wrote to localStorage ran at the very end. Reloading the tab, following a
 * link and coming back, or having a phone kill the tab in the background
 * silently threw away up to twenty answers. For a five-minute form that
 * people are often filling in while not at their best, that is the worst
 * possible failure, and it was invisible — nothing errored, the app just
 * opened on the welcome screen as though nothing had happened.
 *
 * What is persisted, and what is not. Only the depth and the raw answers.
 * The pending queue is NOT saved, because questions carry `after` callbacks
 * and functions do not survive JSON. Instead the queue is rebuilt on resume
 * by replaying the saved answers through a fresh flow, which re-runs those
 * callbacks and so reproduces every adaptive branch exactly — including the
 * crisis flag, which must not be lost across a reload.
 *
 * That replay is also the reason this is stored separately from the main
 * `wellbeings-v1` key rather than inside it: a draft is a different lifecycle
 * from a finished profile, and it is deleted the moment the check-in
 * completes so a stale half-answered form can never resurrect over a real
 * result.
 */

const DRAFT_KEY = "wellbeings-draft-v1";

export type Answers = Record<string, string | number | undefined>;

export interface Draft {
  depth: Depth;
  answers: Answers;
  /** Epoch ms, used only to expire a draft nobody came back to. */
  savedAt: number;
}

/** A week. Long enough that finishing tomorrow works, short enough that a
    half-finished form from two months ago does not reappear as though it
    still described someone's life. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function saveDraft(depth: Depth, answers: Answers): void {
  if (typeof window === "undefined") return;
  try {
    const draft: Draft = { depth, answers, savedAt: Date.now() };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage blocked or full. The check-in still works in memory; it just
    // loses the safety net, which is exactly the old behaviour.
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (!d || typeof d !== "object" || !d.answers) return null;
    if (Date.now() - (d.savedAt || 0) > MAX_AGE_MS) {
      clearDraft();
      return null;
    }
    if (Object.keys(d.answers).length === 0) return null;
    return { depth: d.depth === "quick" ? "quick" : "detailed", answers: d.answers, savedAt: d.savedAt };
  } catch {
    return null;
  }
}

export interface Replay {
  /** Questions already answered, in the order they were asked. */
  asked: Question[];
  /** What is still to come, with adaptive branches restored. */
  pending: Question[];
  /** Whether a crisis card was triggered during the answered portion. */
  crisis: boolean;
}

/**
 * Rebuilds flow position from answers alone.
 *
 * Walks a fresh flow, consuming questions that already have an answer and
 * running each one's `after` so the branches it created come back. Stops at
 * the first unanswered question, which is where the person left off.
 */
export function replayFlow(depth: Depth, answers: Answers): Replay {
  const pending = buildFlow(depth);
  const asked: Question[] = [];
  let crisis = false;

  const ctx: FlowCtx = {
    answers,
    insertNext: (qs: Question[]) => pending.unshift(...qs),
    triggerCrisis: () => {
      crisis = true;
    },
  };

  // Bounded rather than `while (true)`: a malformed draft must not be able to
  // spin the main thread on a page load.
  for (let guard = 0; guard < 200; guard++) {
    const q = pending[0];
    if (!q) break;
    const value = answers[q.id];
    if (value === undefined) break;
    pending.shift();
    asked.push(q);
    q.after?.(value, ctx);
  }

  return { asked, pending, crisis };
}

/** The label a person chose, for rebuilding the transcript on resume. Falls
    back to the raw value so a changed option list degrades to something
    truthful rather than blank. */
export function answerLabel(q: Question, value: string | number): string {
  const opt = q.opts?.find((o) => o.value === value);
  return opt ? opt.label : String(value);
}
