/**
 * Ooh: the companion character shared by Arun and Ronak.
 *
 * One file draws Ooh everywhere, in both apps, so the two can never drift
 * apart the way two hand-drawn copies of a logo did in this repo once
 * already. It is plain JavaScript that returns SVG strings, with no React
 * and no build step, so Ronak's vanilla app.js can import it unchanged:
 *
 *   import { oohSvg, OOH_CSS } from "./ooh.mjs";
 *   style.textContent = OOH_CSS;
 *   el.innerHTML = oohSvg({ mood: "hello", size: 72 });
 *
 * WHO OOH IS
 *
 * A small round creature the colour of the sun coming up, with a tiny
 * bloom growing out of its head: the pink and lilac petals of the bloom-sun
 * both apps grew up with. Big eyes, rosy cheeks, stubby arms, drawn like a
 * comic: flat colour and a thick plum outline.
 *
 * The name is the sound people make when something lands: "ooh". It needs
 * no translation, which matters for two apps that speak six languages
 * between them, and Ooh's signature face is that round "ooh!" mouth.
 *
 * WHAT OOH IS NOT
 *
 * Not a person, not a therapist, and not watching anyone. Ooh narrates the
 * page it is on. Lines that could be read as "someone is here with you
 * right now" are a safety bug in an app with no staff (see AGENTS.md), so
 * on a heavy day Ooh points at people who can actually answer.
 *
 * Everything is on a 120-unit square. No ids, no <defs>, no clipPath, so
 * any number of copies can sit on one page.
 */

export const INK = "#2A1636";
export const SUN = "#FFC857";
export const SUN_LIGHT = "#FFE08A";
export const PEACH = "#FF9F80";
export const PINK = "#FF7AB0";
export const LILAC = "#B794FF";
export const CREAM = "#FFF8EE";
export const MOUTH = "#7A2748";

/**
 * The moods, and when each is for.
 *   hello   waving; the first thing on a page.
 *   ooh     the signature: round mouth, hands to cheeks. Something good.
 *   happy   eyes closed in a smile, arms up. Something kept or done.
 *   calm    eyes softly shut, arms down. Breathing, rest.
 *   listen  head tilted, hand to the side. Someone is saying something.
 *   care    soft brows, hands together. A heavy day. Never tearful: a
 *           character crying at someone who is struggling makes it about
 *           the character.
 *   think   looking up, hand by the chin. Plans, guides, small print.
 *   sleepy  half-closed eyes. Late at night.
 */
export const MOODS = ["hello", "ooh", "happy", "calm", "listen", "care", "think", "sleepy"];

const S = `stroke="${INK}" stroke-linecap="round" stroke-linejoin="round"`;

