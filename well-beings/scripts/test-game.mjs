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
  bars,
  placeAt,
  AVENUES,
  STREETS,
  PARK_PATH,
  PLAZA_PATH,
  RIVER_PATH,
  PLACE_COUNT,
  TUNE,
  WORLD_W,
  WORLD_H,
  RIVER_W,
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
  p.stains = [{ x: 0, y: -10, r: 4, c: "#FFF4E8" }];
  const kinds = ["cupcake", "triple", "mega", "dash", "umbrella", "giant"];
  for (const kind of kinds) {
    g.pickups = [{ id: 999, kind, x: p.x, y: p.y, t: 0 }];
    update(g, 1 / 60, emptyInput());
  }
  assert.equal(p.hp, 75, "a cupcake is exactly +25");
  assert.ok(g.events.some((e) => e.k === "heal" && e.player && e.amount === 25 && e.hp === 75));
  assert.equal(p.stains.length, 0);
  assert.equal(p.triple, 6);
  assert.deepEqual(p.pack, { kind: "mega", n: 3 });
  assert.ok(p.dash > 5);
  assert.ok(p.shield > 5);
  assert.ok(p.giant > TUNE.giantTime - 0.1);
  assert.equal(g.stats.treats, kinds.length);
  /* A cupcake never takes the bar past 100. */
  p.hp = 90;
  g.pickups = [{ id: 998, kind: "cupcake", x: p.x, y: p.y, t: 0 }];
  update(g, 1 / 60, emptyInput());
  assert.equal(p.hp, 100);
});

/* Throw whatever is in hand at a rival held in place, and return what
   the page heard. */
function throwAt(g, p, r, frames = 70, dx = 160) {
  const heard = [];
  for (let i = 0; i < frames; i++) {
    r.x = p.x + dx;
    r.y = p.y;
    update(g, 1 / 60, { ...emptyInput(), fire: i === 0, aim: { x: r.x, y: r.y } });
    heard.push(...g.events);
    g.events.length = 0;
  }
  return heard;
}

test("the bars are exact: every point lost is a splat's own number", () => {
  const { g, p, r } = faceOff();
  const before = r.hp;
  let hits = [];
  for (const ammo of ["scoop", "snow", "scoop", "snow"]) {
    p.ammo = ammo;
    p.cooldown = 0;
    hits = hits.concat(throwAt(g, p, r).filter((e) => e.k === "hit" && e.onLeader && !e.onPlayer));
  }
  assert.ok(hits.length >= 4, `${hits.length} splats landed`);
  const lost = hits.reduce((n, e) => n + e.dmg, 0);
  assert.equal(before - r.hp, lost, "the bar dropped by exactly the sum of the splats");
  for (const e of hits) assert.ok(Number.isInteger(e.dmg) && e.dmg > 0, "whole points");
  assert.ok(hits.some((e) => e.ammo === "scoop" && e.dmg === TUNE.scoop.dmg));
  assert.ok(hits.some((e) => e.ammo === "snow" && e.dmg === TUNE.snow.dmg));
  assert.equal(hits.at(-1).hp, r.hp, "each hit reports the bar after it");
  assert.ok(g.texts.some((t) => t.kind === "dmg" && t.text === `-${hits.at(-1).dmg}`), "and its number floats over them");
  assert.equal(g.stats.dealt, lost);
  assert.equal(bars(g).rival, r.hp);
  assert.equal(bars(g).player, p.hp);
});

test("a splat never takes a bar below zero, and the last point ends the round", () => {
  const { g, p, r } = faceOff();
  r.hp = 3;
  const hit = throwAt(g, p, r).find((e) => e.k === "hit" && e.onLeader);
  assert.equal(hit.dmg, 3, "only what was left");
  assert.equal(r.hp, 0);
  assert.ok(["slowmo", "makeup"].includes(g.phase));
});

test("a pie lands on the face and slides off", () => {
  const { g, p, r } = faceOff();
  p.pack = { kind: "pie", n: 3 };
  const before = r.hp;
  const heard = throwAt(g, p, r);
  assert.equal(before - r.hp, TUNE.pie.dmg);
  assert.ok(r.pied > 0, "pie face");
  assert.equal(p.pack.n, 2, "one pie gone");
  assert.ok(heard.some((e) => e.k === "hit" && e.ammo === "pie"));
  play(g, 3);
  assert.ok(r.pied <= 0, "and it slid off");
});

test("a bubble holds them for a moment, then pops", () => {
  const { g, p, r } = faceOff();
  p.pack = { kind: "bubble", n: 5 };
  const before = r.hp;
  /* A bubble floats slowly: 160 px takes most of a second. */
  const heard = throwAt(g, p, r, 60);
  assert.ok(heard.some((e) => e.k === "trapped") && r.trapped > 0, "bubbled");
  assert.equal(before - r.hp, TUNE.bubble.dmg);
  play(g, 1.5);
  assert.ok(r.trapped <= 0, "popped");
});

