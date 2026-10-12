/**
 * How Scoops & Snowballs looks: the six characters, the treats and the
 * props, and the skyline on the title card. Canvas drawing only, no state.
 *
 * Drawn the way Ooh is drawn (lib/ooh.mjs): a comic ink outline in Ooh's
 * plum ink, flat colour, one highlight. The colours are the dawn palette
 * (DESIGN.md) pushed brighter for a game: sun, dawn pink, lilac, peach and
 * the one leaf green, with sky blue added for water and snow. No pure black
 * and no pure white, as everywhere in Arun.
 */
import type { Look, PowerKind, Stain } from "./engine";

export const INK = "#2A1636";
export const CREAM = "#FFF4E8";
export const SUN = "#FFC857";
export const PINK = "#FF7AB0";
export const LILAC = "#B794FF";
export const PEACH = "#FF9F80";
export const LEAF = "#62D6A5";
export const SKY = "#8BB8E8";
export const SNOWBALL = "#F4F8FF";

type C = CanvasRenderingContext2D;

function ell(ctx: C, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
}
function circ(ctx: C, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
}
function fillStroke(ctx: C, fill: string | CanvasGradient, lw = 2.2, stroke = INK) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
function rrect(ctx: C, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/* ── the cast ──────────────────────────────────────────────────────── */

interface Coat {
  kind: "dog" | "pug" | "corgi" | "cat";
  fur: string;
  light: string;
  ear: string;
  accent: string;
  eye?: string;
  stripes?: string;
  patches?: string[];
  mask?: string;
}

export const COATS: Record<Look, Coat> = {
  /* A golden retriever-ish pup in a rose bandana. */
  biscuit: { kind: "dog", fur: "#F2B25C", light: "#FFE3B8", ear: "#B8693A", accent: "#E84E7A" },
  /* A fawn pug with a dark mask and a leaf-green collar. */
  pip: { kind: "pug", fur: "#E9C48F", light: "#F7E2BF", ear: "#4A3346", accent: LEAF, mask: "#4A3346" },
  /* An orange-and-cream corgi with a sky-blue collar. */
  bao: { kind: "corgi", fur: "#F09A4A", light: CREAM, ear: "#F09A4A", accent: SKY },
  /* A blue-grey tabby in a sun-yellow scarf. */
  miso: { kind: "cat", fur: "#A3ACD9", light: "#E4E7F7", ear: "#FF9FB8", accent: SUN, eye: LEAF, stripes: "#7C83B8" },
  /* A plum-black cat with a pink bell (plum, never pure black). */
  inky: { kind: "cat", fur: "#3B2E52", light: "#5C4C7A", ear: "#FF9FB8", accent: PINK, eye: "#FFD36E" },
  /* A calico with a lilac ribbon. */
  mochi: { kind: "cat", fur: "#FFF1E2", light: CREAM, ear: "#FF9FB8", accent: LILAC, eye: SKY, patches: ["#F4A259", "#4A3346"] },
};

export interface Pose {
  /** Seconds, for breathing, blinking and wagging. */
  t: number;
  walk: number;
  moving: boolean;
  /** 1 facing right, -1 facing left. */
  face: number;
  /** Seconds left of being splatted: a squash and a giggle. */
  hitT: number;
  /** Seconds left of a throw: leaning in. */
  throwT: number;
  sit: boolean;
  stains: Stain[];
  /** Celebrating: eyes closed in a smile. */
  happy: boolean;
  /** Reaching a paw out in front (holding hands at the end). */
  hold: boolean;
  /** Hopping, at the party. */
  hop: number;
  /** Shivering from a snowball. */
  chilly: boolean;
  scale: number;
  /** A per-character offset so they don't blink in unison. */
  seed: number;
}

export function drawCritter(ctx: C, look: Look, p: Pose) {
  const c = COATS[look];
  ctx.save();
  let lift = 0;
  if (p.hop > 0) lift = Math.abs(Math.sin(p.hop * 7)) * 9;
  const bob = p.moving ? Math.abs(Math.sin(p.walk)) * 2.2 : Math.sin(p.t * 2.2 + p.seed) * 0.7;
  ctx.translate(p.chilly ? Math.sin(p.t * 60) * 0.9 : 0, -lift);
  ctx.scale(p.face * p.scale, p.scale);
  /* Squash on a splat, stretch on a throw: the two moments that should
     feel like something. */
  const sq = p.hitT > 0 ? Math.sin((p.hitT / 0.42) * Math.PI) * 0.12 : 0;
  ctx.scale(1 + sq, 1 - sq);
  if (p.throwT > 0) ctx.rotate(Math.sin((p.throwT / 0.28) * Math.PI) * 0.13);
  if (p.sit) ctx.rotate(Math.sin(p.t * 9) * 0.07);
  if (c.kind === "cat") cat(ctx, c, p, bob);
  else dog(ctx, c, p, bob);
  /* Ice cream and snow on the fur: the bar, drawn on the character. */
  for (const s of p.stains) {
    ctx.fillStyle = s.c;
    circ(ctx, s.x, s.y, s.r);
    ctx.fill();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = "rgba(42,22,54,0.55)";
    ctx.stroke();
    circ(ctx, s.x + s.r * 0.5, s.y + s.r * 1.1, s.r * 0.42);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    circ(ctx, s.x - s.r * 0.35, s.y - s.r * 0.35, s.r * 0.28);
    ctx.fill();
  }
  ctx.restore();
}

function legs(ctx: C, p: Pose, xs: number[], h: number, w: number, fill: string, far: boolean) {
  xs.forEach((x, i) => {
    const ph = p.walk + (i % 2 ? Math.PI : 0) + (far ? Math.PI / 2 : 0);
    const dx = p.moving ? Math.sin(ph) * 3 : 0;
    const up = p.moving ? Math.max(0, -Math.cos(ph)) * 2.2 : 0;
    rrect(ctx, x - w / 2 + dx, -h - up, w, h, w / 2);
    fillStroke(ctx, far ? shade(fill, -0.18) : fill, 2);
  });
}

function eyes(ctx: C, p: Pose, at: [number, number][], r: number, iris: string | null) {
  const blink = (p.t + p.seed * 1.7) % 3.9 < 0.12;
  const laugh = p.happy || p.hitT > 0 || p.sit;
  at.forEach(([x, y], i) => {
    const rr = i === 0 ? r : r * 0.86;
    ctx.lineCap = "round";
    if (laugh) {
      ctx.beginPath();
      ctx.arc(x, y + 0.8, rr, Math.PI * 1.1, Math.PI * 1.9);
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = INK;
      ctx.stroke();
    } else if (blink) {
      ctx.beginPath();
      ctx.moveTo(x - rr, y);
      ctx.lineTo(x + rr, y);
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = INK;
      ctx.stroke();
    } else if (iris) {
      ell(ctx, x, y, rr * 1.05, rr * 1.3);
      fillStroke(ctx, iris, 1.3);
      ell(ctx, x + 0.3, y, rr * 0.36, rr * 1.05);
      ctx.fillStyle = INK;
      ctx.fill();
      circ(ctx, x - rr * 0.35, y - rr * 0.5, rr * 0.32);
      ctx.fillStyle = CREAM;
      ctx.fill();
    } else {
      circ(ctx, x, y, rr);
      ctx.fillStyle = INK;
      ctx.fill();
      circ(ctx, x - rr * 0.35, y - rr * 0.4, rr * 0.38);
      ctx.fillStyle = CREAM;
      ctx.fill();
    }
  });
}

function mouth(ctx: C, p: Pose, x: number, y: number, w: number) {
  const open = p.happy || p.hitT > 0 || p.sit;
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = INK;
  if (open) {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x, y + w * 1.6, x + w, y);
    ctx.closePath();
    ctx.fillStyle = "#7A2748";
    ctx.fill();
    ctx.stroke();
    ell(ctx, x + w * 0.2, y + w * 0.7, w * 0.5, w * 0.35);
    ctx.fillStyle = "#FF8FA8";
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w / 2, y + w * 0.7, x, y);
    ctx.quadraticCurveTo(x + w / 2, y + w * 0.7, x + w, y);
    ctx.stroke();
  }
}

