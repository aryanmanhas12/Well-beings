/**
 * Scoops & Snowballs: the world and the rules, with no drawing and no DOM,
 * so the whole game can be played out in Node by scripts/test-game.mjs.
 *
 * Asked for by the owner in October 2026: dogs against cats in a city like
 * New York, by day or by night, ice creams and snowballs, power-ups and
 * teammates found in the streets, a bar each, and an ending where nobody is
 * hurt or destroyed: whoever runs out sits down laughing, the other walks
 * over, and they hold hands under a rainbow with butterflies and cupcakes.
 *
 * The bar is a health bar, as asked, but nothing in the game is injured.
 * A splat lowers it and leaves a blob of ice cream or snow on the fur, so
 * the bar can be read off the character too; a cupcake perks it back up.
 *
 * This file is self-contained on purpose (no runtime imports): Node strips
 * the types and runs it as is, which is how the tests drive it.
 */

/* ── kinds ─────────────────────────────────────────────────────────── */

export type Team = "dog" | "cat";
export type Look = "biscuit" | "pip" | "bao" | "miso" | "inky" | "mochi";
export type Ammo = "scoop" | "snow";
export type ProjKind = "scoop" | "snow" | "mega" | "rain";
export type PowerKind = "triple" | "mega" | "dash" | "umbrella" | "cupcake";
export type Sky = "day" | "night";
export type Pace = "gentle" | "lively";
export type Phase = "ready" | "play" | "slowmo" | "makeup" | "done";

export interface Pt {
  x: number;
  y: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Circle {
  x: number;
  y: number;
  r: number;
}

/* ── the city ──────────────────────────────────────────────────────── */

/* A Manhattan grid: blocks between avenues (running north to south) and
   streets (east to west). Sizes are world pixels; the camera shows about
   440 of them across a phone held upright. */
export const COLS = 6;
export const ROWS = 5;
export const BW = 280;
export const BH = 210;
export const AW = 110;
export const SH = 90;
export const SIDEWALK = 16;
export const WORLD_W = COLS * BW + (COLS + 1) * AW;
export const WORLD_H = ROWS * BH + (ROWS + 1) * SH;
/* The river on the east side, with a bridge drawn over it. Not walkable. */
export const RIVER_W = 240;

export const blockX = (c: number) => AW + c * (BW + AW);
export const blockY = (r: number) => SH + r * (BH + SH);
export const avX = (i: number) => i * (BW + AW) + AW / 2;
export const stY = (j: number) => j * (BH + SH) + SH / 2;

export type Style = "brick" | "brownstone" | "tower" | "deli" | "loft" | "glass" | "parlour" | "pizza";

export interface Building extends Rect {
  id: number;
  /** How tall the front is drawn, in world pixels. */
  height: number;
  style: Style;
  /** Which of the palette's facade colours. */
  tone: number;
  seed: number;
}

export interface Lane {
  vertical: boolean;
  /** x of a vertical lane, y of a horizontal one. */
  at: number;
  dir: 1 | -1;
}

export interface City {
  buildings: Building[];
  park: Rect;
  pond: { x: number; y: number; rx: number; ry: number };
  plaza: Rect;
  fountain: Circle;
  trees: (Circle & { kind: number })[];
  lamps: Pt[];
  vents: Pt[];
  hydrants: Pt[];
  flowers: (Pt & { c: number })[];
  solids: Rect[];
  round: Circle[];
  spots: Pt[];
  starts: Record<Team, Pt>;
  palHomes: Record<Team, Pt[]>;
  lanes: Lane[];
}

/** A small seeded random, so a city and a game can be replayed exactly. */
export function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Which blocks are not buildings. The park spans two blocks by two,
   swallowing the avenue and the street between them, as Central Park
   swallows a stretch of Manhattan. */
const PARK = { c0: 2, c1: 3, r0: 1, r1: 2 };
const PLAZA = { c: 4, r: 3 };
const PARLOUR = { c: 1, r: 3 };

export function buildCity(seed = 11): City {
  const rnd = mulberry(seed);
  const buildings: Building[] = [];
  const park: Rect = { x: blockX(PARK.c0), y: blockY(PARK.r0), w: blockX(PARK.c1) + BW - blockX(PARK.c0), h: blockY(PARK.r1) + BH - blockY(PARK.r0) };
  const plaza: Rect = { x: blockX(PLAZA.c), y: blockY(PLAZA.r), w: BW, h: BH };
  const pond = { x: park.x + park.w * 0.63, y: park.y + park.h * 0.4, rx: 92, ry: 58 };
  const fountain: Circle = { x: plaza.x + plaza.w / 2, y: plaza.y + plaza.h / 2 + 6, r: 30 };

  let id = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c >= PARK.c0 && c <= PARK.c1 && r >= PARK.r0 && r <= PARK.r1) continue;
      if (c === PLAZA.c && r === PLAZA.r) continue;
      const x0 = blockX(c) + SIDEWALK;
      const y0 = blockY(r) + SIDEWALK;
      const w = BW - SIDEWALK * 2;
      const h = BH - SIDEWALK * 2;
      if (c === PARLOUR.c && r === PARLOUR.r) {
        /* The ice cream parlour gets a corner of its block to itself. */
        buildings.push({ id: id++, x: x0, y: y0, w: 120, h, height: 46, style: "parlour", tone: 0, seed: rnd() * 1e9 });
        buildings.push({ id: id++, x: x0 + 120, y: y0, w: w - 120, h, height: 70, style: "brick", tone: 1, seed: rnd() * 1e9 });
        continue;
      }
      /* Taller to the north (midtown), lower to the south (the
         brownstone streets). */
      const north = 1 - r / (ROWS - 1);
      let x = x0;
      while (x < x0 + w - 4) {
        let lw = Math.round(64 + rnd() * 74);
        if (x0 + w - (x + lw) < 56) lw = x0 + w - x;
        const roll = rnd();
        let style: Style;
        if (roll < 0.22 + north * 0.25) style = rnd() < 0.5 ? "tower" : "glass";
        else if (roll < 0.5 - north * 0.1) style = "brownstone";
        else if (roll < 0.62) style = rnd() < 0.5 ? "deli" : "pizza";
        else if (roll < 0.82) style = "brick";
        else style = "loft";
        const height =
          style === "tower" ? 96 + rnd() * 28 : style === "glass" ? 86 + rnd() * 26 : style === "loft" ? 62 + rnd() * 16 : style === "brick" ? 52 + rnd() * 16 : style === "brownstone" ? 42 + rnd() * 10 : 36 + rnd() * 8;
        buildings.push({ id: id++, x, y: y0, w: lw, h, height: Math.round(height), style, tone: Math.floor(rnd() * 8), seed: Math.floor(rnd() * 1e9) });
        x += lw;
      }
    }
  }

  /* Trees in the park, clear of the pond and of the two paths crossing it. */
  const trees: (Circle & { kind: number })[] = [];
  let guard = 0;
  while (trees.length < 26 && guard++ < 2000) {
    const t = { x: park.x + 24 + rnd() * (park.w - 48), y: park.y + 24 + rnd() * (park.h - 48), r: 15 + rnd() * 6, kind: Math.floor(rnd() * 3) };
    const inPond = ((t.x - pond.x) / (pond.rx + 34)) ** 2 + ((t.y - pond.y) / (pond.ry + 34)) ** 2 < 1;
    const onPath = Math.abs(t.y - (park.y + park.h * 0.78)) < 40 || Math.abs(t.x - (park.x + park.w * 0.3)) < 40;
    const crowded = trees.some((o) => Math.hypot(o.x - t.x, o.y - t.y) < o.r + t.r + 26);
    if (!inPond && !onPath && !crowded) trees.push(t);
  }
  /* Two trees in planters at the plaza's corners. */
  trees.push({ x: plaza.x + 30, y: plaza.y + 30, r: 14, kind: 1 }, { x: plaza.x + plaza.w - 30, y: plaza.y + plaza.h - 30, r: 14, kind: 2 });

  const flowers: (Pt & { c: number })[] = [];
  for (let i = 0; i < 46; i++) {
    const f = { x: park.x + 10 + rnd() * (park.w - 20), y: park.y + 10 + rnd() * (park.h - 20), c: Math.floor(rnd() * 5) };
    if (((f.x - pond.x) / (pond.rx + 8)) ** 2 + ((f.y - pond.y) / (pond.ry + 8)) ** 2 > 1) flowers.push(f);
  }

  /* Street lamps along the sidewalks, one every so often. */
  const lamps: Pt[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (c >= PARK.c0 && c <= PARK.c1 && r >= PARK.r0 && r <= PARK.r1) continue;
      lamps.push({ x: blockX(c) + 30, y: blockY(r) + BH - 4 }, { x: blockX(c) + BW - 30, y: blockY(r) + BH - 4 });
    }
  lamps.push({ x: park.x + park.w * 0.3 - 22, y: park.y + park.h * 0.5 }, { x: park.x + park.w * 0.55, y: park.y + park.h * 0.78 - 26 });

  const vents: Pt[] = [
    { x: avX(1) + 18, y: stY(1) + 60 },
    { x: avX(4) - 14, y: stY(4) - 50 },
    { x: avX(5) + 20, y: stY(1) - 46 },
    { x: avX(2) - 18, y: stY(4) + 40 },
  ];
  const hydrants: Pt[] = [
    { x: blockX(0) + BW - 8, y: blockY(4) + 8 },
    { x: blockX(5) + 8, y: blockY(0) + BH - 8 },
    { x: blockX(1) + 8, y: blockY(1) + BH - 8 },
  ];

  const solids: Rect[] = buildings.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h }));
  /* The pond, as three circles along its length. */
  const round: Circle[] = [
    { x: pond.x - pond.rx * 0.55, y: pond.y, r: pond.ry * 0.92 },
    { x: pond.x, y: pond.y, r: pond.ry },
    { x: pond.x + pond.rx * 0.55, y: pond.y, r: pond.ry * 0.92 },
    fountain,
    ...trees.map((t) => ({ x: t.x, y: t.y, r: t.r * 0.62 })),
  ];

  const spots: Pt[] = [];
  for (let i = 0; i <= COLS; i++)
    for (let j = 0; j <= ROWS; j++) {
      const p = { x: avX(i), y: stY(j) };
      if (inRect(p, park)) continue;
      spots.push(p);
    }
  spots.push({ x: plaza.x + 60, y: plaza.y + plaza.h / 2 }, { x: plaza.x + plaza.w - 60, y: plaza.y + plaza.h / 2 });
  spots.push({ x: park.x + park.w * 0.3, y: park.y + park.h * 0.25 }, { x: park.x + park.w * 0.2, y: park.y + park.h * 0.78 }, { x: park.x + park.w * 0.75, y: park.y + park.h * 0.78 });
  spots.push({ x: blockX(PARLOUR.c) + 60, y: blockY(PARLOUR.r) + BH + SH / 2 });

  const lanes: Lane[] = [];
  for (let i = 0; i <= COLS; i++) {
    if (i === 3) continue;
    lanes.push({ vertical: true, at: avX(i) - 24, dir: 1 }, { vertical: true, at: avX(i) + 24, dir: -1 });
  }
  for (let j = 0; j <= ROWS; j++) {
    if (j === 2) continue;
    lanes.push({ vertical: false, at: stY(j) - 20, dir: -1 }, { vertical: false, at: stY(j) + 20, dir: 1 });
  }

  return {
    buildings,
    park,
    pond,
    plaza,
    fountain,
    trees,
    lamps,
    vents,
    hydrants,
    flowers,
    solids,
    round,
    spots,
    starts: { dog: { x: avX(0) + 10, y: stY(ROWS) - 6 }, cat: { x: avX(COLS) - 10, y: stY(0) + 6 } },
    palHomes: {
      dog: [
        { x: avX(1), y: stY(3) },
        { x: park.x + 90, y: park.y + park.h - 80 },
      ],
      cat: [
        { x: avX(5), y: stY(2) },
        { x: park.x + park.w - 70, y: park.y + 60 },
      ],
    },
    lanes,
  };
}

