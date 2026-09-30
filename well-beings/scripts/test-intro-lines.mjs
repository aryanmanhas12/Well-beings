/**
 * Tests for the opening sunrise's lines (lib/introLines.ts).
 *
 * Run: node --test scripts/test-intro-lines.mjs   (part of npm run verify)
 *
 * One of these is the first thing someone reads each time they open Arun,
 * possibly on a very hard day. These are the rules every line keeps.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { INTRO_LINES } from "../lib/introLines.ts";

test("there are enough lines for a new one every visit for weeks", () => {
  assert.ok(INTRO_LINES.length >= 30, `only ${INTRO_LINES.length}`);
});

test("every line is different", () => {
  assert.equal(new Set(INTRO_LINES.map((l) => l.toLowerCase())).size, INTRO_LINES.length);
});

test("short enough to read while the words rise", () => {
  for (const l of INTRO_LINES) assert.ok(l.length <= 60, `too long (${l.length}): ${l}`);
});

test("finished sentences, no shouting, no em or en dashes", () => {
  for (const l of INTRO_LINES) {
    assert.match(l, /[.]$/, `should end with a full stop: ${l}`);
    assert.ok(!/[—–!]/.test(l), `dash or exclamation: ${l}`);
    assert.ok(!/  /.test(l), `double space: ${l}`);
  }
});

test("never implies someone is there, watching or coming", () => {
  const bad = /\b(we|we're|us|our|i'm here|i am here|someone is|watching|waiting for you|coming|with you)\b/i;
  for (const l of INTRO_LINES) assert.ok(!bad.test(l), `implies a person behind the app: ${l}`);
});

test("no promises about how things will turn out", () => {
  const bad = /\b(will be (ok|okay|fine|alright)|everything will|it gets better|guarantee|always|never again)\b/i;
  for (const l of INTRO_LINES) assert.ok(!bad.test(l), `a forecast, not encouragement: ${l}`);
});

test("none of the words the house style bans", () => {
  const bad = /\b(seamless|elevate|unlock|empower|delve|robust|leverage|journey)\b|it's not just/i;
  for (const l of INTRO_LINES) assert.ok(!bad.test(l), `banned wording: ${l}`);
});

test("nothing about methods, harm or death", () => {
  const bad = /\b(die|dying|death|kill|suicid|hurt yourself|end it|pills|overdose|jump)\w*/i;
  for (const l of INTRO_LINES) assert.ok(!bad.test(l), `unsafe word: ${l}`);
});
