/**
 * The Arun symbol: the sun rising between two mountains, seen through a
 * square window.
 *
 * The window is the doorway idea kept from earlier drafts: somewhere safe
 * to look out from, someone who leaves a light on. Through it, a blue sky
 * warming towards the horizon, the sun coming up in the gap between two
 * peaks, and its rays. Hope, drawn as a view rather than a slogan. No
 * heart, leaf, hands or brain anywhere in it.
 *
 * Plain .mjs so the Node icon and social-card scripts and the React
 * component (components/ArunMark.tsx) all draw from this one file.
 *
 * Everything is on a 120-unit square. No clipPath: every shape is drawn
 * inside the glass, and the frame is one even-odd path laid over the top,
 * so many copies can sit on one page without id collisions.
 */

export const VIEWBOX = "0 0 120 120";
export const STANDALONE_VIEWBOX = "8 8 104 112";

/* Glass: x 22..98, y 40..114. The sun sits on the top edge of the frame,
   half inside the window and half above it, with its rays breaking out.
   The first draft put the sun inside the glass behind the mountains, and
   at icon size it read as the stock "image" placeholder: a picture frame
   with peaks in it. A sun that crosses the frame is what makes it a
   window someone is looking out of, and not a photo. */
const X0 = 22;
const X1 = 98;
const Y0 = 40;
const Y1 = 114;

/* Flat bands, blue at the top warming to the horizon. Bands read as
   printed; a gradient wash is the generated-image tell. */
export const SKY = [
  { y: Y0, h: 22, fill: "#3E9FD0" },
  { y: 62, h: 14, fill: "#86CBE6" },
  { y: 76, h: 10, fill: "#FFD98A" },
  { y: 86, h: 28, fill: "#EE7A45" },
];

export const SUN = "#FFD25E";
export const FRAME = "#FFF1DE";

const SUN_X = 60;
const SUN_Y = Y0;
const SUN_R = 16;
const RAY_ANGLES = [-162, -126, -90, -54, -18];
/* The middle ray is always lit; the other four light one per good thing
   kept this week (the Hope tab's good things), from the centre outwards. */
const RAY_ORDER = [2, 1, 3, 0, 4];

export function rays(detail = "full") {
  const angles = detail === "full" ? RAY_ANGLES : detail === "medium" ? [-126, -90, -54] : [];
  return angles.map((deg) => {
    const t = (deg * Math.PI) / 180;
    return {
      i: RAY_ANGLES.indexOf(deg),
      x1: r2(SUN_X + (SUN_R + 5) * Math.cos(t)),
      y1: r2(SUN_Y + (SUN_R + 5) * Math.sin(t)),
      x2: r2(SUN_X + (SUN_R + 13) * Math.cos(t)),
      y2: r2(SUN_Y + (SUN_R + 13) * Math.sin(t)),
    };
  });
}

export function rayLit(i, lit) {
  if (lit === undefined) return true;
  return RAY_ORDER.indexOf(i) <= lit;
}

/* Two cool peaks and a rose ridge: the warm sky between them is what the
   eye goes to. */
export const MOUNTAINS = [
  { d: `M ${X0} ${Y1} V 92 L 42 72 L 70 ${Y1} Z`, fill: "#2A8A94" },
  { d: `M 52 ${Y1} L 78 68 L ${X1} 88 V ${Y1} Z`, fill: "#1F6B82" },
  { d: `M ${X0} ${Y1} V 104 Q 44 96 62 103 T ${X1} 101 V ${Y1} Z`, fill: "#C2304F" },
];

const F = 5; // frame thickness: the window margin
export const FRAME_PATH =
  `M ${X0 - F + 4} ${Y0 - F} H ${X1 + F - 4} A 4 4 0 0 1 ${X1 + F} ${Y0 - F + 4} V ${Y1 + F - 4} A 4 4 0 0 1 ${X1 + F - 4} ${Y1 + F} ` +
  `H ${X0 - F + 4} A 4 4 0 0 1 ${X0 - F} ${Y1 + F - 4} V ${Y0 - F + 4} A 4 4 0 0 1 ${X0 - F + 4} ${Y0 - F} Z ` +
  `M ${X0} ${Y0} V ${Y1} H ${X1} V ${Y0} Z`;

export function detailFor(px) {
  if (px >= 96) return "full";
  if (px >= 40) return "medium";
  return "tiny";
}

/**
 * The symbol as an SVG fragment on a 120-unit square.
 * @param {object} o
 * @param {"full"|"medium"|"tiny"} [o.detail]
 * @param {number} [o.lit] 0-4 extra rays lit; undefined = all
 * @param {string} [o.frame] frame colour
 */
export function markSvgBody({ detail = "full", lit, frame = FRAME } = {}) {
  const p = [];
  for (const b of SKY) p.push(`<rect x="${X0}" y="${b.y}" width="${X1 - X0}" height="${b.h}" fill="${b.fill}"/>`);
  const mountains = detail === "tiny" ? MOUNTAINS.slice(0, 2) : MOUNTAINS;
  for (const m of mountains) p.push(`<path d="${m.d}" fill="${m.fill}"/>`);
  p.push(`<path d="${FRAME_PATH}" fill="${frame}" fill-rule="evenodd"/>`);
  /* Drawn over the frame: the sun belongs to the margin, not the glass. */
  p.push(`<circle cx="${SUN_X}" cy="${SUN_Y}" r="${detail === "tiny" ? SUN_R + 3 : SUN_R}" fill="${SUN}"/>`);
  const w = detail === "full" ? 3.4 : 4.4;
  for (const r of rays(detail)) {
    p.push(
      `<line x1="${r.x1}" y1="${r.y1}" x2="${r.x2}" y2="${r.y2}" stroke="${SUN}" stroke-width="${w}" stroke-linecap="round" stroke-opacity="${rayLit(r.i, lit) ? 1 : 0.3}"/>`,
    );
  }
  return p.join("");
}

function r2(n) {
  return Math.round(n * 100) / 100;
}