/* ── geometry ──────────────────────────────────────────────────────── */

export function inRect(p: Pt, r: Rect, pad = 0) {
  return p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
}

/** Push a circle out of every solid it overlaps. Returns true if it moved. */
export function collide(city: City, p: Pt, r: number): boolean {
  let moved = false;
  for (let pass = 0; pass < 2; pass++) {
    for (const s of city.solids) {
      if (p.x < s.x - r || p.x > s.x + s.w + r || p.y < s.y - r || p.y > s.y + s.h + r) continue;
      const cx = Math.max(s.x, Math.min(p.x, s.x + s.w));
      const cy = Math.max(s.y, Math.min(p.y, s.y + s.h));
      let dx = p.x - cx;
      let dy = p.y - cy;
      let d = Math.hypot(dx, dy);
      if (d >= r) continue;
      if (d < 0.001) {
        /* Centre inside the rectangle: out by the nearest side. */
        const left = p.x - s.x;
        const right = s.x + s.w - p.x;
        const top = p.y - s.y;
        const bottom = s.y + s.h - p.y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) p.x = s.x - r;
        else if (m === right) p.x = s.x + s.w + r;
        else if (m === top) p.y = s.y - r;
        else p.y = s.y + s.h + r;
        moved = true;
        continue;
      }
      dx /= d;
      dy /= d;
      p.x = cx + dx * r;
      p.y = cy + dy * r;
      d = r;
      moved = true;
    }
    for (const c of city.round) {
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const d = Math.hypot(dx, dy);
      if (d >= c.r + r || d < 0.001) continue;
      p.x = c.x + (dx / d) * (c.r + r);
      p.y = c.y + (dy / d) * (c.r + r);
      moved = true;
    }
  }
  const before = p.x + p.y;
  p.x = Math.max(r, Math.min(WORLD_W - r, p.x));
  p.y = Math.max(r, Math.min(WORLD_H - r, p.y));
  return moved || before !== p.x + p.y;
}

export function solidAt(city: City, x: number, y: number, pad = 0): boolean {
  if (x < 0 || y < 0 || x > WORLD_W || y > WORLD_H) return true;
  for (const s of city.solids) if (x > s.x - pad && x < s.x + s.w + pad && y > s.y - pad && y < s.y + s.h + pad) return true;
  for (const c of city.round) if (Math.hypot(x - c.x, y - c.y) < c.r + pad) return true;
  return false;
}

/** Whether a straight line between two points clears every building. */
export function clearLine(city: City, a: Pt, b: Pt, pad = 0): boolean {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 12);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (solidAt(city, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, pad)) return false;
  }
  return true;
}

/* ── finding a way round the blocks ────────────────────────────────── */

const CELL = 30;
export interface Nav {
  w: number;
  h: number;
  open: Uint8Array;
}

export function buildNav(city: City, r = 15): Nav {
  const w = Math.ceil(WORLD_W / CELL);
  const h = Math.ceil(WORLD_H / CELL);
  const open = new Uint8Array(w * h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const x = i * CELL + CELL / 2;
      const y = j * CELL + CELL / 2;
      open[j * w + i] = solidAt(city, x, y, r) ? 0 : 1;
    }
  return { w, h, open };
}

function nearestOpen(nav: Nav, i: number, j: number): number {
  for (let rad = 0; rad < 6; rad++)
    for (let dj = -rad; dj <= rad; dj++)
      for (let di = -rad; di <= rad; di++) {
        const x = i + di;
        const y = j + dj;
        if (x >= 0 && y >= 0 && x < nav.w && y < nav.h && nav.open[y * nav.w + x]) return y * nav.w + x;
      }
  return -1;
}

/** A* over the grid; returns waypoints (world points), or [] if none. */
export function findPath(nav: Nav, from: Pt, to: Pt): Pt[] {
  const s = nearestOpen(nav, Math.floor(from.x / CELL), Math.floor(from.y / CELL));
  const g = nearestOpen(nav, Math.floor(to.x / CELL), Math.floor(to.y / CELL));
  if (s < 0 || g < 0) return [];
  if (s === g) return [to];
  const n = nav.w * nav.h;
  const cost = new Float32Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const gx = g % nav.w;
  const gy = Math.floor(g / nav.w);
  const heur = (k: number) => Math.hypot((k % nav.w) - gx, Math.floor(k / nav.w) - gy);
  /* A binary heap: priorities in hf, nodes in hk. */
  const hf: number[] = [];
  const hk: number[] = [];
  const swap = (i: number, j: number) => {
    [hf[i], hf[j]] = [hf[j], hf[i]];
    [hk[i], hk[j]] = [hk[j], hk[i]];
  };
  const push = (f: number, k: number) => {
    hf.push(f);
    hk.push(k);
    let c = hf.length - 1;
    while (c > 0) {
      const p = (c - 1) >> 1;
      if (hf[p] <= hf[c]) break;
      swap(p, c);
      c = p;
    }
  };
  const pop = (): number => {
    const top = hk[0];
    const lf = hf.pop()!;
    const lk = hk.pop()!;
    if (hf.length) {
      hf[0] = lf;
      hk[0] = lk;
      let c = 0;
      for (;;) {
        const l = c * 2 + 1;
        const r = l + 1;
        let best = c;
        if (l < hf.length && hf[l] < hf[best]) best = l;
        if (r < hf.length && hf[r] < hf[best]) best = r;
        if (best === c) break;
        swap(best, c);
        c = best;
      }
    }
    return top;
  };
  cost[s] = 0;
  push(heur(s), s);
  let found = false;
  let guard = 0;
  while (hf.length && guard++ < 20000) {
    const k = pop();
    if (closed[k]) continue;
    closed[k] = 1;
    if (k === g) {
      found = true;
      break;
    }
    const ki = k % nav.w;
    const kj = Math.floor(k / nav.w);
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const x = ki + di;
        const y = kj + dj;
        if (x < 0 || y < 0 || x >= nav.w || y >= nav.h) continue;
        const nk = y * nav.w + x;
        if (!nav.open[nk] || closed[nk]) continue;
        /* No cutting a building's corner diagonally. */
        if (di && dj && (!nav.open[kj * nav.w + x] || !nav.open[y * nav.w + ki])) continue;
        const c = cost[k] + (di && dj ? 1.414 : 1);
        if (c < cost[nk]) {
          cost[nk] = c;
          prev[nk] = k;
          push(c + heur(nk), nk);
        }
      }
  }
  if (!found) return [];
  const out: Pt[] = [];
  for (let k = g; k !== s && k >= 0; k = prev[k]) out.push({ x: (k % nav.w) * CELL + CELL / 2, y: Math.floor(k / nav.w) * CELL + CELL / 2 });
  out.reverse();
  out.push(to);
  return out;
}

