/**
 * Draws a game of Scoops & Snowballs onto a canvas, sixty times a second.
 *
 * Fast means measured (AGENTS.md), and on a phone slowed 4x a city drawn
 * shape by shape every frame would not keep up. So:
 *
 *   - Everything that never moves (streets, park, river, every building)
 *     is drawn once into 384-pixel tiles and kept; a frame copies the few
 *     tiles in view. Tiles are made at most two per frame, nearest first,
 *     and the ring just outside the view is made ahead while the phone is
 *     idle, so walking never waits on one.
 *   - Buildings fill their own footprint, roof above and front wall below,
 *     the way classic top-down games draw them, so no building ever hides
 *     a character in the street, and they can live in the tiles.
 *   - Trees, lamps and the like are small cached pictures, drawn in order
 *     of depth with the characters, so walking behind a tree looks right.
 *   - Night is dark in its palette, and light is only ever added, in small
 *     glows: nothing is laid over the whole frame.
 *   - The canvas never goes above 1.5x the CSS pixels on a phone (2x on a
 *     bigger screen), and the tiles never above 1.75x.
 */
import {
  AW,
  BH,
  BW,
  COLS,
  RIVER_W,
  ROWS,
  SH,
  SIDEWALK,
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
  type Game,
  type Pt,
} from "./engine";
import {
  CAKE_COLOURS,
  CREAM,
  INK,
  LEAF,
  PINK,
  RAINBOW,
  SUN,
  drawButterfly,
  drawCone,
  drawCritter,
  drawCupcake,
  drawHeart,
  drawHydrant,
  drawLamp,
  drawPigeon,
  drawPowerIcon,
  drawRainbow,
  drawSnowball,
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
};
/* Night was first drawn much darker and read as murky, not as a city at
   night: everything here is lifted, and the darkness laid over it is
   lighter (0.34, was 0.5), so the colours of the buildings still show. */
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
};

/* Facade colours, day; night darkens them. Brick, cream, peach, lilac,
   sky, mint, sun and rose: a colourful city, still from the dawn palette. */