function holdPaw(ctx: C, fur: string) {
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(8, -17);
  ctx.quadraticCurveTo(13, -21, 17, -17);
  ctx.lineWidth = 6.6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = fur;
  ctx.stroke();
  circ(ctx, 17.5, -17, 3.6);
  fillStroke(ctx, fur, 1.8);
}

function dog(ctx: C, c: Coat, p: Pose, bob: number) {
  const short = c.kind === "corgi";
  const legH = short ? 8 : 11;
  const sitDrop = p.sit ? 5 : 0;
  ctx.translate(0, sitDrop);
  /* Tail: a wag, faster when happy. */
  const wag = Math.sin(p.t * (p.happy || p.moving ? 16 : 6) + p.seed) * (p.happy ? 0.5 : 0.3);
  ctx.save();
  ctx.translate(-12, -19 - bob);
  ctx.rotate(-0.6 + wag);
  ctx.lineCap = "round";
  ctx.beginPath();
  if (c.kind === "pug") {
    ctx.arc(-3, -4, 4, Math.PI * 0.2, Math.PI * 2);
  } else {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-8, -6, -6, -15);
  }
  ctx.lineWidth = c.kind === "corgi" ? 8 : 7;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = c.kind === "corgi" ? 5 : 4.4;
  ctx.strokeStyle = c.fur;
  ctx.stroke();
  ctx.restore();

  if (p.sit) {
    ell(ctx, -6, -6, 8, 6);
    fillStroke(ctx, shade(c.fur, -0.12));
  } else legs(ctx, p, [-9, 6], legH, 5.2, c.fur, true);
  ell(ctx, 0, -14 - legH * 0.35 - bob, 14.5, 10);
  fillStroke(ctx, c.fur);
  ell(ctx, 5, -11 - legH * 0.35 - bob, 8, 5.6);
  ctx.fillStyle = c.light;
  ctx.fill();
  if (p.sit) {
    legs(ctx, { ...p, moving: false }, [8, 12], legH, 5.2, c.fur, false);
  } else legs(ctx, p, [-5, 10], legH, 5.2, c.fur, false);
  /* Collar or bandana. */
  const hy = -30 - bob - (short ? 0 : 1);
  if (c.kind === "dog") {
    ctx.beginPath();
    ctx.moveTo(3, hy + 9);
    ctx.lineTo(16, hy + 9);
    ctx.lineTo(9, hy + 17);
    ctx.closePath();
    fillStroke(ctx, c.accent, 1.8);
  } else {
    rrect(ctx, 3, hy + 8, 13, 3.6, 1.8);
    fillStroke(ctx, c.accent, 1.5);
    circ(ctx, 10, hy + 13, 1.8);
    fillStroke(ctx, SUN, 1.2);
  }
  /* Far ear. */
  if (c.kind === "corgi") {
    tri(ctx, [0, hy - 4], [3, hy - 17], [8, hy - 7]);
    fillStroke(ctx, shade(c.fur, -0.15));
  } else {
    ell(ctx, 2.5, hy + 1, 4.2, 7.5, 0.35);
    fillStroke(ctx, shade(c.ear, -0.1));
  }
  /* Head. */
  circ(ctx, 9, hy, 11.5);
  fillStroke(ctx, c.fur);
  if (c.kind === "corgi") {
    ell(ctx, 14, hy + 3, 7, 6);
    ctx.fillStyle = c.light;
    ctx.fill();
  }
  /* Muzzle. */
  const pugFace = c.kind === "pug";
  ell(ctx, pugFace ? 16 : 17.5, hy + 3, pugFace ? 6 : 7, pugFace ? 5.4 : 5.2);
  fillStroke(ctx, pugFace ? c.mask! : c.light, 1.8);
  circ(ctx, pugFace ? 20.5 : 23.5, hy + 1, 2.5);
  ctx.fillStyle = INK;
  ctx.fill();
  mouth(ctx, p, pugFace ? 17.5 : 19.5, hy + 5.5, 2.6);
  if (p.happy && !p.sit) {
    ell(ctx, 20, hy + 9, 2, 3);
    fillStroke(ctx, "#FF8FA8", 1.2);
  }
  eyes(ctx, p, [[14, hy - 3.5], [7, hy - 4]], 2.1, null);
  /* Near ear. */
  if (c.kind === "corgi") {
    tri(ctx, [6, hy - 6], [12, hy - 21], [16, hy - 7]);
    fillStroke(ctx, c.fur);
    tri(ctx, [9, hy - 8], [12, hy - 16], [14, hy - 8]);
    ctx.fillStyle = "#FF9FB8";
    ctx.fill();
  } else if (pugFace) {
    tri(ctx, [3, hy - 7], [9, hy - 12], [8, hy - 3]);
    fillStroke(ctx, c.ear, 1.8);
  } else {
    const flop = p.moving ? Math.sin(p.walk) * 0.18 : 0;
    ell(ctx, 4, hy + 2, 4.6, 8.6, 0.25 + flop);
    fillStroke(ctx, c.ear);
  }
  if (p.hold) holdPaw(ctx, c.fur);
}