function arm(cx, cy, rot) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="6.5" ry="10" transform="rotate(${rot} ${cx} ${cy})" fill="${SUN}" ${S} stroke-width="3.5"/>`;
}

/* Arms drawn BEHIND the body peek out from its sides; arms drawn IN FRONT
   are hands on the belly or at the cheeks. */
const ARMS = {
  rest: { back: arm(22, 82, 25) + arm(98, 82, -25), front: "" },
  wave: { back: arm(22, 82, 25) + arm(103, 50, -40), front: "" },
  up: { back: arm(14, 54, 50) + arm(106, 54, -50), front: "" },
  down: { back: arm(25, 88, 12) + arm(95, 88, -12), front: "" },
  cheeks: { back: "", front: arm(29, 83, 10) + arm(91, 83, -10) },
  together: { back: "", front: arm(51, 100, 72) + arm(69, 100, -72) },
  chin: { back: arm(22, 82, 25), front: arm(80, 95, -30) },
  ear: { back: arm(22, 82, 25) + arm(100, 60, -20), front: "" },
};

const EYE_L = 46;
const EYE_R = 74;
const EYE_Y = 66;

function openEyes({ dx = 1, dy = 2, rx = 8, ry = 9.5, pupil = 5 } = {}) {
  const one = (x) =>
    `<ellipse cx="${x}" cy="${EYE_Y}" rx="${rx}" ry="${ry}" fill="${CREAM}" ${S} stroke-width="3"/>` +
    `<circle cx="${x + dx}" cy="${EYE_Y + dy}" r="${pupil}" fill="${INK}"/>` +
    `<circle cx="${x + dx + 2}" cy="${EYE_Y + dy - 2.5}" r="1.9" fill="${CREAM}"/>`;
  /* The class is what blinks (OOH_CSS). Closed eyes never blink. */
  return `<g class="ooh-blink">${one(EYE_L)}${one(EYE_R)}</g>`;
}

function arcEyes(up) {
  const d = (x) => (up ? `M ${x - 8} ${EYE_Y + 2} Q ${x} ${EYE_Y - 7} ${x + 8} ${EYE_Y + 2}` : `M ${x - 8} ${EYE_Y - 1} Q ${x} ${EYE_Y + 6} ${x + 8} ${EYE_Y - 1}`);
  return `<path d="${d(EYE_L)}" fill="none" ${S} stroke-width="3.5"/><path d="${d(EYE_R)}" fill="none" ${S} stroke-width="3.5"/>`;
}

function sleepyEyes() {
  const one = (x) =>
    `<path d="M ${x - 8} ${EYE_Y} Q ${x} ${EYE_Y + 7} ${x + 8} ${EYE_Y} Z" fill="${CREAM}" ${S} stroke-width="3"/>` +
    `<circle cx="${x + 1}" cy="${EYE_Y + 2.6}" r="2.6" fill="${INK}"/>`;
  return one(EYE_L) + one(EYE_R);
}

function brows(kind) {
  if (kind === "raised")
    return `<path d="M 38 52 Q 46 46 54 51" fill="none" ${S} stroke-width="3"/><path d="M 66 51 Q 74 46 82 52" fill="none" ${S} stroke-width="3"/>`;
  if (kind === "soft")
    /* Inner ends up: concern, not alarm. */
    return `<path d="M 38 56 Q 45 54 52 51" fill="none" ${S} stroke-width="3"/><path d="M 68 51 Q 75 54 82 56" fill="none" ${S} stroke-width="3"/>`;
  return "";
}

const MOUTHS = {
  smile: `<path d="M 52 82 Q 60 90 68 82" fill="none" ${S} stroke-width="3.5"/>`,
  grin: `<path d="M 50 80 Q 60 96 70 80 Z" fill="${MOUTH}" ${S} stroke-width="3"/><path d="M 55 88 Q 60 92 65 88" fill="${PINK}"/>`,
  ooh: `<ellipse cx="60" cy="86" rx="5" ry="6.5" fill="${MOUTH}" ${S} stroke-width="3"/>`,
  small: `<path d="M 55 85 Q 60 88.5 65 85" fill="none" ${S} stroke-width="3.2"/>`,
  soft: `<path d="M 54 87 Q 60 84.5 66 87" fill="none" ${S} stroke-width="3.2"/>`,
  side: `<path d="M 56 86 Q 63 88 68 84" fill="none" ${S} stroke-width="3.2"/>`,
};

const FACES = {
  hello: { eyes: () => openEyes(), brows: "", mouth: "grin", arms: "wave" },
  ooh: { eyes: () => openEyes({ rx: 9, ry: 11, pupil: 5.5, dy: 0 }), brows: "raised", mouth: "ooh", arms: "cheeks" },
  happy: { eyes: () => arcEyes(true), brows: "", mouth: "grin", arms: "up" },
  calm: { eyes: () => arcEyes(false), brows: "", mouth: "small", arms: "down" },
  listen: { eyes: () => openEyes({ dx: 2, dy: 1 }), brows: "", mouth: "small", arms: "ear", tilt: -7 },
  care: { eyes: () => openEyes({ dx: 0, dy: 3 }), brows: "soft", mouth: "soft", arms: "together" },
  think: { eyes: () => openEyes({ dx: 2.5, dy: -2.5 }), brows: "", mouth: "side", arms: "chin" },
  sleepy: { eyes: () => sleepyEyes(), brows: "", mouth: "small", arms: "down" },
};

/**
 * Ooh as a string of SVG elements on the 120-unit square, for embedding
 * inside an <svg viewBox="0 0 120 120"> you already have.
 * @param {string} mood one of MOODS; anything else draws "hello".
 */
export function oohBody(mood = "hello") {
  const f = FACES[mood] ?? FACES.hello;
  const arms = ARMS[f.arms];
  const p = [];
  /* The sprout: a stem and the bloom-sun's two petals. Its own group so it
     can sway. */
  p.push(
    `<g class="ooh-sprout">` +
      `<path d="M 60 34 Q 58 26 60 18" fill="none" ${S} stroke-width="3"/>` +
      `<ellipse cx="50.5" cy="14" rx="9.5" ry="5.4" transform="rotate(-26 50.5 14)" fill="${PINK}" ${S} stroke-width="2.8"/>` +
      `<ellipse cx="69.5" cy="14" rx="9.5" ry="5.4" transform="rotate(26 69.5 14)" fill="${LILAC}" ${S} stroke-width="2.8"/>` +
      `<circle cx="60" cy="17" r="4.4" fill="${SUN}" ${S} stroke-width="2.6"/>` +
      `</g>`,
  );
  p.push(`<ellipse cx="45" cy="107" rx="10" ry="5.5" fill="${PEACH}" ${S} stroke-width="3.2"/>`);
  p.push(`<ellipse cx="75" cy="107" rx="10" ry="5.5" fill="${PEACH}" ${S} stroke-width="3.2"/>`);
  p.push(arms.back);
  /* The body: a round, slightly bottom-heavy sunrise. */
  p.push(`<path d="M 60 33 C 88 33 101 52 101 74 C 101 96 85 106 60 106 C 35 106 19 96 19 74 C 19 52 32 33 60 33 Z" fill="${SUN}" ${S} stroke-width="4"/>`);
  p.push(`<ellipse cx="60" cy="93" rx="25" ry="10" fill="${SUN_LIGHT}"/>`);
  p.push(`<ellipse cx="40" cy="47" rx="8" ry="4" transform="rotate(-32 40 47)" fill="${CREAM}" opacity="0.85"/>`);
  p.push(`<ellipse cx="35" cy="80" rx="6.5" ry="3.8" fill="${PINK}" opacity="0.8"/>`);
  p.push(`<ellipse cx="85" cy="80" rx="6.5" ry="3.8" fill="${PINK}" opacity="0.8"/>`);
  p.push(brows(f.brows));
  p.push(f.eyes());
  p.push(MOUTHS[f.mouth]);
  p.push(arms.front);
  const body = p.join("");
  return f.tilt ? `<g transform="rotate(${f.tilt} 60 74)">${body}</g>` : body;
}

/**
 * A whole <svg> of Ooh.
 * @param {object} o
 * @param {string} [o.mood]
 * @param {number} [o.size] px
 * @param {string} [o.label] when set, Ooh is announced with this name;
 *   otherwise decorative (the words next to Ooh carry the meaning).
 */
export function oohSvg({ mood = "hello", size = 72, label } = {}) {
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, "&quot;")}"` : `aria-hidden="true" focusable="false"`;
  return `<svg class="ooh-svg" width="${size}" height="${size}" viewBox="0 0 120 120" ${a11y}><g class="ooh-bob">${oohBody(mood)}</g></svg>`;
}

/* The motion, for pages that do not have it in their own stylesheet. Slow,
   small, and off under reduced motion: Ooh breathes and blinks, it never
   bounces for attention. transform-box keeps each origin on its own shape. */
export const OOH_CSS = `
.ooh-svg .ooh-bob{animation:ooh-bob 3.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
.ooh-svg .ooh-blink{animation:ooh-blink 5.2s infinite;transform-box:fill-box;transform-origin:50% 50%}
.ooh-svg .ooh-sprout{animation:ooh-sway 4.4s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes ooh-bob{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-2.5px) scale(1.01,.99)}}
@keyframes ooh-blink{0%,93%,100%{transform:scaleY(1)}95.5%{transform:scaleY(.08)}}
@keyframes ooh-sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
@media (prefers-reduced-motion: reduce){.ooh-svg .ooh-bob,.ooh-svg .ooh-blink,.ooh-svg .ooh-sprout{animation:none}}
`;
