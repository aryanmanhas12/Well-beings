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
 * Version 2, also at the owner's request: every street its own (a name, a
 * look and something that only happens there), a power-up that brings in
 * an army of dogs or of cats, pies, water balloons, bubbles and big paws,
 * a health bar that is exact, and smoother motion (every moving thing
 * keeps where it was last step, so the screen can draw between steps).
 *
 * The bar is a health bar, as asked, but nothing in the game is injured.
 * A splat lowers it by an exact, whole number and leaves a blob of ice
 * cream or snow on the fur, so the bar can be read off the character too;
 * a cupcake, or a run through the sprinklers, perks it back up.
 *
 * This file is self-contained on purpose (no runtime imports): Node strips
 * the types and runs it as is, which is how the tests drive it.
 */

/* ── kinds ─────────────────────────────────────────────────────────── */

export type Team = "dog" | "cat";
export type Look = "biscuit" | "pip" | "bao" | "miso" | "inky" | "mochi";
export type Ammo = "scoop" | "snow";
/** Throws that come in packs, from a power-up: they go first. */
export type Pack = "mega" | "pie" | "balloon" | "bubble";
export type ProjKind = "scoop" | "snow" | "mega" | "rain" | "pie" | "balloon" | "bubble" | "mini";
export type PowerKind = "triple" | "mega" | "dash" | "umbrella" | "cupcake" | "army" | "pie" | "balloon" | "bubble" | "giant";
export type Sky = "day" | "sunset" | "night";
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

/* ── every path its own ────────────────────────────────────────────── */

export type Theme =
  | "cherry"
  | "mural"
  | "theatre"
  | "flowers"
  | "lantern"
  | "market"
  | "harbor"
  | "skyline"
  | "cobbles"
  | "park"
  | "rainbow"
  | "sprinkler"
  | "leaves"
  | "plaza"
  | "river";

export interface Path {
  name: string;
  theme: Theme;
  /** What is different here, in a few words, for the card that names it. */
  blurb: string;
}

/* The seven avenues, west to east, and the six streets, north to south.
   Each has its own look (lib/game/render.ts) and most change something
   about playing there. */
export const AVENUES: Path[] = [
  { name: "Cherry Lane", theme: "cherry", blurb: "Blossom drifting down, trees to hide behind." },
  { name: "Mural Mile", theme: "mural", blurb: "Painted from curb to curb." },
  { name: "Broadway", theme: "theatre", blurb: "Marquee lights. Splats from here charge your special faster." },
  { name: "Park Avenue", theme: "flowers", blurb: "Flower beds down the middle, good for cover." },
  { name: "Lantern Avenue", theme: "lantern", blurb: "Paper lanterns overhead. Bubbles drift slower here." },
  { name: "Market Row", theme: "market", blurb: "Carts to duck behind, and treats turn up more often." },
  { name: "Harbor Walk", theme: "harbor", blurb: "A boardwalk. The river breeze pushes throws south." },
];
export const STREETS: Path[] = [
  { name: "Skyline Street", theme: "skyline", blurb: "Tall towers and big bright screens." },
  { name: "Bleecker Street", theme: "cobbles", blurb: "Cobbles and café tables to hide behind." },
  { name: "Park Drive", theme: "park", blurb: "Straight through the park." },
  { name: "Rainbow Street", theme: "rainbow", blurb: "Rainbow crossings. Sprinkle dash lasts longer here." },
  { name: "Sprinkler Street", theme: "sprinkler", blurb: "Run through the spray to wash a splat off." },
  { name: "Brownstone Row", theme: "leaves", blurb: "Stoops, and leaves to kick up." },
];
export const PARK_PATH: Path = { name: "The Park", theme: "park", blurb: "Trees, a pond, fireflies after dark." };
export const PLAZA_PATH: Path = { name: "Sprinkle Square", theme: "plaza", blurb: "A fountain, pigeons and big signs." };
/* One object, not a new one per call: the place card compares by identity,
   and a fresh river object every call announced the river four times a
   second. */
export const RIVER_PATH: Path = { name: "The River", theme: "river", blurb: "Water. The bridge is for looking at." };
/** Every place with a name, for "streets explored" on the last card. */
export const PLACE_COUNT = AVENUES.length + STREETS.length + 3;

export type Style = "brick" | "brownstone" | "tower" | "deli" | "loft" | "glass" | "parlour" | "pizza" | "theatre" | "warehouse" | "mural" | "shop";
export type District = "midtown" | "theatre" | "mural" | "lantern" | "market" | "harbor" | "brownstone" | "mixed";

export interface Building extends Rect {
  id: number;
  /** How tall the front is drawn, in world pixels. */
  height: number;
  style: Style;
  district: District;
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

export interface Cart extends Rect {
  kind: number;
}

export interface City {
  buildings: Building[];
  park: Rect;
  pond: { x: number; y: number; rx: number; ry: number };
  plaza: Rect;
  fountain: Circle;
  trees: (Circle & { kind: number })[];
  /** Cherry Lane's trees: blossom, not leaves. */
  blossoms: Circle[];
  lamps: Pt[];
  vents: Pt[];
  hydrants: Pt[];
  flowers: (Pt & { c: number })[];
  /** Market Row's carts (solid: cover). */
  carts: Cart[];
  /** Park Avenue's flower beds (solid: cover). */
  medians: Rect[];
  /** Bleecker Street's café tables (solid: cover). */
  tables: Circle[];
  /** Sprinkler Street's open hydrants: run through to wash a splat off. */
  sprinklers: Circle[];
  solids: Rect[];
  round: Circle[];
  spots: Pt[];
  /** Spots that get treats more often (Market Row). */
  hotSpots: Pt[];
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
const inPark = (c: number, r: number) => c >= PARK.c0 && c <= PARK.c1 && r >= PARK.r0 && r <= PARK.r1;

/** Which neighbourhood a block is in: what its buildings look like. */
export function districtOf(c: number, r: number): District {
  if (r === 0) return "midtown";
  if (c === COLS - 1) return "harbor";
  if (r === ROWS - 1) return "brownstone";
  if (c === 1) return "theatre";
  if (c === 4) return "market";
  if (c === 0) return "mural";
  if (c === 3) return "lantern";
  return "mixed";
}

function styleFor(d: District, roll: number, faceBroadway: boolean): Style {
  switch (d) {
    case "midtown":
      return roll < 0.45 ? "tower" : roll < 0.85 ? "glass" : "loft";
    case "theatre":
      return faceBroadway || roll < 0.35 ? "theatre" : roll < 0.7 ? "brick" : "pizza";
    case "harbor":
      return roll < 0.6 ? "warehouse" : roll < 0.85 ? "brick" : "deli";
    case "brownstone":
      return roll < 0.72 ? "brownstone" : roll < 0.86 ? "deli" : "pizza";
    case "market":
      return roll < 0.4 ? "deli" : roll < 0.7 ? "shop" : "pizza";
    case "mural":
      return roll < 0.55 ? "mural" : roll < 0.8 ? "loft" : "brick";
    case "lantern":
      return roll < 0.6 ? "shop" : roll < 0.85 ? "brick" : "loft";
    default:
      return roll < 0.3 ? "brick" : roll < 0.55 ? "loft" : roll < 0.8 ? "brownstone" : "deli";
  }
}

function heightFor(s: Style, rnd: () => number): number {
  switch (s) {
    case "tower":
      return 96 + rnd() * 28;
    case "glass":
      return 86 + rnd() * 26;
    case "loft":
    case "warehouse":
      return 58 + rnd() * 16;
    case "brick":
    case "mural":
    case "theatre":
      return 52 + rnd() * 16;
    case "brownstone":
      return 42 + rnd() * 10;
    default:
      return 36 + rnd() * 8;
  }
}

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
      if (inPark(c, r)) continue;
      if (c === PLAZA.c && r === PLAZA.r) continue;
      const x0 = blockX(c) + SIDEWALK;
      const y0 = blockY(r) + SIDEWALK;
      const w = BW - SIDEWALK * 2;
      const h = BH - SIDEWALK * 2;
      const district = districtOf(c, r);
      if (c === PARLOUR.c && r === PARLOUR.r) {
        /* The ice cream parlour gets a corner of its block to itself. */
        buildings.push({ id: id++, x: x0, y: y0, w: 120, h, height: 46, style: "parlour", district, tone: 0, seed: Math.floor(rnd() * 1e9) });
        buildings.push({ id: id++, x: x0 + 120, y: y0, w: w - 120, h, height: 70, style: "theatre", district, tone: 1, seed: Math.floor(rnd() * 1e9) });
        continue;
      }
      let x = x0;
      while (x < x0 + w - 4) {
        let lw = Math.round(64 + rnd() * 74);
        if (x0 + w - (x + lw) < 56) lw = x0 + w - x;
        /* Theatres face Broadway: the lots on the east side of column 1. */
        const faceBroadway = district === "theatre" && x + lw > x0 + w - 4;
        const style = styleFor(district, rnd(), faceBroadway);
        buildings.push({ id: id++, x, y: y0, w: lw, h, height: Math.round(heightFor(style, rnd)), style, district, tone: Math.floor(rnd() * 8), seed: Math.floor(rnd() * 1e9) });
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

  /* Cherry Lane: blossom trees along its west side, the edge of the city. */
  const blossoms: Circle[] = [];
  for (let j = 0; j < ROWS; j++) for (const k of [0.25, 0.75]) blossoms.push({ x: 14, y: blockY(j) + BH * k, r: 8 });

  /* Market Row: carts parked along both curbs, between the crossings. */
  const carts: Cart[] = [];
  for (let j = 0; j < ROWS; j++) {
    const y = blockY(j);
    carts.push({ x: avX(5) - AW / 2 + 4, y: y + 40, w: 22, h: 34, kind: j % 4 }, { x: avX(5) + AW / 2 - 26, y: y + BH - 80, w: 22, h: 34, kind: (j + 2) % 4 });
  }
  /* Park Avenue: flower beds down the middle, outside the park. */
  const medians: Rect[] = [];
  for (const r of [0, 3, 4]) medians.push({ x: avX(3) - 9, y: blockY(r) + 36, w: 18, h: BH - 72 });
  /* Bleecker Street: café tables along the north curb. */
  const tables: Circle[] = [];
  for (let i = 0; i < COLS; i++) tables.push({ x: blockX(i) + 70, y: stY(1) - SH / 2 + 12, r: 9 }, { x: blockX(i) + 170, y: stY(1) - SH / 2 + 12, r: 9 });
  /* Sprinkler Street: an open hydrant mid-block, spraying across. */
  const sprinklers: Circle[] = [];
  for (let i = 0; i < COLS; i++) sprinklers.push({ x: blockX(i) + BW / 2, y: stY(4), r: 40 });

  /* Street lamps along the sidewalks, one every so often. */
  const lamps: Pt[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (inPark(c, r)) continue;
      lamps.push({ x: blockX(c) + 30, y: blockY(r) + BH - 4 }, { x: blockX(c) + BW - 30, y: blockY(r) + BH - 4 });
    }
  lamps.push({ x: park.x + park.w * 0.3 - 22, y: park.y + park.h * 0.5 }, { x: park.x + park.w * 0.55, y: park.y + park.h * 0.78 - 26 });

  const vents: Pt[] = [
    { x: avX(1) + 18, y: stY(1) + 60 },
    { x: avX(4) - 14, y: stY(4) - 50 },
    { x: avX(5) + 4, y: stY(1) - 50 },
    { x: avX(2) - 18, y: stY(4) + 40 },
  ];
  const hydrants: Pt[] = [
    { x: blockX(0) + BW - 8, y: blockY(4) + 8 },
    { x: blockX(5) + 8, y: blockY(0) + BH - 8 },
    { x: blockX(1) + 8, y: blockY(1) + BH - 8 },
  ];

  const solids: Rect[] = [...buildings.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h })), ...carts.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h })), ...medians];
  /* The pond, as three circles along its length. */
  const round: Circle[] = [
    { x: pond.x - pond.rx * 0.55, y: pond.y, r: pond.ry * 0.92 },
    { x: pond.x, y: pond.y, r: pond.ry },
    { x: pond.x + pond.rx * 0.55, y: pond.y, r: pond.ry * 0.92 },
    fountain,
    ...trees.map((t) => ({ x: t.x, y: t.y, r: t.r * 0.62 })),
    ...blossoms,
    ...tables,
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
  const hotSpots: Pt[] = [];
  for (let j = 0; j < ROWS; j++) hotSpots.push({ x: avX(5), y: blockY(j) + BH / 2 });

  const lanes: Lane[] = [];
  for (let i = 0; i <= COLS; i++) {
    if (i === 3 || i === 5) continue;
    lanes.push({ vertical: true, at: avX(i) - 24, dir: 1 }, { vertical: true, at: avX(i) + 24, dir: -1 });
  }
  /* No cabs through the park, down Market Row's carts or past Bleecker's
     café tables. */
  for (let j = 0; j <= ROWS; j++) {
    if (j === 2 || j === 1) continue;
    lanes.push({ vertical: false, at: stY(j) - 20, dir: -1 }, { vertical: false, at: stY(j) + 20, dir: 1 });
  }

  return {
    buildings,
    park,
    pond,
    plaza,
    fountain,
    trees,
    blossoms,
    lamps,
    vents,
    hydrants,
    flowers,
    carts,
    medians,
    tables,
    sprinklers,
    solids,
    round,
    spots,
    hotSpots,
    starts: { dog: { x: avX(0) + 10, y: stY(ROWS) - 6 }, cat: { x: avX(COLS) - 10, y: stY(0) + 6 } },
    palHomes: {
      dog: [
        { x: avX(1), y: stY(3) },
        { x: park.x + 90, y: park.y + park.h - 80 },
      ],
      cat: [
        { x: avX(5) + 6, y: stY(2) },
        { x: park.x + park.w - 70, y: park.y + 60 },
      ],
    },
    lanes,
  };
}