function cat(ctx: C, c: Coat, p: Pose, bob: number) {
  const sitDrop = p.sit ? 5 : 0;
  ctx.translate(0, sitDrop);
  /* A tail that sways in an S. */
  const sway = Math.sin(p.t * 2.4 + p.seed) * 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-11, -18 - bob);
  ctx.bezierCurveTo(-24, -22, -14 + sway, -34, -20 + sway, -44);
  ctx.lineWidth = 7.4;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 4.6;
  ctx.strokeStyle = c.patches ? c.patches[0] : c.fur;
  ctx.stroke();

  if (p.sit) {
    ell(ctx, -6, -6, 8, 6);
    fillStroke(ctx, shade(c.fur, -0.1));
  } else legs(ctx, p, [-8, 6], 11, 4.4, c.fur, true);
  ell(ctx, 0, -18 - bob, 13.5, 9.5);
  fillStroke(ctx, c.fur);
  if (c.patches) {
    ctx.save();
    ell(ctx, 0, -18 - bob, 13.5, 9.5);
    ctx.clip();
    ell(ctx, -6, -22 - bob, 7, 5);
    ctx.fillStyle = c.patches[0];
    ctx.fill();
    ell(ctx, 5, -24 - bob, 5, 4);
    ctx.fillStyle = c.patches[1];
    ctx.fill();
    ctx.restore();
  }
  if (c.stripes) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = c.stripes;
    for (const x of [-7, -2, 3]) {
      ctx.beginPath();
      ctx.moveTo(x - 1, -27 - bob);
      ctx.quadraticCurveTo(x + 2, -22 - bob, x, -17 - bob);
      ctx.stroke();
    }
  }
  if (p.sit) legs(ctx, { ...p, moving: false }, [7, 11], 12, 4.4, c.fur, false);
  else legs(ctx, p, [-4, 10], 11, 4.4, c.fur, false);
  const hy = -31 - bob;
  /* Scarf or bell. */
  if (c.stripes) {
    rrect(ctx, 2, hy + 8, 15, 5, 2.5);
    fillStroke(ctx, c.accent, 1.7);
    const flap = Math.sin(p.t * 6) * 2;
    rrect(ctx, 1, hy + 11, 4, 9 + flap, 2);
    fillStroke(ctx, shade(c.accent, -0.08), 1.5);
  } else {
    rrect(ctx, 3, hy + 8.5, 13, 3.4, 1.7);
    fillStroke(ctx, c.accent, 1.4);
    circ(ctx, 10, hy + 13.5, 2.2);
    fillStroke(ctx, SUN, 1.2);
  }
  /* Ears, far then near. */
  tri(ctx, [1, hy - 5], [3, hy - 17], [10, hy - 8]);
  fillStroke(ctx, shade(c.patches ? c.patches[1] : c.fur, -0.12));
  circ(ctx, 9, hy, 11);
  fillStroke(ctx, c.fur);
  if (c.patches) {
    ctx.save();
    circ(ctx, 9, hy, 11);
    ctx.clip();
    ell(ctx, 3, hy - 6, 7, 6);
    ctx.fillStyle = c.patches[0];
    ctx.fill();
    ctx.restore();
    circ(ctx, 9, hy, 11);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  if (c.stripes) {
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = c.stripes;
    for (const x of [5, 9]) {
      ctx.beginPath();
      ctx.moveTo(x, hy - 10.5);
      ctx.lineTo(x + 1, hy - 6);
      ctx.stroke();
    }
  }
  tri(ctx, [10, hy - 8], [15, hy - 19], [19, hy - 5]);
  fillStroke(ctx, c.patches ? c.patches[0] : c.fur);
  tri(ctx, [12.5, hy - 8], [15, hy - 14.5], [17, hy - 7]);
  ctx.fillStyle = c.ear;
  ctx.fill();
  /* Face. */
  ell(ctx, 15, hy + 4, 5, 3.6);
  ctx.fillStyle = c.light;
  ctx.fill();
  tri(ctx, [16.5, hy + 0.8], [20, hy + 0.8], [18.2, hy + 2.8]);
  ctx.fillStyle = "#FF8FA8";
  ctx.fill();
  mouth(ctx, p, 17.5, hy + 4.5, 2);
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = c.kind === "cat" && c.fur === "#3B2E52" ? "#C9BDE0" : INK;
  for (const [dy, ey] of [[-0.5, -2.5], [1.2, 0.8], [2.8, 3.8]]) {
    ctx.beginPath();
    ctx.moveTo(19, hy + 2 + dy);
    ctx.lineTo(28, hy + 2 + ey);
    ctx.stroke();
  }
  eyes(ctx, p, [[14, hy - 3], [7.5, hy - 3.5]], 2.2, c.eye ?? LEAF);
  if (p.hold) holdPaw(ctx, c.fur);
}