/* ── the characters ────────────────────────────────────────────────── */

export interface Stain {
  x: number;
  y: number;
  r: number;
  c: string;
}

export interface Actor {
  id: number;
  team: Team;
  look: Look;
  name: string;
  leader: boolean;
  player: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  face: 1 | -1;
  /** Last direction moved or aimed, radians. */
  dir: number;
  hp: number;
  maxHp: number;
  ammo: Ammo;
  cooldown: number;
  /* Timers, in seconds. */
  stun: number;
  slow: number;
  shield: number;
  dash: number;
  hitT: number;
  throwT: number;
  /* Charges. */
  triple: number;
  mega: number;
  /** 0 to 1; at 1 the special is ready. */
  special: number;
  stains: Stain[];
  walk: number;
  sit: boolean;
  /* Pals: found yet, whose, and where in the line. */
  found: boolean;
  follows: number;
  slot: number;
  home: Pt;
  trail: Pt[];
  trailT: number;
  combo: number;
  lastHitT: number;
  /* The rival's mind. */
  ai: Ai | null;
  /** Hops during the celebration. */
  hop: number;
}

interface Ai {
  think: number;
  goal: Pt | null;
  goalKind: "pal" | "pickup" | "engage" | "hunt" | "meet" | "idle";
  path: Pt[];
  pathT: number;
  pathTo: Pt | null;
  strafe: 1 | -1;
  strafeT: number;
  dodge: number;
  dodgeDir: Pt;
  aimDelay: number;
}

export interface Proj {
  id: number;
  team: Team;
  kind: ProjKind;
  owner: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Height above the ground, for the arc and the shadow. */
  z: number;
  vz: number;
  dist: number;
  range: number;
  r: number;
  dmg: number;
  color: string;
  spin: number;
  splash: number;
  rolled: boolean;
}

export interface Pickup {
  id: number;
  kind: PowerKind;
  x: number;
  y: number;
  t: number;
}

export type FxKind = "drop" | "puff" | "spark" | "heart" | "confetti" | "ring" | "sprinkle" | "steam" | "feather" | "star";
export interface Fx {
  kind: FxKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
}

export interface Decal {
  x: number;
  y: number;
  r: number;
  color: string;
  life: number;
  seed: number;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  t: number;
  life: number;
  color: string;
  size: number;
}

export interface Taxi {
  lane: number;
  x: number;
  y: number;
  speed: number;
  v: number;
  honk: number;
  hue: number;
}

export interface Pigeon {
  x: number;
  y: number;
  home: Pt;
  z: number;
  vx: number;
  vy: number;
  flying: number;
  peck: number;
}

export interface Storm {
  kind: "sundae" | "blizzard";
  team: Team;
  x: number;
  y: number;
  t: number;
  dur: number;
  next: number;
  tick: number;
}

export interface Cake {
  x: number;
  y: number;
  at: number;
  c: number;
}

export type GameEvent =
  | { k: "ready" }
  | { k: "go" }
  | { k: "throw"; player: boolean; ammo: ProjKind }
  | { k: "hit"; byPlayer: boolean; onPlayer: boolean; onLeader: boolean; combo: number; ammo: ProjKind; name: string }
  | { k: "wall"; near: boolean; ammo: ProjKind }
  | { k: "pickup"; kind: PowerKind; player: boolean }
  | { k: "recruit"; name: string; player: boolean }
  | { k: "block"; player: boolean }
  | { k: "special"; team: Team; player: boolean }
  | { k: "low"; player: boolean; name: string }
  | { k: "out"; name: string; player: boolean }
  | { k: "hands" }
  | { k: "honk"; near: boolean };

export interface Input {
  /** Movement, each -1 to 1. */
  mx: number;
  my: number;
  /** Throw this frame (consumed). */
  fire: boolean;
  /** Hold to keep throwing whenever ready. */
  holdFire: boolean;
  /** Where to throw, in world coordinates, or null to aim for the
      nearest rival in front. */
  aim: Pt | null;
  swap: boolean;
  special: boolean;
}

export const emptyInput = (): Input => ({ mx: 0, my: 0, fire: false, holdFire: false, aim: null, swap: false, special: false });

export interface Stats {
  thrown: number;
  hits: number;
  gotHit: number;
  treats: number;
  pals: number;
  bestCombo: number;
  specials: number;
}

export interface Game {
  t: number;
  rnd: () => number;
  sky: Sky;
  pace: Pace;
  playerTeam: Team;
  /** The player is driven by the rival's mind too (tests, and nothing else). */
  autopilot: boolean;
  city: City;
  nav: Nav;
  actors: Actor[];
  projs: Proj[];
  pickups: Pickup[];
  fx: Fx[];
  decals: Decal[];
  texts: FloatText[];
  taxis: Taxi[];
  pigeons: Pigeon[];
  storms: Storm[];
  cakes: Cake[];
  events: GameEvent[];
  phase: Phase;
  phaseT: number;
  winner: Team | null;
  /** When the paws met, in game time; 0 until then. */
  handsAt: number;
  shake: number;
  hitStop: number;
  nextPickup: number;
  nextId: number;
  stats: Stats;
  reduced: boolean;
}

/* ── the cast ──────────────────────────────────────────────────────── */

export const CAST: Record<Look, { name: string; team: Team; leader: boolean }> = {
  biscuit: { name: "Biscuit", team: "dog", leader: true },
  pip: { name: "Pip", team: "dog", leader: false },
  bao: { name: "Bao", team: "dog", leader: false },
  miso: { name: "Miso", team: "cat", leader: true },
  inky: { name: "Inky", team: "cat", leader: false },
  mochi: { name: "Mochi", team: "cat", leader: false },
};
export const LEADER: Record<Team, Look> = { dog: "biscuit", cat: "miso" };
const PALS: Record<Team, Look[]> = { dog: ["pip", "bao"], cat: ["inky", "mochi"] };

/* Ice cream flavours, from the dawn palette: strawberry, mint, mango,
   blueberry, vanilla, and one chocolate for contrast. */
export const FLAVOURS = ["#FF7AB0", "#62D6A5", "#FFC857", "#B794FF", "#FFE3A1", "#9A6450"];
export const SNOW = "#F4F8FF";

export const POWER_NAMES: Record<PowerKind, string> = {
  triple: "Triple scoop",
  mega: "Mega snowball",
  dash: "Sprinkle dash",
  umbrella: "Umbrella",
  cupcake: "Cupcake",
};

/* Tuning. Times in seconds, speeds in world pixels per second. */
export const TUNE = {
  playerSpeed: 220,
  rivalSpeed: { gentle: 180, lively: 205 },
  palSpeed: 250,
  /* Splats are small on purpose: two bots playing each other took 24 s to
     finish at twice these, and a round should last minutes. */
  scoop: { speed: 560, range: 520, dmg: 5, cool: 0.3, r: 7 },
  snow: { speed: 470, range: 470, dmg: 8, cool: 0.55, r: 8, slow: 1.1 },
  mega: { speed: 430, range: 480, dmg: 14, cool: 0.7, r: 15, splash: 70 },
  palThrow: { dmg: 3, cool: [1.8, 2.6] as [number, number], reach: 320 },
  rivalCool: { gentle: 1.9, lively: 1.2 },
  rivalAim: { gentle: 0.16, lively: 0.08 },
  rivalDodge: { gentle: 0.3, lively: 0.62 },
  maxHp: 100,
  readyTime: 1.6,
};

function makeActor(g: Game, look: Look, at: Pt, player: boolean): Actor {
  const c = CAST[look];
  return {
    id: g.nextId++,
    team: c.team,
    look,
    name: c.name,
    leader: c.leader,
    player,
    x: at.x,
    y: at.y,
    vx: 0,
    vy: 0,
    r: c.leader ? 15 : 12,
    face: c.team === "dog" ? 1 : -1,
    dir: c.team === "dog" ? -Math.PI / 4 : (Math.PI * 3) / 4,
    hp: TUNE.maxHp,
    maxHp: TUNE.maxHp,
    ammo: "scoop",
    cooldown: 0,
    stun: 0,
    slow: 0,
    shield: 0,
    dash: 0,
    hitT: 0,
    throwT: 0,
    triple: 0,
    mega: 0,
    special: 0,
    stains: [],
    walk: 0,
    sit: false,
    found: c.leader,
    follows: -1,
    slot: 0,
    home: { ...at },
    trail: [],
    trailT: 0,
    combo: 0,
    lastHitT: -10,
    ai: null,
    hop: 0,
  };
}

