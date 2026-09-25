/**
 * Tests for lib/care.ts: the rules that decide when the safe place offers
 * comfort, when it points at a person, and when it puts a crisis line on
 * screen.
 *
 * Run: npm run test:care   (Node 22.6+ strips the TypeScript types itself)
 *
 * These are the rules in the app most worth being wrong about loudly. Each
 * case below is a situation a real person could be in, and the assertion is
 * what the app must do for them. If a threshold ever changes, the case that
 * breaks should make the consequence obvious.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  careLevel,
  careSummaryText,
  buildCareSummary,
  dailyPattern,
  dawnLevel,
  hopeTrend,
  isSustainedLow,
  shouldAskSafety,
} from "../lib/care.ts";

const NOW = new Date("2026-09-25T21:00:00");
const ago = (h) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const a = (h, mood, hope, safety) => ({ at: ago(h), mood, hope, ...(safety ? { safety } : {}) });

test("nothing logged yet reads as steady, not as a judgement", () => {
  assert.equal(careLevel([], NOW), "steady");
});

test("the direct question is asked on a heavy mood or very little hope, and only then", () => {
  assert.equal(shouldAskSafety(1, 5), true);
  assert.equal(shouldAskSafety(2, 4), true);
  assert.equal(shouldAskSafety(4, 2), true, "okay mood with no way forward still gets asked");
  assert.equal(shouldAskSafety(3, 3), false);
  assert.equal(shouldAskSafety(5, 5), false);
});

test("'I don't feel safe' is urgent the moment it is said", () => {
  assert.equal(careLevel([a(0, 1, 1, "unsafe")], NOW), "urgent");
});

test("one good check-in after 'unsafe' keeps the plan pinned, never back to steady", () => {
  const xs = [a(20, 1, 1, "unsafe"), a(1, 4, 3)];
  assert.equal(careLevel(xs, NOW), "thoughts");
});

test("thoughts reported stay pinned for three days, then release", () => {
  assert.equal(careLevel([a(70, 2, 2, "thoughts"), a(1, 4, 4)], NOW), "thoughts");
  assert.equal(careLevel([a(80, 2, 2, "thoughts"), a(1, 4, 4)], NOW), "steady");
});

test("a run of low hope is 'heavy' even when today's mood is okay", () => {
  const xs = [a(100, 3, 2), a(60, 3, 1), a(30, 3, 2), a(1, 4, 3)];
  assert.equal(isSustainedLow(xs, NOW), true);
  assert.equal(careLevel(xs, NOW), "heavy");
});

test("one bad day is 'low', not 'heavy'", () => {
  const xs = [a(50, 4, 4), a(26, 4, 4), a(1, 2, 3)];
  assert.equal(careLevel(xs, NOW), "low");
});

test("low hope from three weeks ago does not count toward 'heavy'", () => {
  const xs = [a(24 * 20, 1, 1), a(24 * 19, 1, 1), a(24 * 18, 1, 1), a(1, 4, 4)];
  assert.equal(careLevel(xs, NOW), "steady");
});

test("an unsorted history is read by time, not by array order", () => {
  const xs = [a(1, 1, 1, "unsafe"), a(30, 5, 5)];
  assert.equal(careLevel(xs.reverse(), NOW), "urgent");
});

test("the daily pattern keeps the worst moment of a day, not the average", () => {
  const xs = [a(3, 5, 5), a(2, 1, 2, "thoughts")];
  const today = dailyPattern(xs, NOW).at(-1);
  assert.equal(today.mood, 1);
  assert.equal(today.hope, 2);
  assert.equal(today.thoughts, true);
  assert.equal(dailyPattern(xs, NOW).length, 14);
});

test("the trend says nothing until there is enough to say it", () => {
  assert.equal(hopeTrend([a(1, 3, 1)], NOW), "unknown");
  const falling = [a(24 * 10, 3, 4), a(24 * 9, 3, 4), a(24 * 2, 2, 2), a(24, 2, 2)];
  assert.equal(hopeTrend(falling, NOW), "lower");
  const steady = [a(24 * 10, 3, 3), a(24 * 9, 3, 3), a(24 * 2, 3, 3), a(24, 3, 4)];
  assert.equal(hopeTrend(steady, NOW), "similar");
});

test("the care summary says what was reported, in the person's own words", () => {
  const xs = [a(24 * 3, 2, 2), a(24, 1, 1, "thoughts"), a(2, 3, 2)];
  const text = careSummaryText({
    arrivals: xs,
    safetyPlanWritten: true,
    safetyPlanUpdatedAt: ago(24 * 2),
    note: "  Rough week at college.  ",
    now: NOW,
    formatDate: (d) => d.toISOString().slice(0, 10),
  });
  assert.match(text, /3 check-ins/);
  assert.match(text, /lowest 1 \(Really heavy\)/);
  assert.match(text, /Thoughts of ending my life: reported on 1 check-in/);
  assert.match(text, /Safety plan: written, last updated/);
  assert.match(text, /A note from me: Rough week at college\./);
  assert.match(text, /sent by me/);
  assert.doesNotMatch(text, /diagnos/i, "a self-report must never read as a diagnosis");
});

test("the care summary says plainly when there is nothing to report", () => {
  const text = careSummaryText({ arrivals: [], safetyPlanWritten: false, now: NOW, formatDate: () => "x" });
  assert.match(text, /No check-ins in the last 14 days/);
  assert.match(text, /Safety plan: not written yet/);
});

test("the machine-readable summary carries a versioned schema", () => {
  const s = buildCareSummary({ arrivals: [a(1, 2, 2)], safetyPlanWritten: false, now: NOW });
  assert.equal(s.schema, "wellbeings.care-summary/1");
  assert.equal(s.checkins, 1);
  assert.equal(s.note, null);
});

test("the dawn only rises and caps at a full sunrise", () => {
  assert.equal(dawnLevel(0), 0);
  assert.equal(dawnLevel(3), 0.6);
  assert.equal(dawnLevel(12), 1);
});
