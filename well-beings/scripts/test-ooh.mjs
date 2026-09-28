/**
 * Tests for what Ooh says (lib/oohScript.ts).
 *
 * Run: node --test scripts/test-ooh.mjs   (part of npm run verify)
 *
 * Ooh talks to people on their worst days. These are the rules its lines
 * must keep, checked across every scene the app can show.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { allScripts, oohScript, GENTLE_MOODS } from "../lib/oohScript.ts";
import { MOODS, oohSvg } from "../lib/ooh.mjs";

const lines = allScripts().flatMap((s) => [...s.lines, s.short].map((l) => ({ ...l, id: s.id })));

test("every line fits a phone bubble", () => {
  for (const l of lines) assert.ok(l.text.length <= 120, `${l.id}: ${l.text.length} chars`);
});

test("no em dashes, like the rest of the copy", () => {
  for (const l of lines) assert.ok(!/—/.test(l.text), `${l.id}: ${l.text}`);
});

test("Ooh never implies someone is watching, waiting or coming", () => {
  const bad = /\b(watching|monitor|we('| a)re here|i'?m here for you|i'?ll be here|someone will (call|come|reach)|we'?ll (call|contact|check)|alert(ed)?|notif(y|ied))\b/i;
  for (const l of lines) assert.ok(!bad.test(l.text), `${l.id}: ${l.text}`);
});

test("on heavy, thoughts and urgent days Ooh is only ever gentle", () => {
  for (const level of ["heavy", "thoughts", "urgent"]) {
    for (const returning of [false, true]) {
      const s = oohScript({ kind: "here", level, returning, hour: 12 });
      for (const l of [...s.lines, s.short]) assert.ok(GENTLE_MOODS.includes(l.mood), `${level}: "${l.mood}" for "${l.text}"`);
    }
  }
});

test("on heavy days and worse, Ooh never takes space above the plan and the numbers", () => {
  for (const level of ["heavy", "thoughts", "urgent"]) {
    for (const returning of [false, true]) assert.equal(oohScript({ kind: "here", level, returning, hour: 12 }).quiet, true, level);
  }
  for (const level of [null, "steady", "low"]) assert.notEqual(oohScript({ kind: "here", level, returning: false, hour: 12 }).quiet, true, String(level));
});

test("thoughts and urgent always point at the numbers and the plan", () => {
  for (const level of ["thoughts", "urgent"]) {
    const s = oohScript({ kind: "here", level, returning: false, hour: 12 });
    const all = [...s.lines, s.short].map((l) => l.text).join(" ");
    assert.match(all, /number|line/i);
  }
});

test("every mood the script uses can be drawn", () => {
  for (const l of lines) assert.ok(MOODS.includes(l.mood), `${l.id}: ${l.mood}`);
  for (const m of MOODS) assert.match(oohSvg({ mood: m }), /^<svg[^>]+viewBox="0 0 120 120"/);
});

test("the drawing has no ids, so many copies can share a page", () => {
  for (const m of MOODS) assert.ok(!/\sid=/.test(oohSvg({ mood: m })), m);
});