function newAi(): Ai {
  return { think: 0, goal: null, goalKind: "idle", path: [], pathT: 0, pathTo: null, strafe: 1, strafeT: 1.5, dodge: 0, dodgeDir: { x: 0, y: 0 }, aimDelay: 0.4 };
}

export function newGame(opts: { team: Team; sky: Sky; pace: Pace; seed?: number; autopilot?: boolean; reduced?: boolean }): Game {
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const city = buildCity(11);
  const g: Game = {
    t: 0,
    rnd: mulberry(seed),
    sky: opts.sky,
    pace: opts.pace,
    playerTeam: opts.team,
    autopilot: !!opts.autopilot,
    city,
    nav: buildNav(city),
    actors: [],
    projs: [],
    pickups: [],
    fx: [],
    decals: [],
    texts: [],
    taxis: [],
    pigeons: [],
    storms: [],
    cakes: [],
    events: [{ k: "ready" }],
    phase: "ready",
    phaseT: 0,
    winner: null,
    handsAt: 0,
    shake: 0,
    hitStop: 0,
    nextPickup: 4,
    nextId: 1,
    stats: { thrown: 0, hits: 0, gotHit: 0, treats: 0, pals: 0, bestCombo: 0, specials: 0 },
    reduced: !!opts.reduced,
  };
  for (const team of ["dog", "cat"] as Team[]) {
    const lead = makeActor(g, LEADER[team], city.starts[team], team === opts.team);
    if (!lead.player || g.autopilot) lead.ai = newAi();
    g.actors.push(lead);
    PALS[team].forEach((look, i) => g.actors.push(makeActor(g, look, city.palHomes[team][i], false)));
  }
  for (let i = 0; i < 3; i++) spawnPickup(g);
  for (let i = 0; i < 8; i++) {
    const lane = Math.floor(g.rnd() * city.lanes.length);
    const L = city.lanes[lane];
    const along = g.rnd() * (L.vertical ? WORLD_H : WORLD_W);
    g.taxis.push({ lane, x: L.vertical ? L.at : along, y: L.vertical ? along : L.at, speed: 110 + g.rnd() * 60, v: 0, honk: 0, hue: g.rnd() });
  }
  const pl = city.plaza;
  for (let i = 0; i < 9; i++) {
    const home = { x: pl.x + 40 + g.rnd() * (pl.w - 80), y: pl.y + 30 + g.rnd() * (pl.h - 60) };
    if (Math.hypot(home.x - city.fountain.x, home.y - city.fountain.y) < 46) continue;
    g.pigeons.push({ x: home.x, y: home.y, home, z: 0, vx: 0, vy: 0, flying: 0, peck: g.rnd() * 3 });
  }
  return g;
}

export const leaderOf = (g: Game, team: Team) => g.actors.find((a) => a.leader && a.team === team)!;
export const playerOf = (g: Game) => leaderOf(g, g.playerTeam);
export const rivalOf = (g: Game) => leaderOf(g, g.playerTeam === "dog" ? "cat" : "dog");
const other = (t: Team): Team => (t === "dog" ? "cat" : "dog");

/* ── little helpers ────────────────────────────────────────────────── */

function burst(g: Game, kind: FxKind, x: number, y: number, n: number, color: string | string[], speed = 120, up = 80, size = 3, life = 0.6) {
  if (g.reduced) n = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    if (g.fx.length > 320) g.fx.shift();
    const a = g.rnd() * Math.PI * 2;
    const s = speed * (0.4 + g.rnd() * 0.8);
    g.fx.push({
      kind,
      x,
      y,
      z: 6 + g.rnd() * 10,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s * 0.6,
      vz: up * (0.5 + g.rnd()),
      life: life * (0.7 + g.rnd() * 0.6),
      max: life,
      size: size * (0.6 + g.rnd() * 0.8),
      color: Array.isArray(color) ? color[Math.floor(g.rnd() * color.length)] : color,
      rot: g.rnd() * 6.28,
    });
  }
}

function say(g: Game, x: number, y: number, text: string, color = "#FFF4E8", size = 15) {
  if (g.texts.length > 12) g.texts.shift();
  g.texts.push({ x, y, text, t: 0, life: 1.2, color, size });
}

function decal(g: Game, x: number, y: number, r: number, color: string) {
  if (g.decals.length > 70) g.decals.shift();
  g.decals.push({ x, y, r, color, life: 9, seed: Math.floor(g.rnd() * 1e6) });
}

export function spawnPickup(g: Game) {
  if (g.pickups.length >= 4) return;
  const kinds: PowerKind[] = ["triple", "mega", "dash", "umbrella", "cupcake"];
  const weights = [0.23, 0.19, 0.2, 0.17, 0.21];
  for (let tries = 0; tries < 20; tries++) {
    const s = g.city.spots[Math.floor(g.rnd() * g.city.spots.length)];
    if (g.pickups.some((p) => Math.hypot(p.x - s.x, p.y - s.y) < 260)) continue;
    if (g.actors.some((a) => a.leader && Math.hypot(a.x - s.x, a.y - s.y) < 180)) continue;
    let roll = g.rnd();
    let kind: PowerKind = "triple";
    for (let i = 0; i < kinds.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        kind = kinds[i];
        break;
      }
    }
    g.pickups.push({ id: g.nextId++, kind, x: s.x, y: s.y, t: 0 });
    return;
  }
}

/* ── throwing ──────────────────────────────────────────────────────── */

/** The nearest rival in roughly the direction `dir`, for aim assist. */
function target(g: Game, a: Actor, dir: number | null, reach: number): Actor | null {
  let best: Actor | null = null;
  let bestScore = Infinity;
  for (const o of g.actors) {
    if (o.team === a.team || o.sit) continue;
    const d = Math.hypot(o.x - a.x, o.y - a.y);
    if (d > reach) continue;
    let score = d * (o.leader ? 0.7 : 1);
    if (dir !== null) {
      let diff = Math.abs(Math.atan2(o.y - a.y, o.x - a.x) - dir);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff > 1.9) continue;
      score *= 1 + diff * 0.6;
    }
    if (!clearLine(g.city, a, o)) score *= 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = o;
    }
  }
  return best;
}

/** Where to aim to meet a moving target, partly leading it. */
function leadAim(a: Pt, o: Actor, speed: number, lead: number): number {
  const d = Math.hypot(o.x - a.x, o.y - a.y);
  const t = (d / speed) * lead;
  return Math.atan2(o.y + o.vy * t - a.y, o.x + o.vx * t - a.x);
}

function throwFrom(g: Game, a: Actor, ang: number, forced?: ProjKind): boolean {
  if (a.cooldown > 0 || a.stun > 0 || a.sit) return false;
  let kind: ProjKind = forced ?? (a.mega > 0 ? "mega" : a.ammo);
  if (!a.leader) kind = "scoop";
  const spec = kind === "mega" ? TUNE.mega : kind === "snow" ? TUNE.snow : TUNE.scoop;
  const angles = a.triple > 0 && kind === "scoop" ? [-0.2, 0, 0.2] : [0];
  for (const off of angles) {
    const t = ang + off;
    g.projs.push({
      id: g.nextId++,
      team: a.team,
      kind,
      owner: a.id,
      x: a.x + Math.cos(t) * (a.r + 4),
      y: a.y + Math.sin(t) * (a.r + 4) - 2,
      vx: Math.cos(t) * spec.speed,
      vy: Math.sin(t) * spec.speed,
      z: 14,
      vz: 0,
      dist: 0,
      range: spec.range,
      r: spec.r,
      dmg: a.leader ? spec.dmg : TUNE.palThrow.dmg,
      color: kind === "scoop" ? FLAVOURS[Math.floor(g.rnd() * FLAVOURS.length)] : SNOW,
      spin: g.rnd() * 6,
      splash: kind === "mega" ? TUNE.mega.splash : 0,
      rolled: false,
    });
  }
  if (kind === "mega") a.mega--;
  else if (angles.length > 1) a.triple--;
  const rivalSlow = a.leader && !a.player ? TUNE.rivalCool[g.pace] : 1;
  a.cooldown = a.leader ? spec.cool * rivalSlow : TUNE.palThrow.cool[0] + g.rnd() * (TUNE.palThrow.cool[1] - TUNE.palThrow.cool[0]);
  a.throwT = 0.28;
  a.dir = ang;
  a.face = Math.cos(ang) >= 0 ? 1 : -1;
  if (a.player) g.stats.thrown++;
  g.events.push({ k: "throw", player: a.player, ammo: kind });
  return true;
}

/* ── splats ────────────────────────────────────────────────────────── */

const HIT_WORDS = ["Splat!", "Splosh!", "Sploot!", "Plop!", "Yum!"];
const SNOW_WORDS = ["Brr!", "Poof!", "Fwump!", "Chilly!"];