function tri(ctx: C, a: [number, number], b: [number, number], c: [number, number]) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]);
  ctx.closePath();
}

/** Mix two #rrggbb colours: 0 is all `a`, 1 is all `b`. */
export function mix(a: string, b: string, t: number): string {
  const p = parseInt(a.slice(1), 16);
  const q = parseInt(b.slice(1), 16);
  const ch = (n: number, sh: number) => (n >> sh) & 255;
  const m = (sh: number) => Math.round(ch(p, sh) + (ch(q, sh) - ch(p, sh)) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}

/** Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt >= 0) {
    r += (255 - r) * amt;
    g += (255 - g) * amt;
    b += (255 - b) * amt;
  } else {
    r *= 1 + amt;
    g *= 1 + amt;
    b *= 1 + amt;
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

/* ── treats ────────────────────────────────────────────────────────── */

/** An ice cream cone, centred on its scoop. */
export function drawCone(ctx: C, color: string, spin: number, s = 1) {
  ctx.save();
  ctx.scale(s, s);
  ctx.rotate(spin);
  tri(ctx, [-5, 1], [5, 1], [0, 13]);
  fillStroke(ctx, "#E8B26A", 1.6);
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = "#B97E3E";
  ctx.beginPath();
  ctx.moveTo(-3, 4);
  ctx.lineTo(2, 9);
  ctx.moveTo(3, 4);
  ctx.lineTo(-2, 9);
  ctx.stroke();
  circ(ctx, 0, -2.5, 6.4);
  fillStroke(ctx, color, 1.7);
  ell(ctx, -2, -4.5, 2, 1.4, -0.5);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fill();
  circ(ctx, 1.5, -8.6, 1.8);
  fillStroke(ctx, "#E84E7A", 1);
  ctx.restore();
}

export function drawSnowball(ctx: C, r: number, spin = 0) {
  circ(ctx, 0, 0, r);
  fillStroke(ctx, SNOWBALL, Math.max(1.2, r * 0.16), "#6E78A8");
  ctx.save();
  circ(ctx, 0, 0, r);
  ctx.clip();
  circ(ctx, r * 0.45, r * 0.5, r * 0.85);
  ctx.fillStyle = "rgba(139,184,232,0.55)";
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.rotate(spin);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  circ(ctx, -r * 0.35, -r * 0.35, r * 0.26);
  ctx.fill();
  ctx.restore();
}

export const CAKE_COLOURS = [PINK, LEAF, LILAC, SUN, PEACH];

export function drawCupcake(ctx: C, frost: string, s = 1) {
  ctx.save();
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-9, -9);
  ctx.lineTo(9, -9);
  ctx.lineTo(6.5, 3);
  ctx.lineTo(-6.5, 3);
  ctx.closePath();
  fillStroke(ctx, "#FF9F80", 1.8);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(42,22,54,0.45)";
  for (const x of [-4.5, 0, 4.5]) {
    ctx.beginPath();
    ctx.moveTo(x * 1.1, -8);
    ctx.lineTo(x * 0.85, 2);
    ctx.stroke();
  }
  ell(ctx, 0, -11, 11, 5.2);
  fillStroke(ctx, frost, 1.8);
  ell(ctx, 0, -15.5, 7.6, 4.2);
  fillStroke(ctx, frost, 1.6);
  ell(ctx, 0, -19, 4, 2.8);
  fillStroke(ctx, frost, 1.4);
  circ(ctx, 0.5, -23, 2.6);
  fillStroke(ctx, "#E84E7A", 1.2);
  const sprinkle = [SUN, SKY, CREAM, LEAF];
  for (let i = 0; i < 7; i++) {
    ctx.save();
    ctx.translate(-7 + i * 2.3, -12 - (i % 3) * 2.2);
    ctx.rotate(i * 1.3);
    ctx.fillStyle = sprinkle[i % 4];
    ctx.fillRect(-1.3, -0.5, 2.6, 1);
    ctx.restore();
  }
  ctx.restore();
}