/** Which path a point is on, or null on a crossing (where two meet). */
/** The named place at a point. At a crossing it is null (neither road), so
 *  the sign does not flick between the two as someone crosses; pass
 *  `pick` to have the nearer road's centre line chosen instead, which the
 *  first sign of a round uses when someone starts on a crossing. */
export function placeAt(city: City, x: number, y: number, pick = false): Path | null {
  if (x > WORLD_W) return RIVER_PATH;
  if (inRect({ x, y }, city.park)) return PARK_PATH;
  if (inRect({ x, y }, city.plaza)) return PLAZA_PATH;
  let ai = 0;
  let ad = Infinity;
  for (let i = 0; i <= COLS; i++) {
    const d = Math.abs(x - avX(i));
    if (d < ad) {
      ad = d;
      ai = i;
    }
  }
  let sj = 0;
  let sd = Infinity;
  for (let j = 0; j <= ROWS; j++) {
    const d = Math.abs(y - stY(j));
    if (d < sd) {
      sd = d;
      sj = j;
    }
  }
  const onAv = ad <= AW / 2;
  const onSt = sd <= SH / 2;
  if (onAv && onSt) return pick ? (ad <= sd ? AVENUES[ai] : STREETS[sj]) : null;
  if (onAv) return AVENUES[ai];
  if (onSt) return STREETS[sj];
  /* On a sidewalk: whichever road is nearer. */
  return ad - AW / 2 < sd - SH / 2 ? AVENUES[ai] : STREETS[sj];
}

/** The path's index in AVENUES (0 to 6) or STREETS (7 to 12), or -1. */
function pathIndex(city: City, x: number, y: number): number {
  const p = placeAt(city, x, y);
  if (!p) return -1;
  const a = AVENUES.indexOf(p);
  if (a >= 0) return a;
  const s = STREETS.indexOf(p);
  return s >= 0 ? AVENUES.length + s : -1;
}

/* ── geometry ──────────────────────────────────────────────────────── */

export function inRect(p: Pt, r: Rect, pad = 0) {
  return p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
}

/* A coarse grid over the city, so a question about one point looks only
   at the solids near it. Every solid is filed in each cell within MARGIN
   of it, so any question with a pad (or a radius, plus how far a push can
   move it) up to MARGIN is answered from one cell. v2 has carts, café
   tables, flower beds and trees as well as buildings, and the straight
   scans over all of them were a third of the rules' time (measured in a
   Node profile of a whole game: solidAt 19%, collide 15%). */
const GRID_CELL = 96;
const MARGIN = 48;
interface Grid {
  cols: number;
  rows: number;
  rects: Rect[][];
  circles: Circle[][];
}
const grids = new WeakMap<City, Grid>();
function gridOf(city: City): Grid {
  const gr = grids.get(city);
  if (gr) return gr;
  const cols = Math.ceil(WORLD_W / GRID_CELL) + 1;
  const rows = Math.ceil(WORLD_H / GRID_CELL) + 1;
  const g: Grid = { cols, rows, rects: Array.from({ length: cols * rows }, () => []), circles: Array.from({ length: cols * rows }, () => []) };
  const file = (x0: number, y0: number, x1: number, y1: number, put: (k: number) => void) => {
    const i0 = Math.max(0, Math.floor((x0 - MARGIN) / GRID_CELL));
    const i1 = Math.min(cols - 1, Math.floor((x1 + MARGIN) / GRID_CELL));
    const j0 = Math.max(0, Math.floor((y0 - MARGIN) / GRID_CELL));
    const j1 = Math.min(rows - 1, Math.floor((y1 + MARGIN) / GRID_CELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) put(j * cols + i);
  };
  for (const s of city.solids) file(s.x, s.y, s.x + s.w, s.y + s.h, (k) => g.rects[k].push(s));
  for (const c of city.round) file(c.x - c.r, c.y - c.r, c.x + c.r, c.y + c.r, (k) => g.circles[k].push(c));
  grids.set(city, g);
  return g;
}
/** The cell a point is filed under, or -1 off the grid. */
function cellAt(g: Grid, x: number, y: number): number {
  const i = Math.floor(x / GRID_CELL);
  const j = Math.floor(y / GRID_CELL);
  return i < 0 || j < 0 || i >= g.cols || j >= g.rows ? -1 : j * g.cols + i;
}

/** Push a circle out of every solid it overlaps. Returns true if it moved. */
export function collide(city: City, p: Pt, r: number): boolean {
  let moved = false;
  /* A push moves the circle by at most its radius, so twice the radius
     must fit in the margin for one cell to hold everything it can touch. */
  const g = gridOf(city);
  const k = r * 2 <= MARGIN ? cellAt(g, p.x, p.y) : -1;
  const solids = k >= 0 ? g.rects[k] : city.solids;
  const round = k >= 0 ? g.circles[k] : city.round;
  for (let pass = 0; pass < 2; pass++) {
    for (const s of solids) {
      if (p.x < s.x - r || p.x > s.x + s.w + r || p.y < s.y - r || p.y > s.y + s.h + r) continue;
      const cx = Math.max(s.x, Math.min(p.x, s.x + s.w));
      const cy = Math.max(s.y, Math.min(p.y, s.y + s.h));
      let dx = p.x - cx;
      let dy = p.y - cy;
      const d = Math.hypot(dx, dy);
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
      moved = true;
    }
    for (const c of round) {
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
  const g = gridOf(city);
  const k = pad <= MARGIN ? cellAt(g, x, y) : -1;
  for (const s of k >= 0 ? g.rects[k] : city.solids) if (x > s.x - pad && x < s.x + s.w + pad && y > s.y - pad && y < s.y + s.h + pad) return true;
  for (const c of k >= 0 ? g.circles[k] : city.round) {
    const dx = x - c.x;
    const dy = y - c.y;
    const rr = c.r + pad;
    if (dx * dx + dy * dy < rr * rr) return true;
  }
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

/** The nearest point to `p` where a circle of radius `r` fits, searching
    outward in rings. */
export function freeSpot(city: City, p: Pt, r: number): Pt {
  if (!solidAt(city, p.x, p.y, r)) return { ...p };
  for (let rad = 8; rad < 240; rad += 8)
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const q = { x: p.x + Math.cos(a) * rad, y: p.y + Math.sin(a) * rad };
      if (!solidAt(city, q.x, q.y, r)) return q;
    }
  return { ...p };
}

/** Distance from point p to the segment a to b. */
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax;
  const vy = by - ay;
  const l2 = vx * vx + vy * vy;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2)) : 0;
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

/* ── finding a way round the blocks ────────────────────────────────── */

const CELL = 30;
export interface Nav {
  w: number;
  h: number;
  open: Uint8Array;
  /** How much the rival dislikes each cell's street this game (1 or more):
      a new taste each game, so it does not take the same route twice. */
  cost: Float32Array;
}

export function buildNav(city: City, r = 15, taste?: () => number): Nav {
  const w = Math.ceil(WORLD_W / CELL);
  const h = Math.ceil(WORLD_H / CELL);
  const open = new Uint8Array(w * h);
  const cost = new Float32Array(w * h).fill(1);
  const likes = AVENUES.concat(STREETS).map(() => (taste ? 1 + taste() * 0.9 : 1));
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const x = i * CELL + CELL / 2;
      const y = j * CELL + CELL / 2;
      open[j * w + i] = solidAt(city, x, y, r) ? 0 : 1;
      const k = pathIndex(city, x, y);
      if (k >= 0) cost[j * w + i] = likes[k];
    }
  return { w, h, open, cost };
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
        const c = cost[k] + (di && dj ? 1.414 : 1) * nav.cost[nk];
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
  /** Part of an army brought in by a power-up: here for a while, then home. */
  minion: boolean;
  player: boolean;
  x: number;
  y: number;
  /** Where it was at the start of the last step, for drawing in between. */
  px: number;
  py: number;
  vx: number;
  vy: number;
  r: number;
  baseR: number;
  face: 1 | -1;
  /** Last direction moved or aimed, radians. */
  dir: number;
  hp: number;
  maxHp: number;
  ammo: Ammo;
  /** A pack of special throws from a power-up; they go before the rest. */
  pack: { kind: Pack; n: number } | null;
  cooldown: number;
  /* Timers, in seconds. */
  stun: number;
  slow: number;
  shield: number;
  dash: number;
  giant: number;
  trapped: number;
  pied: number;
  hitT: number;
  throwT: number;
  stepT: number;
  freshT: number;
  /* Charges. */
  triple: number;
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
  /* Minions: seconds left, leaving, a party hat. */
  life: number;
  leaving: boolean;
  hat: string | null;
  /** How big it is drawn (pals and minions are smaller). */
  scale: number;
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
  px: number;
  py: number;
  /** Height above the ground, for the arc and the shadow. */
  z: number;
  pz: number;
  vx: number;
  vy: number;
  vz: number;
  dist: number;
  range: number;
  r: number;
  dmg: number;
  color: string;
  spin: number;
  splash: number;
  rolled: boolean;
  big: boolean;
  /* A lobbed balloon: from, to, how long, how far through. */
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  dur: number;
  t: number;
  trailT: number;
}