function addStain(g: Game, a: Actor, color: string, big = false) {
  if (a.stains.length >= 18) a.stains.shift();
  a.stains.push({ x: (g.rnd() - 0.5) * a.r * 1.8, y: -a.r * 0.4 - g.rnd() * a.r * 1.6, r: (big ? 6 : 3.4) + g.rnd() * 2.6, c: color });
}

function landHit(g: Game, p: Proj, o: Actor, direct: boolean) {
  const owner = g.actors.find((a) => a.id === p.owner);
  const dmg = direct ? p.dmg : 5;
  if (o.shield > 0) {
    burst(g, "spark", o.x, o.y - 10, 8, ["#FFC857", "#FFF4E8", "#FF7AB0"], 140, 90, 2.5, 0.5);
    say(g, o.x, o.y - 40, "Boing!", "#FFE3A1", 14);
    g.events.push({ k: "block", player: o.player });
    return;
  }
  const color = p.kind === "scoop" || p.kind === "rain" ? p.color : SNOW;
  if (o.leader) {
    const before = o.hp;
    o.hp = Math.max(0, o.hp - dmg);
    if (o.player) g.stats.gotHit++;
    addStain(g, o, color, p.kind === "mega");
    if (before > 30 && o.hp <= 30 && o.hp > 0) g.events.push({ k: "low", player: o.player, name: o.name });
  } else {
    o.stun = 1.3;
    addStain(g, o, color);
  }
  o.hitT = 0.42;
  if (p.kind === "snow" || p.kind === "mega") o.slow = Math.max(o.slow, TUNE.snow.slow);
  if (owner) {
    owner.special = Math.min(1, owner.special + (o.leader ? 0.11 : 0.05));
    owner.combo = g.t - owner.lastHitT < 2.6 ? owner.combo + 1 : 1;
    owner.lastHitT = g.t;
    if (owner.player) {
      g.stats.hits++;
      g.stats.bestCombo = Math.max(g.stats.bestCombo, owner.combo);
    }
  }
  const combo = owner?.combo ?? 1;
  const words = p.kind === "scoop" || p.kind === "rain" ? HIT_WORDS : SNOW_WORDS;
  const word = p.kind === "mega" ? "Brain freeze!" : combo >= 3 ? `Combo x${combo}!` : words[Math.floor(g.rnd() * words.length)];
  say(g, o.x, o.y - 44, word, combo >= 3 ? "#FFC857" : "#FFF4E8", combo >= 3 || p.kind === "mega" ? 17 : 14);
  if (p.kind === "scoop" || p.kind === "rain") burst(g, "drop", o.x, o.y - 14, 12, [p.color, p.color, "#FFF4E8"], 150, 120, 3.2, 0.7);
  else burst(g, "puff", o.x, o.y - 14, p.kind === "mega" ? 20 : 12, [SNOW, "#D6E6FF", "#FFFFFF"], 160, 110, p.kind === "mega" ? 5 : 3.6, 0.8);
  burst(g, "ring", o.x, o.y - 12, 1, p.kind === "scoop" ? p.color : "#D6E6FF", 0, 0, 10, 0.35);
  decal(g, o.x + (g.rnd() - 0.5) * 16, o.y + 6, p.kind === "mega" ? 22 : 12, color);
  const playerInvolved = o.player || !!owner?.player;
  if (playerInvolved && !g.reduced) {
    g.hitStop = Math.max(g.hitStop, p.kind === "mega" ? 0.07 : 0.035);
    g.shake = Math.max(g.shake, o.player ? 7 : 3.5);
  }
  g.events.push({ k: "hit", byPlayer: !!owner?.player, onPlayer: o.player, onLeader: o.leader, combo, ammo: p.kind, name: o.name });
  if (o.leader && o.hp <= 0 && g.phase === "play") goOut(g, o);
}

function splash(g: Game, p: Proj, except: number) {
  if (!p.splash) return;
  for (const o of g.actors) {
    if (o.team === p.team || o.id === except) continue;
    if (Math.hypot(o.x - p.x, o.y - p.y) < p.splash) landHit(g, p, o, false);
  }
}

function splatGround(g: Game, p: Proj, wall: boolean) {
  const color = p.kind === "scoop" || p.kind === "rain" ? p.color : SNOW;
  if (p.kind === "scoop" || p.kind === "rain") burst(g, "drop", p.x, p.y, 7, [color, "#FFF4E8"], 90, 70, 2.6, 0.5);
  else burst(g, "puff", p.x, p.y, p.kind === "mega" ? 16 : 8, [SNOW, "#D6E6FF"], 110, 70, p.kind === "mega" ? 4.6 : 3, 0.6);
  decal(g, p.x, p.y + (wall ? 4 : 0), p.kind === "mega" ? 24 : 10, color);
  splash(g, p, -1);
  const pl = playerOf(g);
  g.events.push({ k: "wall", near: Math.hypot(pl.x - p.x, pl.y - p.y) < 420, ammo: p.kind });
}

/* ── the specials ──────────────────────────────────────────────────── */

export const SPECIAL_NAMES: Record<Team, string> = { dog: "Sundae Storm", cat: "Blizzard" };

function startSpecial(g: Game, a: Actor) {
  if (a.special < 1 || a.sit || g.phase !== "play") return false;
  const o = leaderOf(g, other(a.team));
  a.special = 0;
  g.storms.push({ kind: a.team === "dog" ? "sundae" : "blizzard", team: a.team, x: o.x, y: o.y, t: 0, dur: a.team === "dog" ? 2.1 : 2.6, next: 0, tick: 0 });
  say(g, a.x, a.y - 56, `${SPECIAL_NAMES[a.team]}!`, "#FFC857", 19);
  burst(g, "star", a.x, a.y - 20, 14, ["#FFC857", "#FF7AB0", "#B794FF", "#62D6A5"], 180, 140, 4, 0.9);
  if (a.player) g.stats.specials++;
  g.events.push({ k: "special", team: a.team, player: a.player });
  return true;
}

function updateStorms(g: Game, dt: number) {
  for (const s of g.storms) {
    s.t += dt;
    const o = leaderOf(g, other(s.team));
    /* The storm drifts after its target, slower than it can run. */
    const d = Math.hypot(o.x - s.x, o.y - s.y);
    if (d > 1) {
      const step = Math.min(d, (s.kind === "sundae" ? 90 : 120) * dt);
      s.x += ((o.x - s.x) / d) * step;
      s.y += ((o.y - s.y) / d) * step;
    }
    if (s.kind === "sundae") {
      s.next -= dt;
      if (s.next <= 0 && s.t < s.dur) {
        s.next = 0.13;
        const a = g.rnd() * Math.PI * 2;
        const rr = g.rnd() * 64;
        g.projs.push({
          id: g.nextId++,
          team: s.team,
          kind: "rain",
          owner: leaderOf(g, s.team).id,
          x: s.x + Math.cos(a) * rr,
          y: s.y + Math.sin(a) * rr * 0.7,
          vx: 0,
          vy: 0,
          z: 260 + g.rnd() * 60,
          vz: -380,
          dist: 0,
          range: 1,
          r: 8,
          dmg: 4,
          color: FLAVOURS[Math.floor(g.rnd() * FLAVOURS.length)],
          spin: g.rnd() * 6,
          splash: 0,
          rolled: false,
        });
      }
    } else {
      s.tick -= dt;
      for (let i = 0; i < 3; i++) {
        if (g.fx.length > 320) break;
        const a = g.rnd() * Math.PI * 2;
        const rr = 20 + g.rnd() * 70;
        g.fx.push({ kind: "puff", x: s.x + Math.cos(a) * rr, y: s.y + Math.sin(a) * rr * 0.7, z: 10 + g.rnd() * 50, vx: -Math.sin(a) * 160, vy: Math.cos(a) * 110, vz: 10, life: 0.6, max: 0.6, size: 2 + g.rnd() * 2.5, color: g.rnd() < 0.5 ? SNOW : "#D6E6FF", rot: 0 });
      }
      if (s.tick <= 0 && s.t < s.dur) {
        s.tick = 0.26;
        for (const e of g.actors) {
          if (e.team === s.team || Math.hypot(e.x - s.x, e.y - s.y) > 92) continue;
          e.slow = Math.max(e.slow, 0.8);
          if (e.leader) {
            const fake: Proj = { id: 0, team: s.team, kind: "snow", owner: leaderOf(g, s.team).id, x: e.x, y: e.y, vx: 0, vy: 0, z: 0, vz: 0, dist: 0, range: 0, r: 0, dmg: 2, color: SNOW, spin: 0, splash: 0, rolled: true };
            landHit(g, fake, e, true);
          } else e.stun = Math.max(e.stun, 0.6);
          if (g.phase !== "play") break;
        }
      }
    }
  }
  g.storms = g.storms.filter((s) => s.t < s.dur + 0.4);
}

/* ── the end: nobody loses, really ─────────────────────────────────── */

