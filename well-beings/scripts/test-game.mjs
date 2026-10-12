/**
 * Tests for Scoops & Snowballs (lib/game/engine.ts): the city, the rules,
 * and whole games played to the end with nobody at the controls.
 *
 * Run: node --test scripts/test-game.mjs   (part of npm run verify)
 *
 * What matters most is at the bottom: every game ends with the two of
 * them holding hands, and nothing anyone reads in the game talks about
 * hurting anyone.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import {
  buildCity,
  buildNav,
  findPath,
  newGame,
  update,
  emptyInput,
  playerOf,
  rivalOf,
  solidAt,
  clearLine,
  badges,
  WORLD_W,
  WORLD_H,
} from "../lib/game/engine.ts";

const city = buildCity(11);

test("the city: no building overlaps another, and nothing sits in a street", () => {
  const b = city.buildings;
  for (let i = 0; i < b.length; i++)
    for (let j = i + 1; j < b.length; j++) {
      const o = b[i].x < b[j].x + b[j].w - 0.5 && b[j].x < b[i].x + b[i].w - 0.5 && b[i].y < b[j].y + b[j].h - 0.5 && b[j].y < b[i].y + b[i].h - 0.5;
      assert.ok(!o, `buildings ${b[i].id} and ${b[j].id} overlap`);
    }
  for (const s of city.spots) assert.ok(!solidAt(city, s.x, s.y, 14), `a power-up spot is inside something at ${s.x},${s.y}`);
  for (const t of ["dog", "cat"]) {
    assert.ok(!solidAt(city, city.starts[t].x, city.starts[t].y, 15), `${t} starts inside something`);
    for (const h of city.palHomes[t]) assert.ok(!solidAt(city, h.x, h.y, 12), `a ${t} pal waits inside something`);
  }
  assert.ok(city.buildings.length > 40, "a city, not a village");
  assert.ok(city.trees.length >= 20, "a park with trees");
});

test("there is a way from each start to the other, and to every pal", () => {
  const nav = buildNav(city);
  const path = findPath(nav, city.starts.dog, city.starts.cat);
  assert.ok(path.length > 10, "dog start to cat start");
  for (const p of path.slice(0, -1)) assert.ok(!solidAt(city, p.x, p.y, 10), `a waypoint at ${p.x},${p.y} is inside a building`);
  for (const t of ["dog", "cat"]) for (const h of city.palHomes[t]) assert.ok(findPath(nav, city.starts[t], h).length > 0, `${t} can reach its pal`);
});

test("buildings stop a throw, open street does not", () => {
  const b = city.buildings[5];
  const west = { x: b.x - 30, y: b.y + b.h / 2 };
  const east = { x: b.x + b.w + 30, y: b.y + b.h / 2 };
  assert.equal(clearLine(city, west, east), false);
  assert.equal(clearLine(city, city.starts.dog, { x: city.starts.dog.x + 200, y: city.starts.dog.y }), true);
});

function play(g, seconds, input = emptyInput(), each) {
  for (let i = 0; i < seconds * 60; i++) {
    update(g, 1 / 60, input);
    each?.(g);
  }
}

/* A small stage: the rival placed in plain sight of the player. */
function faceOff(opts = {}) {
  const g = newGame({ team: "dog", sky: "day", pace: "gentle", seed: 3, ...opts });
  const p = playerOf(g);
  const r = rivalOf(g);
  r.ai = null;
  r.x = p.x + 160;
  r.y = p.y;
  play(g, 1.7);
  g.events.length = 0;
  return { g, p, r };
}

test("a splat lowers the bar and leaves a blob on the fur", () => {
  const { g, p, r } = faceOff();
  const before = r.hp;
  r.ai = null;
  const input = { ...emptyInput(), fire: true, aim: { x: r.x, y: r.y } };
  /* Hold the rival still: it is the player's turn. */
  for (let i = 0; i < 40; i++) {
    r.x = p.x + 160;
    r.y = p.y;
    update(g, 1 / 60, input);
  }
  assert.ok(r.hp < before, `rival's bar went down (${before} to ${r.hp})`);
  assert.ok(r.stains.length >= 1, "and there is ice cream on them");
  assert.ok(g.events.some((e) => e.k === "hit" && e.byPlayer), "the page hears about the hit");
});

test("a snowball makes them chilly (slower) for a moment", () => {
  const { g, p, r } = faceOff();
  p.ammo = "snow";
  for (let i = 0; i < 40; i++) {
    r.x = p.x + 160;
    r.y = p.y;
    update(g, 1 / 60, { ...emptyInput(), fire: i === 0, aim: { x: r.x, y: r.y } });
    if (r.slow > 0) break;
  }
  assert.ok(r.slow > 0);
});

test("an umbrella blocks a splat", () => {
  const { g, p, r } = faceOff();
  r.shield = 5;
  const before = r.hp;
  for (let i = 0; i < 40; i++) {
    r.x = p.x + 160;
    r.y = p.y;
    update(g, 1 / 60, { ...emptyInput(), fire: i === 0, aim: { x: r.x, y: r.y } });
  }
  assert.equal(r.hp, before);
  assert.ok(g.events.some((e) => e.k === "block"));
});

