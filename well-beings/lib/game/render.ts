/**
 * Draws a game of Scoops & Snowballs onto a canvas, sixty times a second.
 *
 * Fast means measured (AGENTS.md), and on a phone slowed 4x a city drawn
 * shape by shape every frame would not keep up. So:
 *
 *   - Everything that never moves (streets, park, river, every building,
 *     each street's paint) is drawn once into 384-pixel tiles and kept; a
 *     frame copies the few tiles in view. Tiles are made at most one per
 *     frame while walking, nearest first, and the ring just outside the
 *     view is made ahead, so walking never waits on one.
 *   - Buildings fill their own footprint, roof above and front wall below,
 *     the way classic top-down games draw them, so no building ever hides
 *     a character in the street, and they can live in the tiles.
 *   - Trees, lamps, carts and the like are small cached pictures, drawn in
 *     order of depth with the characters, so walking behind a tree looks
 *     right. The list they are sorted in is reused, not rebuilt: a frame
 *     makes no new objects for it (a new array of closures every frame was
 *     the largest source of garbage, and garbage is what stutters).
 *   - Things move between the rules' steps: each is drawn where it was,
 *     plus `alpha` of the way to where it is (the screen passes `alpha`).
 *   - Night and sunset are dark or warm in their palettes, and light is
 *     only ever added, in small glows: nothing is laid over the whole frame
 *     but a brief flash or the cream of a pie.
 *   - The canvas never goes above 1.5x the CSS pixels on a phone (2x on a
 *     bigger screen), and the tiles never above 1.75x.
 */
import {
  AVENUES,
  AW,
  BH,
  BW,
  COLS,
  RIVER_W,
  ROWS,
  SH,
  SIDEWALK,
  STREETS,
  WORLD_H,
  WORLD_W,
  avX,
  blockX,
  blockY,
  leaderOf,
  playerOf,
  stY,
  type Actor,
  type Building,
  type Cart,
  type Circle,
  type Game,
  type PowerKind,
  type Proj,
  type Pt,
  type Rect,
  type Sky,
} from "./engine";
import {
  CAKE_COLOURS,
  CREAM,
  INK,
  LEAF,
  LILAC,
  PEACH,
  PINK,
  RAINBOW,
  SKY,
  SUN,
  drawBalloon,
  drawBlossomTree,
  drawBubble,
  drawButterfly,
  drawCart,
  drawCone,
  drawCritter,
  drawCupcake,
  drawGull,
  drawHeart,
  drawHydrant,
  drawLamp,
  drawLantern,
  drawPaw,
  drawPie,
  drawPigeon,
  drawPowerIcon,
  drawRainbow,
  drawSnowball,
  drawTable,
  drawTaxi,
  drawTree,
  drawUmbrella,
  mix,
  shade,
  star,
} from "./art";

type C = CanvasRenderingContext2D;
const CHUNK = 384;

interface Palette {
  asphalt: string;
  sidewalk: string;
  curb: string;
  line: string;
  zebra: string;
  grass: string;
  grass2: string;
  path: string;
  pond: string;
  pondRim: string;
  plaza: string;
  plazaLine: string;
  water: string;
  edge: string;
  edgeWin: string;
  shadow: string;
  plank: string;
  /** What faces and roofs are mixed toward, and how much. */
  tint: [string, number, number];
}

const DAY: Palette = {
  asphalt: "#5B5470",
  sidewalk: "#D3C8DD",
  curb: "#A698B6",
  line: "#FFD36E",
  zebra: "#F4EEF9",
  grass: "#86D49A",
  grass2: "#74C389",
  path: "#EBD8B5",
  pond: "#6CC3EE",
  pondRim: "#4FA3D6",
  plaza: "#E9D9C8",
  plazaLine: "#D8C4B0",
  water: "#5DB7E6",
  edge: "#7D6E96",
  edgeWin: "#A99BC0",
  shadow: "rgba(42,22,54,0.18)",
  plank: "#C99A6E",
  tint: ["#000000", 0, 0],
};
/* Sunset, the hour the app is named for: the city warmed toward peach,
   the river and the pond holding the sky's colour. */
const SUNSET: Palette = {
  asphalt: "#5E4868",
  sidewalk: "#E6C2C4",
  curb: "#B98FA3",
  line: "#FFD36E",
  zebra: "#FCE3DC",
  grass: "#9BC889",
  grass2: "#86B97A",
  path: "#F2C9A6",
  pond: "#F3A98C",
  pondRim: "#D98A86",
  plaza: "#F0C9B8",
  plazaLine: "#DDB0A2",
  water: "#F2A07E",
  edge: "#7A5878",
  edgeWin: "#FFB98A",
  shadow: "rgba(70,22,54,0.22)",
  plank: "#C98A68",
  tint: ["#FF9F80", 0.2, 0.32],
};
/* Night was first drawn much darker and read as murky, not as a city at
   night: everything here is lifted, and light is added in glows, so the
   colours of the buildings still show. */
const NIGHT: Palette = {
  asphalt: "#2E2448",
  sidewalk: "#4A3C70",
  curb: "#382C5A",
  line: "#D9AE62",
  zebra: "#8579AA",
  grass: "#3A6E64",
  grass2: "#336158",
  path: "#6A5C86",
  pond: "#244A82",
  pondRim: "#1C3D6E",
  plaza: "#584874",
  plazaLine: "#4C3E68",
  water: "#22407A",
  edge: "#241A3E",
  edgeWin: "#4A3870",
  shadow: "rgba(8,3,20,0.3)",
  plank: "#5A4468",
  /* Night mixes toward the app's plum midnight, not toward black: mixed
     toward black, the yellow and peach roofs came out olive. */
  tint: ["#2A1F48", 0.5, 0.68],
};

/* Facade colours, day; night darkens them. Brick, cream, peach, lilac,
   sky, mint, sun and rose: a colourful city, still from the dawn palette. */
const TONES = ["#D9776A", "#F2D9B5", "#FFB59A", "#C3AEEA", "#9EC3EE", "#9FDDBF", "#FFD98A", "#E9A0BE"];
const BROWNSTONE = ["#A86A55", "#9A5E4E", "#B8775F"];
const GLASS = ["#8FC3EC", "#A7B7EE", "#93D6D9"];
const LANTERNS = [PINK, SUN, PEACH, "#E8677E", LILAC];
const SHOWS = ["THE SNOW SHOW", "SCOOPS!", "SPRINKLES", "PAWS", "CAT TALES", "GOOD BOY"];