function goOut(g: Game, loser: Actor) {
  g.phase = "slowmo";
  g.phaseT = 0;
  g.winner = other(loser.team);
  loser.sit = true;
  loser.vx = loser.vy = 0;
  g.storms = [];
  say(g, loser.x, loser.y - 58, "All splatted out!", "#FFC857", 18);
  burst(g, "star", loser.x, loser.y - 20, 16, ["#FFC857", "#FFF4E8", "#FF7AB0"], 120, 120, 3.4, 1);
  g.events.push({ k: "out", name: loser.name, player: loser.player });
}

function startMakeup(g: Game) {
  g.phase = "makeup";
  g.phaseT = 0;
  g.projs = [];
  const loser = leaderOf(g, other(g.winner!));
  const winner = leaderOf(g, g.winner!);
  /* The winner walks over, on the side they are already on. */
  const side = winner.x < loser.x ? -1 : 1;
  const spot = { x: loser.x + side * 34, y: loser.y };
  if (solidAt(g.city, spot.x, spot.y, winner.r)) spot.x = loser.x - side * 34;
  winner.ai = winner.ai ?? newAi();
  winner.ai.goalKind = "meet";
  winner.ai.goal = spot;
  winner.ai.path = findPath(g.nav, winner, spot);
  winner.ai.pathTo = spot;
  /* Everyone else comes to watch. */
  for (const a of g.actors) {
    if (a.leader) continue;
    a.found = true;
    a.stun = 0;
  }
}

function joinHands(g: Game) {
  const loser = leaderOf(g, other(g.winner!));
  const winner = leaderOf(g, g.winner!);
  g.handsAt = g.t;
  loser.sit = false;
  loser.hitT = 0;
  winner.vx = winner.vy = 0;
  /* Side by side, facing the same way, paws held between them. */
  const mid = { x: (loser.x + winner.x) / 2, y: (loser.y + winner.y) / 2 };
  const left = winner.x < loser.x ? winner : loser;
  const right = left === winner ? loser : winner;
  /* 24 either side: their reaching paws meet in the middle (closer, and
     the two of them were drawn on top of each other). */
  left.x = mid.x - 24;
  right.x = mid.x + 24;
  left.y = right.y = mid.y;
  left.face = 1;
  right.face = -1;
  /* Cupcakes pop up in a ring round them, one after another. */
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3;
    /* Next to a building, closer in or further out instead. */
    for (const rad of [92, 72, 56, 116]) {
      const p = { x: mid.x + Math.cos(a) * rad, y: mid.y + Math.sin(a) * rad * 0.68 };
      if (solidAt(g.city, p.x, p.y, 8)) continue;
      g.cakes.push({ x: p.x, y: p.y, at: g.t + 0.5 + i * 0.16, c: i % 5 });
      break;
    }
  }
  burst(g, "confetti", mid.x, mid.y - 30, 40, ["#FF7AB0", "#FFC857", "#62D6A5", "#B794FF", "#FF9F80", "#8BB8E8"], 220, 260, 3.4, 1.6);
  burst(g, "heart", mid.x, mid.y - 40, 10, ["#FF7AB0", "#FF5C8A", "#FFB3CF"], 70, 160, 7, 1.8);
  g.events.push({ k: "hands" });
}

/* ── moving ────────────────────────────────────────────────────────── */

function move(g: Game, a: Actor, tx: number, ty: number, speed: number, dt: number) {
  const len = Math.hypot(tx, ty);
  const want = len > 0.01 ? { x: (tx / Math.max(1, len)) * speed, y: (ty / Math.max(1, len)) * speed } : { x: 0, y: 0 };
  const k = Math.min(1, dt * 12);
  a.vx += (want.x - a.vx) * k;
  a.vy += (want.y - a.vy) * k;
  const p = { x: a.x + a.vx * dt, y: a.y + a.vy * dt };
  collide(g.city, p, a.r);
  a.x = p.x;
  a.y = p.y;
  const sp = Math.hypot(a.vx, a.vy);
  if (sp > 12) {
    a.walk += dt * (6 + sp / 30);
    if (Math.abs(a.vx) > 8) a.face = a.vx > 0 ? 1 : -1;
    if (a.throwT <= 0) a.dir = Math.atan2(a.vy, a.vx);
  }
}

function speedOf(g: Game, a: Actor): number {
  let s = a.player && !g.autopilot ? TUNE.playerSpeed : a.leader ? TUNE.rivalSpeed[g.pace] : TUNE.palSpeed;
  if (a.dash > 0) s *= 1.45;
  if (a.slow > 0) s *= 0.6;
  return s;
}

/** Follow a path toward `to`, re-planning now and then. Returns the
    direction to move this frame. */
function steer(g: Game, a: Actor, to: Pt, dt: number): Pt {
  const ai = a.ai!;
  if (clearLine(g.city, a, to, a.r - 3)) {
    ai.path = [];
    return { x: to.x - a.x, y: to.y - a.y };
  }
  ai.pathT -= dt;
  if (!ai.path.length || ai.pathT <= 0 || !ai.pathTo || Math.hypot(ai.pathTo.x - to.x, ai.pathTo.y - to.y) > 70) {
    ai.path = findPath(g.nav, a, to);
    ai.pathTo = { ...to };
    ai.pathT = 1;
  }
  /* Skip ahead to the furthest waypoint in plain sight. */
  while (ai.path.length > 1 && clearLine(g.city, a, ai.path[1], a.r - 3)) ai.path.shift();
  const w = ai.path[0];
  if (!w) return { x: to.x - a.x, y: to.y - a.y };
  if (Math.hypot(w.x - a.x, w.y - a.y) < 14) ai.path.shift();
  return { x: w.x - a.x, y: w.y - a.y };
}

/* ── the rival's mind ──────────────────────────────────────────────── */

function think(g: Game, a: Actor) {
  const ai = a.ai!;
  const foe = leaderOf(g, other(a.team));
  const dFoe = Math.hypot(foe.x - a.x, foe.y - a.y);
  const lost = g.actors.filter((p) => !p.leader && p.team === a.team && !p.found);
  const nearPal = lost.sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0];
  const wantCake = a.hp < 72;
  const pick = g.pickups
    .filter((p) => p.kind !== "cupcake" || wantCake)
    .map((p) => ({ p, d: Math.hypot(p.x - a.x, p.y - a.y) }))
    .sort((p, q) => p.d - q.d)[0];
  const cake = g.pickups.find((p) => p.kind === "cupcake" && Math.hypot(p.x - a.x, p.y - a.y) < 700);
  if (a.hp < 40 && cake) {
    ai.goalKind = "pickup";
    ai.goal = { x: cake.x, y: cake.y };
  } else if (nearPal && (g.t < 45 || dFoe > 520) && Math.hypot(nearPal.x - a.x, nearPal.y - a.y) < 1100) {
    ai.goalKind = "pal";
    ai.goal = { x: nearPal.x, y: nearPal.y };
  } else if (pick && pick.d < 340 && dFoe > 200) {
    ai.goalKind = "pickup";
    ai.goal = { x: pick.p.x, y: pick.p.y };
  } else if (dFoe < 620 && clearLine(g.city, a, foe)) {
    ai.goalKind = "engage";
    ai.goal = { x: foe.x, y: foe.y };
  } else {
    ai.goalKind = "hunt";
    ai.goal = { x: foe.x, y: foe.y };
  }
}

function runAi(g: Game, a: Actor, dt: number) {
  const ai = a.ai!;
  if (ai.goalKind === "meet") {
    const dir = ai.goal ? steer(g, a, ai.goal, dt) : { x: 0, y: 0 };
    move(g, a, dir.x, dir.y, speedOf(g, a) * 0.8, dt);
    return;
  }
  ai.think -= dt;
  if (ai.think <= 0) {
    think(g, a);
    ai.think = 0.35;
  }
  const foe = leaderOf(g, other(a.team));
  const dFoe = Math.hypot(foe.x - a.x, foe.y - a.y);
  const sees = dFoe < 500 && clearLine(g.city, a, foe);

  /* Dodging: a splat heading this way, seen in time, maybe. */
  if (ai.dodge > 0) ai.dodge -= dt;
  else
    for (const p of g.projs) {
      if (p.team === a.team || p.rolled || p.kind === "rain") continue;
      const rx = a.x - p.x;
      const ry = a.y - p.y;
      const sp = Math.hypot(p.vx, p.vy) || 1;
      const along = (rx * p.vx + ry * p.vy) / sp;
      if (along < 0 || along > sp * 0.5) continue;
      const across = Math.abs((rx * p.vy - ry * p.vx) / sp);
      if (across > a.r + p.r + 16) continue;
      p.rolled = true;
      if (g.rnd() < TUNE.rivalDodge[g.pace]) {
        const side = rx * p.vy - ry * p.vx > 0 ? 1 : -1;
        ai.dodge = 0.3;
        ai.dodgeDir = { x: (-p.vy / sp) * side, y: (p.vx / sp) * side };
      }
      break;
    }

  let dir: Pt = { x: 0, y: 0 };
  if (ai.dodge > 0) dir = ai.dodgeDir;
  else if (ai.goalKind === "engage" && sees) {
    ai.strafeT -= dt;
    if (ai.strafeT <= 0) {
      ai.strafe = ai.strafe === 1 ? -1 : 1;
      ai.strafeT = 1.1 + g.rnd() * 1.4;
    }
    const ux = (foe.x - a.x) / (dFoe || 1);
    const uy = (foe.y - a.y) / (dFoe || 1);
    const want = 250;
    const radial = Math.max(-1, Math.min(1, (dFoe - want) / 90));
    dir = { x: ux * radial + -uy * ai.strafe * 0.85, y: uy * radial + ux * ai.strafe * 0.85 };
  } else if (ai.goal) dir = steer(g, a, ai.goal, dt);
  move(g, a, dir.x, dir.y, speedOf(g, a), dt);

  /* Throwing, with a moment's thought first and a gentle miss in it. */
  if (sees && a.cooldown <= 0) {
    ai.aimDelay -= dt;
    if (ai.aimDelay <= 0) {
      if (a.special >= 1 && dFoe < 380) startSpecial(g, a);
      else {
        a.ammo = dFoe < 300 ? "snow" : "scoop";
        const spec = a.mega > 0 ? TUNE.mega : a.ammo === "snow" ? TUNE.snow : TUNE.scoop;
        const err = (g.rnd() - 0.5) * 2 * TUNE.rivalAim[g.pace];
        if (dFoe < spec.range + 10) throwFrom(g, a, leadAim(a, foe, spec.speed, 0.55) + err);
      }
      ai.aimDelay = 0.12 + g.rnd() * 0.25;
    }
  }
}