export interface Pickup {
  id: number;
  kind: PowerKind;
  x: number;
  y: number;
  t: number;
}

export type FxKind = "drop" | "puff" | "spark" | "heart" | "confetti" | "ring" | "sprinkle" | "steam" | "feather" | "star" | "drip" | "glint" | "leaf" | "petal" | "rocket" | "dust" | "water";
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
  kind: "splat" | "paw" | "puddle";
  x: number;
  y: number;
  r: number;
  color: string;
  life: number;
  seed: number;
  rot: number;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  t: number;
  life: number;
  color: string;
  size: number;
  kind: "word" | "dmg" | "heal";
}

export interface Taxi {
  lane: number;
  x: number;
  y: number;
  px: number;
  py: number;
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
  | { k: "hit"; byPlayer: boolean; onPlayer: boolean; onLeader: boolean; combo: number; ammo: ProjKind; name: string; dmg: number; hp: number }
  | { k: "heal"; player: boolean; amount: number; hp: number; why: "cupcake" | "sprinkler" }
  | { k: "wall"; near: boolean; ammo: ProjKind }
  | { k: "pickup"; kind: PowerKind; player: boolean }
  | { k: "recruit"; name: string; player: boolean }
  | { k: "army"; team: Team; player: boolean; n: number }
  | { k: "block"; player: boolean }
  | { k: "special"; team: Team; player: boolean }
  | { k: "pied" }
  | { k: "trapped"; player: boolean }
  | { k: "stomp" }
  | { k: "place"; path: Path }
  | { k: "low"; player: boolean; name: string }
  | { k: "out"; name: string; player: boolean }
  | { k: "hands" }
  | { k: "firework" }
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
  armies: number;
  /** Every point of the rival's bar that the player and their side took. */
  dealt: number;
  /** Every point of the player's bar that the other side took. */
  taken: number;
  healed: number;
  /** The names of the streets the player has been along. */
  places: string[];
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
  /** A brief white flash (a mega or a balloon landing near you). */
  flash: number;
  /** Seconds of cream on the screen after a pie lands on the player. */
  pieSplat: number;
  nextPickup: number;
  nextFirework: number;
  nextId: number;
  placeT: number;
  place: Path | null;
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
const ARMY_LOOKS: Record<Team, Look[]> = { dog: ["pip", "bao", "biscuit"], cat: ["inky", "mochi", "miso"] };
export const ARMY_NAMES: Record<Team, string> = { dog: "The Dog Pack", cat: "The Cat Crew" };
const HATS = ["#FF7AB0", "#FFC857", "#62D6A5", "#B794FF", "#8BB8E8", "#FF9F80"];

/* Ice cream flavours, from the dawn palette: strawberry, mint, mango,
   blueberry, vanilla, and one chocolate for contrast. */
export const FLAVOURS = ["#FF7AB0", "#62D6A5", "#FFC857", "#B794FF", "#FFE3A1", "#9A6450"];
export const SNOW = "#F4F8FF";
export const CREAM_PIE = "#FFF1DA";
export const WATER = "#8FD3FF";

export const POWER_NAMES: Record<PowerKind, string> = {
  triple: "Triple scoop",
  mega: "Mega snowball",
  dash: "Sprinkle dash",
  umbrella: "Umbrella",
  cupcake: "Cupcake",
  army: "Call the army",
  pie: "Cream pies",
  balloon: "Water balloons",
  bubble: "Bubble wand",
  giant: "Big paws",
};
/** What each one does, in a few words, for the screen. */
export const POWER_HINTS: Record<PowerKind, string> = {
  triple: "Your next 6 scoops go out three at a time.",
  mega: "3 huge snowballs that splash.",
  dash: "Run faster for 6 seconds, trailing sprinkles.",
  umbrella: "Splats bounce off you for 6 seconds.",
  cupcake: "Back up 25 points on your bar.",
  army: "Six friends run in to help for 12 seconds.",
  pie: "3 cream pies. Right in the face, and that's that.",
  balloon: "4 water balloons, lobbed. Big splash where they land.",
  bubble: "5 bubbles. Catch someone and they float for a moment.",
  giant: "Grow big for 7 seconds. Bigger throws, bigger steps.",
};
const PACK_SIZE: Record<Pack, number> = { mega: 3, pie: 3, balloon: 4, bubble: 5 };

/* Tuning. Times in seconds, speeds in world pixels per second, damage in
   whole points of a 100-point bar. */
export const TUNE = {
  playerSpeed: 220,
  rivalSpeed: { gentle: 180, lively: 205 },
  palSpeed: 250,
  minionSpeed: 235,
  /* Splats are small on purpose: two bots playing each other took 24 s to
     finish at twice these, and a round should last minutes. */
  scoop: { speed: 560, range: 520, dmg: 5, cool: 0.3, r: 7 },
  snow: { speed: 470, range: 470, dmg: 8, cool: 0.55, r: 8, slow: 1.1 },
  mega: { speed: 430, range: 480, dmg: 14, cool: 0.7, r: 15, splash: 70 },
  pie: { speed: 430, range: 440, dmg: 11, cool: 0.6, r: 10 },
  balloon: { speed: 0, range: 420, dmg: 9, cool: 0.65, r: 9, splash: 66 },
  bubble: { speed: 230, range: 440, dmg: 3, cool: 0.5, r: 11, trap: 1.15 },
  mini: { speed: 520, range: 320, dmg: 2, cool: [1.2, 1.9] as [number, number], r: 5 },
  palThrow: { dmg: 3, cool: [1.8, 2.6] as [number, number], reach: 320 },
  rivalCool: { gentle: 1.9, lively: 1.2 },
  rivalAim: { gentle: 0.16, lively: 0.08 },
  rivalDodge: { gentle: 0.3, lively: 0.62 },
  armySize: 6,
  armyLife: 12,
  giantTime: 7,
  maxHp: 100,
  readyTime: 1.6,
};

function makeActor(g: Game, look: Look, at: Pt, player: boolean): Actor {
  const c = CAST[look];
  const r = c.leader ? 15 : 12;
  return {
    id: g.nextId++,
    team: c.team,
    look,
    name: c.name,
    leader: c.leader,
    minion: false,
    player,
    x: at.x,
    y: at.y,
    px: at.x,
    py: at.y,
    vx: 0,
    vy: 0,
    r,
    baseR: r,
    face: c.team === "dog" ? 1 : -1,
    dir: c.team === "dog" ? -Math.PI / 4 : (Math.PI * 3) / 4,
    hp: TUNE.maxHp,
    maxHp: TUNE.maxHp,
    ammo: "scoop",
    pack: null,
    cooldown: 0,
    stun: 0,
    slow: 0,
    shield: 0,
    dash: 0,
    giant: 0,
    trapped: 0,
    pied: 0,
    hitT: 0,
    throwT: 0,
    stepT: 0,
    freshT: 0,
    triple: 0,
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
    life: 0,
    leaving: false,
    hat: null,
    scale: c.leader ? 1 : 0.82,
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
  const rnd = mulberry(seed);
  const g: Game = {
    t: 0,
    rnd,
    sky: opts.sky,
    pace: opts.pace,
    playerTeam: opts.team,
    autopilot: !!opts.autopilot,
    city,
    nav: buildNav(city, 15, mulberry(seed ^ 0x5bd1e995)),
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
    flash: 0,
    pieSplat: 0,
    nextPickup: 4,
    nextFirework: 0,
    nextId: 1,
    placeT: 0,
    place: null,
    stats: { thrown: 0, hits: 0, gotHit: 0, treats: 0, pals: 0, bestCombo: 0, specials: 0, armies: 0, dealt: 0, taken: 0, healed: 0, places: [] },
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
    const x = L.vertical ? L.at : along;
    const y = L.vertical ? along : L.at;
    g.taxis.push({ lane, x, y, px: x, py: y, speed: 110 + g.rnd() * 60, v: 0, honk: 0, hue: g.rnd() });
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

const FX_CAP = 360;

function burst(g: Game, kind: FxKind, x: number, y: number, n: number, color: string | string[], speed = 120, up = 80, size = 3, life = 0.6) {
  if (g.reduced) n = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    if (g.fx.length >= FX_CAP) return;
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

function one(g: Game, kind: FxKind, x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, color: string) {
  if (g.fx.length >= FX_CAP) return;
  g.fx.push({ kind, x, y, z, vx, vy, vz, life, max: life, size, color, rot: g.rnd() * 6.28 });
}

function say(g: Game, x: number, y: number, text: string, color = "#FFF4E8", size = 15, kind: FloatText["kind"] = "word") {
  /* Words in one place stack instead of printing over each other, and the
     same word twice in one place is said once: a mega snowball's splash
     once wrote "Brain freeze!" four times on top of itself. */
  if (kind === "word") {
    let lift = 0;
    for (const t of g.texts) {
      if (t.kind !== "word" || t.t > 0.6 || Math.abs(t.x - x) > 90 || Math.abs(t.y - (y - lift)) > 16) continue;
      if (t.text === text) return;
      lift += 18;
    }
    y -= lift;
  }
  if (g.texts.length > 16) g.texts.shift();
  g.texts.push({ x, y, text, t: 0, life: kind === "word" ? 1.2 : 0.95, color, size, kind });
}

function decal(g: Game, x: number, y: number, r: number, color: string, kind: Decal["kind"] = "splat", life = 9, rot = 0) {
  if (g.decals.length > 90) g.decals.shift();
  g.decals.push({ kind, x, y, r, color, life, seed: Math.floor(g.rnd() * 1e6), rot });
}

export function spawnPickup(g: Game) {
  if (g.pickups.length >= 5) return;
  const kinds: PowerKind[] = ["triple", "mega", "dash", "umbrella", "cupcake", "army", "pie", "balloon", "bubble", "giant"];
  const weights = [0.12, 0.1, 0.1, 0.09, 0.13, 0.08, 0.1, 0.1, 0.09, 0.09];
  for (let tries = 0; tries < 24; tries++) {
    /* Market Row's carts turn treats up more often. */
    const pool = g.rnd() < 0.3 ? g.city.hotSpots : g.city.spots;
    const s = pool[Math.floor(g.rnd() * pool.length)];
    if (g.pickups.some((p) => Math.hypot(p.x - s.x, p.y - s.y) < 220)) continue;
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
    /* One army out at a time is plenty. */
    if (kind === "army" && g.actors.some((a) => a.minion)) kind = "cupcake";
    g.pickups.push({ id: g.nextId++, kind, x: s.x, y: s.y, t: 0 });
    return;
  }
}

function pathThemeAt(g: Game, x: number, y: number): Theme | null {
  return placeAt(g.city, x, y)?.theme ?? null;
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
    let score = d * (o.leader ? 0.7 : o.minion ? 1.2 : 1);
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

/**
 * Where to aim to meet a moving target: the true intercept (solving for
 * the moment the throw and the target arrive at the same point), scaled by
 * `lead` (1 is a perfect lead, 0 aims where they are now).
 */
export function interceptAngle(a: Pt, o: { x: number; y: number; vx: number; vy: number }, speed: number, lead = 1): number {
  const dx = o.x - a.x;
  const dy = o.y - a.y;
  const vx = o.vx * lead;
  const vy = o.vy * lead;
  const A = vx * vx + vy * vy - speed * speed;
  const B = 2 * (dx * vx + dy * vy);
  const C = dx * dx + dy * dy;
  let t = -1;
  if (Math.abs(A) < 1e-6) t = B !== 0 ? -C / B : -1;
  else {
    const disc = B * B - 4 * A * C;
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      const t1 = (-B - s) / (2 * A);
      const t2 = (-B + s) / (2 * A);
      t = Math.min(t1, t2) > 0 ? Math.min(t1, t2) : Math.max(t1, t2);
    }
  }
  if (!(t > 0) || !Number.isFinite(t)) return Math.atan2(dy, dx);
  return Math.atan2(dy + vy * t, dx + vx * t);
}

function specOf(kind: ProjKind) {
  switch (kind) {
    case "snow":
      return TUNE.snow;
    case "mega":
      return TUNE.mega;
    case "pie":
      return TUNE.pie;
    case "balloon":
      return TUNE.balloon;
    case "bubble":
      return TUNE.bubble;
    case "mini":
      return { ...TUNE.mini, cool: TUNE.mini.cool[0] };
    default:
      return TUNE.scoop;
  }
}

/** What this actor will throw next. */
export function nextThrow(a: Actor): ProjKind {
  if (a.minion) return "mini";
  if (!a.leader) return "scoop";
  if (a.pack) return a.pack.kind;
  return a.ammo;
}

function throwFrom(g: Game, a: Actor, ang: number, aimAt?: Pt | null): boolean {
  if (a.cooldown > 0 || a.stun > 0 || a.sit || a.trapped > 0) return false;
  const kind = nextThrow(a);
  const spec = specOf(kind);
  const big = a.giant > 0;
  const angles = a.triple > 0 && kind === "scoop" ? [-0.2, 0, 0.2] : [0];
  for (const off of angles) {
    const t = ang + off;
    const sx = a.x + Math.cos(t) * (a.r + 4);
    const sy = a.y + Math.sin(t) * (a.r + 4) - 2;
    const p: Proj = {
      id: g.nextId++,
      team: a.team,
      kind,
      owner: a.id,
      x: sx,
      y: sy,
      px: sx,
      py: sy,
      z: 14,
      pz: 14,
      vx: Math.cos(t) * spec.speed,
      vy: Math.sin(t) * spec.speed,
      vz: 0,
      dist: 0,
      range: spec.range,
      r: spec.r * (big ? 1.6 : 1),
      dmg: !a.leader && !a.minion ? TUNE.palThrow.dmg : Math.round(spec.dmg * (big ? 1.5 : 1)),
      color: kind === "scoop" || kind === "mini" ? FLAVOURS[Math.floor(g.rnd() * FLAVOURS.length)] : kind === "pie" ? CREAM_PIE : kind === "balloon" ? [WATER, "#FF9FCB", "#C6B2FF"][Math.floor(g.rnd() * 3)] : SNOW,
      spin: g.rnd() * 6,
      splash: kind === "mega" ? TUNE.mega.splash : kind === "balloon" ? TUNE.balloon.splash : 0,
      rolled: false,
      big,
      sx,
      sy,
      tx: 0,
      ty: 0,
      dur: 0,
      t: 0,
      trailT: 0,
    };
    if (kind === "balloon") {
      /* A lob: to the point aimed at, or where they will be, inside reach. */
      const want = aimAt ?? { x: a.x + Math.cos(t) * spec.range, y: a.y + Math.sin(t) * spec.range };
      const d = Math.min(spec.range, Math.hypot(want.x - a.x, want.y - a.y));
      p.tx = a.x + Math.cos(t) * d;
      p.ty = a.y + Math.sin(t) * d;
      p.dur = 0.45 + d / 1100;
      p.vx = p.vy = 0;
    }
    g.projs.push(p);
  }
  if (a.pack && kind === a.pack.kind) {
    a.pack.n--;
    if (a.pack.n <= 0) a.pack = null;
  } else if (angles.length > 1) a.triple--;
  const rivalSlow = a.leader && !a.player ? TUNE.rivalCool[g.pace] : 1;
  a.cooldown = a.minion
    ? TUNE.mini.cool[0] + g.rnd() * (TUNE.mini.cool[1] - TUNE.mini.cool[0])
    : a.leader
      ? spec.cool * rivalSlow
      : TUNE.palThrow.cool[0] + g.rnd() * (TUNE.palThrow.cool[1] - TUNE.palThrow.cool[0]);
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
  a.stains.push({ x: (g.rnd() - 0.5) * a.baseR * 1.8, y: -a.baseR * 0.4 - g.rnd() * a.baseR * 1.6, r: (big ? 6 : 3.4) + g.rnd() * 2.6, c: color });
}

function colorOf(p: Proj): string {
  if (p.kind === "scoop" || p.kind === "rain" || p.kind === "mini") return p.color;
  if (p.kind === "pie") return CREAM_PIE;
  if (p.kind === "balloon") return WATER;
  if (p.kind === "bubble") return "#E3D7FF";
  return SNOW;
}

/** A splat lands on `o`. `dmg` is exact: the bar drops by that much. */
function landHit(g: Game, p: Proj, o: Actor, dmgOverride?: number) {
  const owner = g.actors.find((a) => a.id === p.owner);
  if (o.shield > 0) {
    burst(g, "spark", o.x, o.y - 10, 8, ["#FFC857", "#FFF4E8", "#FF7AB0"], 140, 90, 2.5, 0.5);
    say(g, o.x, o.y - 40, "Boing!", "#FFE3A1", 14);
    g.events.push({ k: "block", player: o.player });
    return;
  }
  const color = colorOf(p);
  let dmg = 0;
  if (o.leader) {
    const before = o.hp;
    dmg = Math.min(before, Math.max(0, Math.round(dmgOverride ?? p.dmg)));
    o.hp = before - dmg;
    if (o.player) {
      g.stats.gotHit++;
      g.stats.taken += dmg;
    } else if (o.team !== g.playerTeam) g.stats.dealt += owner?.team === g.playerTeam ? dmg : 0;
    addStain(g, o, color, p.kind === "mega" || p.kind === "pie" || p.big);
    if (before > 30 && o.hp <= 30 && o.hp > 0) g.events.push({ k: "low", player: o.player, name: o.name });
    say(g, o.x + (g.rnd() - 0.5) * 14, o.y - 30, `-${dmg}`, o.player ? "#FF9FB8" : "#FFE08A", 13 + Math.min(8, dmg / 2), "dmg");
  } else {
    o.stun = o.minion ? 0.8 : 1.3;
    addStain(g, o, color);
  }
  o.hitT = 0.42;
  if (p.kind === "snow" || p.kind === "mega") o.slow = Math.max(o.slow, TUNE.snow.slow);
  if (p.kind === "balloon") o.slow = Math.max(o.slow, 0.6);
  if (p.kind === "pie") {
    o.pied = 2.2;
    if (o.player) {
      g.pieSplat = g.reduced ? 1.6 : 2.2;
      g.events.push({ k: "pied" });
    }
  }
  if (p.kind === "bubble") {
    o.trapped = TUNE.bubble.trap;
    o.vx = o.vy = 0;
    g.events.push({ k: "trapped", player: o.player });
  }
  if (owner) {
    /* Broadway: the crowd loves it, and the special charges half as fast
       again. */
    const applause = pathThemeAt(g, owner.x, owner.y) === "theatre";
    const gain = (o.leader ? 0.11 : 0.05) * (applause ? 1.5 : 1);
    const lead = owner.minion ? g.actors.find((x) => x.leader && x.team === owner.team) : owner;
    if (lead) lead.special = Math.min(1, lead.special + gain * (owner.minion ? 0.5 : 1));
    owner.combo = g.t - owner.lastHitT < 2.6 ? owner.combo + 1 : 1;
    owner.lastHitT = g.t;
    if (owner.player) {
      g.stats.hits++;
      g.stats.bestCombo = Math.max(g.stats.bestCombo, owner.combo);
    }
    if (applause && o.leader) say(g, owner.x, owner.y - 50, "Bravo!", "#FFC857", 14);
  }
  const combo = owner?.combo ?? 1;
  const words = p.kind === "scoop" || p.kind === "rain" || p.kind === "mini" ? HIT_WORDS : SNOW_WORDS;
  const word =
    p.kind === "mega" ? "Brain freeze!" : p.kind === "pie" ? "Pie face!" : p.kind === "balloon" ? "Sploosh!" : p.kind === "bubble" ? "Bubbled!" : combo >= 3 ? `Combo x${combo}!` : words[Math.floor(g.rnd() * words.length)];
  if (o.leader || p.kind !== "mini") say(g, o.x, o.y - 48, word, combo >= 3 ? "#FFC857" : "#FFF4E8", combo >= 3 || p.kind === "mega" || p.kind === "pie" ? 17 : 14);
  if (p.kind === "scoop" || p.kind === "rain" || p.kind === "mini") burst(g, "drop", o.x, o.y - 14, p.kind === "mini" ? 5 : 12, [p.color, p.color, "#FFF4E8"], 150, 120, 3.2, 0.7);
  else if (p.kind === "pie") burst(g, "drop", o.x, o.y - 22, 18, [CREAM_PIE, "#FFE3A1", "#FFF8EE"], 170, 140, 4, 0.8);
  else if (p.kind === "balloon") burst(g, "water", o.x, o.y - 12, 16, [WATER, "#C6ECFF", "#FFF8EE"], 180, 150, 3.2, 0.7);
  else if (p.kind === "bubble") burst(g, "glint", o.x, o.y - 20, 10, ["#FFB3CF", "#B794FF", "#8BB8E8", "#FFF8EE"], 90, 90, 2.6, 0.6);
  else burst(g, "puff", o.x, o.y - 14, p.kind === "mega" ? 20 : 12, [SNOW, "#D6E6FF", "#FFF8EE"], 160, 110, p.kind === "mega" ? 5 : 3.6, 0.8);
  burst(g, "ring", o.x, o.y - 12, 1, p.kind === "scoop" ? p.color : "#D6E6FF", 0, 0, 10, 0.35);
  if (p.kind !== "bubble") decal(g, o.x + (g.rnd() - 0.5) * 16, o.y + 6, p.kind === "mega" || p.kind === "pie" ? 22 : 12, color);
  const playerInvolved = o.player || !!owner?.player;
  if (playerInvolved && !g.reduced) {
    g.hitStop = Math.max(g.hitStop, p.kind === "mega" || p.kind === "pie" ? 0.07 : 0.035);
    g.shake = Math.max(g.shake, o.player ? 7 : 3.5);
    if (p.kind === "mega" || p.kind === "pie") g.flash = Math.max(g.flash, 0.12);
  }
  g.events.push({ k: "hit", byPlayer: !!owner?.player, onPlayer: o.player, onLeader: o.leader, combo, ammo: p.kind, name: o.name, dmg, hp: o.hp });
  if (o.leader && o.hp <= 0 && g.phase === "play") goOut(g, o);
}

function heal(g: Game, a: Actor, amount: number, why: "cupcake" | "sprinkler") {
  const before = a.hp;
  a.hp = Math.min(a.maxHp, a.hp + amount);
  const got = a.hp - before;
  if (got <= 0 && why === "sprinkler" && !a.stains.length) return;
  a.stains.splice(0, why === "cupcake" ? 4 : 1);
  if (a.player) g.stats.healed += got;
  if (got > 0) say(g, a.x, a.y - 34, `+${got}`, "#62D6A5", 14 + Math.min(6, got / 4), "heal");
  g.events.push({ k: "heal", player: a.player, amount: got, hp: a.hp, why });
}

function splash(g: Game, p: Proj, except: number) {
  if (!p.splash) return;
  for (const o of g.actors) {
    if (o.team === p.team || o.id === except || (o.sit && g.phase !== "play")) continue;
    const d = Math.hypot(o.x - p.x, o.y - p.y);
    if (d >= p.splash) continue;
    /* Balloons fall off with distance: 9 at the centre, 4 at the edge. */
    const dmg = p.kind === "balloon" ? Math.round(TUNE.balloon.dmg - 5 * (d / p.splash)) : 5;
    landHit(g, p, o, dmg);
  }
}

function splatGround(g: Game, p: Proj, wall: boolean) {
  const color = colorOf(p);
  if (p.kind === "scoop" || p.kind === "rain" || p.kind === "mini" || p.kind === "pie") burst(g, "drop", p.x, p.y, 7, [color, "#FFF4E8"], 90, 70, 2.6, 0.5);
  else if (p.kind === "balloon") {
    burst(g, "water", p.x, p.y, 22, [WATER, "#C6ECFF", "#FFF8EE"], 200, 160, 3.4, 0.8);
    burst(g, "ring", p.x, p.y, 1, WATER, 0, 0, 16, 0.5);
    decal(g, p.x, p.y, 40, WATER, "puddle", 7);
    const pl = playerOf(g);
    if (!g.reduced && Math.hypot(pl.x - p.x, pl.y - p.y) < 160) g.flash = Math.max(g.flash, 0.08);
  } else if (p.kind === "bubble") burst(g, "glint", p.x, p.y - 10, 8, ["#FFB3CF", "#B794FF", "#8BB8E8"], 70, 60, 2.4, 0.5);
  else burst(g, "puff", p.x, p.y, p.kind === "mega" ? 16 : 8, [SNOW, "#D6E6FF"], 110, 70, p.kind === "mega" ? 4.6 : 3, 0.6);
  if (p.kind !== "balloon" && p.kind !== "bubble") decal(g, p.x, p.y + (wall ? 4 : 0), p.kind === "mega" ? 24 : 10, color);
  splash(g, p, -1);
  const pl = playerOf(g);
  g.events.push({ k: "wall", near: Math.hypot(pl.x - p.x, pl.y - p.y) < 420, ammo: p.kind });
}

/* ── the army ──────────────────────────────────────────────────────── */

/** Six friends of `lead`'s side run in from behind them, for a while. */
export function callArmy(g: Game, lead: Actor) {
  const foe = leaderOf(g, other(lead.team));
  const d = Math.hypot(lead.x - foe.x, lead.y - foe.y) || 1;
  /* From behind the leader, away from the foe, on open ground. */
  const base = freeSpot(g.city, { x: lead.x + ((lead.x - foe.x) / d) * 200, y: lead.y + ((lead.y - foe.y) / d) * 200 }, 14);
  const mine = g.actors.filter((a) => a.minion && a.team === lead.team);
  for (const m of mine) {
    m.life = TUNE.armyLife;
    m.leaving = false;
  }
  const n = Math.max(0, TUNE.armySize - mine.length);
  const looks = ARMY_LOOKS[lead.team];
  for (let i = 0; i < n; i++) {
    const ang = (i / Math.max(1, n)) * Math.PI * 2;
    const at = freeSpot(g.city, { x: base.x + Math.cos(ang) * 30, y: base.y + Math.sin(ang) * 22 }, 10);
    const m = makeActor(g, looks[i % looks.length], at, false);
    m.minion = true;
    m.leader = false;
    m.found = true;
    m.follows = lead.id;
    m.r = m.baseR = 10;
    m.scale = 0.64;
    m.life = TUNE.armyLife;
    m.hat = HATS[(i + (lead.team === "cat" ? 3 : 0)) % HATS.length];
    m.name = lead.team === "dog" ? "pup" : "kitten";
    m.slot = i;
    m.cooldown = 0.6 + g.rnd() * 0.8;
    m.ai = newAi();
    g.actors.push(m);
  }
  burst(g, "dust", base.x, base.y, 18, ["#E9DFF5", "#D3C8DD", "#FFF4E8"], 160, 60, 7, 0.9);
  burst(g, "confetti", base.x, base.y - 20, 22, HATS, 200, 220, 3, 1.2);
  say(g, lead.x, lead.y - 62, `${ARMY_NAMES[lead.team]}!`, "#FFC857", 19);
  if (lead.player) g.stats.armies++;
  g.events.push({ k: "army", team: lead.team, player: lead.player, n });
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

function newProj(g: Game, kind: ProjKind, team: Team, owner: number, x: number, y: number, z: number, dmg: number, r: number, color: string): Proj {
  return { id: g.nextId++, team, kind, owner, x, y, px: x, py: y, z, pz: z, vx: 0, vy: 0, vz: 0, dist: 0, range: 1, r, dmg, color, spin: g.rnd() * 6, splash: 0, rolled: false, big: false, sx: x, sy: y, tx: x, ty: y, dur: 0, t: 0, trailT: 0 };
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
        const p = newProj(g, "rain", s.team, leaderOf(g, s.team).id, s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr * 0.7, 260 + g.rnd() * 60, 4, 8, FLAVOURS[Math.floor(g.rnd() * FLAVOURS.length)]);
        p.vz = -380;
        g.projs.push(p);
      }
    } else {
      s.tick -= dt;
      for (let i = 0; i < 3; i++) {
        const a = g.rnd() * Math.PI * 2;
        const rr = 20 + g.rnd() * 70;
        one(g, "puff", s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr * 0.7, 10 + g.rnd() * 50, -Math.sin(a) * 160, Math.cos(a) * 110, 10, 0.6, 2 + g.rnd() * 2.5, g.rnd() < 0.5 ? SNOW : "#D6E6FF");
      }
      if (s.tick <= 0 && s.t < s.dur) {
        s.tick = 0.26;
        for (const e of g.actors) {
          if (e.team === s.team || Math.hypot(e.x - s.x, e.y - s.y) > 92) continue;
          e.slow = Math.max(e.slow, 0.8);
          if (e.leader) landHit(g, newProj(g, "snow", s.team, leaderOf(g, s.team).id, e.x, e.y, 0, 2, 0, SNOW), e);
          else e.stun = Math.max(e.stun, 0.6);
          if (g.phase !== "play") break;
        }
      }
    }
  }
  let w = 0;
  for (const s of g.storms) if (s.t < s.dur + 0.4) g.storms[w++] = s;
  g.storms.length = w;
}

/* ── the end: nobody loses, really ─────────────────────────────────── */

function goOut(g: Game, loser: Actor) {
  g.phase = "slowmo";
  g.phaseT = 0;
  g.winner = other(loser.team);
  loser.sit = true;
  loser.trapped = 0;
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
  winner.giant = 0;
  winner.trapped = 0;
  /* The winner walks over, on the side they are already on. */
  const side = winner.x < loser.x ? -1 : 1;
  let spot = { x: loser.x + side * 48, y: loser.y };
  if (solidAt(g.city, spot.x, spot.y, winner.r)) spot.x = loser.x - side * 48;
  /* In the park the other side can be a tree too (measured: one game in
     twelve put the winner inside one). */
  spot = freeSpot(g.city, spot, winner.r);
  winner.ai = winner.ai ?? newAi();
  winner.ai.goalKind = "meet";
  winner.ai.goal = spot;
  winner.ai.path = findPath(g.nav, winner, spot);
  winner.ai.pathTo = spot;
  /* Everyone else comes to watch, armies too. */
  for (const a of g.actors) {
    if (a.leader) continue;
    a.found = true;
    a.stun = 0;
    a.trapped = 0;
    if (a.minion) a.life = 999;
  }
}

function joinHands(g: Game) {
  const loser = leaderOf(g, other(g.winner!));
  const winner = leaderOf(g, g.winner!);
  g.handsAt = g.t;
  loser.sit = false;
  loser.hitT = 0;
  winner.vx = winner.vy = 0;
  /* Side by side, facing each other, paws held between them: 24 either
     side, so the reaching paws meet in the middle (closer, and the two of
     them were drawn on top of each other). */
  const mid = { x: (loser.x + winner.x) / 2, y: (loser.y + winner.y) / 2 };
  const left = winner.x < loser.x ? winner : loser;
  const right = left === winner ? loser : winner;
  left.x = left.px = mid.x - 24;
  right.x = right.px = mid.x + 24;
  left.y = right.y = left.py = right.py = mid.y;
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
  g.nextFirework = g.t + 0.6;
  g.events.push({ k: "hands" });
}

/* ── moving ────────────────────────────────────────────────────────── */

function move(g: Game, a: Actor, tx: number, ty: number, speed: number, dt: number) {
  if (a.trapped > 0) {
    /* Inside a bubble: floating, going nowhere. */
    a.vx *= 0.8;
    a.vy *= 0.8;
    return;
  }
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
  let s = a.player && !g.autopilot ? TUNE.playerSpeed : a.minion ? TUNE.minionSpeed : a.leader ? TUNE.rivalSpeed[g.pace] : TUNE.palSpeed;
  if (a.dash > 0) s *= 1.45;
  if (a.slow > 0) s *= 0.6;
  if (a.giant > 0) s *= 0.92;
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
  const lost = g.actors.filter((p) => !p.leader && !p.minion && p.team === a.team && !p.found);
  const nearPal = lost.sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0];
  const wantCake = a.hp < 72;
  const pick = g.pickups
    .filter((p) => p.kind !== "cupcake" || wantCake)
    .map((p) => ({ p, d: Math.hypot(p.x - a.x, p.y - a.y) }))
    .sort((p, q) => p.d - q.d)[0];
  const cake = g.pickups.find((p) => p.kind === "cupcake" && Math.hypot(p.x - a.x, p.y - a.y) < 700);
  const spray = a.hp < 60 && a.stains.length ? g.city.sprinklers.find((s) => Math.hypot(s.x - a.x, s.y - a.y) < 360) : undefined;
  if (a.hp < 40 && cake) {
    ai.goalKind = "pickup";
    ai.goal = { x: cake.x, y: cake.y };
  } else if (spray && dFoe > 260) {
    ai.goalKind = "pickup";
    ai.goal = { x: spray.x, y: spray.y };
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
      if (p.team === a.team || p.rolled || p.kind === "rain" || p.kind === "balloon") continue;
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
  if (sees && a.cooldown <= 0 && a.trapped <= 0) {
    ai.aimDelay -= dt;
    if (ai.aimDelay <= 0) {
      if (a.special >= 1 && dFoe < 380) startSpecial(g, a);
      else {
        if (!a.pack) a.ammo = dFoe < 300 ? "snow" : "scoop";
        const kind = nextThrow(a);
        const spec = specOf(kind);
        const err = (g.rnd() - 0.5) * 2 * TUNE.rivalAim[g.pace];
        if (dFoe < spec.range + 10) {
          if (kind === "balloon") {
            const t = Math.min(1.2, dFoe / 900);
            throwFrom(g, a, Math.atan2(foe.y - a.y, foe.x - a.x) + err, { x: foe.x + foe.vx * t * 0.6, y: foe.y + foe.vy * t * 0.6 });
          } else throwFrom(g, a, interceptAngle(a, foe, spec.speed, 0.55) + err);
        }
      }
      ai.aimDelay = 0.12 + g.rnd() * 0.25;
    }
  }
}

/* ── one step ──────────────────────────────────────────────────────── */

/**
 * Moves the game on by `realDt` seconds. The screen calls it in fixed
 * steps (1/60 s) and draws between them using each thing's previous
 * position, which is what keeps motion smooth on a 120 Hz screen and on
 * an uneven frame alike.
 */
export function update(g: Game, realDt: number, input: Input) {
  for (const a of g.actors) {
    a.px = a.x;
    a.py = a.y;
  }
  for (const p of g.projs) {
    p.px = p.x;
    p.py = p.y;
    p.pz = p.z;
  }
  for (const c of g.taxis) {
    c.px = c.x;
    c.py = c.y;
  }

  let dt = Math.min(realDt, 1 / 30);
  if (g.hitStop > 0) {
    g.hitStop -= dt;
    dt *= 0.08;
  }
  if (g.phase === "slowmo") dt *= g.reduced ? 1 : 0.35;
  g.t += dt;
  g.phaseT += realDt;
  g.shake = Math.max(0, g.shake - realDt * 30);
  g.flash = Math.max(0, g.flash - realDt);
  g.pieSplat = Math.max(0, g.pieSplat - realDt);

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
    a.pied = Math.max(0, a.pied - dt);
    a.freshT = Math.max(0, a.freshT - dt);
    if (a.trapped > 0) {
      a.trapped -= dt;
      if (a.trapped <= 0) {
        a.trapped = 0;
        burst(g, "glint", a.x, a.y - 22, 10, ["#FFB3CF", "#B794FF", "#8BB8E8", "#FFF8EE"], 120, 80, 2.4, 0.5);
        say(g, a.x, a.y - 52, "Pop!", "#FFF4E8", 14);
      }
    }
    const wasGiant = a.giant > 0;
    a.giant = Math.max(0, a.giant - dt);
    a.r = a.giant > 0 ? a.baseR * 1.5 : a.baseR;
    if (wasGiant && a.giant <= 0) burst(g, "star", a.x, a.y - 20, 8, ["#FFC857", "#FFF4E8"], 100, 80, 3, 0.6);
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
      const kind = nextThrow(player);
      const spec = specOf(kind);
      let ang: number;
      let at: Pt | null = input.aim;
      if (input.aim) ang = Math.atan2(input.aim.y - player.y, input.aim.x - player.x);
      else {
        const moving = Math.hypot(input.mx, input.my) > 0.2 ? Math.atan2(input.my, input.mx) : player.dir;
        const t = target(g, player, moving, spec.range + 40);
        ang = t ? interceptAngle(player, t, kind === "balloon" ? 700 : spec.speed, 1) : moving;
        if (t && kind === "balloon") at = { x: t.x, y: t.y };
      }
      throwFrom(g, player, ang, at);
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

  /* The pals and the armies. */
  const loser = g.winner ? leaderOf(g, other(g.winner)) : null;
  const winner = g.winner ? leaderOf(g, g.winner) : null;
  const mid = loser && winner ? { x: (loser.x + winner.x) / 2, y: (loser.y + winner.y) / 2 } : null;
  let ring = 0;
  for (const a of g.actors) {
    if (a.leader) continue;
    const lead = leaderOf(g, a.team);
    if (g.phase === "makeup" || g.phase === "done") {
      /* Everyone gathers round the two of them and hops. */
      const idx = ring++;
      const ang = (idx / 6) * Math.PI * 2 + 0.8 + (idx >= 6 ? 0.5 : 0);
      const rad = idx < 6 ? 64 : 104;
      const spot = { x: mid!.x + Math.cos(ang) * rad, y: mid!.y + Math.sin(ang) * rad * 0.7 + 8 };
      if (!a.ai) a.ai = newAi();
      const d = Math.hypot(spot.x - a.x, spot.y - a.y);
      if (d > 8) {
        const dir = steer(g, a, spot, dt);
        move(g, a, dir.x, dir.y, TUNE.palSpeed, dt);
      } else {
        move(g, a, 0, 0, 0, dt);
        a.face = mid!.x > a.x ? 1 : -1;
      }
      if (g.handsAt) a.hop += dt;
      continue;
    }
    if (a.minion) {
      runMinion(g, a, dt, playing);
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
        a.slot = g.actors.filter((x) => !x.leader && !x.minion && x.team === a.team && x.found && x !== a).length;
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
    if (a.stun > 0 || a.trapped > 0) move(g, a, 0, 0, 0, dt);
    else if (d > 10) {
      if (!a.ai) a.ai = newAi();
      const dir = d > 160 ? steer(g, a, spot, dt) : { x: spot.x - a.x, y: spot.y - a.y };
      move(g, a, dir.x, dir.y, TUNE.palSpeed * (a.slow > 0 ? 0.6 : 1) * (d > 140 ? 1.3 : 1), dt);
    } else move(g, a, 0, 0, 0, dt);
    if (playing && a.stun <= 0 && a.cooldown <= 0 && a.trapped <= 0) {
      const t = target(g, a, null, TUNE.palThrow.reach);
      if (t && clearLine(g.city, a, t)) throwFrom(g, a, interceptAngle(a, t, TUNE.scoop.speed, 0.5) + (g.rnd() - 0.5) * 0.3);
      else a.cooldown = 0.4;
    }
  }
  /* Minions who have gone home. */
  {
    let w = 0;
    for (const a of g.actors) if (!(a.minion && a.leaving && a.life < -1.4)) g.actors[w++] = a;
    if (w !== g.actors.length) g.actors.length = w;
  }

  /* Pickups. */
  if (playing) {
    g.nextPickup -= dt;
    if (g.nextPickup <= 0) {
      spawnPickup(g);
      g.nextPickup = 5 + g.rnd() * 4;
    }
  }
  for (const p of g.pickups) p.t += dt;
  if (playing)
    for (const a of g.actors) {
      if (!a.leader || a.sit) continue;
      const hit = g.pickups.find((p) => Math.hypot(p.x - a.x, p.y - (a.y - 4)) < a.r + 16);
      if (!hit) continue;
      g.pickups = g.pickups.filter((p) => p !== hit);
      switch (hit.kind) {
        case "triple":
          a.triple = 6;
          break;
        case "dash":
          a.dash = 6;
          break;
        case "umbrella":
          a.shield = 6;
          break;
        case "giant":
          a.giant = TUNE.giantTime;
          break;
        case "cupcake":
          heal(g, a, 25, "cupcake");
          break;
        case "army":
          callArmy(g, a);
          break;
        default:
          a.pack = { kind: hit.kind, n: PACK_SIZE[hit.kind] };
      }
      if (hit.kind !== "army") say(g, a.x, a.y - 46, `${POWER_NAMES[hit.kind]}!`, "#FFE3A1", 16);
      burst(g, "spark", hit.x, hit.y - 10, 14, ["#FFC857", "#FFF4E8", "#FF7AB0", "#62D6A5"], 150, 130, 3, 0.7);
      burst(g, "ring", hit.x, hit.y - 8, 1, "#FFC857", 0, 0, 14, 0.4);
      if (a.player) g.stats.treats++;
      g.events.push({ k: "pickup", kind: hit.kind, player: a.player });
    }

  /* Each path's own thing. */
  if (playing)
    for (const a of g.actors) {
      if (a.sit) continue;
      const theme = pathThemeAt(g, a.x, a.y);
      const moving = Math.hypot(a.vx, a.vy) > 60;
      if (theme === "sprinkler" && a.freshT <= 0 && (a.leader || a.stun > 0)) {
        const s = g.city.sprinklers.find((q) => Math.hypot(q.x - a.x, q.y - a.y) < q.r);
        if (s) {
          a.freshT = 1.2;
          if (a.leader) {
            if (a.hp < a.maxHp || a.stains.length) {
              heal(g, a, 3, "sprinkler");
              say(g, a.x, a.y - 54, "Fresh!", "#8FD3FF", 13);
            }
          } else a.stun = 0;
          burst(g, "water", a.x, a.y - 16, 8, [WATER, "#FFF8EE"], 90, 110, 2.6, 0.5);
        }
      }
      if (!moving || g.fx.length > FX_CAP - 40) continue;
      if (theme === "leaves" && g.rnd() < dt * 8) one(g, "leaf", a.x, a.y, 2, (g.rnd() - 0.5) * 60, (g.rnd() - 0.5) * 30, 50 + g.rnd() * 40, 1.1, 3, ["#FF9F80", "#FFC857", "#E8677E"][Math.floor(g.rnd() * 3)]);
      if (theme === "rainbow" && g.rnd() < dt * 14) one(g, "sprinkle", a.x - a.face * 6, a.y - 2, 4, -a.vx * 0.1, -a.vy * 0.1, 18, 0.8, 3, FLAVOURS[Math.floor(g.rnd() * 5)]);
      if (theme === "cobbles" && g.rnd() < dt * 6) one(g, "dust", a.x, a.y, 1, (g.rnd() - 0.5) * 30, 0, 14, 0.6, 5, g.sky === "night" ? "#6A5C86" : "#E9DFF5");
    }

  /* Footsteps: paw prints in the night's snow, a thump under big paws. */
  for (const a of g.actors) {
    if (!(a.leader || a.minion) || a.sit) continue;
    const sp = Math.hypot(a.vx, a.vy);
    if (sp < 50) continue;
    a.stepT -= dt;
    if (a.stepT > 0) continue;
    a.stepT = a.giant > 0 ? 0.34 : 0.22;
    if (g.sky === "night" && a.leader) decal(g, a.x + (g.rnd() - 0.5) * 6, a.y + 3, a.giant > 0 ? 5 : 3.2, "#EAF1FF", "paw", 6, Math.atan2(a.vy, a.vx));
    if (a.giant > 0) {
      burst(g, "ring", a.x, a.y, 1, "#FFF4E8", 0, 0, 16, 0.4);
      burst(g, "dust", a.x, a.y, 4, ["#E9DFF5", "#D3C8DD"], 80, 30, 6, 0.6);
      if (!g.reduced && Math.hypot(a.x - player.x, a.y - player.y) < 400) g.shake = Math.max(g.shake, 2.5);
      g.events.push({ k: "stomp" });
    } else if (a.dash > 0 || sp > 230) one(g, "dust", a.x - a.face * 6, a.y, 1, -a.vx * 0.08, 0, 10, 0.5, 4, g.sky === "night" ? "#B9C9EE" : "#E9DFF5");
  }

  /* Projectiles. */
  let keepN = 0;
  for (const p of g.projs) {
    if (p.kind === "rain") {
      p.z += p.vz * dt;
      p.vz -= 300 * dt;
      p.spin += dt * 8;
      if (p.z <= 0) {
        let hitOne = false;
        for (const o of g.actors) {
          if (o.team === p.team || Math.hypot(o.x - p.x, o.y - p.y) > 34) continue;
          landHit(g, p, o);
          hitOne = true;
          break;
        }
        if (!hitOne) splatGround(g, p, false);
        continue;
      }
      g.projs[keepN++] = p;
      continue;
    }
    if (p.kind === "balloon") {
      /* Lobbed high: nothing stops it until it lands. */
      p.t += dt;
      const k = Math.min(1, p.t / p.dur);
      p.x = p.sx + (p.tx - p.sx) * k;
      p.y = p.sy + (p.ty - p.sy) * k;
      p.z = 14 + 92 * 4 * k * (1 - k) - 12 * k;
      p.spin += dt * 4;
      if (k >= 1) {
        splatGround(g, p, false);
        continue;
      }
      g.projs[keepN++] = p;
      continue;
    }
    if (p.kind === "bubble") {
      /* Bubbles wobble, and drift slower under Lantern Avenue's lanterns. */
      const slow = pathThemeAt(g, p.x, p.y) === "lantern" ? 0.6 : 1;
      const sp = Math.hypot(p.vx, p.vy) || 1;
      const wob = Math.sin(p.dist / 22) * 40;
      p.x += (p.vx * slow + (-p.vy / sp) * wob) * dt;
      p.y += (p.vy * slow + (p.vx / sp) * wob) * dt;
      p.dist += sp * slow * dt;
    } else {
      /* Harbor Walk: the river breeze pushes throws south. */
      if (p.x > avX(COLS) - AW / 2) p.vy += 70 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.dist += Math.hypot(p.vx, p.vy) * dt;
    }
    const f = Math.min(1, p.dist / p.range);
    p.z = 14 + 30 * 4 * f * (1 - f) - 10 * f + (p.kind === "bubble" ? 10 : 0);
    p.spin += dt * (p.kind === "scoop" || p.kind === "mini" ? 11 : p.kind === "pie" ? 7 : 6);
    /* A trail behind it: drips for ice cream and pies, glints for snow and bubbles. */
    p.trailT -= dt;
    if (p.trailT <= 0) {
      p.trailT = 0.045;
      if (p.kind === "scoop" || p.kind === "mini" || p.kind === "pie") one(g, "drip", p.x, p.y, p.z, 0, 0, -20, 0.32, p.kind === "pie" ? 2.6 : 1.8, p.color);
      else one(g, "glint", p.x, p.y, p.z, 0, 0, 0, 0.3, p.kind === "bubble" ? 2.2 : 1.8, p.kind === "bubble" ? ["#FFB3CF", "#8BB8E8", "#B794FF"][Math.floor(g.rnd() * 3)] : "#FFF8EE");
    }
    if (solidAt(g.city, p.x, p.y)) {
      splatGround(g, p, true);
      continue;
    }
    /* The hit is checked along the whole step, not just where it ends up,
       so a fast throw cannot pass through a small pal between frames. */
    let hit: Actor | null = null;
    let best = Infinity;
    for (const o of g.actors) {
      if (o.team === p.team || (o.sit && g.phase !== "play") || (o.minion && o.leaving)) continue;
      const d = segDist(o.x, o.y, p.px, p.py, p.x, p.y);
      if (d < o.r + p.r && d < best) {
        best = d;
        hit = o;
      }
    }
    if (hit) {
      landHit(g, p, hit);
      splash(g, p, hit.id);
      continue;
    }
    if (p.dist >= p.range) {
      splatGround(g, p, false);
      continue;
    }
    g.projs[keepN++] = p;
  }
  g.projs.length = g.phase === "makeup" || g.phase === "done" ? 0 : keepN;

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
      if (c.y > WORLD_H + 60) c.y = c.py = -60;
      if (c.y < -60) c.y = c.py = WORLD_H + 60;
    } else {
      c.x += c.v * L.dir * dt;
      if (c.x > WORLD_W + 60) c.x = c.px = -60;
      if (c.x < -60) c.x = c.px = WORLD_W + 60;
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
  if (g.rnd() < dt * 6) {
    const v = g.city.vents[Math.floor(g.rnd() * g.city.vents.length)];
    one(g, "steam", v.x + (g.rnd() - 0.5) * 10, v.y, 0, (g.rnd() - 0.3) * 14, 0, 26 + g.rnd() * 16, 2.4, 6 + g.rnd() * 5, "#FFF4E8");
  }
  /* Spray from Sprinkler Street's hydrants. */
  if (g.rnd() < dt * 20) {
    const s = g.city.sprinklers[Math.floor(g.rnd() * g.city.sprinklers.length)];
    if (Math.hypot(s.x - player.x, s.y - player.y) < 700) one(g, "water", s.x, s.y - 30, 8, (g.rnd() - 0.5) * 120, (g.rnd() - 0.5) * 50, 120 + g.rnd() * 60, 0.7, 2.4, g.rnd() < 0.5 ? WATER : "#FFF8EE");
  }
  /* Rainbow sprinkles behind anyone dashing, more on Rainbow Street. */
  for (const a of g.actors)
    if (a.dash > 0 && Math.hypot(a.vx, a.vy) > 60 && g.rnd() < dt * 30) one(g, "sprinkle", a.x - a.face * 8, a.y - 4, 6, -a.vx * 0.1, -a.vy * 0.1, 20, 0.7, 3, FLAVOURS[Math.floor(g.rnd() * 4)]);
  /* Sprinkle dash lasts longer on Rainbow Street. */
  if (player.dash > 0 && pathThemeAt(g, player.x, player.y) === "rainbow") player.dash += dt * 0.5;

  /* Which street the player is on, for the card that names it. */
  g.placeT -= realDt;
  if (g.placeT <= 0 && (playing || g.phase === "ready")) {
    g.placeT = 0.25;
    const here = placeAt(g.city, player.x, player.y, !g.place);
    if (here && here !== g.place) {
      g.place = here;
      if (!g.stats.places.includes(here.name)) g.stats.places.push(here.name);
      g.events.push({ k: "place", path: here });
    }
  }

  /* The celebration keeps giving hearts, and fireworks after dark. */
  if (g.handsAt && mid) {
    if (g.rnd() < dt * 5) burst(g, "heart", mid.x + (g.rnd() - 0.5) * 30, mid.y - 46, 1, ["#FF7AB0", "#FF5C8A", "#FFB3CF"], 30, 70, 5 + g.rnd() * 4, 2);
    for (const a of [loser!, winner!]) if (a.stains.length && g.rnd() < dt * 2.5) a.stains.shift();
    if (g.t >= g.nextFirework && g.t - g.handsAt < 9) {
      g.nextFirework = g.t + (g.reduced ? 1.2 : 0.55 + g.rnd() * 0.4);
      const x = mid.x + (g.rnd() - 0.5) * 260;
      if (g.sky === "day") burst(g, "confetti", x, mid.y - 20, 18, ["#FF7AB0", "#FFC857", "#62D6A5", "#B794FF", "#8BB8E8"], 160, 300, 3, 1.4);
      else one(g, "rocket", x, mid.y + 10, 0, 0, 0, 300 + g.rnd() * 80, 0.75 + g.rnd() * 0.25, 2.4, ["#FF7AB0", "#FFC857", "#62D6A5", "#B794FF", "#8BB8E8"][Math.floor(g.rnd() * 5)]);
      g.events.push({ k: "firework" });
    }
    if (g.t - g.handsAt > 6 && g.phase === "makeup") {
      g.phase = "done";
      g.phaseT = 0;
    }
  }

  /* Particles, texts and decals age, in place (no new arrays each step). */
  let fw = 0;
  const born: Fx[] = [];
  for (const f of g.fx) {
    f.life -= realDt;
    f.x += f.vx * realDt;
    f.y += f.vy * realDt;
    f.z += f.vz * realDt;
    switch (f.kind) {
      case "heart":
      case "steam":
      case "dust":
        f.vx *= 0.98;
        f.vz *= 0.995;
        break;
      case "rocket":
        if (f.life <= 0)
          for (let i = 0; i < (g.reduced ? 14 : 30); i++) {
            const a = (i / 30) * Math.PI * 2;
            born.push({ kind: "spark", x: f.x, y: f.y, z: f.z, vx: Math.cos(a) * 120, vy: Math.sin(a) * 50, vz: Math.sin(a) * 90 + 40, life: 1, max: 1, size: 2.2, color: f.color, rot: 0 });
          }
        break;
      case "confetti":
      case "feather":
      case "leaf":
      case "petal":
        f.vz -= 220 * realDt;
        f.vx *= 0.97;
        f.vy *= 0.97;
        if (f.z < 0) {
          f.z = 0;
          f.vz = 0;
          f.vx = f.vy = 0;
        }
        break;
      case "drip":
      case "glint":
      case "ring":
        break;
      case "spark":
        f.vz -= 120 * realDt;
        break;
      default:
        f.vz -= 420 * realDt;
        if (f.z < 0) {
          f.z = 0;
          f.vz *= -0.3;
          f.vx *= 0.6;
          f.vy *= 0.6;
        }
    }
    f.rot += realDt * 5;
    if (f.life > 0) g.fx[fw++] = f;
  }
  g.fx.length = fw;
  for (const b of born) if (g.fx.length < FX_CAP) g.fx.push(b);
  let tw = 0;
  for (const t of g.texts) {
    t.t += realDt;
    if (t.t < t.life) g.texts[tw++] = t;
  }
  g.texts.length = tw;
  let dw = 0;
  for (const d of g.decals) {
    d.life -= realDt;
    if (d.life > 0) g.decals[dw++] = d;
  }
  g.decals.length = dw;
}

/** Minions: run at the other side's leader, throw little scoops, go home. */
function runMinion(g: Game, a: Actor, dt: number, playing: boolean) {
  if (!playing) {
    /* The round is ending: stop where they are and watch. */
    move(g, a, 0, 0, 0, dt);
    return;
  }
  a.life -= dt;
  const foe = leaderOf(g, other(a.team));
  if (a.life <= 0 && !a.leaving) {
    a.leaving = true;
    say(g, a.x, a.y - 30, "Bye!", "#FFF4E8", 11);
  }
  if (a.leaving) {
    /* Wave and run off the way they came, then gone in a puff. */
    const d = Math.hypot(a.x - foe.x, a.y - foe.y) || 1;
    move(g, a, (a.x - foe.x) / d, (a.y - foe.y) / d, TUNE.minionSpeed, dt);
    if (a.life < -1.3 && a.life + dt >= -1.3) burst(g, "confetti", a.x, a.y - 10, 8, [a.hat ?? "#FFC857", "#FFF4E8"], 120, 140, 2.6, 0.8);
    return;
  }
  if (a.stun > 0 || a.trapped > 0) {
    move(g, a, 0, 0, 0, dt);
    return;
  }
  /* Spread round the foe, each at its own angle, a throw away. */
  const ang = (a.slot / TUNE.armySize) * Math.PI * 2 + g.t * 0.3;
  const spot = { x: foe.x + Math.cos(ang) * 200, y: foe.y + Math.sin(ang) * 150 };
  if (!a.ai) a.ai = newAi();
  const dir = steer(g, a, spot, dt);
  move(g, a, dir.x, dir.y, speedOf(g, a), dt);
  if (a.cooldown <= 0) {
    const dFoe = Math.hypot(foe.x - a.x, foe.y - a.y);
    if (dFoe < TUNE.mini.range && clearLine(g.city, a, foe)) throwFrom(g, a, interceptAngle(a, foe, TUNE.mini.speed, 0.6) + (g.rnd() - 0.5) * 0.35);
    else a.cooldown = 0.3;
  }
}

/** The bars, as numbers the page can read out. Exact: the same numbers
    the rules use, never smoothed. */
export function bars(g: Game) {
  const p = playerOf(g);
  const r = rivalOf(g);
  return { player: p.hp, rival: r.hp, max: TUNE.maxHp, special: p.special };
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
  if (s.armies >= 1) out.push(g.playerTeam === "dog" ? "Called the pack" : "Called the crew");
  if (s.places.length >= 8) out.push("City explorer");
  if (g.winner === g.playerTeam && playerOf(g).hp >= 70) out.push("Barely sticky");
  return out;
}