function mk(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

function rnd(seed: number) {
  let a = seed % 2147483647 || 1;
  return () => {
    a = (a * 16807) % 2147483647;
    return a / 2147483647;
  };
}

/* What stands up, in a reused list. `k` says which kind; `o` the thing. */
const enum K {
  Tree,
  Lamp,
  Hydrant,
  Fountain,
  Board,
  Pickup,
  Taxi,
  Pigeon,
  Cake,
  Actor,
  Cart,
  Blossom,
  Table,
  Sprinkler,
}
interface Item {
  y: number;
  k: K;
  o: unknown;
  i: number;
}

interface Marquee {
  x: number;
  y: number;
  w: number;
  h: number;
  seed: number;
}

export class Renderer {
  private ctx: C;
  private w = 1;
  private h = 1;
  private dpr = 1;
  private ps = 1;
  private base = 1;
  private chunks = new Map<string, { c: HTMLCanvasElement; used: number }>();
  private sprites = new Map<string, { c: HTMLCanvasElement; ox: number; oy: number; s: number }>();
  private glow: HTMLCanvasElement;
  private frame = 0;
  private flakes: { x: number; y: number; s: number; v: number; d: number }[] = [];
  private pal: Palette;
  private items: Item[] = [];
  private itemN = 0;
  /** The pink "just lost" part of each leader's bar above their head. */
  private chip = new Map<number, number>();
  private marquees: Marquee[] = [];
  readonly sky: Sky;
  readonly night: boolean;
  cam = { x: 0, y: 0, z: 1 };
  private camReady = false;
  private punch = 0;
  font = "Fredoka, system-ui, sans-serif";

  constructor(
    private canvas: HTMLCanvasElement,
    sky: Sky,
    private reduced: boolean,
  ) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.sky = sky;
    this.night = sky === "night";
    this.pal = sky === "night" ? NIGHT : sky === "sunset" ? SUNSET : DAY;
    this.glow = mk(128, 128);
    const g = this.glow.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.65)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const n = reduced ? 26 : 64;
    for (let i = 0; i < n; i++) this.flakes.push({ x: Math.random(), y: Math.random(), s: 0.8 + Math.random() * 1.8, v: 14 + Math.random() * 26, d: Math.random() * 6 });
  }

  /** The canvas's CSS size and the screen's pixel ratio. */
  private rawDpr = 1;
  private low = false;
  /** Whether the canvas is drawn at its lower resolution (see setLowRes). */
  get lowRes() {
    return this.low;
  }
  /** Dynamic resolution: a phone that cannot keep up draws the canvas at
   *  1x instead of 1.5x, 0.33 million pixels a frame instead of 0.74 on a
   *  390-wide phone. The city's tiles are kept at their full sharpness and
   *  drawn smaller, so nothing is repainted and nothing flickers. */
  setLowRes(on: boolean) {
    if (on === this.low) return;
    this.low = on;
    this.resize(this.w, this.h, this.rawDpr);
  }

  resize(w: number, h: number, dpr: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.rawDpr = dpr || 1;
    /* 1.5x at most on a phone: a 390-wide phone at 3x is 1.3 million
       pixels a frame at 2x and 0.74 million at 1.5x, and the city, drawn
       in ink lines, looks the same. */
    const full = Math.min(this.w < 600 ? 1.5 : 2, dpr || 1);
    this.dpr = this.low ? Math.min(1, full) : full;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    /* About 440 world pixels across the short side of a phone, 620 on a
       bigger screen. */
    this.base = Math.max(0.7, Math.min(1.6, Math.min(this.w, this.h) / (this.w < 600 ? 440 : 620)));
    const ps = Math.max(1, Math.min(1.75, Math.round(full * this.base * 4) / 4));
    if (ps !== this.ps) {
      this.ps = ps;
      this.chunks.clear();
      this.sprites.clear();
    }
  }

  /** A point on screen (CSS pixels) as a point in the world. */
  toWorld(sx: number, sy: number): Pt {
    return { x: this.cam.x + (sx - this.w / 2) / this.cam.z, y: this.cam.y + (sy - this.h / 2) / this.cam.z };
  }

  /** How much of the canvas the bars cover at the top and the buttons at
   *  the bottom (CSS pixels): the camera keeps the player in the open part
   *  between them. Without this the player stood behind the Throw button
   *  in the bottom street, with the rival hidden under the pad. */
  insetTop = 0;
  insetBottom = 0;
  setInsets(top: number, bottom: number) {
    this.insetTop = Math.max(0, top);
    this.insetBottom = Math.max(0, bottom);
  }

  /** A little zoom toward the action: a special, an army arriving. */
  kick(amount = 0.05) {
    if (!this.reduced) this.punch = Math.max(this.punch, amount);
  }

  /* ── the camera ──────────────────────────────────────────────────── */

  private aim(g: Game, dt: number, alpha: number) {
    const p = playerOf(g);
    const px = p.px + (p.x - p.px) * alpha;
    const py = p.py + (p.y - p.py) * alpha;
    let tx = px + p.vx * 0.22;
    let ty = py + p.vy * 0.22 - 10;
    let tz = this.base * (g.phase === "ready" ? 0.92 : 1) * (p.giant > 0 ? 0.9 : 1);
    if (g.phase === "slowmo" || g.phase === "makeup" || g.phase === "done") {
      const a = leaderOf(g, "dog");
      const b = leaderOf(g, "cat");
      tx = (a.x + b.x) / 2;
      ty = (a.y + b.y) / 2 - 30;
      tz = this.base * (g.handsAt ? 1.32 : 1.12);
    }
    const halfW = this.w / 2 / tz;
    const halfH = this.h / 2 / tz;
    const top = this.insetTop / tz;
    const bottom = this.insetBottom / tz;
    ty -= (top - bottom) / 2;
    tx = Math.max(halfW - 120, Math.min(WORLD_W + RIVER_W * 0.75 - halfW, tx));
    ty = Math.max(halfH - 110 - top, Math.min(WORLD_H + 110 + bottom - halfH, ty));
    if (!this.camReady) {
      this.cam = { x: tx, y: ty, z: tz };
      this.camReady = true;
      return;
    }
    /* A critically damped follow: no overshoot, no lag that grows with
       the frame rate. */
    const k = 1 - Math.exp(-dt * (g.phase === "play" ? 8 : 3));
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    this.punch = Math.max(0, this.punch - dt * 0.25);
    this.cam.z += (tz * (1 + this.punch) - this.cam.z) * (1 - Math.exp(-dt * 3));
  }

  /* ── one frame ───────────────────────────────────────────────────── */

  draw(g: Game, dt: number, alpha = 1) {
    this.frame++;
    this.aim(g, dt, alpha);
    const ctx = this.ctx;
    const { w, h, dpr } = this;
    const z = this.cam.z;
    const sx = g.shake > 0 && !this.reduced ? (Math.random() - 0.5) * g.shake : 0;
    const sy = g.shake > 0 && !this.reduced ? (Math.random() - 0.5) * g.shake : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.pal.edge;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (w / 2 - this.cam.x * z + sx), dpr * (h / 2 - this.cam.y * z + sy));
    const view = { x: this.cam.x - w / 2 / z, y: this.cam.y - h / 2 / z, w: w / z, h: h / z };

    /* The tiles. */
    ctx.imageSmoothingEnabled = true;
    let made = 0;
    const c0 = Math.floor(view.x / CHUNK);
    const c1 = Math.floor((view.x + view.w) / CHUNK);
    const r0 = Math.floor(view.y / CHUNK);
    const r1 = Math.floor((view.y + view.h) / CHUNK);
    for (let cy = r0; cy <= r1; cy++)
      for (let cx = c0; cx <= c1; cx++) {
        const key = `${cx},${cy}`;
        let tile = this.chunks.get(key);
        /* One new tile a frame once the game is moving (two at the start),
           so no single frame pays for several. */
        if (!tile && made < (this.frame < 3 ? 12 : 1)) {
          tile = { c: this.paintChunk(cx * CHUNK, cy * CHUNK), used: this.frame };
          this.chunks.set(key, tile);
          made++;
        }
        if (tile) {
          tile.used = this.frame;
          /* Half a pixel of overlap hides the seam between tiles. */
          ctx.drawImage(tile.c, cx * CHUNK - 0.25, cy * CHUNK - 0.25, CHUNK + 0.5, CHUNK + 0.5);
        } else {
          ctx.fillStyle = this.pal.asphalt;
          ctx.fillRect(cx * CHUNK, cy * CHUNK, CHUNK, CHUNK);
        }
      }
    /* One tile ahead every other frame, in the ring just outside the view. */
    if (!made && this.frame % 2 === 0) this.prefetch(c0 - 1, c1 + 1, r0 - 1, r1 + 1);
    this.evict();

    const t = g.t;
    const inView = (x: number, y: number, m = 80) => x > view.x - m && x < view.x + view.w + m && y > view.y - m && y < view.y + view.h + m;
    const ix = (o: { x: number; px: number }) => o.px + (o.x - o.px) * alpha;
    const iy = (o: { y: number; py: number }) => o.py + (o.y - o.py) * alpha;

    /* The river moves. */
    if (view.x + view.w > WORLD_W) {
      ctx.strokeStyle = this.night ? "rgba(255,217,138,0.28)" : "rgba(255,248,238,0.55)";
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 40; i++) {
        const yy = ((i * 61) % (WORLD_H + 200)) - 100;
        if (yy < view.y - 10 || yy > view.y + view.h + 10) continue;
        const xx = WORLD_W + 20 + ((i * 53 + t * 18) % (RIVER_W - 40));
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.quadraticCurveTo(xx + 8, yy - 3, xx + 16, yy);
        ctx.stroke();
      }
    }

    /* Day: the shadows of clouds drift over the streets. */
    if (this.sky === "day") {
      ctx.globalAlpha = 0.07;
      for (let i = 0; i < 3; i++) {
        const cx = ((t * 10 + i * 1100) % (WORLD_W + 1400)) - 700;
        const cy = 300 + i * 520;
        ctx.drawImage(this.glow, cx - 260, cy - 160, 520, 320);
      }
      ctx.globalAlpha = 1;
    }

    /* Sprinkler Street's spray, on the ground. */
    for (const s of g.city.sprinklers) {
      if (!inView(s.x, s.y, 60)) continue;
      ctx.globalAlpha = 0.18 + 0.06 * Math.sin(t * 4 + s.x);
      ctx.fillStyle = this.night ? "#6FA6E8" : "#BFE6FF";
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* Splats, puddles and paw prints on the ground, fading. */
    for (const d of g.decals) {
      if (!inView(d.x, d.y)) continue;
      const fade = Math.min(1, d.life / 2);
      if (d.kind === "paw") {
        ctx.globalAlpha = fade * 0.55;
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot + Math.PI / 2);
        drawPaw(ctx, 0, 0, d.r / 5, d.color);
        ctx.restore();
        continue;
      }
      ctx.globalAlpha = fade * (d.kind === "puddle" ? 0.45 : 0.9);
      ctx.fillStyle = d.color;
      const r = rnd(d.seed);
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r, d.r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = r() * Math.PI * 2;
        const rr = d.r * (0.9 + r() * 0.6);
        ctx.beginPath();
        ctx.arc(d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr * 0.62, d.r * (0.14 + r() * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    /* Shadows under everyone and everything in the air. */
    ctx.fillStyle = this.pal.shadow;
    for (const a of g.actors) {
      const ax = ix(a);
      const ay = iy(a);
      if (!inView(ax, ay)) continue;
      ctx.beginPath();
      ctx.ellipse(ax, ay + 1, a.r * 0.95, a.r * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of g.projs) {
      const px = ix(p);
      const py = iy(p);
      if (!inView(px, py)) continue;
      const pz = p.pz + (p.z - p.pz) * alpha;
      const s = Math.max(0.35, 1 - pz / 320);
      ctx.beginPath();
      ctx.ellipse(px, py + 2, p.r * s, p.r * 0.45 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    /* The finale's rainbow stands behind the two of them. */
    const finale = g.handsAt > 0;
    const dog = leaderOf(g, "dog");
    const cat = leaderOf(g, "cat");
    const mid = { x: (dog.x + cat.x) / 2, y: (dog.y + cat.y) / 2 };
    if (finale) {
      const k = (t - g.handsAt) / 1.4;
      drawRainbow(ctx, mid.x, mid.y - 14, 118, 8.5, this.reduced ? 1 : k, this.reduced ? Math.min(0.9, k) : 0.88);
    }

    /* Everything that stands up, nearest last. */
    this.itemN = 0;
    const city = g.city;
    for (let i = 0; i < city.trees.length; i++) if (inView(city.trees[i].x, city.trees[i].y, 60)) this.add(city.trees[i].y, K.Tree, city.trees[i], i);
    for (let i = 0; i < city.blossoms.length; i++) if (inView(city.blossoms[i].x, city.blossoms[i].y, 60)) this.add(city.blossoms[i].y, K.Blossom, city.blossoms[i], i);
    for (let i = 0; i < city.lamps.length; i++) if (inView(city.lamps[i].x, city.lamps[i].y, 60)) this.add(city.lamps[i].y, K.Lamp, city.lamps[i], i);
    for (let i = 0; i < city.hydrants.length; i++) if (inView(city.hydrants[i].x, city.hydrants[i].y)) this.add(city.hydrants[i].y, K.Hydrant, city.hydrants[i], i);
    for (let i = 0; i < city.carts.length; i++) if (inView(city.carts[i].x, city.carts[i].y)) this.add(city.carts[i].y + city.carts[i].h, K.Cart, city.carts[i], i);
    for (let i = 0; i < city.tables.length; i++) if (inView(city.tables[i].x, city.tables[i].y)) this.add(city.tables[i].y, K.Table, city.tables[i], i);
    for (let i = 0; i < city.sprinklers.length; i++) if (inView(city.sprinklers[i].x, city.sprinklers[i].y, 90)) this.add(city.sprinklers[i].y - 34, K.Sprinkler, city.sprinklers[i], i);
    const f = city.fountain;
    if (inView(f.x, f.y, 100)) this.add(f.y + 10, K.Fountain, f, 0);
    const pl = city.plaza;
    if (inView(pl.x + pl.w / 2, pl.y, 200)) for (let i = 0; i < 3; i++) this.add(pl.y + 10, K.Board, pl, i);
    for (const p of g.pickups) if (inView(p.x, p.y)) this.add(p.y, K.Pickup, p, 0);
    for (const c of g.taxis) if (inView(c.x, c.y)) this.add(c.y + 8, K.Taxi, c, 0);
    for (const b of g.pigeons) if (inView(b.x, b.y)) this.add(b.y, K.Pigeon, b, 0);
    for (const c of g.cakes) if (t >= c.at && inView(c.x, c.y)) this.add(c.y, K.Cake, c, 0);
    for (const a of g.actors) {
      const ay = iy(a);
      if (inView(ix(a), ay)) this.add(ay, K.Actor, a, 0);
    }
    const list = this.items;
    const n = this.itemN;
    /* Insertion sort: the list is nearly in order frame to frame. */
    for (let i = 1; i < n; i++) {
      const it = list[i];
      let j = i - 1;
      while (j >= 0 && list[j].y > it.y) {
        list[j + 1] = list[j];
        j--;
      }
      list[j + 1] = it;
    }
    for (let i = 0; i < n; i++) this.drawItem(g, list[i], t, alpha);

    /* The player, faintly, through anything standing in front of them. */
    if (!finale) {
      ctx.globalAlpha = 0.3;
      this.actor(g, playerOf(g), alpha, true);
      ctx.globalAlpha = 1;
    }

    /* Overhead: Lantern Avenue's lanterns, Bleecker's string lights, the
       marquee bulbs on Broadway's theatres. */
    this.overhead(g, view, t);

    /* In the air. */
    for (const p of g.projs) {
      const px = ix(p);
      const pz = p.pz + (p.z - p.pz) * alpha;
      const py = iy(p) - pz;
      if (!inView(px, py)) continue;
      ctx.save();
      ctx.translate(px, py);
      this.proj(p, t);
      ctx.restore();
    }
    this.particles(g, inView);
    this.ambient(g, view, t);

    if (finale) this.party(g, mid, t);

    /* The bars over the two leaders' heads, exact. */
    for (const a of [dog, cat]) if (!finale && inView(ix(a), iy(a))) this.overBar(a, ix(a), iy(a), dt);

    /* Words that pop up: splats, numbers off the bar, cheers. */
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    for (const tx of g.texts) {
      if (!inView(tx.x, tx.y)) continue;
      const k = tx.t / tx.life;
      const numeric = tx.kind !== "word";
      const pop = this.reduced ? 1 : Math.min(1, tx.t / 0.1) * (1 + (numeric ? 0.35 : 0.25) * Math.max(0, 1 - tx.t / 0.2));
      ctx.save();
      /* Numbers jump up and stop; words drift. */
      const rise = numeric ? 18 * Math.min(1, k * 3) : k * 26;
      ctx.translate(tx.x, tx.y - rise);
      ctx.scale(pop, pop);
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      ctx.font = `${numeric ? 700 : 600} ${tx.size}px ${this.font}`;
      ctx.lineWidth = numeric ? 3.6 : 4;
      ctx.strokeStyle = INK;
      ctx.strokeText(tx.text, 0, 0);
      ctx.fillStyle = tx.color;
      ctx.fillText(tx.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (this.sky !== "day") this.lights(g, view, t);

    /* Screen space from here. */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.night) this.snow(dt);
    const me = playerOf(g);
    if (!this.reduced && me.dash > 0 && Math.hypot(me.vx, me.vy) > 120 && g.phase === "play") this.speedLines(me);
    if (g.phase === "play") this.pointers(g, view);
    if (g.pieSplat > 0) this.cream(g.pieSplat);
    if (g.flash > 0 && !this.reduced) {
      ctx.fillStyle = `rgba(255,248,238,${Math.min(0.22, g.flash * 1.6)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private add(y: number, k: K, o: unknown, i: number) {
    let it = this.items[this.itemN];
    if (!it) {
      it = { y, k, o, i };
      this.items[this.itemN] = it;
    } else {
      it.y = y;
      it.k = k;
      it.o = o;
      it.i = i;
    }
    this.itemN++;
  }

  private drawItem(g: Game, it: Item, t: number, alpha: number) {
    const ctx = this.ctx;
    switch (it.k) {
      case K.Tree: {
        const tr = it.o as Circle & { kind: number };
        this.sprite(`tree${tr.kind}-${Math.round(tr.r)}`, tr.x, tr.y, 70, 80, (c) => drawTree(c, tr.kind, tr.r, this.night));
        return;
      }
      case K.Blossom: {
        const b = it.o as Circle;
        this.sprite("blossom", b.x, b.y, 44, 46, (c) => drawBlossomTree(c, this.night));
        return;
      }
      case K.Lamp: {
        const l = it.o as Pt;
        this.sprite("lamp", l.x, l.y, 16, 56, (c) => drawLamp(c, this.sky !== "day"));
        return;
      }
      case K.Hydrant: {
        const hy = it.o as Pt;
        this.sprite("hydrant", hy.x, hy.y, 18, 18, (c) => drawHydrant(c));
        return;
      }
      case K.Cart: {
        const c = it.o as Cart;
        this.sprite(`cart${c.kind}`, c.x + c.w / 2, c.y + c.h, 40, 50, (cx) => drawCart(cx, c.kind, c.w, c.h, this.night, this.font));
        return;
      }
      case K.Table: {
        const tb = it.o as Circle;
        this.sprite(`table${it.i % 3}`, tb.x, tb.y + 4, 28, 32, (c) => drawTable(c, [PINK, LEAF, SUN][it.i % 3], this.night));
        return;
      }
      case K.Sprinkler: {
        const s = it.o as Circle;
        this.sprite("hydrant", s.x, s.y - 34, 18, 18, (c) => drawHydrant(c));
        /* Two arcs of spray, catching the light. */
        ctx.save();
        ctx.translate(s.x, s.y - 44);
        ctx.strokeStyle = this.night ? "rgba(185,220,255,0.7)" : "rgba(255,248,238,0.85)";
        ctx.lineWidth = 2;
        for (const side of [-1, 1]) {
          for (let i = 0; i < 3; i++) {
            const reach = 26 + i * 9 + Math.sin(t * 6 + i) * 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(side * reach * 0.5, -18 - i * 4, side * reach, 34 + i * 6);
            ctx.stroke();
          }
        }
        ctx.restore();
        return;
      }
      case K.Fountain: {
        const fo = it.o as Circle;
        this.fountain(fo.x, fo.y, fo.r, t);
        return;
      }
      case K.Board: {
        const pl = it.o as Rect;
        this.billboard(pl.x + 54 + it.i * 86, pl.y + 10, ["SCOOPS", "SNOW DAY", "HELLO CITY"][it.i], it.i, t);
        return;
      }
      case K.Pickup: {
        const p = it.o as { x: number; y: number; kind: PowerKind; t: number };
        this.pickup(p.x, p.y, p.kind, p.t);
        return;
      }
      case K.Taxi: {
        const c = it.o as Game["taxis"][number];
        const L = g.city.lanes[c.lane];
        ctx.save();
        ctx.translate(c.px + (c.x - c.px) * alpha, c.py + (c.y - c.py) * alpha);
        drawTaxi(ctx, L.vertical, L.dir, this.night, c.honk > 1.8);
        ctx.restore();
        return;
      }
      case K.Pigeon: {
        const b = it.o as Game["pigeons"][number];
        ctx.save();
        ctx.translate(b.x, b.y - b.z);
        ctx.scale(b.vx < 0 ? -1 : 1, 1);
        drawPigeon(ctx, t + b.home.x, b.flying > 0, b.peck < 0);
        ctx.restore();
        return;
      }
      case K.Cake: {
        const c = it.o as Game["cakes"][number];
        const k = Math.min(1, (t - c.at) / 0.45);
        const s = this.reduced ? 1 : 1 + Math.sin(k * Math.PI) * 0.35 * (1 - k) - (1 - k) * (1 - k) * 0.9;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(Math.max(0.05, s), Math.max(0.05, s));
        drawCupcake(ctx, CAKE_COLOURS[c.c], 1);
        if (k >= 1) {
          /* A candle with a flame that flickers. */
          ctx.fillStyle = CREAM;
          ctx.fillRect(-1, -32, 2, 7);
          ctx.fillStyle = SUN;
          ctx.beginPath();
          ctx.ellipse(0, -35, 1.8, 3 + Math.sin(t * 20 + c.x) * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        return;
      }
      case K.Actor:
        this.actor(g, it.o as Actor, alpha);
        return;
    }
  }

  /* ── pieces of a frame ───────────────────────────────────────────── */

  private proj(p: Proj, t: number) {
    const ctx = this.ctx;
    switch (p.kind) {
      case "scoop":
      case "mini":
        drawCone(ctx, p.color, p.spin, p.kind === "mini" ? 0.7 : p.big ? 1.5 : 1);
        return;
      case "rain":
        drawCone(ctx, p.color, Math.PI + Math.sin(p.spin) * 0.3, 1.15);
        return;
      case "pie":
        drawPie(ctx, p.spin, p.big ? 1.5 : 1);
        return;
      case "balloon":
        drawBalloon(ctx, p.color, t + p.id, p.big ? 1.5 : 1.05);
        return;
      case "bubble":
        drawBubble(ctx, p.r, t + p.id);
        return;
      default:
        drawSnowball(ctx, p.r, p.spin);
    }
  }

  private actor(g: Game, a: Actor, alpha: number, ghost = false) {
    const ctx = this.ctx;
    const party = g.handsAt > 0;
    const x = a.px + (a.x - a.px) * alpha;
    const y = a.py + (a.y - a.py) * alpha;
    ctx.save();
    ctx.translate(x, y);
    if (!ghost && a.player && g.phase === "play") {
      /* A sun ring under you, so you can always find yourself. */
      ctx.strokeStyle = SUN;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 1, a.r + 5, (a.r + 5) * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (!ghost && a.minion) {
      /* The army wears its side's colour underfoot. */
      ctx.strokeStyle = a.team === g.playerTeam ? LEAF : PINK;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(0, 1, a.r + 3, (a.r + 3) * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const big = a.giant > 0 ? 1.5 * (a.giant < 1 && !this.reduced ? 0.9 + 0.1 * Math.sin(g.t * 30) : 1) : 1;
    const float = a.trapped > 0 ? 10 + Math.sin(g.t * 5) * 2 : 0;
    if (float) ctx.translate(0, -float);
    drawCritter(ctx, a.look, {
      t: g.t,
      walk: a.walk,
      moving: Math.hypot(a.vx, a.vy) > 18,
      face: a.face,
      hitT: a.hitT,
      throwT: a.throwT,
      sit: a.sit,
      stains: a.stains,
      happy: party || (g.phase === "makeup" && !a.leader),
      hold: party && a.leader,
      hop: a.leader ? 0 : a.hop,
      chilly: a.slow > 0,
      scale: a.scale * big,
      seed: a.id * 1.3,
      hat: a.hat,
      pied: a.pied > 0,
    });
    if (!ghost) {
      if (a.trapped > 0) {
        ctx.save();
        ctx.translate(0, -a.r * 1.2 * a.scale);
        drawBubble(ctx, a.r * 1.9, g.t);
        ctx.restore();
      }
      if (a.shield > 0) {
        ctx.save();
        ctx.translate(a.face * 4, -50 * big);
        ctx.globalAlpha = a.shield < 1 ? 0.5 + 0.5 * Math.sin(g.t * 20) : 1;
        drawUmbrella(ctx, g.t);
        ctx.restore();
      }
      if (!a.leader && !a.minion && !a.found && g.phase === "play") this.bubble(0, -48, "?", g.t + a.id);
      if (a.sit && !party) {
        ctx.font = `600 12px ${this.font}`;
        ctx.textAlign = "center";
        ctx.fillStyle = CREAM;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        const s = g.t % 0.8 < 0.4 ? "ha ha" : "hee hee";
        ctx.strokeText(s, 0, -52);
        ctx.fillText(s, 0, -52);
      }
    }
    ctx.restore();
  }

  /** A slim bar over a leader's head: the same number as the big bar,
      with the part just lost showing pink for a moment. */
  private overBar(a: Actor, x: number, y: number, dt: number) {
    const ctx = this.ctx;
    const k = Math.max(0, a.hp / a.maxHp);
    let chip = this.chip.get(a.id) ?? k;
    chip = chip > k ? Math.max(k, chip - dt * 0.6) : k;
    this.chip.set(a.id, chip);
    const W = 36;
    const top = y - (a.giant > 0 ? 80 : 60) - (a.trapped > 0 ? 12 : 0);
    ctx.save();
    ctx.translate(x - W / 2, top);
    ctx.fillStyle = "rgba(17,9,33,0.75)";
    ctx.beginPath();
    ctx.roundRect(-2, -2, W + 4, 9, 4);
    ctx.fill();
    ctx.fillStyle = "#FFB3CF";
    ctx.fillRect(0, 0, W * chip, 5);
    ctx.fillStyle = k > 0.6 ? LEAF : k > 0.3 ? SUN : PINK;
    ctx.fillRect(0, 0, W * k, 5);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo((W * i) / 4, 0);
      ctx.lineTo((W * i) / 4, 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** A little speech bubble ("?" over a pal still to be found), drawn once
   *  and then stamped: drawing it fresh, with its text, cost more than all
   *  four pals it sat on. */
  private bubble(x: number, y: number, text: string, t: number) {
    const b = this.reduced ? 0 : Math.sin(t * 3) * 2;
    this.sprite(`bubble:${text}`, x, y + b + 9, 22, 22, (ctx) => {
      ctx.translate(0, -9);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.roundRect(-8 + 2, -10 + 2, 16, 16, 6);
      ctx.fill();
      ctx.fillStyle = CREAM;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-8, -10, 16, 16, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = `700 12px ${this.font}`;
      ctx.textAlign = "center";
      ctx.fillText(text, 0, 2.5);
    });
  }

  private pickup(x: number, y: number, kind: PowerKind, t: number) {
    const ctx = this.ctx;
    const bob = this.reduced ? 0 : Math.sin(t * 3) * 3;
    const pop = Math.min(1, t / 0.35);
    const special = kind === "army" || kind === "giant";
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = special ? 0.75 : 0.55;
    ctx.drawImage(this.glow, -28, -38, 56, 56);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = special ? PINK : SUN;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -t * 20;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.translate(0, -16 + bob);
    ctx.scale(pop, pop);
    drawPowerIcon(ctx, kind, t);
    ctx.restore();
  }

  private fountain(x: number, y: number, r: number, t: number) {
    const ctx = this.ctx;
    this.sprite("fountain", x, y, r * 2 + 16, r + 30, (c) => {
      c.beginPath();
      c.ellipse(0, -8, r, r * 0.55, 0, 0, Math.PI * 2);
      c.fillStyle = this.night ? "#5A4D72" : "#CFC3DC";
      c.fill();
      c.lineWidth = 2.2;
      c.strokeStyle = INK;
      c.stroke();
      c.beginPath();
      c.ellipse(0, -10, r - 6, (r - 6) * 0.5, 0, 0, Math.PI * 2);
      c.fillStyle = this.night ? "#2C5A9A" : this.sky === "sunset" ? "#F3A98C" : "#7ECDF2";
      c.fill();
      c.beginPath();
      c.roundRect(-4, -26, 8, 16, 3);
      c.fillStyle = this.night ? "#6D6390" : "#E8E0F0";
      c.fill();
      c.stroke();
    });
    ctx.save();
    ctx.translate(x, y - 24);
    ctx.strokeStyle = this.night ? "rgba(185,220,255,0.75)" : "rgba(255,248,238,0.9)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + t * 0.6;
      const dx = Math.cos(a) * (r - 10);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(dx * 0.4, -16 - Math.sin(t * 4 + i) * 2, dx, 12 + Math.sin(a) * 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  private billboard(x: number, y: number, label: string, i: number, t: number) {
    const ctx = this.ctx;
    this.sprite(`board${i}`, x, y, 84, 70, (c) => {
      c.fillStyle = INK;
      c.fillRect(-26, -26, 3, 26);
      c.fillRect(23, -26, 3, 26);
      const col = [PINK, "#8BB8E8", SUN][i];
      c.beginPath();
      c.roundRect(-38, -58, 76, 34, 5);
      c.fillStyle = this.night ? shade(col, -0.25) : col;
      c.fill();
      c.lineWidth = 2.4;
      c.strokeStyle = INK;
      c.stroke();
      c.font = `700 11px ${this.font}`;
      c.textAlign = "center";
      c.fillStyle = INK;
      c.fillText(label, 0, -37);
    });
    if (this.sky !== "day" && !this.reduced) {
      /* Neon breathes, slowly. */
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.12 + 0.06 * Math.sin(t * 1.5 + i);
      ctx.drawImage(this.glow, x - 60, y - 80, 120, 64);
      ctx.restore();
    }
  }

  /** Strung across Lantern Avenue and Bleecker Street; bulbs on Broadway. */
  private overhead(g: Game, view: { x: number; y: number; w: number; h: number }, t: number) {
    const ctx = this.ctx;
    const lit = this.sky !== "day";
    const sway = this.reduced ? 0 : 1;
    /* Lantern Avenue (avenue 4): a string across the road every 60. */
    const lx = avX(4);
    if (lx + AW > view.x && lx - AW < view.x + view.w) {
      for (let y = 30; y < WORLD_H; y += 60) {
        if (y < view.y - 40 || y > view.y + view.h + 40) continue;
        const x0 = lx - AW / 2 - 4;
        const x1 = lx + AW / 2 + 4;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y - 30);
        ctx.quadraticCurveTo(lx, y - 14, x1, y - 30);
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const k = (i + 0.5) / 5;
          const px = x0 + (x1 - x0) * k;
          const py = y - 30 + 16 * 4 * k * (1 - k) * 0.5;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(Math.sin(t * 1.4 + i + y) * 0.08 * sway);
          drawLantern(ctx, LANTERNS[(i + y / 60) % LANTERNS.length | 0], lit);
          ctx.restore();
        }
      }
    }
    /* Bleecker Street (street 1): café lights strung from curb to curb. */
    const by = stY(1);
    if (by + SH > view.y && by - SH < view.y + view.h) {
      for (let x = 40; x < WORLD_W; x += 70) {
        if (x < view.x - 40 || x > view.x + view.w + 40) continue;
        const y0 = by - SH / 2 - 6;
        const y1 = by + SH / 2 + 6;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y0 - 30);
        ctx.quadraticCurveTo(x + 10, by - 24, x, y1 - 30);
        ctx.stroke();
        for (let i = 1; i < 7; i++) {
          const k = i / 7;
          const yy = y0 - 30 + (y1 - y0) * k;
          const xx = x + 10 * 4 * k * (1 - k) * 0.5;
          ctx.fillStyle = lit ? (Math.sin(t * 2 + i + x) > -0.6 || this.reduced ? "#FFE08A" : "#FFC857") : "#FFF4E8";
          ctx.beginPath();
          ctx.arc(xx, yy, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    /* Broadway's marquees: bulbs chasing round the sign, slowly. */
    for (const m of this.marquees) {
      if (m.x + m.w < view.x || m.x > view.x + view.w || m.y + m.h < view.y || m.y > view.y + view.h) continue;
      const step = this.reduced ? 0 : Math.floor(t * 6);
      let i = 0;
      const bulb = (x: number, y: number) => {
        const on = (i + step) % 3 === 0;
        ctx.fillStyle = on ? "#FFF6C8" : lit ? "#E3AC2C" : "#C9A24A";
        ctx.beginPath();
        ctx.arc(x, y, on ? 1.7 : 1.3, 0, Math.PI * 2);
        ctx.fill();
        i++;
      };
      for (let x = m.x + 3; x < m.x + m.w - 2; x += 6) bulb(x, m.y + 2);
      for (let x = m.x + m.w - 3; x > m.x + 2; x -= 6) bulb(x, m.y + m.h - 2);
    }
  }

  /** Little life that belongs to a place: petals, gulls, fireflies, butterflies. */
  private ambient(g: Game, view: { x: number; y: number; w: number; h: number }, t: number) {
    if (this.reduced) return;
    const ctx = this.ctx;
    /* Cherry Lane: blossom drifting down the avenue. */
    if (view.x < AW + 60) {
      ctx.fillStyle = this.night ? "#D9A6C4" : "#FFC7DA";
      for (let i = 0; i < 24; i++) {
        const x = 6 + ((i * 37 + t * (10 + (i % 4) * 4)) % (AW + 40));
        const y = view.y + ((i * 97 + t * (24 + (i % 5) * 6)) % (view.h + 40)) - 20;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 1.5 + i);
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.6, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    /* Harbor Walk: gulls, by day and at sunset. */
    if (this.sky !== "night" && view.x + view.w > avX(6) - AW) {
      for (let i = 0; i < 3; i++) {
        const cx = WORLD_W + 40 + Math.cos(t * 0.5 + i * 2.1) * 90;
        const cy = 300 + i * 420 + Math.sin(t * 0.7 + i) * 60;
        if (cy < view.y - 30 || cy > view.y + view.h + 30) continue;
        ctx.save();
        ctx.translate(cx, cy);
        drawGull(ctx, t + i);
        ctx.restore();
      }
    }
    const k = g.city.park;
    if (k.x < view.x + view.w && k.x + k.w > view.x && k.y < view.y + view.h && k.y + k.h > view.y) {
      if (this.night) {
        /* Fireflies in the park. */
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 22; i++) {
          const x = k.x + ((i * 131) % k.w) + Math.sin(t * 0.8 + i) * 20;
          const y = k.y + ((i * 211) % k.h) + Math.cos(t * 0.6 + i * 1.3) * 16;
          const a = 0.35 + 0.35 * Math.sin(t * 2.4 + i * 1.7);
          ctx.globalAlpha = Math.max(0, a);
          ctx.drawImage(this.glow, x - 8, y - 8, 16, 16);
        }
        ctx.restore();
      } else {
        /* Butterflies over the flowers. */
        for (let i = 0; i < 5; i++) {
          const x = k.x + ((i * 167) % k.w) + Math.sin(t * 0.6 + i) * 40;
          const y = k.y + ((i * 113) % k.h) + Math.cos(t * 0.5 + i * 2) * 30 - 20;
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(0.6, 0.6);
          drawButterfly(ctx, t + i, RAINBOW[i % RAINBOW.length], 1);
          ctx.restore();
        }
      }
    }
  }

  private particles(g: Game, inView: (x: number, y: number, m?: number) => boolean) {
    const ctx = this.ctx;
    for (const p of g.fx) {
      if (!inView(p.x, p.y)) continue;
      const a = Math.min(1, p.life / (p.max * 0.5));
      ctx.globalAlpha = a;
      const y = p.y - p.z;
      switch (p.kind) {
        case "heart":
          ctx.save();
          ctx.translate(p.x + Math.sin(p.life * 6 + p.rot) * 4, y);
          drawHeart(ctx, p.size * 1.6, p.color);
          ctx.restore();
          break;
        case "ring": {
          const k = 1 - p.life / p.max;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3 * (1 - k);
          ctx.beginPath();
          ctx.ellipse(p.x, y, p.size + k * 26, (p.size + k * 26) * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case "star":
          star(ctx, p.x, y, p.size * 1.4, p.color, p.rot);
          break;
        case "confetti":
        case "sprinkle":
          ctx.save();
          ctx.translate(p.x, y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size, -p.size * 0.35, p.size * 2, p.size * 0.7);
          ctx.restore();
          break;
        case "leaf":
        case "petal":
          ctx.save();
          ctx.translate(p.x, y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        case "steam":
          ctx.globalAlpha = a * 0.28;
          ctx.drawImage(this.glow, p.x - p.size * 2, y - p.size * 2, p.size * 4, p.size * 4);
          break;
        case "dust":
          ctx.globalAlpha = a * 0.4;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, y, p.size * (1.4 - a * 0.4), 0, Math.PI * 2);
          ctx.fill();
          break;
        case "glint":
          ctx.fillStyle = p.color;
          ctx.save();
          ctx.translate(p.x, y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-p.size, -0.6, p.size * 2, 1.2);
          ctx.fillRect(-0.6, -p.size, 1.2, p.size * 2);
          ctx.restore();
          break;
        case "rocket":
          ctx.fillStyle = "#FFF6C8";
          ctx.beginPath();
          ctx.arc(p.x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = a * 0.5;
          ctx.fillRect(p.x - 0.8, y, 1.6, 14);
          break;
        default:
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, y, p.size, 0, Math.PI * 2);
          ctx.fill();
          if (p.kind === "spark") {
            ctx.globalAlpha = a * 0.5;
            ctx.drawImage(this.glow, p.x - p.size * 3, y - p.size * 3, p.size * 6, p.size * 6);
          }
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Hearts, butterflies and a bubble with a heart in it. */
  private party(g: Game, mid: Pt, t: number) {
    const ctx = this.ctx;
    const since = t - g.handsAt;
    for (let i = 0; i < 9; i++) {
      const k = Math.min(1, since / 1.2);
      const a = t * 0.75 + i * 0.7;
      const r = (64 + 26 * Math.sin(t * 0.5 + i)) * k;
      const x = mid.x + Math.cos(a) * r;
      const y = mid.y - 46 + Math.sin(a) * r * 0.55 - 14 * Math.sin(t * 2 + i);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(Math.cos(a) > 0 ? -1 : 1, 1);
      drawButterfly(ctx, t + i, RAINBOW[i % RAINBOW.length], 0.95);
      ctx.restore();
    }
    /* The bubble, comic-style like Ooh's: cream paper, ink, a hard shadow. */
    const pop = this.reduced ? 1 : Math.min(1, since / 0.3) * (1 + 0.18 * Math.sin(Math.min(1, since / 0.5) * Math.PI));
    const beat = this.reduced ? 1 : 1 + 0.08 * Math.sin(t * 7);
    ctx.save();
    ctx.translate(mid.x, mid.y - 84);
    ctx.scale(pop, pop);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.roundRect(-20 + 3, -18 + 3, 40, 32, 12);
    ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-20, -18, 40, 32, 12);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, 14);
    ctx.lineTo(0, 22);
    ctx.lineTo(5, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = CREAM;
    ctx.fillRect(-4.5, 12, 9, 3);
    ctx.translate(0, -1);
    ctx.scale(beat, beat);
    drawHeart(ctx, 24, PINK);
    ctx.restore();
  }

  /**
   * Night and sunset lights. The first version laid a darkness over the
   * whole frame with a hole cut for every light; on a phone slowed 4x it
   * took the game from 19 to 13 frames a second, because it touches every
   * pixel twice. The dark is in the palette instead, and only the light is
   * added: small glows round lamps, lanterns, string lights, the plaza's
   * signs, headlights, and the two of them at the end.
   */
  private lights(g: Game, view: { x: number; y: number; w: number; h: number }, t: number) {
    const ctx = this.ctx;
    const near = (x: number, y: number, m: number) => x > view.x - m && x < view.x + view.w + m && y > view.y - m && y < view.y + view.h + m;
    const soft = this.sky === "sunset" ? 0.55 : 1;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.2 * soft;
    for (const lp of g.city.lamps) if (near(lp.x, lp.y, 90)) ctx.drawImage(this.glow, lp.x - 56, lp.y - 102, 112, 112);
    ctx.globalAlpha = 0.12 * soft;
    for (const lp of g.city.lamps) if (near(lp.x, lp.y, 90)) ctx.drawImage(this.glow, lp.x - 60, lp.y - 34, 120, 60);
    /* Lantern Avenue glows warm all the way down. */
    const lx = avX(4);
    if (near(lx, this.cam.y, AW)) {
      ctx.globalAlpha = 0.1 * soft;
      for (let y = 30; y < WORLD_H; y += 60) if (near(lx, y, 60)) ctx.drawImage(this.glow, lx - 70, y - 40, 140, 60);
    }
    ctx.globalAlpha = 0.16 * soft;
    for (const c of g.taxis) {
      if (!near(c.x, c.y, 60)) continue;
      const L = g.city.lanes[c.lane];
      const hx = c.x + (L.vertical ? 0 : L.dir * 34);
      const hy = c.y + (L.vertical ? L.dir * 34 : 0);
      ctx.drawImage(this.glow, hx - 30, hy - 30, 60, 60);
    }
    ctx.globalAlpha = 0.18;
    for (const p of g.pickups) if (near(p.x, p.y, 40)) ctx.drawImage(this.glow, p.x - 34, p.y - 46, 68, 68);
    /* Broadway's theatres, and searchlights sweeping the sky after dark. */
    ctx.globalAlpha = 0.14 * soft;
    for (const m of this.marquees) if (near(m.x, m.y, 60)) ctx.drawImage(this.glow, m.x - 10, m.y - 20, m.w + 20, m.h + 40);
    if (this.night && !this.reduced && near(avX(2), this.cam.y, 200)) {
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = "#FFF6C8";
      for (let i = 0; i < 2; i++) {
        const ox = avX(2);
        const oy = this.cam.y + view.h * 0.4;
        const a = -Math.PI / 2 + Math.sin(t * 0.4 + i * 2) * 0.6;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(a - 0.08) * 900, oy + Math.sin(a - 0.08) * 900);
        ctx.lineTo(ox + Math.cos(a + 0.08) * 900, oy + Math.sin(a + 0.08) * 900);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (g.handsAt) {
      const m = leaderOf(g, "dog");
      ctx.globalAlpha = 0.22;
      ctx.drawImage(this.glow, m.x - 150, m.y - 200, 300, 260);
    }
    ctx.restore();
  }

  private snow(dt: number) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(244,248,255,0.85)";
    for (const f of this.flakes) {
      f.y += (f.v * dt) / this.h;
      f.d += dt;
      if (f.y > 1.02) {
        f.y = -0.02;
        f.x = Math.random();
      }
      const x = f.x * this.w + Math.sin(f.d * 0.9) * 14;
      ctx.beginPath();
      ctx.arc(x, f.y * this.h, f.s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Sprinkle dash: streaks at the edges of the screen, toward the middle. */
  private speedLines(me: Actor) {
    const ctx = this.ctx;
    const ang = Math.atan2(me.vy, me.vx);
    ctx.save();
    ctx.translate(this.w / 2, this.h / 2);
    ctx.rotate(ang);
    ctx.strokeStyle = "rgba(255,244,232,0.35)";
    ctx.lineWidth = 2;
    const R = Math.hypot(this.w, this.h) / 2;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const r0 = R * (0.62 + Math.random() * 0.2);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * (r0 + 40 + Math.random() * 40), Math.sin(a) * (r0 + 40 + Math.random() * 40));
      ctx.stroke();
    }
    ctx.restore();
  }

  /** A pie on the player: cream across the edges of the screen, sliding
      off. Never over the middle, where the game is. */
  private cream(left: number) {
    const ctx = this.ctx;
    const k = Math.min(1, left / 0.6);
    const slide = (2.2 - left) * 30;
    ctx.save();
    ctx.globalAlpha = k * 0.92;
    /* At the edges only, and never over the bars: the first version had a
       blob at the top middle, and on a desktop the blobs (170px across)
       hid most of the street. Capped at 96px. */
    const blobs: [number, number, number][] = [
      [0.02, 0.3, 0.16],
      [0.98, 0.4, 0.14],
      [0.06, 0.8, 0.13],
      [0.94, 0.72, 0.17],
    ];
    for (const [bx, by, br] of blobs) {
      const x = bx * this.w;
      const y = by * this.h + slide;
      const r = Math.min(96, br * Math.min(this.w, this.h) * 1.1);
      ctx.fillStyle = "#FFF1DA";
      ctx.strokeStyle = "rgba(42,22,54,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(x + (i - 1.5) * r * 0.45, y + r * 0.8 + i * 6, r * 0.14, r * 0.3 + slide * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(255,248,238,0.8)";
      ctx.beginPath();
      ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Arrows at the edge of the screen toward the rival and lost pals. */
  private pointers(g: Game, view: { x: number; y: number; w: number; h: number }) {
    const ctx = this.ctx;
    const me = playerOf(g);
    for (const a of g.actors) {
      if (a.player || a.minion) continue;
      let col: string | null = null;
      if (a.leader && a.team !== me.team) col = PINK;
      else if (!a.leader && !a.found && a.team === me.team) col = LEAF;
      if (!col) continue;
      if (a.x > view.x && a.x < view.x + view.w && a.y > view.y && a.y < view.y + view.h) continue;
      const sx = (a.x - view.x) * this.cam.z;
      const sy = (a.y - view.y) * this.cam.z;
      const cx = this.w / 2;
      const cy = this.h / 2;
      const ang = Math.atan2(sy - cy, sx - cx);
      const m = 30;
      const k = Math.min((cx - m) / Math.abs(Math.cos(ang) || 1e-6), (cy - m) / Math.abs(Math.sin(ang) || 1e-6));
      const x = cx + Math.cos(ang) * k;
      const y = cy + Math.sin(ang) * k;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-6, -9);
      ctx.lineTo(-6, 9);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ── caches ──────────────────────────────────────────────────────── */

  /** A small cached picture, drawn with its foot at (x, y). */
  private sprite(key: string, x: number, y: number, w: number, h: number, paint: (c: C) => void) {
    let s = this.sprites.get(key);
    if (!s) {
      const c = mk((w + 8) * this.ps, (h + 8) * this.ps);
      const cx = c.getContext("2d")!;
      cx.scale(this.ps, this.ps);
      cx.translate(w / 2 + 4, h + 4);
      paint(cx);
      s = { c, ox: w / 2 + 4, oy: h + 4, s: this.ps };
      this.sprites.set(key, s);
    }
    this.ctx.drawImage(s.c, x - s.ox, y - s.oy, s.c.width / s.s, s.c.height / s.s);
  }

  private prefetch(c0: number, c1: number, r0: number, r1: number) {
    for (let cy = r0; cy <= r1; cy++)
      for (let cx = c0; cx <= c1; cx++) {
        const key = `${cx},${cy}`;
        if (this.chunks.has(key)) continue;
        this.chunks.set(key, { c: this.paintChunk(cx * CHUNK, cy * CHUNK), used: this.frame });
        return;
      }
  }

  /* Evicted tiles' canvases, kept to paint the next tiles on. A new
     384px tile at 1.25x is a 480px canvas, and allocating its pixels was
     the largest single cost of walking around the city (in a 4x-slowed
     profile, the first call on each new canvas took 10 ms of every
     second). */
  private pool: HTMLCanvasElement[] = [];

  private evict() {
    if (this.chunks.size <= 24) return;
    const old = [...this.chunks.entries()].sort((a, b) => a[1].used - b[1].used);
    for (const [k, t] of old.slice(0, this.chunks.size - 20)) {
      this.chunks.delete(k);
      if (this.pool.length < 6) this.pool.push(t.c);
    }
  }

  /* ── painting the city ───────────────────────────────────────────── */

  /** The buildings, set by the game screen before the first frame. */
  buildings: Building[] = [];
  park = { x: 0, y: 0, w: 0, h: 0 };
  pond = { x: 0, y: 0, rx: 1, ry: 1 };
  plaza = { x: 0, y: 0, w: 0, h: 0 };
  flowers: (Pt & { c: number })[] = [];
  vents: Pt[] = [];
  medians: Rect[] = [];

  /** Hand the renderer the city once, so tiles can be painted. */
  setCity(g: Game) {
    this.vents = g.city.vents;
    this.buildings = g.city.buildings;
    this.park = g.city.park;
    this.pond = g.city.pond;
    this.plaza = g.city.plaza;
    this.flowers = g.city.flowers;
    this.medians = g.city.medians;
    this.marquees = [];
    for (const b of g.city.buildings) {
      if (b.style !== "theatre") continue;
      const H = Math.min(b.height, b.h - 50);
      const fy = b.y + b.h - H;
      this.marquees.push({ x: b.x + 6, y: fy + H - 34, w: b.w - 12, h: 14, seed: b.seed });
    }
    this.chunks.clear();
  }

  private paintChunk(x0: number, y0: number): HTMLCanvasElement {
    const size = Math.ceil(CHUNK * this.ps);
    let c = this.pool.pop();
    if (!c || c.width !== size || c.height !== size) c = mk(size, size);
    const ctx = c.getContext("2d", { alpha: false })!;
    ctx.setTransform(this.ps, 0, 0, this.ps, 0, 0);
    ctx.translate(-x0, -y0);
    const P = this.pal;
    const hit = (x: number, y: number, w: number, h: number) => x < x0 + CHUNK && x + w > x0 && y < y0 + CHUNK && y + h > y0;

    ctx.fillStyle = P.asphalt;
    ctx.fillRect(x0, y0, CHUNK, CHUNK);

    /* Past the edges of the playable city, more city, quieter. */
    const pitchX = BW + AW;
    const pitchY = BH + SH;
    for (let r = Math.floor((y0 - SH) / pitchY) - 1; r <= Math.floor((y0 + CHUNK) / pitchY) + 1; r++)
      for (let cc = Math.floor((x0 - AW) / pitchX) - 1; cc <= Math.floor((x0 + CHUNK) / pitchX) + 1; cc++) {
        const bx = blockX(cc);
        const by = blockY(r);
        const inside = cc >= 0 && cc < COLS && r >= 0 && r < ROWS;
        const eastBank = bx > WORLD_W + RIVER_W;
        if (inside || (bx > WORLD_W - AW && !eastBank) || !hit(bx, by, BW, BH)) continue;
        ctx.fillStyle = P.sidewalk;
        ctx.fillRect(bx, by, BW, BH);
        const rr = rnd(Math.abs(cc * 31 + r * 17) + 3);
        ctx.fillStyle = P.edge;
        ctx.fillRect(bx + SIDEWALK, by + SIDEWALK, BW - SIDEWALK * 2, BH - SIDEWALK * 2);
        ctx.fillStyle = P.edgeWin;
        for (let wy = by + 30; wy < by + BH - 30; wy += 22)
          for (let wx = bx + 30; wx < bx + BW - 30; wx += 20) if (rr() < (this.sky !== "day" ? 0.45 : 0.25)) ctx.fillRect(wx, wy, 8, 8);
      }

    /* Sidewalks round every block. */
    for (let r = 0; r < ROWS; r++)
      for (let cc = 0; cc < COLS; cc++) {
        const bx = blockX(cc);
        const by = blockY(r);
        if (!hit(bx - 4, by - 4, BW + 8, BH + 8)) continue;
        ctx.fillStyle = P.curb;
        ctx.beginPath();
        ctx.roundRect(bx - 2, by - 2, BW + 4, BH + 4, 10);
        ctx.fill();
        ctx.fillStyle = P.sidewalk;
        ctx.beginPath();
        ctx.roundRect(bx, by, BW, BH, 9);
        ctx.fill();
        /* Paving lines. */
        ctx.strokeStyle = P.curb;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        for (let x = bx + 24; x < bx + BW; x += 24) {
          ctx.beginPath();
          ctx.moveTo(x, by);
          ctx.lineTo(x, by + SIDEWALK);
          ctx.moveTo(x, by + BH - SIDEWALK);
          ctx.lineTo(x, by + BH);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

    this.paintStreets(ctx, hit);

    /* Road markings and crossings. */
    ctx.lineWidth = 2;
    for (let i = 0; i <= COLS; i++) {
      const x = avX(i);
      if (i === 6 || i === 3 || !hit(x - AW / 2, 0, AW, WORLD_H)) continue;
      for (let j = 0; j < ROWS; j++) {
        const ya = stY(j) + SH / 2 + 18;
        const yb = stY(j + 1) - SH / 2 - 18;
        ctx.strokeStyle = i === 4 ? "#E8677E" : P.line;
        ctx.beginPath();
        ctx.moveTo(x - 2.5, ya);
        ctx.lineTo(x - 2.5, yb);
        ctx.moveTo(x + 2.5, ya);
        ctx.lineTo(x + 2.5, yb);
        ctx.stroke();
      }
    }
    for (let j = 0; j <= ROWS; j++) {
      const y = stY(j);
      if (j === 1 || !hit(0, y - SH / 2, WORLD_W, SH)) continue;
      for (let i = 0; i < COLS; i++) {
        if (j === 2 && (i === 2 || i === 3)) continue;
        const xa = avX(i) + AW / 2 + 18;
        const xb = avX(i + 1) - AW / 2 - 18;
        if (j === 3) {
          /* Rainbow Street's centre line is a rainbow. */
          RAINBOW.forEach((col, k) => {
            ctx.fillStyle = col;
            ctx.fillRect(xa, y - 6 + k * 2, xb - xa, 2);
          });
          continue;
        }
        ctx.strokeStyle = P.zebra;
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([16, 14]);
        ctx.beginPath();
        ctx.moveTo(xa, y);
        ctx.lineTo(xb, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }
    for (let i = 0; i <= COLS; i++)
      for (let j = 0; j <= ROWS; j++) {
        const x = avX(i);
        const y = stY(j);
        if (!hit(x - AW, y - SH, AW * 2, SH * 2)) continue;
        if ((i === 3 && j === 2) || x > WORLD_W) continue;
        for (const side of [-1, 1]) {
          const cy = y + side * (SH / 2 + 8);
          let k2 = 0;
          if (cy > 0 && cy < WORLD_H)
            for (let k = -AW / 2 + 8; k < AW / 2 - 6; k += 10) {
              ctx.fillStyle = j === 3 ? RAINBOW[k2++ % RAINBOW.length] : P.zebra;
              ctx.fillRect(x + k, cy - 6, 5, 12);
            }
          const cx = x + side * (AW / 2 + 8);
          k2 = 0;
          if (cx > 0 && cx < WORLD_W)
            for (let k = -SH / 2 + 8; k < SH / 2 - 6; k += 10) {
              ctx.fillStyle = j === 3 ? RAINBOW[k2++ % RAINBOW.length] : P.zebra;
              ctx.fillRect(cx - 6, y + k, 12, 5);
            }
        }
        this.sign(ctx, i, j);
      }

    /* The vents that steam. */
    for (const v of this.vents) {
      if (!hit(v.x - 12, v.y - 12, 24, 24)) continue;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = shade(P.asphalt, -0.25);
      ctx.fill();
      ctx.strokeStyle = P.curb;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      for (const d of [-4, 0, 4]) {
        ctx.beginPath();
        ctx.moveTo(v.x - 6, v.y + d);
        ctx.lineTo(v.x + 6, v.y + d);
        ctx.stroke();
      }
    }

    this.paintPark(ctx, hit);
    this.paintPlaza(ctx, hit);
    this.paintRiver(ctx, hit);
    for (const b of this.buildings) if (hit(b.x, b.y, b.w, b.h)) this.paintBuilding(ctx, b);
    return c;
  }

  /** A street-name sign on the corner, small, like the real ones. */
  private sign(ctx: C, i: number, j: number) {
    if (i === 0 || i === COLS || j === 0 || j === ROWS) return;
    const x = avX(i) + AW / 2 + 4;
    const y = stY(j) + SH / 2 + 4;
    const av = AVENUES[i].name.replace("Avenue", "Av").replace("Street", "St");
    const st = STREETS[j].name.replace("Street", "St").replace("Avenue", "Av");
    ctx.save();
    ctx.translate(x, y);
    /* Big enough to read on a phone (8px at about 0.9x): at 5.5px the
       names were a green smudge. Cream on #27774E is 5.05:1 (the first
       green, #2F8A5B, measured 3.94:1 and was darkened). */
    ctx.fillStyle = INK;
    ctx.fillRect(-1, 2, 2.5, 14);
    ctx.font = `700 8px ${this.font}`;
    const w1 = Math.max(ctx.measureText(av).width, ctx.measureText(st).width) + 8;
    ctx.fillStyle = INK;
    ctx.fillRect(-1, -19, w1 + 2, 22);
    ctx.fillStyle = "#27774E";
    ctx.fillRect(0, -18, w1, 9.5);
    ctx.fillRect(0, -7.5, w1, 9.5);
    ctx.fillStyle = CREAM;
    ctx.textAlign = "left";
    ctx.fillText(av, 4, -10.6);
    ctx.fillText(st, 4, -0.4);
    ctx.restore();
  }

  /** Each avenue's and street's own paint on the ground. */
  private paintStreets(ctx: C, hit: (x: number, y: number, w: number, h: number) => boolean) {
    const P = this.pal;
    const r = rnd(4242);
    const night = this.night;
    /* Cherry Lane (avenue 0): petals everywhere. */
    if (hit(0, 0, AW, WORLD_H)) {
      for (let i = 0; i < 260; i++) {
        const x = r() * AW;
        const y = r() * WORLD_H;
        ctx.fillStyle = night ? "#B9739A" : r() < 0.5 ? "#FFB3CF" : "#FFC7DA";
        ctx.beginPath();
        ctx.ellipse(x, y, 2.4, 1.4, r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else for (let i = 0; i < 260 * 5; i++) r();
    /* Mural Mile (avenue 1): the road painted between the crossings. */
    const mx = avX(1);
    if (hit(mx - AW / 2, 0, AW, WORLD_H))
      for (let j = 0; j < ROWS; j++) {
        const ya = stY(j) + SH / 2 + 10;
        const yb = stY(j + 1) - SH / 2 - 10;
        const cy = (ya + yb) / 2;
        ctx.save();
        ctx.globalAlpha = night ? 0.4 : 0.55;
        const cols = [PINK, SUN, LEAF, SKY, LILAC, PEACH];
        if (j % 3 === 0) {
          ctx.fillStyle = cols[j % 6];
          ctx.beginPath();
          ctx.arc(mx, cy, 30, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = cols[(j + 1) % 6];
          ctx.lineWidth = 5;
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(mx + Math.cos(a) * 36, cy + Math.sin(a) * 36);
            ctx.lineTo(mx + Math.cos(a) * 48, cy + Math.sin(a) * 48);
            ctx.stroke();
          }
        } else if (j % 3 === 1) {
          for (let k = 0; k < 4; k++) {
            ctx.strokeStyle = cols[(j + k) % 6];
            ctx.lineWidth = 8;
            ctx.beginPath();
            for (let yy = ya; yy <= yb; yy += 6) ctx.lineTo(mx - 30 + k * 20 + Math.sin(yy / 14) * 8, yy);
            ctx.stroke();
          }
        } else {
          ctx.save();
          ctx.translate(mx, cy);
          drawHeart(ctx, 70, cols[(j + 2) % 6], false);
          ctx.restore();
        }
        ctx.restore();
      }
    /* Broadway (avenue 2): stars set into both sidewalks. */
    const bx = avX(2);
    if (hit(bx - AW, 0, AW * 2, WORLD_H))
      for (let y = 20; y < WORLD_H; y += 34) {
        for (const side of [-1, 1]) {
          const x = bx + side * (AW / 2 + 8);
          if (this.park.w && x > this.park.x && y > this.park.y && y < this.park.y + this.park.h) continue;
          star(ctx, x, y, 4.4, night ? "#C9A24A" : "#F2B63D", 0);
        }
      }
    /* Park Avenue (avenue 3): its flower beds. */
    for (const m of this.medians) {
      if (!hit(m.x, m.y, m.w, m.h)) continue;
      ctx.fillStyle = P.curb;
      ctx.beginPath();
      ctx.roundRect(m.x - 2, m.y - 2, m.w + 4, m.h + 4, 8);
      ctx.fill();
      ctx.fillStyle = P.grass;
      ctx.beginPath();
      ctx.roundRect(m.x, m.y, m.w, m.h, 7);
      ctx.fill();
      const cols = ["#FF7AB0", "#FFC857", "#B794FF", "#FFF4E8", "#FF9F80"];
      for (let y = m.y + 6; y < m.y + m.h - 4; y += 7) {
        ctx.fillStyle = cols[(y / 7) % 5 | 0];
        ctx.beginPath();
        ctx.arc(m.x + 5 + ((y * 7) % 8), y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    /* Market Row (avenue 5): loading-bay stripes by the carts. */
    const kx = avX(5);
    if (hit(kx - AW / 2, 0, AW, WORLD_H)) {
      ctx.strokeStyle = night ? "rgba(255,224,138,0.3)" : "rgba(255,248,238,0.45)";
      ctx.lineWidth = 3;
      for (let j = 0; j < ROWS; j++) {
        const y = blockY(j) + BH / 2;
        for (let k = -3; k <= 3; k++) {
          ctx.beginPath();
          ctx.moveTo(kx - 18 + k * 7, y - 14);
          ctx.lineTo(kx - 10 + k * 7, y + 14);
          ctx.stroke();
        }
      }
    }
    /* Harbor Walk (avenue 6): a boardwalk, and a rail along the water. */
    const hx = avX(6) - AW / 2;
    if (hit(hx, 0, WORLD_W - hx, WORLD_H)) {
      ctx.fillStyle = P.plank;
      ctx.fillRect(hx, 0, WORLD_W - hx, WORLD_H);
      ctx.strokeStyle = shade(P.plank, -0.25);
      ctx.lineWidth = 1;
      for (let y = 0; y < WORLD_H; y += 9) {
        ctx.beginPath();
        ctx.moveTo(hx, y);
        ctx.lineTo(WORLD_W, y);
        ctx.stroke();
      }
      ctx.fillStyle = shade(P.plank, -0.35);
      for (let y = 4; y < WORLD_H; y += 18) for (let x = hx + 8; x < WORLD_W; x += 34) ctx.fillRect(x + ((y / 18) % 2) * 17, y, 2, 2);
      ctx.fillStyle = INK;
      ctx.fillRect(WORLD_W - 4, 0, 3, WORLD_H);
      for (let y = 0; y < WORLD_H; y += 20) ctx.fillRect(WORLD_W - 6, y, 7, 3);
    }
    /* Bleecker Street (street 1): cobbles. */
    const cy = stY(1);
    if (hit(0, cy - SH / 2, WORLD_W, SH)) {
      for (let y = cy - SH / 2 + 2; y < cy + SH / 2 - 2; y += 8)
        for (let x = ((y / 8) % 2) * 6; x < WORLD_W; x += 12) {
          if (x < -12 || !hit(x, y, 12, 8)) continue;
          ctx.fillStyle = shade(P.asphalt, (((x * 7 + y * 13) % 5) - 2) * 0.05 + 0.08);
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, 10, 6, 2.5);
          ctx.fill();
        }
    }
    /* Sprinkler Street (street 4): wet patches round each hydrant. */
    const sy = stY(4);
    if (hit(0, sy - SH / 2, WORLD_W, SH)) {
      ctx.fillStyle = night ? "rgba(36,74,130,0.5)" : "rgba(76,128,190,0.28)";
      for (let i = 0; i < COLS; i++) {
        const x = blockX(i) + BW / 2;
        ctx.beginPath();
        ctx.ellipse(x, sy + 6, 58, 22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    /* Brownstone Row (street 5): fallen leaves along the curb. */
    const ly = stY(5);
    if (hit(0, ly - SH / 2, WORLD_W, SH)) {
      const lr = rnd(99);
      for (let i = 0; i < 180; i++) {
        const x = lr() * WORLD_W;
        const y = ly - SH / 2 + lr() * SH;
        ctx.fillStyle = ["#FF9F80", "#FFC857", "#E8677E", "#C97B4A"][Math.floor(lr() * 4)];
        ctx.globalAlpha = night ? 0.5 : 0.85;
        ctx.beginPath();
        ctx.ellipse(x, y, 3.2, 1.8, lr() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  private paintPark(ctx: C, hit: (x: number, y: number, w: number, h: number) => boolean) {
    const P = this.pal;
    const k = this.park;
    if (!hit(k.x, k.y, k.w, k.h)) return;
    ctx.fillStyle = P.curb;
    ctx.beginPath();
    ctx.roundRect(k.x - 2, k.y - 2, k.w + 4, k.h + 4, 14);
    ctx.fill();
    ctx.fillStyle = P.grass;
    ctx.beginPath();
    ctx.roundRect(k.x, k.y, k.w, k.h, 12);
    ctx.fill();
    const r = rnd(99);
    ctx.fillStyle = P.grass2;
    for (let i = 0; i < 120; i++) {
      const x = k.x + r() * k.w;
      const y = k.y + r() * k.h;
      ctx.beginPath();
      ctx.ellipse(x, y, 10 + r() * 16, 6 + r() * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    /* Two paths, curving a little. */
    ctx.strokeStyle = P.path;
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(k.x, k.y + k.h * 0.78);
    ctx.bezierCurveTo(k.x + k.w * 0.35, k.y + k.h * 0.7, k.x + k.w * 0.65, k.y + k.h * 0.86, k.x + k.w, k.y + k.h * 0.78);
    ctx.moveTo(k.x + k.w * 0.3, k.y);
    ctx.bezierCurveTo(k.x + k.w * 0.24, k.y + k.h * 0.35, k.x + k.w * 0.36, k.y + k.h * 0.6, k.x + k.w * 0.3, k.y + k.h);
    ctx.stroke();
    ctx.lineCap = "butt";
    /* The pond, with a rim and a few ripples. */
    const p = this.pond;
    ctx.fillStyle = P.pondRim;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx + 6, p.ry + 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.pond;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.night ? "rgba(255,217,138,0.35)" : "rgba(255,248,238,0.55)";
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      const x = p.x - p.rx * 0.6 + r() * p.rx * 1.2;
      const y = p.y - p.ry * 0.5 + r() * p.ry;
      ctx.beginPath();
      ctx.moveTo(x - 9, y);
      ctx.quadraticCurveTo(x, y - 3, x + 9, y);
      ctx.stroke();
    }
    if (this.sky !== "day") {
      /* The moon (or the setting sun) on the water. */
      ctx.fillStyle = this.night ? "rgba(255,241,201,0.55)" : "rgba(255,224,138,0.6)";
      ctx.beginPath();
      ctx.ellipse(p.x + 20, p.y - 10, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const cols = ["#FF7AB0", "#FFC857", "#B794FF", "#FFF4E8", "#FF9F80"];
    for (const f of this.flowers) {
      ctx.fillStyle = cols[f.c];
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(f.x + Math.cos(i * 1.57) * 2.2, f.y + Math.sin(i * 1.57) * 2.2, 1.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = SUN;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    /* Benches along the path. */
    ctx.fillStyle = this.night ? "#6A4E7E" : "#B97E5A";
    for (const bx of [0.15, 0.55, 0.85]) {
      const x = k.x + k.w * bx;
      const y = k.y + k.h * 0.78 - 26;
      ctx.fillRect(x - 14, y - 4, 28, 7);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 14, y - 4, 28, 7);
    }
  }

  private paintPlaza(ctx: C, hit: (x: number, y: number, w: number, h: number) => boolean) {
    const P = this.pal;
    const k = this.plaza;
    if (!hit(k.x, k.y, k.w, k.h)) return;
    ctx.fillStyle = P.plaza;
    ctx.beginPath();
    ctx.roundRect(k.x, k.y, k.w, k.h, 9);
    ctx.fill();
    ctx.strokeStyle = P.plazaLine;
    ctx.lineWidth = 1.2;
    for (let x = k.x + 20; x < k.x + k.w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, k.y);
      ctx.lineTo(x, k.y + k.h);
      ctx.stroke();
    }
    for (let y = k.y + 20; y < k.y + k.h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(k.x, y);
      ctx.lineTo(k.x + k.w, y);
      ctx.stroke();
    }
    /* Red steps at the north end, for sitting and watching the city. */
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = shade("#E8677E", this.night ? -0.35 - i * 0.04 : -i * 0.06);
      ctx.fillRect(k.x + 70, k.y + 24 + i * 7, k.w - 140, 7);
    }
  }

  private paintRiver(ctx: C, hit: (x: number, y: number, w: number, h: number) => boolean) {
    const P = this.pal;
    if (!hit(WORLD_W, -400, RIVER_W, WORLD_H + 800)) return;
    ctx.fillStyle = P.curb;
    ctx.fillRect(WORLD_W, -400, 10, WORLD_H + 800);
    ctx.fillStyle = P.water;
    ctx.fillRect(WORLD_W + 10, -400, RIVER_W - 10, WORLD_H + 800);
    /* The bridge, on two stone towers. */
    const y = stY(2);
    const x1 = WORLD_W + 10;
    const x2 = WORLD_W + RIVER_W + 400;
    ctx.fillStyle = this.night ? "#4A3B66" : "#B6A9C9";
    ctx.fillRect(x1, y - 26, x2 - x1, 52);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, y - 26, x2 - x1, 52);
    ctx.strokeStyle = this.night ? "#B9A2E8" : "#5A4D72";
    ctx.lineWidth = 1;
    for (let x = x1; x < x2; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, y - 26);
      ctx.lineTo(x + 4, y - 32);
      ctx.moveTo(x, y + 26);
      ctx.lineTo(x + 4, y + 32);
      ctx.stroke();
    }
    for (const tx of [WORLD_W + 70, WORLD_W + RIVER_W - 30]) {
      ctx.fillStyle = this.night ? "#6A4E7E" : "#C9A582";
      ctx.fillRect(tx - 16, y - 40, 32, 80);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.strokeRect(tx - 16, y - 40, 32, 80);
      ctx.fillStyle = P.water;
      ctx.fillRect(tx - 9, y - 30, 18, 20);
      ctx.fillRect(tx - 9, y + 10, 18, 20);
    }
  }

  private paintBuilding(ctx: C, b: Building) {
    const r = rnd(b.seed + 7);
    const night = this.night;
    const lit = this.sky !== "day";
    const [tintTo, faceMix, roofMix] = this.pal.tint;
    const H = Math.min(b.height, b.h - 50);
    const roofH = b.h - H;
    const fy = b.y + roofH;
    let tone = TONES[b.tone % TONES.length];
    if (b.style === "brownstone") tone = BROWNSTONE[b.tone % 3];
    if (b.style === "glass") tone = GLASS[b.tone % 3];
    if (b.style === "parlour") tone = "#FFD3E2";
    if (b.style === "pizza") tone = "#F2D9B5";
    if (b.style === "warehouse") tone = ["#B8604F", "#A65A4C", "#C46E58"][b.tone % 3];
    if (b.style === "theatre") tone = ["#7A2E5A", "#5E2E7A", "#8A3A4A"][b.tone % 3];
    const face = faceMix ? mix(tone, tintTo, faceMix) : tone;
    const roof = roofMix ? mix(tone, tintTo, roofMix) : shade(tone, -0.22);

    /* The roof. */
    ctx.fillStyle = roof;
    ctx.fillRect(b.x, b.y, b.w, roofH);
    ctx.strokeStyle = night ? shade(tone, -0.45) : shade(tone, 0.25);
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x + 3, b.y + 3, b.w - 6, roofH - 6);
    if (b.style === "parlour") {
      /* A giant cone on the roof: the parlour can be found from far off. */
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + roofH / 2 + 4);
      drawCone(ctx, PINK, 0, 2.4);
      ctx.restore();
    } else if (b.district === "midtown" && (b.style === "tower" || b.style === "glass") && b.w > 70 && r() < 0.6) {
      /* Skyline Street's rooftop screens. */
      const sw = Math.min(b.w - 24, 70);
      const sx = b.x + (b.w - sw) / 2;
      const sy = b.y + 14;
      ctx.fillStyle = INK;
      ctx.fillRect(sx - 2, sy - 2, sw + 4, 32);
      const g = ctx.createLinearGradient(sx, sy, sx + sw, sy + 28);
      const cols = [[PINK, SUN], [SKY, LILAC], [LEAF, SUN], [PEACH, PINK]][b.tone % 4];
      g.addColorStop(0, lit ? cols[0] : shade(cols[0], -0.1));
      g.addColorStop(1, lit ? cols[1] : shade(cols[1], -0.1));
      ctx.fillStyle = g;
      ctx.fillRect(sx, sy, sw, 28);
      ctx.font = `700 9px ${this.font}`;
      ctx.textAlign = "center";
      ctx.fillStyle = INK;
      ctx.fillText(["HELLO!", "BE KIND", "SNOW DAY", "SCOOPS"][b.seed % 4], sx + sw / 2, sy + 18);
    } else if (b.style === "warehouse") {
      /* Crates on the harbour roofs. */
      for (let i = 0; i < 4; i++) {
        const x = b.x + 12 + r() * (b.w - 36);
        const y = b.y + 12 + r() * Math.max(1, roofH - 40);
        ctx.fillStyle = night ? "#6A4E5E" : "#C99A6E";
        ctx.fillRect(x, y, 16, 14);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x, y, 16, 14);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 16, y + 14);
        ctx.stroke();
      }
    } else if (b.style === "brownstone" && r() < 0.6) {
      ctx.fillStyle = night ? "#2F5A55" : "#86D49A";
      ctx.fillRect(b.x + 10, b.y + 10, b.w - 20, Math.min(30, roofH - 20));
      ctx.fillStyle = night ? "#3E7068" : "#5CC48A";
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(b.x + 16 + r() * (b.w - 32), b.y + 16 + r() * Math.min(18, roofH - 32), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const items = 1 + Math.floor(r() * 3);
      for (let i = 0; i < items; i++) {
        const kind = r();
        const x = b.x + 14 + r() * Math.max(1, b.w - 46);
        const y = b.y + 12 + r() * Math.max(1, roofH - 44);
        if (kind < 0.42 && b.w > 70) {
          /* A water tower, seen from above: a round lid on legs. */
          ctx.fillStyle = night ? "#3A2A3F" : "#8E5B4A";
          ctx.fillRect(x + 2, y + 18, 3, 8);
          ctx.fillRect(x + 17, y + 18, 3, 8);
          ctx.beginPath();
          ctx.ellipse(x + 11, y + 12, 12, 11, 0, 0, Math.PI * 2);
          ctx.fillStyle = night ? "#5A3F55" : "#B97E5A";
          ctx.fill();
          ctx.strokeStyle = INK;
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + 11, y + 1);
          ctx.lineTo(x + 11, y + 12);
          ctx.moveTo(x + 1, y + 12);
          ctx.lineTo(x + 21, y + 12);
          ctx.strokeStyle = night ? "#2A1C3A" : "#7A4A3A";
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (kind < 0.7) {
          ctx.fillStyle = night ? "#4A3B66" : "#E9E1F2";
          ctx.fillRect(x, y, 18, 12);
          ctx.strokeStyle = INK;
          ctx.lineWidth = 1.4;
          ctx.strokeRect(x, y, 18, 12);
          ctx.beginPath();
          ctx.arc(x + 9, y + 6, 3.5, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = night ? "#3B5C8A" : "#BFE3F8";
          ctx.fillRect(x, y, 22, 14);
          ctx.strokeStyle = INK;
          ctx.lineWidth = 1.4;
          ctx.strokeRect(x, y, 22, 14);
        }
      }
      if (b.style === "glass" && b.w > 80 && r() < 0.5) {
        ctx.strokeStyle = night ? "#FFD98A" : CREAM;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(b.x + b.w - 30, b.y + roofH - 30, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = `700 14px ${this.font}`;
        ctx.fillStyle = night ? "#FFD98A" : CREAM;
        ctx.textAlign = "center";
        ctx.fillText("H", b.x + b.w - 30, b.y + roofH - 25);
      }
    }

    /* The front wall. */
    ctx.fillStyle = face;
    ctx.fillRect(b.x, fy, b.w, H);
    ctx.fillStyle = night ? shade(tone, -0.62) : shade(tone, -0.18);
    ctx.fillRect(b.x, fy, b.w, 5);
    if (b.style === "mural") {
      /* Mural Mile's walls: painted bands and a big sun. */
      ctx.save();
      ctx.beginPath();
      ctx.rect(b.x, fy + 5, b.w, H - 5);
      ctx.clip();
      const cols = [PINK, SUN, LEAF, SKY, LILAC, PEACH];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = night ? mix(cols[(i + b.tone) % 6], "#2A1F48", 0.45) : cols[(i + b.tone) % 6];
        ctx.beginPath();
        ctx.moveTo(b.x - 10 + i * 22, fy + H);
        ctx.quadraticCurveTo(b.x + 20 + i * 22, fy + 10, b.x + 40 + i * 22, fy + H);
        ctx.fill();
      }
      ctx.fillStyle = night ? "#C9A24A" : SUN;
      ctx.beginPath();
      ctx.arc(b.x + b.w * 0.7, fy + 20, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const floorH = b.style === "glass" || b.style === "tower" ? 16 : 20;
    const shopH = b.style === "deli" || b.style === "pizza" || b.style === "parlour" || b.style === "shop" ? 22 : b.style === "theatre" ? 36 : b.style === "warehouse" ? 26 : 0;
    /* Windows, floor by floor; after dark about half of them lit. */
    if (b.style !== "mural") {
      const winW = b.style === "glass" ? 12 : 9;
      const gap = b.style === "glass" ? 4 : 9;
      const cols = Math.max(1, Math.floor((b.w - 10) / (winW + gap)));
      const left = b.x + (b.w - cols * (winW + gap) + gap) / 2;
      for (let y = fy + 10; y < fy + H - shopH - 14; y += floorH) {
        for (let i = 0; i < cols; i++) {
          const x = left + i * (winW + gap);
          const on = lit && r() < (night ? 0.55 : 0.3);
          ctx.fillStyle = on ? (r() < 0.6 ? "#FFD98A" : r() < 0.5 ? "#FF9F80" : "#FFB3CF") : night ? "#251B42" : b.style === "glass" ? "#DDF1FF" : this.sky === "sunset" ? "#FFD3B8" : "#BFE3F8";
          if (b.style === "shop") {
            ctx.beginPath();
            ctx.arc(x + winW / 2, y + (floorH - 8) / 2, winW / 2, 0, Math.PI * 2);
            ctx.fill();
          } else ctx.fillRect(x, y, winW, floorH - 8);
          if (!night && b.style !== "glass" && b.style !== "shop") {
            ctx.fillStyle = "rgba(255,248,238,0.6)";
            ctx.fillRect(x + 1, y + 1, 2.5, floorH - 11);
          }
        }
      }
    }
    /* Fire escapes on the brick and the lofts. */
    if ((b.style === "brick" || b.style === "loft") && H > 50) {
      ctx.strokeStyle = night ? "#140C26" : INK;
      ctx.lineWidth = 1.2;
      const ex = b.x + b.w * 0.5 - 14;
      for (let y = fy + 10; y < fy + H - 24; y += floorH) {
        ctx.strokeRect(ex, y + floorH - 9, 28, 3);
        ctx.beginPath();
        ctx.moveTo(ex + 3, y + floorH - 6);
        ctx.lineTo(ex + 25, y + floorH + 11);
        ctx.stroke();
      }
    }
    /* Ground floor: a door, a stoop, a shop, a theatre or a loading door. */
    const gy = b.y + b.h;
    if (b.style === "theatre") {
      /* The marquee (its bulbs are drawn live, chasing) and the doors. */
      ctx.fillStyle = night ? "#3A2C10" : "#2A1636";
      ctx.fillRect(b.x + 6, gy - 34, b.w - 12, 14);
      ctx.font = `700 8px ${this.font}`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFE08A";
      ctx.fillText(SHOWS[b.seed % SHOWS.length], b.x + b.w / 2, gy - 24);
      ctx.fillStyle = night ? "#FFE08A" : "#C9A24A";
      for (let x = b.x + 14; x < b.x + b.w - 14; x += 16) ctx.fillRect(x, gy - 16, 10, 16);
    } else if (b.style === "warehouse") {
      ctx.fillStyle = night ? "#3A2A3F" : "#8E7A9E";
      ctx.fillRect(b.x + 10, gy - 24, b.w - 20, 24);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      for (let y = gy - 22; y < gy; y += 4) {
        ctx.beginPath();
        ctx.moveTo(b.x + 10, y);
        ctx.lineTo(b.x + b.w - 10, y);
        ctx.stroke();
      }
    } else if (shopH) {
      ctx.fillStyle = lit ? "#FFE08A" : "#DDF1FF";
      ctx.fillRect(b.x + 8, gy - shopH + 4, b.w - 16, shopH - 6);
      const stripes = b.style === "parlour" ? [PINK, CREAM] : b.style === "pizza" ? ["#E8677E", CREAM] : b.style === "shop" ? [LANTERNS[b.tone % LANTERNS.length], CREAM] : ["#62D6A5", CREAM];
      const aw = Math.ceil((b.w - 4) / 10);
      for (let i = 0; i < aw; i++) {
        ctx.fillStyle = night ? shade(stripes[i % 2], -0.35) : stripes[i % 2];
        ctx.beginPath();
        ctx.moveTo(b.x + 2 + i * 10, gy - shopH - 4);
        ctx.lineTo(b.x + 12 + i * 10, gy - shopH - 4);
        ctx.lineTo(b.x + 12 + i * 10, gy - shopH + 6);
        ctx.arc(b.x + 7 + i * 10, gy - shopH + 6, 5, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
      }
      ctx.font = `700 9px ${this.font}`;
      ctx.textAlign = "center";
      ctx.fillStyle = INK;
      const sign = b.style === "parlour" ? "ICE CREAM" : b.style === "pizza" ? "PIZZA" : b.style === "shop" ? ["BAKERY", "BOOKS", "TEA", "PLANTS", "TOYS"][b.tone % 5] : "DELI";
      ctx.fillText(sign, b.x + b.w / 2, gy - 6);
    } else {
      const dx = b.x + b.w / 2 - 7;
      ctx.fillStyle = night ? "#3A2A3F" : b.style === "glass" ? "#7FA6D8" : "#7A4A3A";
      ctx.fillRect(dx, gy - 18, 14, 18);
      ctx.fillStyle = SUN;
      ctx.fillRect(dx + 10, gy - 10, 2, 2);
      if (b.style === "brownstone") {
        ctx.fillStyle = night ? shade(tone, -0.5) : shade(tone, -0.1);
        for (let i = 0; i < 3; i++) ctx.fillRect(dx - 4 - i * 2, gy - 6 + i * 2, 22 + i * 4, 2);
      }
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.beginPath();
    ctx.moveTo(b.x, fy);
    ctx.lineTo(b.x + b.w, fy);
    ctx.stroke();
  }
}