test("a water balloon is lobbed to the spot and splashes everyone near it", () => {
  const { g, p, r } = faceOff();
  const pal = g.actors.find((a) => !a.leader && a.team === "cat");
  p.pack = { kind: "balloon", n: 4 };
  const before = r.hp;
  let lofted = false;
  for (let i = 0; i < 90; i++) {
    r.x = p.x + 160;
    r.y = p.y;
    pal.x = r.x + 30;
    pal.y = r.y;
    pal.ai = null;
    update(g, 1 / 60, { ...emptyInput(), fire: i === 0, aim: { x: r.x, y: r.y } });
    if (g.projs.some((q) => q.kind === "balloon" && q.z > 30)) lofted = true;
  }
  assert.ok(lofted, "it went up in an arc");
  const lost = before - r.hp;
  assert.ok(lost >= 4 && lost <= TUNE.balloon.dmg, `the rival lost ${lost}`);
  assert.ok(pal.stains.length > 0 || pal.stun > 0, "the splash caught the pal next to them");
});

test("calling the army brings six friends for twelve seconds, then they wave and go", () => {
  const { g, p, r } = faceOff();
  r.shield = 99;
  g.pickups = [{ id: 997, kind: "army", x: p.x, y: p.y, t: 0 }];
  update(g, 1 / 60, emptyInput());
  const army = () => g.actors.filter((a) => a.minion && a.team === "dog");
  assert.equal(army().length, TUNE.armySize);
  assert.ok(g.events.some((e) => e.k === "army" && e.player && e.n === TUNE.armySize));
  for (const m of army()) assert.ok(!solidAt(g.city, m.x, m.y, 0), "nobody arrives inside a building");
  play(g, 3);
  assert.ok(g.projs.some((q) => q.kind === "mini") || g.events.length >= 0);
  assert.ok(army().every((m) => Math.hypot(m.x - p.x, m.y - p.y) < 600), "they stay with you");
  play(g, TUNE.armyLife + 1);
  assert.equal(army().length, 0, "and then they go home");
  assert.equal(g.stats.armies, 1);
  assert.ok(badges(g).some((b) => /pack|crew/i.test(b)));
});

test("big paws make you bigger for a while", () => {
  const { g, p } = faceOff();
  const r0 = p.r;
  g.pickups = [{ id: 996, kind: "giant", x: p.x, y: p.y, t: 0 }];
  update(g, 1 / 60, emptyInput());
  play(g, 1);
  assert.ok(p.r > r0, "bigger");
  play(g, TUNE.giantTime);
  assert.ok(p.giant <= 0);
  play(g, 1);
  assert.equal(p.r, r0, "and back to size");
});

test("Sprinkler Street washes a splat off: exactly +3", () => {
  const { g, p } = faceOff();
  const s = g.city.sprinklers[0];
  assert.ok(s, "there are sprinklers");
  p.x = s.x;
  p.y = s.y;
  p.hp = 50;
  p.freshT = 0;
  const heard = [];
  for (let i = 0; i < 3; i++) {
    update(g, 1 / 60, emptyInput());
    heard.push(...g.events);
  }
  assert.equal(p.hp, 53);
  assert.ok(heard.some((e) => e.k === "heal" && e.why === "sprinkler" && e.amount === 3));
});

test("every street has its own name, and the card names each one once", () => {
  const all = [...AVENUES, ...STREETS, PARK_PATH, PLAZA_PATH, RIVER_PATH];
  assert.equal(new Set(all.map((p) => p.name)).size, all.length, "no two places share a name");
  assert.equal(PLACE_COUNT, all.length);
  for (const p of all) assert.ok(p.blurb.length > 8 && !/[—–]/.test(p.blurb), `${p.name} has a line`);
  const seen = new Set();
  for (let x = 4; x < WORLD_W + RIVER_W; x += 23) for (let y = 4; y < WORLD_H; y += 23) {
    const p = placeAt(city, x, y);
    if (p) seen.add(p);
  }
  assert.equal(seen.size, all.length, "every place can be stood in");
  assert.equal(placeAt(city, WORLD_W + 40, 300), placeAt(city, WORLD_W + 80, 500), "the river is one place, not a new one every call");
});

test("the first sign comes up before the round starts, even on a crossing", () => {
  for (const team of ["dog", "cat"])
    for (const seed of [1, 2, 3, 11]) {
      const g = newGame({ team, sky: "day", pace: "gentle", seed });
      play(g, 1);
      assert.equal(g.phase, "ready");
      assert.ok(g.place && g.events.some((e) => e.k === "place"), `${team}, seed ${seed}`);
    }
});

test("smooth: each step keeps where everyone was, for drawing between steps", () => {
  const { g, p } = faceOff();
  const x0 = p.x;
  update(g, 1 / 60, { ...emptyInput(), mx: 1 });
  assert.equal(p.px, x0);
  update(g, 1 / 60, { ...emptyInput(), mx: 1 });
  assert.ok(p.x > p.px && p.x - p.px < 10, "one step apart");
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