export function drawHeart(ctx: C, size: number, color: string, outline = true) {
  const s = size / 10;
  ctx.save();
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 3.5);
  ctx.bezierCurveTo(-1, 2.6, -9, -2, -5.5, -7);
  ctx.bezierCurveTo(-3, -9.6, 0, -8, 0, -5.4);
  ctx.bezierCurveTo(0, -8, 3, -9.6, 5.5, -7);
  ctx.bezierCurveTo(9, -2, 1, 2.6, 0, 3.5);
  ctx.closePath();
  fillStroke(ctx, color, outline ? 1.6 / s : 0);
  ell(ctx, -3.6, -5.6, 1.6, 1.1, -0.6);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fill();
  ctx.restore();
}

export function drawButterfly(ctx: C, t: number, color: string, s = 1) {
  const flap = 0.25 + Math.abs(Math.cos(t * 13)) * 0.75;
  ctx.save();
  ctx.scale(s, s);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side * flap, 1);
    ell(ctx, 5, -3, 5.4, 4.2, -0.4);
    fillStroke(ctx, color, 1.2);
    ell(ctx, 4, 3, 3.6, 3, 0.4);
    fillStroke(ctx, shade(color, 0.3), 1.1);
    circ(ctx, 5.5, -3.5, 1.3);
    ctx.fillStyle = CREAM;
    ctx.fill();
    ctx.restore();
  }
  rrect(ctx, -1, -6, 2, 12, 1);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.quadraticCurveTo(-2, -10, -3.5, -10.5);
  ctx.moveTo(0, -6);
  ctx.quadraticCurveTo(2, -10, 3.5, -10.5);
  ctx.stroke();
  ctx.restore();
}

export const RAINBOW = ["#FF7AB0", "#FF9F80", "#FFC857", "#62D6A5", "#8BB8E8", "#B794FF"];

/** A rainbow arching over (cx, cy), drawn up to `progress` (0 to 1). */
export function drawRainbow(ctx: C, cx: number, cy: number, r: number, band: number, progress: number, alpha = 0.9) {
  const end = Math.PI + Math.PI * Math.max(0, Math.min(1, progress));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  RAINBOW.forEach((col, i) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r - i * band, Math.PI, end);
    ctx.lineWidth = band + 0.6;
    ctx.strokeStyle = col;
    ctx.stroke();
  });
  ctx.restore();
}

export function drawUmbrella(ctx: C, t: number) {
  ctx.save();
  ctx.rotate(Math.sin(t * 3) * 0.06);
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(0, 22);
  ctx.quadraticCurveTo(0, 26, 4, 25);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 22, Math.PI, 0);
  ctx.quadraticCurveTo(15, -4, 11, 0);
  ctx.quadraticCurveTo(5.5, -4, 0, 0);
  ctx.quadraticCurveTo(-5.5, -4, -11, 0);
  ctx.quadraticCurveTo(-15, -4, -22, 0);
  ctx.closePath();
  fillStroke(ctx, PINK, 2);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = CREAM;
  for (const a of [-0.55, 0.55]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 24, Math.PI * 1.5 + a - 0.16, Math.PI * 1.5 + a + 0.16);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