/* ── one frame ─────────────────────────────────────────────────────── */

export function update(g: Game, realDt: number, input: Input) {
  let dt = Math.min(realDt, 1 / 30);
  if (g.hitStop > 0) {
    g.hitStop -= dt;
    dt *= 0.08;
  }
  if (g.phase === "slowmo") dt *= g.reduced ? 1 : 0.35;
  g.t += dt;
  g.phaseT += realDt;
  g.shake = Math.max(0, g.shake - realDt * 30);

  if (g.phase === "ready" && g.phaseT >= TUNE.readyTime) {
    g.phase = "play";
    g.phaseT = 0;
    g.events.push({ k: "go" });
  }
  if (g.phase === "slowmo" && g.phaseT >= 1.3) startMakeup(g);

  const playing = g.phase === "play";
  const player = playerOf(g);

  for (const a of g.actors) {
    a.cooldown = Math.max(0, a.cooldown - dt);
    a.stun = Math.max(0, a.stun - dt);
    a.slow = Math.max(0, a.slow - dt);
    a.shield = Math.max(0, a.shield - dt);
    a.dash = Math.max(0, a.dash - dt);
    a.hitT = Math.max(0, a.hitT - dt);
    a.throwT = Math.max(0, a.throwT - dt);
    if (a.leader) {
      a.trailT -= dt;
      if (a.trailT <= 0) {
        a.trailT = 0.07;
        a.trail.unshift({ x: a.x, y: a.y });
        if (a.trail.length > 40) a.trail.pop();
      }
    }
  }

  /* The player, when someone is holding the controls. */
  const steering = playing && !player.sit && !g.autopilot;
  if (steering) {
    move(g, player, input.mx, input.my, speedOf(g, player), dt);
    if (input.swap) player.ammo = player.ammo === "scoop" ? "snow" : "scoop";
    if (input.special) startSpecial(g, player);
    if (input.fire || input.holdFire) {
      const spec = player.mega > 0 ? TUNE.mega : player.ammo === "snow" ? TUNE.snow : TUNE.scoop;
      let ang: number;
      if (input.aim) ang = Math.atan2(input.aim.y - player.y, input.aim.x - player.x);
      else {
        const moving = Math.hypot(input.mx, input.my) > 0.2 ? Math.atan2(input.my, input.mx) : player.dir;
        const t = target(g, player, moving, spec.range + 40);
        ang = t ? leadAim(player, t, spec.speed, 0.7) : moving;
      }
      throwFrom(g, player, ang);
    }
  }
  input.fire = false;
  input.swap = false;
  input.special = false;

  /* The leaders nobody is steering: the rival always, the player on
     autopilot, and the winner walking over at the end. */
  for (const a of g.actors) {
    if (!a.leader || a.sit || (a === player && steering)) continue;
    if (playing) {
      if (!a.ai) a.ai = newAi();
      runAi(g, a, dt);
    } else if (g.phase === "makeup" && a.ai?.goalKind === "meet" && a.ai.goal) {
      runAi(g, a, dt);
      if (Math.hypot(a.ai.goal.x - a.x, a.ai.goal.y - a.y) < 10 || g.phaseT > 4) {
        if (g.phaseT > 4) {
          a.x = a.ai.goal.x;
          a.y = a.ai.goal.y;
        }
        a.ai.goalKind = "idle";
        joinHands(g);
      }
    } else move(g, a, 0, 0, 0, dt);
  }

  /* The pals. */
  for (const a of g.actors) {
    if (a.leader) continue;
    const lead = leaderOf(g, a.team);
    if (g.phase === "makeup" || g.phase === "done") {
      /* Everyone gathers round the two of them and hops. */
      const loser = leaderOf(g, other(g.winner ?? "dog"));
      const winner = leaderOf(g, g.winner ?? "dog");
      const mid = { x: (loser.x + winner.x) / 2, y: (loser.y + winner.y) / 2 };
      const idx = g.actors.filter((x) => !x.leader).indexOf(a);
      const ang = (idx / 4) * Math.PI * 2 + 0.8;
      const spot = { x: mid.x + Math.cos(ang) * 62, y: mid.y + Math.sin(ang) * 44 + 8 };
      if (!a.ai) a.ai = newAi();
      const d = Math.hypot(spot.x - a.x, spot.y - a.y);
      if (d > 8) {
        const dir = steer(g, a, spot, dt);
        move(g, a, dir.x, dir.y, TUNE.palSpeed, dt);
      } else {
        move(g, a, 0, 0, 0, dt);
        a.face = mid.x > a.x ? 1 : -1;
      }
      if (g.handsAt) a.hop += dt;
      continue;
    }
    if (!a.found) {
      /* Lost, waiting near where they were left, a little restless. */
      const wob = Math.sin(g.t * 0.9 + a.id) * 18;
      const to = { x: a.home.x + wob - a.x, y: a.home.y + Math.cos(g.t * 0.7 + a.id) * 10 - a.y };
      move(g, a, to.x * 0.04, to.y * 0.04, 40, dt);
      if (playing && Math.hypot(lead.x - a.x, lead.y - a.y) < 74 && !lead.sit) {
        a.found = true;
        a.follows = lead.id;
        a.slot = g.actors.filter((x) => !x.leader && x.team === a.team && x.found && x !== a).length;
        say(g, a.x, a.y - 40, `${a.name} joined!`, "#62D6A5", 16);
        burst(g, "heart", a.x, a.y - 24, 6, ["#FF7AB0", "#FFB3CF"], 60, 120, 5, 1.1);
        if (lead.player) g.stats.pals++;
        g.events.push({ k: "recruit", name: a.name, player: lead.player });
      }
      continue;
    }
    /* Found: follow the leader's footsteps, a few steps behind. */
    const k = Math.min(lead.trail.length - 1, (a.slot + 1) * 6);
    const spot = k >= 0 ? lead.trail[k] : lead;
    const d = Math.hypot(spot.x - a.x, spot.y - a.y);
    if (a.stun > 0) move(g, a, 0, 0, 0, dt);
    else if (d > 10) {
      if (!a.ai) a.ai = newAi();
      const dir = d > 160 ? steer(g, a, spot, dt) : { x: spot.x - a.x, y: spot.y - a.y };
      move(g, a, dir.x, dir.y, TUNE.palSpeed * (a.slow > 0 ? 0.6 : 1) * (d > 140 ? 1.3 : 1), dt);
    } else move(g, a, 0, 0, 0, dt);
    if (playing && a.stun <= 0 && a.cooldown <= 0) {
      const t = target(g, a, null, TUNE.palThrow.reach);
      if (t && clearLine(g.city, a, t)) throwFrom(g, a, leadAim(a, t, TUNE.scoop.speed, 0.5) + (g.rnd() - 0.5) * 0.3);
      else a.cooldown = 0.4;
    }
  }

  /* Pickups. */
  if (playing) {
    g.nextPickup -= dt;
    if (g.nextPickup <= 0) {
      spawnPickup(g);
      g.nextPickup = 6 + g.rnd() * 4;
    }
  }
  for (const p of g.pickups) p.t += dt;
  if (playing)
    for (const a of g.actors) {
      if (!a.leader || a.sit) continue;
      const hit = g.pickups.find((p) => Math.hypot(p.x - a.x, p.y - (a.y - 4)) < a.r + 16);
      if (!hit) continue;
      g.pickups = g.pickups.filter((p) => p !== hit);
      if (hit.kind === "triple") a.triple = 6;
      else if (hit.kind === "mega") a.mega = 3;
      else if (hit.kind === "dash") a.dash = 6;
      else if (hit.kind === "umbrella") a.shield = 6;
      else {
        a.hp = Math.min(a.maxHp, a.hp + 25);
        a.stains.splice(0, 4);
      }
      say(g, a.x, a.y - 46, `${POWER_NAMES[hit.kind]}!`, "#FFE3A1", 16);
      burst(g, "spark", hit.x, hit.y - 10, 14, ["#FFC857", "#FFF4E8", "#FF7AB0", "#62D6A5"], 150, 130, 3, 0.7);
      burst(g, "ring", hit.x, hit.y - 8, 1, "#FFC857", 0, 0, 14, 0.4);
      if (a.player) g.stats.treats++;
      g.events.push({ k: "pickup", kind: hit.kind, player: a.player });
    }

  /* Projectiles. */
  const keep: Proj[] = [];
  for (const p of g.projs) {
    if (p.kind === "rain") {
      p.z += p.vz * dt;
      p.vz -= 300 * dt;
      p.spin += dt * 8;
      if (p.z <= 0) {
        let hitOne = false;
        for (const o of g.actors) {
          if (o.team === p.team || Math.hypot(o.x - p.x, o.y - p.y) > 34) continue;
          landHit(g, p, o, true);
          hitOne = true;
          break;
        }
        if (!hitOne) splatGround(g, p, false);
        continue;
      }
      keep.push(p);
      continue;
    }
    const step = Math.hypot(p.vx, p.vy) * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.dist += step;
    const f = Math.min(1, p.dist / p.range);
    p.z = 14 + 30 * 4 * f * (1 - f) - 10 * f;
    p.spin += dt * (p.kind === "scoop" ? 11 : 6);
    if (solidAt(g.city, p.x, p.y)) {
      splatGround(g, p, true);
      continue;
    }
    let hit: Actor | null = null;
    for (const o of g.actors) {
      if (o.team === p.team || (o.sit && g.phase !== "play")) continue;
      if (Math.hypot(o.x - p.x, o.y - p.y) < o.r + p.r) {
        hit = o;
        break;
      }
    }
    if (hit) {
      landHit(g, p, hit, true);
      splash(g, p, hit.id);
      continue;
    }
    if (p.dist >= p.range) {
      splatGround(g, p, false);
      continue;
    }
    keep.push(p);
  }
  g.projs = g.phase === "makeup" || g.phase === "done" ? [] : keep;

  updateStorms(g, dt);

  /* Taxis: they stop for anyone in the road, and say so. */
  for (const c of g.taxis) {
    const L = g.city.lanes[c.lane];
    let blocked = false;
    for (const a of g.actors) {
      const ahead = L.vertical ? (a.y - c.y) * L.dir : (a.x - c.x) * L.dir;
      const side = L.vertical ? Math.abs(a.x - c.x) : Math.abs(a.y - c.y);
      if (ahead > 0 && ahead < 70 && side < 26) blocked = true;
    }
    const want = blocked ? 0 : c.speed;
    c.v += (want - c.v) * Math.min(1, dt * (blocked ? 6 : 1.5));
    if (blocked && c.honk <= 0 && c.v < 30) {
      c.honk = 2.5;
      say(g, c.x, c.y - 30, "Beep beep!", "#FFE3A1", 12);
      g.events.push({ k: "honk", near: Math.hypot(player.x - c.x, player.y - c.y) < 380 });
    }
    c.honk = Math.max(0, c.honk - dt);
    if (L.vertical) {
      c.y += c.v * L.dir * dt;
      if (c.y > WORLD_H + 60) c.y = -60;
      if (c.y < -60) c.y = WORLD_H + 60;
    } else {
      c.x += c.v * L.dir * dt;
      if (c.x > WORLD_W + 60) c.x = -60;
      if (c.x < -60) c.x = WORLD_W + 60;
    }
  }

  /* Pigeons scatter when anyone runs past, and come back. */
  for (const b of g.pigeons) {
    if (b.flying > 0) {
      b.flying -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += 70 * dt;
      if (b.flying <= 0) {
        b.x = b.home.x;
        b.y = b.home.y;
        b.z = 0;
      }
      continue;
    }
    b.peck -= dt;
    if (b.peck < -0.4) b.peck = 1 + g.rnd() * 3;
    for (const a of g.actors) {
      if (Math.hypot(a.x - b.x, a.y - b.y) < 60 && Math.hypot(a.vx, a.vy) > 40) {
        const ang = Math.atan2(b.y - a.y, b.x - a.x) + (g.rnd() - 0.5);
        b.vx = Math.cos(ang) * 160;
        b.vy = Math.sin(ang) * 120 - 40;
        b.flying = 5 + g.rnd() * 3;
        burst(g, "feather", b.x, b.y - 6, 2, ["#C9C3D9", "#FFF4E8"], 40, 60, 2.4, 0.8);
        break;
      }
    }
  }

  /* Steam from the street vents, as New York does. */
  if (g.rnd() < dt * 6 && g.fx.length < 300) {
    const v = g.city.vents[Math.floor(g.rnd() * g.city.vents.length)];
    g.fx.push({ kind: "steam", x: v.x + (g.rnd() - 0.5) * 10, y: v.y, z: 0, vx: (g.rnd() - 0.3) * 14, vy: 0, vz: 26 + g.rnd() * 16, life: 2.4, max: 2.4, size: 6 + g.rnd() * 5, color: "#FFF4E8", rot: 0 });
  }
  /* Rainbow sprinkles behind anyone dashing. */
  for (const a of g.actors)
    if (a.dash > 0 && Math.hypot(a.vx, a.vy) > 60 && g.rnd() < dt * 30 && g.fx.length < 320)
      g.fx.push({ kind: "sprinkle", x: a.x - a.face * 8, y: a.y - 4, z: 6, vx: -a.vx * 0.1, vy: -a.vy * 0.1, vz: 20, life: 0.7, max: 0.7, size: 3, color: FLAVOURS[Math.floor(g.rnd() * 4)], rot: g.rnd() * 6 });

  /* The celebration keeps giving hearts. */
  if (g.handsAt) {
    const loser = leaderOf(g, other(g.winner!));
    const winner = leaderOf(g, g.winner!);
    const mid = { x: (loser.x + winner.x) / 2, y: (loser.y + winner.y) / 2 };
    if (g.rnd() < dt * 5) burst(g, "heart", mid.x + (g.rnd() - 0.5) * 30, mid.y - 46, 1, ["#FF7AB0", "#FF5C8A", "#FFB3CF"], 30, 70, 5 + g.rnd() * 4, 2);
    /* The two of them clean up as they make up. */
    for (const a of [loser, winner]) if (a.stains.length && g.rnd() < dt * 2.5) a.stains.shift();
    if (g.t - g.handsAt > 6 && g.phase === "makeup") {
      g.phase = "done";
      g.phaseT = 0;
    }
  }

  /* Particles, texts and decals age. */
  for (const f of g.fx) {
    f.life -= realDt;
    f.x += f.vx * realDt;
    f.y += f.vy * realDt;
    f.z += f.vz * realDt;
    if (f.kind === "heart" || f.kind === "steam") {
      f.vx *= 0.98;
      f.vz *= 0.995;
    } else if (f.kind === "confetti" || f.kind === "feather") {
      f.vz -= 220 * realDt;
      f.vx *= 0.97;
      f.vy *= 0.97;
      if (f.z < 0) {
        f.z = 0;
        f.vz = 0;
        f.vx = f.vy = 0;
      }
    } else if (f.kind !== "ring") {
      f.vz -= 420 * realDt;
      if (f.z < 0) {
        f.z = 0;
        f.vz *= -0.3;
        f.vx *= 0.6;
        f.vy *= 0.6;
      }
    }
    f.rot += realDt * 5;
  }
  g.fx = g.fx.filter((f) => f.life > 0);
  for (const t of g.texts) t.t += realDt;
  g.texts = g.texts.filter((t) => t.t < t.life);
  for (const d of g.decals) d.life -= realDt;
  g.decals = g.decals.filter((d) => d.life > 0);
}

/** The bars, as numbers the page can read out. */
export function bars(g: Game) {
  const p = playerOf(g);
  const r = rivalOf(g);
  return { player: p.hp / p.maxHp, rival: r.hp / r.maxHp, special: p.special };
}

/** Little badges for the end card, from this round only. Nothing is kept. */
export function badges(g: Game): string[] {
  const s = g.stats;
  const out: string[] = [];
  if (s.thrown >= 8 && s.hits / s.thrown >= 0.5) out.push("Sharp eye");
  if (s.pals >= 2) out.push("Pack leader");
  if (s.treats >= 4) out.push("Treat hunter");
  if (s.bestCombo >= 4) out.push(`Combo x${s.bestCombo}`);
  if (s.specials >= 1) out.push(g.playerTeam === "dog" ? "Sundae chef" : "Snow maker");
  if (g.winner === g.playerTeam && playerOf(g).hp >= 70) out.push("Barely sticky");
  return out;
}