test("a cupcake perks you up, and power-ups do what they say", () => {
  const { g, p } = faceOff();
  p.hp = 50;
  p.stains = [{ x: 0, y: -10, r: 4, c: "#fff" }];
  const kinds = ["cupcake", "triple", "mega", "dash", "umbrella"];
  for (const kind of kinds) {
    g.pickups = [{ id: 999, kind, x: p.x, y: p.y, t: 0 }];
    update(g, 1 / 60, emptyInput());
  }
  assert.equal(p.hp, 75);
  assert.equal(p.stains.length, 0);
  assert.equal(p.triple, 6);
  assert.equal(p.mega, 3);
  assert.ok(p.dash > 5);
  assert.ok(p.shield > 5);
  assert.equal(g.stats.treats, 5);
});

test("walking up to a lost pal brings them onto your team", () => {
  const { g, p } = faceOff();
  const pal = g.actors.find((a) => !a.leader && a.team === "dog");
  p.x = pal.x + 40;
  p.y = pal.y;
  update(g, 1 / 60, emptyInput());
  assert.ok(pal.found, `${pal.name} joined`);
  assert.ok(g.events.some((e) => e.k === "recruit" && e.player));
});

test("the special is a storm of treats, not a blow", () => {
  const { g, p, r } = faceOff();
  p.special = 1;
  const before = r.hp;
  for (let i = 0; i < 180; i++) {
    r.x = p.x + 200;
    r.y = p.y;
    update(g, 1 / 60, { ...emptyInput(), special: i === 0 });
  }
  assert.ok(g.events.some((e) => e.k === "special" && e.player));
  assert.ok(r.hp < before, "some of the sundae landed");
});

for (const team of ["dog", "cat"])
  for (const pace of ["gentle", "lively"])
    for (const seed of [1, 2, 3])
      test(`a whole game, ${team} on ${pace}, seed ${seed}: it ends with held hands`, () => {
        const g = newGame({ team, sky: seed % 2 ? "day" : "night", pace, seed, autopilot: true });
        let worst = 0;
        let nan = false;
        let inside = 0;
        let frames = 0;
        const t0 = performance.now();
        while (g.phase !== "done" && frames < 60 * 60 * 8) {
          update(g, 1 / 60, emptyInput());
          frames++;
          for (const a of g.actors) {
            if (!Number.isFinite(a.x) || !Number.isFinite(a.y)) nan = true;
            if (solidAt(g.city, a.x, a.y, 0)) inside++;
            worst = Math.max(worst, a.x > WORLD_W || a.y > WORLD_H || a.x < 0 || a.y < 0 ? 1 : 0);
          }
        }
        const ms = (performance.now() - t0) / frames;
        assert.equal(nan, false, "no character ever lost its position");
        assert.equal(inside, 0, "nobody ever walked into a building");
        assert.equal(worst, 0, "nobody left the city");
        assert.equal(g.phase, "done", `the game finished (after ${(frames / 60).toFixed(0)} s, at ${g.phase})`);
        assert.ok(g.handsAt > 0, "they held hands");
        assert.ok(g.cakes.length >= 4, "cupcakes came out");
        assert.ok(frames / 60 > 25, `not over too soon (${(frames / 60).toFixed(0)} s)`);
        assert.ok(ms < 2, `a frame of the rules costs ${ms.toFixed(2)} ms in Node`);
        assert.ok(Array.isArray(badges(g)));
      });

/* Every string in the game's files, the way a reader meets them. */
const files = [
  ...readdirSync(new URL("../lib/game/", import.meta.url)).map((f) => new URL(`../lib/game/${f}`, import.meta.url)),
  ...readdirSync(new URL("../components/game/", import.meta.url)).map((f) => new URL(`../components/game/${f}`, import.meta.url)),
];
function visibleText(src) {
  const out = [];
  for (const m of src.matchAll(/"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`|>([^<>{}\n]+)</g)) out.push(m[1] ?? m[2] ?? m[3]);
  return out.filter((s) => s && /[a-z]/i.test(s));
}

test("nothing in the game talks about hurting anyone", () => {
  const bad = /\b(kill|die[sd]?|dead|death|destroy|blood|weapon|shoot|shot|attack|enem(y|ies)|injur|wound|punch|fight|beat up|hate)\w*/i;
  for (const f of files) {
    for (const s of visibleText(readFileSync(f, "utf8"))) {
      const t = s.replace(/nobody gets hurt/gi, "");
      assert.ok(!bad.test(t) && !/\bhurt\b/i.test(t), `${f.pathname.split("/").pop()}: "${s}"`);
    }
  }
});

test("no em or en dashes in anything the game says", () => {
  for (const f of files) for (const s of visibleText(readFileSync(f, "utf8"))) assert.ok(!/[—–]/.test(s), `${f.pathname.split("/").pop()}: "${s}"`);
});