/** A power-up's icon, about 24 units across. */
export function drawPowerIcon(ctx: C, kind: PowerKind, t: number) {
  if (kind === "triple") {
    ctx.save();
    tri(ctx, [-6, 2], [6, 2], [0, 15]);
    fillStroke(ctx, "#E8B26A", 1.6);
    for (const [y, col] of [[-2, PINK], [-9, LEAF], [-16, SUN]] as [number, string][]) {
      circ(ctx, 0, y, 6.4);
      fillStroke(ctx, col, 1.6);
    }
    ctx.restore();
  } else if (kind === "mega") {
    drawSnowball(ctx, 11, t);
    star(ctx, 9, -9, 4, SUN, t * 2);
  } else if (kind === "dash") {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(3, -15);
    ctx.lineTo(-7, 2);
    ctx.lineTo(0, 2);
    ctx.lineTo(-3, 15);
    ctx.lineTo(8, -3);
    ctx.lineTo(1, -3);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, -15, 0, 15);
    RAINBOW.forEach((c, i) => grad.addColorStop(i / (RAINBOW.length - 1), c));
    fillStroke(ctx, grad, 1.8);
    ctx.restore();
  } else if (kind === "umbrella") {
    ctx.save();
    ctx.scale(0.62, 0.62);
    ctx.translate(0, -6);
    drawUmbrella(ctx, t);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(0, 8);
    drawCupcake(ctx, PINK, 0.85);
    ctx.restore();
  }
}

export function star(ctx: C, x: number, y: number, r: number, color: string, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  fillStroke(ctx, color, 1);
  ctx.restore();
}

/* ── street furniture ──────────────────────────────────────────────── */

/** A yellow cab seen from above and a little in front. */
export function drawTaxi(ctx: C, vertical: boolean, dir: number, night: boolean, honk: boolean) {
  ctx.save();
  ctx.rotate(vertical ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : dir > 0 ? 0 : Math.PI);
  /* Wheels. */
  ctx.fillStyle = INK;
  for (const [x, y] of [[-12, -11], [10, -11], [-12, 8], [10, 8]]) {
    rrect(ctx, x - 3.5, y, 7, 3.4, 1.4);
    ctx.fill();
  }
  rrect(ctx, -20, -10, 40, 20, 6);
  fillStroke(ctx, night ? "#E3AC2C" : "#FFC62E", 2);
  rrect(ctx, -9, -8, 17, 16, 4);
  fillStroke(ctx, night ? "#F0BE45" : "#FFD766", 1.4);
  rrect(ctx, 8, -7.5, 7, 15, 2.5);
  ctx.fillStyle = night ? "#47507A" : "#9FD0F2";
  ctx.fill();
  rrect(ctx, -15, -7, 5, 14, 2);
  ctx.fill();
  rrect(ctx, -4, -3.4, 8, 6.8, 1.4);
  fillStroke(ctx, honk ? PINK : CREAM, 1.2);
  ctx.fillStyle = INK;
  ctx.fillRect(-2.6, -0.4, 5.2, 0.9);
  /* Checker stripe. */
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? INK : CREAM;
    ctx.fillRect(-16 + i * 4, 8, 4, 1.6);
  }
  ctx.fillStyle = night ? "#FFF2B0" : CREAM;
  circ(ctx, 19, -6, 1.8);
  ctx.fill();
  circ(ctx, 19, 6, 1.8);
  ctx.fill();
  ctx.restore();
}

export function drawPigeon(ctx: C, t: number, flying: boolean, peck: boolean) {
  ctx.save();
  if (flying) {
    const f = Math.cos(t * 26);
    ctx.fillStyle = "#B8B2CC";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    for (const s of [-1, 1]) {
      ell(ctx, s * 5, -2 - f * 2, 5.5, 2.4, s * (0.3 + f * 0.4));
      ctx.fill();
      ctx.stroke();
    }
  }
  ell(ctx, 0, -4, 5.6, 3.8);
  fillStroke(ctx, "#A9A3BF", 1.2);
  circ(ctx, 4.5, peck ? -3 : -7.5, 2.6);
  fillStroke(ctx, "#8E86A8", 1.1);
  ctx.fillStyle = "#62D6A5";
  circ(ctx, 3.6, peck ? -1.6 : -6, 1);
  ctx.fill();
  ctx.fillStyle = PEACH;
  ctx.fillRect(6.6, peck ? -2.6 : -7.6, 2, 1);
  ctx.restore();
}