const TONES = ["#D9776A", "#F2D9B5", "#FFB59A", "#C3AEEA", "#9EC3EE", "#9FDDBF", "#FFD98A", "#E9A0BE"];
const BROWNSTONE = ["#A86A55", "#9A5E4E", "#B8775F"];
const GLASS = ["#8FC3EC", "#A7B7EE", "#93D6D9"];

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
  readonly night: boolean;
  cam = { x: 0, y: 0, z: 1 };
  private camReady = false;
  font = "Fredoka, system-ui, sans-serif";

  constructor(
    private canvas: HTMLCanvasElement,
    night: boolean,
    private reduced: boolean,
  ) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.night = night;
    this.pal = night ? NIGHT : DAY;
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
  resize(w: number, h: number, dpr: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    /* 1.5x at most on a phone: a 390-wide phone at 3x is 1.3 million
       pixels a frame at 2x and 0.74 million at 1.5x, and the city, drawn
       in ink lines, looks the same. */
    this.dpr = Math.min(this.w < 600 ? 1.5 : 2, dpr || 1);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    /* About 440 world pixels across the short side of a phone, 620 on a
       bigger screen. */
    this.base = Math.max(0.7, Math.min(1.6, Math.min(this.w, this.h) / (this.w < 600 ? 440 : 620)));
    const ps = Math.max(1, Math.min(1.75, Math.round(this.dpr * this.base * 4) / 4));
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

  /* ── the camera ──────────────────────────────────────────────────── */

  private aim(g: Game, dt: number) {
    const p = playerOf(g);
    let tx = p.x + p.vx * 0.22;
    let ty = p.y + p.vy * 0.22 - 10;
    let tz = this.base * (g.phase === "ready" ? 0.92 : 1);
    if (g.phase === "slowmo" || g.phase === "makeup" || g.phase === "done") {
      const a = leaderOf(g, "dog");
      const b = leaderOf(g, "cat");
      tx = (a.x + b.x) / 2;
      ty = (a.y + b.y) / 2 - 30;
      tz = this.base * (g.handsAt ? 1.32 : 1.12);
    }
    const halfW = this.w / 2 / tz;
    const halfH = this.h / 2 / tz;
    tx = Math.max(halfW - 120, Math.min(WORLD_W + RIVER_W * 0.75 - halfW, tx));
    ty = Math.max(halfH - 110, Math.min(WORLD_H + 110 - halfH, ty));
    if (!this.camReady) {
      this.cam = { x: tx, y: ty, z: tz };
      this.camReady = true;
      return;
    }
    const k = 1 - Math.exp(-dt * (g.phase === "play" ? 7 : 3));
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    this.cam.z += (tz - this.cam.z) * (1 - Math.exp(-dt * 2.5));
  }

  /* ── one frame ───────────────────────────────────────────────────── */

  draw(g: Game, dt: number) {
    this.frame++;
    this.aim(g, dt);
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
        if (!tile && made < 2) {
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
    /* One tile ahead per frame, in the ring just outside the view. */
    if (!made) this.prefetch(c0 - 1, c1 + 1, r0 - 1, r1 + 1);
    this.evict();

    const t = g.t;
    const inView = (x: number, y: number, m = 80) => x > view.x - m && x < view.x + view.w + m && y > view.y - m && y < view.y + view.h + m;

    /* The river moves. */
    if (view.x + view.w > WORLD_W) {
      ctx.strokeStyle = this.night ? "rgba(255,217,138,0.28)" : "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 40; i++) {
        const yy = (i * 61) % (WORLD_H + 200) - 100;
        if (yy < view.y - 10 || yy > view.y + view.h + 10) continue;
        const xx = WORLD_W + 20 + ((i * 53 + t * 18) % (RIVER_W - 40));
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.quadraticCurveTo(xx + 8, yy - 3, xx + 16, yy);
        ctx.stroke();
      }
    }

    /* Day: the shadows of clouds drift over the streets. */
    if (!this.night) {
      ctx.globalAlpha = 0.07;
      for (let i = 0; i < 3; i++) {
        const cx = ((t * 10 + i * 1100) % (WORLD_W + 1400)) - 700;
        const cy = 300 + i * 520;
        ctx.drawImage(this.glow, cx - 260, cy - 160, 520, 320);
      }
      ctx.globalAlpha = 1;
    }

    /* Splats on the ground, fading. */
    for (const d of g.decals) {
      if (!inView(d.x, d.y)) continue;
      ctx.globalAlpha = Math.min(1, d.life / 2) * 0.9;
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
      if (!inView(a.x, a.y)) continue;
      ctx.beginPath();
      ctx.ellipse(a.x, a.y + 1, a.r * 0.95, a.r * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of g.projs) {
      if (!inView(p.x, p.y)) continue;
      const s = Math.max(0.35, 1 - p.z / 320);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 2, p.r * s, p.r * 0.45 * s, 0, 0, Math.PI * 2);
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
    const items: { y: number; draw: () => void }[] = [];
    for (const tr of g.city.trees) {
      if (!inView(tr.x, tr.y, 60)) continue;
      items.push({ y: tr.y, draw: () => this.sprite(`tree${tr.kind}-${Math.round(tr.r)}`, tr.x, tr.y, 70, 80, (c) => drawTree(c, tr.kind, tr.r, this.night)) });
    }
    for (const l of g.city.lamps) {
      if (!inView(l.x, l.y, 60)) continue;
      items.push({ y: l.y, draw: () => this.sprite("lamp", l.x, l.y, 16, 56, (c) => drawLamp(c, this.night)) });
    }
    for (const hy of g.city.hydrants) {
      if (!inView(hy.x, hy.y)) continue;
      items.push({ y: hy.y, draw: () => this.sprite("hydrant", hy.x, hy.y, 18, 18, (c) => drawHydrant(c)) });
    }
    const f = g.city.fountain;
    if (inView(f.x, f.y, 100)) items.push({ y: f.y + 10, draw: () => this.fountain(f.x, f.y, f.r, t) });
    const pl = g.city.plaza;
    if (inView(pl.x + pl.w / 2, pl.y, 200))
      ["SCOOPS", "SNOW DAY", "HELLO CITY"].forEach((label, i) => {
        const bx = pl.x + 54 + i * 86;
        items.push({ y: pl.y + 10, draw: () => this.billboard(bx, pl.y + 10, label, i, t) });
      });
    for (const p of g.pickups) {
      if (!inView(p.x, p.y)) continue;
      items.push({ y: p.y, draw: () => this.pickup(p.x, p.y, p.kind, p.t) });
    }
    for (const c of g.taxis) {
      if (!inView(c.x, c.y)) continue;
      const L = g.city.lanes[c.lane];
      items.push({ y: c.y + 8, draw: () => {
        ctx.save();
        ctx.translate(c.x, c.y);
        drawTaxi(ctx, L.vertical, L.dir, this.night, c.honk > 1.8);
        ctx.restore();
      } });
    }
    for (const b of g.pigeons) {
      if (!inView(b.x, b.y)) continue;
      items.push({ y: b.y, draw: () => {
        ctx.save();
        ctx.translate(b.x, b.y - b.z);
        ctx.scale(b.vx < 0 ? -1 : 1, 1);
        drawPigeon(ctx, t + b.home.x, b.flying > 0, b.peck < 0);
        ctx.restore();
      } });
    }
    for (const c of g.cakes) {
      if (t < c.at || !inView(c.x, c.y)) continue;
      const k = Math.min(1, (t - c.at) / 0.45);
      const s = this.reduced ? 1 : 1 + Math.sin(k * Math.PI) * 0.35 * (1 - k) - (1 - k) * (1 - k) * 0.9;
      items.push({ y: c.y, draw: () => {
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
      } });
    }
    for (const a of g.actors) {
      if (!inView(a.x, a.y)) continue;
      items.push({ y: a.y, draw: () => this.actor(g, a) });
    }
    items.sort((p, q) => p.y - q.y);
    for (const it of items) it.draw();

    /* The player, faintly, through anything standing in front of them. */
    if (!finale) {
      ctx.globalAlpha = 0.3;
      this.actor(g, playerOf(g), true);
      ctx.globalAlpha = 1;
    }

    /* In the air. */
    for (const p of g.projs) {
      if (!inView(p.x, p.y - p.z)) continue;
      ctx.save();
      ctx.translate(p.x, p.y - p.z);
      if (p.kind === "scoop" || p.kind === "rain") drawCone(ctx, p.color, p.kind === "rain" ? Math.PI + Math.sin(p.spin) * 0.3 : p.spin, p.kind === "rain" ? 1.15 : 1);
      else drawSnowball(ctx, p.r, p.spin);
      ctx.restore();
    }
    this.particles(g, inView);

    if (finale) this.party(g, mid, t);

    /* Words that pop up. */
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    for (const tx of g.texts) {
      if (!inView(tx.x, tx.y)) continue;
      const k = tx.t / tx.life;
      const pop = this.reduced ? 1 : Math.min(1, tx.t / 0.12) * (1 + 0.25 * Math.max(0, 1 - tx.t / 0.2));
      ctx.save();
      ctx.translate(tx.x, tx.y - k * 26);
      ctx.scale(pop, pop);
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      ctx.font = `600 ${tx.size}px ${this.font}`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.strokeText(tx.text, 0, 0);
      ctx.fillStyle = tx.color;
      ctx.fillText(tx.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (this.night) this.lights(g, view);

    /* Screen space from here. */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.night) this.snow(dt);
    if (g.phase === "play") this.pointers(g, view);
  }

  /* ── pieces of a frame ───────────────────────────────────────────── */

  private actor(g: Game, a: Actor, ghost = false) {
    const ctx = this.ctx;
    const party = g.handsAt > 0;
    ctx.save();
    ctx.translate(a.x, a.y);
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
      scale: a.leader ? 1 : 0.82,
      seed: a.id * 1.3,
    });
    if (!ghost) {
      if (a.shield > 0) {
        ctx.save();
        ctx.translate(a.face * 4, -50);
        ctx.globalAlpha = a.shield < 1 ? 0.5 + 0.5 * Math.sin(g.t * 20) : 1;
        drawUmbrella(ctx, g.t);
        ctx.restore();
      }
      if (!a.leader && !a.found && g.phase === "play") this.bubble(0, -48, "?", g.t + a.id);
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

  private bubble(x: number, y: number, text: string, t: number) {
    const ctx = this.ctx;
    const b = Math.sin(t * 3) * 2;
    ctx.save();
    ctx.translate(x, y + b);
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
    ctx.restore();
  }

  private pickup(x: number, y: number, kind: Parameters<typeof drawPowerIcon>[1], t: number) {
    const ctx = this.ctx;
    const bob = this.reduced ? 0 : Math.sin(t * 3) * 3;
    const pop = Math.min(1, t / 0.35);
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.55;
    ctx.drawImage(this.glow, -26, -36, 52, 52);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = SUN;
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
      c.fillStyle = this.night ? "#2C5A9A" : "#7ECDF2";
      c.fill();
      c.beginPath();
      c.roundRect(-4, -26, 8, 16, 3);
      c.fillStyle = this.night ? "#6D6390" : "#E8E0F0";
      c.fill();
      c.stroke();
    });
    ctx.save();
    ctx.translate(x, y - 24);
    ctx.strokeStyle = this.night ? "rgba(185,220,255,0.75)" : "rgba(255,255,255,0.9)";
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
    if (this.night && !this.reduced) {
      /* Neon breathes, slowly. */
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.12 + 0.06 * Math.sin(t * 1.5 + i);
      ctx.drawImage(this.glow, x - 60, y - 80, 120, 64);
      ctx.restore();
    }
  }

  private particles(g: Game, inView: (x: number, y: number, m?: number) => boolean) {
    const ctx = this.ctx;
    for (const p of g.fx) {
      if (!inView(p.x, p.y)) continue;
      const a = Math.min(1, p.life / (p.max * 0.5));
      ctx.globalAlpha = a;
      const y = p.y - p.z;
      if (p.kind === "heart") {
        ctx.save();
        ctx.translate(p.x + Math.sin(p.life * 6 + p.rot) * 4, y);
        drawHeart(ctx, p.size * 1.6, p.color);
        ctx.restore();
      } else if (p.kind === "ring") {
        const k = 1 - p.life / p.max;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * (1 - k);
        ctx.beginPath();
        ctx.ellipse(p.x, y, p.size + k * 26, (p.size + k * 26) * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "star") {
        star(ctx, p.x, y, p.size * 1.4, p.color, p.rot);
      } else if (p.kind === "confetti" || p.kind === "sprinkle") {
        ctx.save();
        ctx.translate(p.x, y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size, -p.size * 0.35, p.size * 2, p.size * 0.7);
        ctx.restore();
      } else if (p.kind === "steam") {
        ctx.globalAlpha = a * 0.28;
        ctx.drawImage(this.glow, p.x - p.size * 2, y - p.size * 2, p.size * 4, p.size * 4);
      } else {
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
   * Night lights. The first version laid a darkness over the whole frame
   * with a hole cut for every light; on a phone slowed 4x it took the game
   * from 19 to 13 frames a second, because it touches every pixel twice.
   * The dark is in the night palette instead, and only the light is added:
   * small glows round lamps, the plaza's signs, headlights, and the two of
   * them at the end.
   */
  private lights(g: Game, view: { x: number; y: number; w: number; h: number }) {
    const ctx = this.ctx;
    const near = (x: number, y: number, m: number) => x > view.x - m && x < view.x + view.w + m && y > view.y - m && y < view.y + view.h + m;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.2;
    for (const lp of g.city.lamps) if (near(lp.x, lp.y, 90)) ctx.drawImage(this.glow, lp.x - 56, lp.y - 102, 112, 112);
    ctx.globalAlpha = 0.12;
    for (const lp of g.city.lamps) if (near(lp.x, lp.y, 90)) ctx.drawImage(this.glow, lp.x - 60, lp.y - 34, 120, 60);
    ctx.globalAlpha = 0.16;
    for (const c of g.taxis) {
      if (!near(c.x, c.y, 60)) continue;
      const L = g.city.lanes[c.lane];
      const hx = c.x + (L.vertical ? 0 : L.dir * 34);
      const hy = c.y + (L.vertical ? L.dir * 34 : 0);
      ctx.drawImage(this.glow, hx - 30, hy - 30, 60, 60);
    }
    ctx.globalAlpha = 0.18;
    for (const p of g.pickups) if (near(p.x, p.y, 40)) ctx.drawImage(this.glow, p.x - 34, p.y - 46, 68, 68);
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

  /** Arrows at the edge of the screen toward the rival and lost pals. */
  private pointers(g: Game, view: { x: number; y: number; w: number; h: number }) {
    const ctx = this.ctx;
    const me = playerOf(g);
    const marks: { a: Actor; col: string }[] = [];
    for (const a of g.actors) {
      if (a.player) continue;
      if (a.leader && a.team !== me.team) marks.push({ a, col: PINK });
      else if (!a.leader && !a.found && a.team === me.team) marks.push({ a, col: LEAF });
    }
    for (const { a, col } of marks) {
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

  private evict() {
    if (this.chunks.size <= 24) return;
    const old = [...this.chunks.entries()].sort((a, b) => a[1].used - b[1].used);
    for (const [k] of old.slice(0, this.chunks.size - 20)) this.chunks.delete(k);
  }

  /* ── painting the city ───────────────────────────────────────────── */

  private paintChunk(x0: number, y0: number): HTMLCanvasElement {
    const c = mk(CHUNK * this.ps, CHUNK * this.ps);
    const ctx = c.getContext("2d", { alpha: false })!;
    ctx.scale(this.ps, this.ps);
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
          for (let wx = bx + 30; wx < bx + BW - 30; wx += 20) if (rr() < (this.night ? 0.45 : 0.25)) ctx.fillRect(wx, wy, 8, 8);
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

    /* Road markings and crossings. */
    ctx.lineWidth = 2;
    for (let i = 0; i <= COLS; i++) {
      const x = avX(i);
      if (!hit(x - AW / 2, 0, AW, WORLD_H)) continue;
      for (let j = 0; j < ROWS; j++) {
        const ya = stY(j) + SH / 2 + 18;
        const yb = stY(j + 1) - SH / 2 - 18;
        if (i === 3 && (j === 1 || j === 2)) continue;
        ctx.strokeStyle = P.line;
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
      if (!hit(0, y - SH / 2, WORLD_W, SH)) continue;
      for (let i = 0; i < COLS; i++) {
        if (j === 2 && (i === 2 || i === 3)) continue;
        const xa = avX(i) + AW / 2 + 18;
        const xb = avX(i + 1) - AW / 2 - 18;
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
    ctx.fillStyle = P.zebra;
    for (let i = 0; i <= COLS; i++)
      for (let j = 0; j <= ROWS; j++) {
        const x = avX(i);
        const y = stY(j);
        if (!hit(x - AW, y - SH, AW * 2, SH * 2)) continue;
        if ((i === 3 && j === 2) || x > WORLD_W) continue;
        for (const side of [-1, 1]) {
          const cy = y + side * (SH / 2 + 8);
          if (cy > 0 && cy < WORLD_H) for (let k = -AW / 2 + 8; k < AW / 2 - 6; k += 10) ctx.fillRect(x + k, cy - 6, 5, 12);
          const cx = x + side * (AW / 2 + 8);
          if (cx > 0 && cx < WORLD_W) for (let k = -SH / 2 + 8; k < SH / 2 - 6; k += 10) ctx.fillRect(cx - 6, y + k, 12, 5);
        }
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

  /** The buildings, set by the game screen before the first frame. */
  buildings: Building[] = [];
  park = { x: 0, y: 0, w: 0, h: 0 };
  pond = { x: 0, y: 0, rx: 1, ry: 1 };
  plaza = { x: 0, y: 0, w: 0, h: 0 };
  flowers: (Pt & { c: number })[] = [];
  vents: Pt[] = [];

  /** Hand the renderer the city once, so tiles can be painted. */
  setCity(g: Game) {
    this.vents = g.city.vents;
    this.buildings = g.city.buildings;
    this.park = g.city.park;
    this.pond = g.city.pond;
    this.plaza = g.city.plaza;
    this.flowers = g.city.flowers;
    this.chunks.clear();
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
    ctx.strokeStyle = this.night ? "rgba(255,217,138,0.35)" : "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      const x = p.x - p.rx * 0.6 + r() * p.rx * 1.2;
      const y = p.y - p.ry * 0.5 + r() * p.ry;
      ctx.beginPath();
      ctx.moveTo(x - 9, y);
      ctx.quadraticCurveTo(x, y - 3, x + 9, y);
      ctx.stroke();
    }
    if (this.night) {
      ctx.fillStyle = "rgba(255,241,201,0.55)";
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
    const H = Math.min(b.height, b.h - 50);
    const roofH = b.h - H;
    const fy = b.y + roofH;
    let tone = TONES[b.tone % TONES.length];
    if (b.style === "brownstone") tone = BROWNSTONE[b.tone % 3];
    if (b.style === "glass") tone = GLASS[b.tone % 3];
    if (b.style === "parlour") tone = "#FFD3E2";
    if (b.style === "pizza") tone = "#F2D9B5";
    /* Night mixes toward the app's plum midnight, not toward black: mixed
       toward black, the yellow and peach roofs came out olive. */
    const face = night ? mix(tone, "#2A1F48", 0.5) : tone;
    const roof = night ? mix(tone, "#241A40", 0.68) : shade(tone, -0.22);

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
    const floorH = b.style === "glass" || b.style === "tower" ? 16 : 20;
    const shopH = b.style === "deli" || b.style === "pizza" || b.style === "parlour" ? 22 : 0;
    /* Windows, floor by floor; at night about half of them lit. */
    const winW = b.style === "glass" ? 12 : 9;
    const gap = b.style === "glass" ? 4 : 9;
    const cols = Math.max(1, Math.floor((b.w - 10) / (winW + gap)));
    const left = b.x + (b.w - cols * (winW + gap) + gap) / 2;
    for (let y = fy + 10; y < fy + H - shopH - 14; y += floorH) {
      for (let i = 0; i < cols; i++) {
        const x = left + i * (winW + gap);
        const lit = night && r() < 0.55;
        ctx.fillStyle = lit ? (r() < 0.6 ? "#FFD98A" : r() < 0.5 ? "#FF9F80" : "#FFB3CF") : night ? "#251B42" : b.style === "glass" ? "#DDF1FF" : "#BFE3F8";
        ctx.fillRect(x, y, winW, floorH - 8);
        if (!night && b.style !== "glass") {
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.fillRect(x + 1, y + 1, 2.5, floorH - 11);
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
    /* Ground floor: a door, a stoop, or a shop with an awning. */
    const gy = b.y + b.h;
    if (shopH) {
      ctx.fillStyle = night ? "#FFE08A" : "#DDF1FF";
      ctx.fillRect(b.x + 8, gy - shopH + 4, b.w - 16, shopH - 6);
      const stripes = b.style === "parlour" ? [PINK, CREAM] : b.style === "pizza" ? ["#E8677E", CREAM] : ["#62D6A5", CREAM];
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
      const sign = b.style === "parlour" ? "ICE CREAM" : b.style === "pizza" ? "PIZZA" : "DELI";
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