export function drawTree(ctx: C, kind: number, r: number, night: boolean) {
  const leaves = night ? ["#2F6B5E", "#285A50", "#3A5C77"] : ["#5CC48A", "#7ED69E", "#4FB58A"];
  ctx.save();
  rrect(ctx, -3.2, -r * 0.9, 6.4, r * 0.95, 2.5);
  fillStroke(ctx, night ? "#5A3F55" : "#9A6450", 1.8);
  const base = leaves[kind % 3];
  const blobs = kind === 1 ? [[0, -r * 1.55, r * 0.95]] : [[-r * 0.45, -r * 1.25, r * 0.7], [r * 0.45, -r * 1.3, r * 0.68], [0, -r * 1.75, r * 0.75]];
  for (const [x, y, rr] of blobs) {
    circ(ctx, x, y, rr);
    fillStroke(ctx, base, 2);
  }
  for (const [x, y, rr] of blobs) {
    circ(ctx, x - rr * 0.3, y - rr * 0.3, rr * 0.35);
    ctx.fillStyle = night ? "rgba(255,244,232,0.08)" : "rgba(255,255,255,0.22)";
    ctx.fill();
  }
  if (kind === 2 && !night) {
    for (let i = 0; i < 5; i++) {
      circ(ctx, Math.cos(i * 2.3) * r * 0.6, -r * 1.45 + Math.sin(i * 1.7) * r * 0.45, 1.6);
      ctx.fillStyle = PINK;
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawLamp(ctx: C, night: boolean) {
  rrect(ctx, -1.6, -44, 3.2, 44, 1.5);
  ctx.fillStyle = night ? "#3B2E52" : "#4A3B66";
  ctx.fill();
  rrect(ctx, -5, -50, 10, 7, 3);
  fillStroke(ctx, night ? "#FFE08A" : "#E9E1F2", 1.5);
}

export function drawHydrant(ctx: C) {
  rrect(ctx, -4, -13, 8, 13, 2.5);
  fillStroke(ctx, "#E8677E", 1.6);
  ell(ctx, 0, -13, 4.5, 2.2);
  fillStroke(ctx, "#F28E9E", 1.4);
  rrect(ctx, -6.5, -9, 13, 3, 1.5);
  fillStroke(ctx, "#E8677E", 1.2);
}

/* ── the title card: the skyline ───────────────────────────────────── */

/**
 * A city skyline at day or night, sized to fill w by h. The landmarks are
 * a tall stepped tower with a spire and a crowned one beside it, rooftop
 * water towers, and a bridge on two stone towers over the river: New
 * York's shapes without anybody's logo. Deterministic, so it can be
 * cached and redrawn identically.
 */
export function drawSkyline(ctx: C, w: number, h: number, night: boolean, t = 0) {
  const rnd = (() => {
    let a = 77;
    return () => {
      a = (a * 16807) % 2147483647;
      return a / 2147483647;
    };
  })();
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  if (night) {
    sky.addColorStop(0, "#110921");
    sky.addColorStop(0.55, "#2E1956");
    sky.addColorStop(1, "#7A3E78");
  } else {
    sky.addColorStop(0, "#79C3F2");
    sky.addColorStop(0.6, "#BFE3F8");
    sky.addColorStop(1, "#FFE3C2");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const ground = h * 0.8;
  if (night) {
    for (let i = 0; i < 70; i++) {
      const x = rnd() * w;
      const y = rnd() * ground * 0.7;
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
      ctx.fillStyle = `rgba(255,244,232,${0.35 + tw * 0.5})`;
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    circ(ctx, w * 0.82, h * 0.16, Math.min(w, h) * 0.06);
    ctx.fillStyle = "#FFF1C9";
    ctx.fill();
    circ(ctx, w * 0.82 + Math.min(w, h) * 0.025, h * 0.15, Math.min(w, h) * 0.055);
    ctx.fillStyle = "#2A1650";
    ctx.fill();
  } else {
    circ(ctx, w * 0.8, h * 0.2, Math.min(w, h) * 0.08);
    ctx.fillStyle = "#FFE08A";
    ctx.fill();
    circ(ctx, w * 0.8, h * 0.2, Math.min(w, h) * 0.06);
    ctx.fillStyle = SUN;
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      const cx = ((i * 0.37 + t * 0.006) % 1.2) * w - w * 0.1;
      const cy = h * (0.12 + i * 0.09);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (const [dx, dy, r] of [[0, 0, 16], [18, -6, 20], [38, 0, 15]]) {
        circ(ctx, cx + dx, cy + dy, r * (w / 900 + 0.5));
        ctx.fill();
      }
    }
  }
  /* Far skyline, hazy. */
  const far = night ? "#3A2464" : "#A5B4E6";
  ctx.fillStyle = far;
  let x = -10;
  while (x < w) {
    const bw = 24 + rnd() * 50;
    const bh = h * (0.18 + rnd() * 0.3);
    ctx.fillRect(x, ground - bh, bw, bh + 2);
    x += bw - 4;
  }
  /* The two landmarks. */
  const lx = w * 0.3;
  const unit = h / 260;
  ctx.fillStyle = night ? "#4B2F78" : "#8E9BD8";
  const steps: [number, number][] = [[46, 70], [36, 110], [26, 150], [16, 172], [8, 186]];
  for (const [sw, sh] of steps) ctx.fillRect(lx - (sw * unit) / 2, ground - sh * unit, sw * unit, sh * unit);
  ctx.fillRect(lx - 1.2 * unit, ground - 214 * unit, 2.4 * unit, 30 * unit);
  const cx2 = lx + 70 * unit;
  ctx.fillRect(cx2 - 15 * unit, ground - 140 * unit, 30 * unit, 140 * unit);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(cx2, ground - 140 * unit - i * 7 * unit, (15 - i * 3.4) * unit, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillRect(cx2 - 1 * unit, ground - 186 * unit, 2 * unit, 22 * unit);
  if (night) {
    ctx.fillStyle = "#FFE08A";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(cx2, ground - 140 * unit - i * 7 * unit, (13 - i * 3.4) * unit, Math.PI * 1.2, Math.PI * 1.8);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "#FFE08A";
      ctx.stroke();
    }
  }
  /* Near buildings with windows and water towers. */
  x = -6;
  const tones = night ? ["#2A1C48", "#33224F", "#3D2A5C", "#2E2050"] : ["#E28C7A", "#F2C08E", "#C98BB9", "#9AB7E0", "#F5D3A6"];
  while (x < w) {
    const bw = 34 + rnd() * 46;
    const bh = h * (0.12 + rnd() * 0.2);
    const top = ground - bh;
    ctx.fillStyle = tones[Math.floor(rnd() * tones.length)];
    ctx.fillRect(x, top, bw, bh + 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = night ? "#1A0F30" : INK;
    ctx.strokeRect(x, top, bw, bh + 2);
    for (let wy = top + 7; wy < ground - 6; wy += 10)
      for (let wx = x + 5; wx < x + bw - 6; wx += 9) {
        const lit = night ? rnd() < 0.55 : false;
        ctx.fillStyle = night ? (lit ? (rnd() < 0.7 ? "#FFD98A" : "#FF9F80") : "#24183F") : "rgba(42,22,54,0.28)";
        ctx.fillRect(wx, wy, 4.5, 5.5);
      }
    if (rnd() < 0.45) {
      /* A water tower on stilts: the rooftop shape that says New York. */
      const tx = x + bw * (0.3 + rnd() * 0.4);
      ctx.strokeStyle = night ? "#1A0F30" : INK;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tx - 5, top);
      ctx.lineTo(tx - 4, top - 6);
      ctx.moveTo(tx + 5, top);
      ctx.lineTo(tx + 4, top - 6);
      ctx.stroke();
      rrect(ctx, tx - 6, top - 16, 12, 10, 2);
      ctx.fillStyle = night ? "#5A3F55" : "#B97E5A";
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx - 7, top - 16);
      ctx.lineTo(tx, top - 22);
      ctx.lineTo(tx + 7, top - 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    x += bw + 2;
  }
  /* The river and the bridge. */
  ctx.fillStyle = night ? "#1C2F5E" : "#6CC3EE";
  ctx.fillRect(0, ground, w, h - ground);
  ctx.strokeStyle = night ? "rgba(255,217,138,0.35)" : "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 14; i++) {
    const yy = ground + 6 + (i % 5) * ((h - ground) / 5);
    const xx = ((i * 97 + t * 14) % (w + 60)) - 30;
    ctx.beginPath();
    ctx.moveTo(xx, yy);
    ctx.lineTo(xx + 18, yy);
    ctx.stroke();
  }
  const by = ground + (h - ground) * 0.35;
  const towers = [w * 0.58, w * 0.86];
  ctx.strokeStyle = night ? "#B9A2E8" : "#5A4D72";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 20; i++) {
    const xx = towers[0] + ((towers[1] - towers[0]) * i) / 20;
    const sag = Math.sin((i / 20) * Math.PI) * h * 0.08;
    ctx.beginPath();
    ctx.moveTo(xx, by - h * 0.17 + sag);
    ctx.lineTo(xx, by);
    ctx.stroke();
  }
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(towers[0], by - h * 0.17);
  ctx.quadraticCurveTo((towers[0] + towers[1]) / 2, by - h * 0.17 + h * 0.16, towers[1], by - h * 0.17);
  ctx.stroke();
  ctx.fillStyle = night ? "#6A4E7E" : "#C9A582";
  ctx.fillRect(towers[0] - w * 0.06, by - 3, w * 0.5, 6);
  for (const tx of towers) {
    const tw = w * 0.035;
    ctx.fillStyle = night ? "#6A4E7E" : "#C9A582";
    ctx.fillRect(tx - tw / 2, by - h * 0.2, tw, h * 0.2 + 3);
    ctx.fillStyle = night ? "#2E1956" : "#79C3F2";
    for (const ox of [-tw * 0.22, tw * 0.22]) {
      ctx.beginPath();
      ctx.moveTo(tx + ox - tw * 0.12, by - h * 0.06);
      ctx.lineTo(tx + ox - tw * 0.12, by - h * 0.13);
      ctx.arc(tx + ox, by - h * 0.13, tw * 0.12, Math.PI, 0);
      ctx.lineTo(tx + ox + tw * 0.12, by - h * 0.06);
      ctx.closePath();
      ctx.fill();
    }
  }
}
