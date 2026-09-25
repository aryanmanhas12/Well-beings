/**
 * The bloom-sun as a standalone SVG string, for the scripts that render the
 * icons and the social card outside React.
 *
 * Same geometry as components/haven/BloomSun.tsx: a 64-unit box, eight
 * petals (ellipses at cy 15.5, rx 6.6, ry 11.5, rotated in 45° steps,
 * alternating pink and lilac), a sun disc of r 11.5 and a pale core of
 * r 6.5. If one changes, change the other; there is a comment on each
 * pointing here.
 */
export const PINK = "#FF7AB0";
export const LILAC = "#B794FF";
export const SUN = "#FFC857";
export const CORE = "#FFE3A1";
export const NIGHT_TOP = "#110921";
export const NIGHT_BOTTOM = "#2E1956";

/** The mark alone, as SVG elements in a 64×64 coordinate space. */
export function bloomElements() {
  const petals = Array.from({ length: 8 }, (_, i) => {
    const fill = i % 2 ? LILAC : PINK;
    return `<ellipse cx="32" cy="15.5" rx="6.6" ry="11.5" fill="${fill}" transform="rotate(${i * 45} 32 32)"/>`;
  }).join("");
  return `${petals}<circle cx="32" cy="32" r="11.5" fill="${SUN}"/><circle cx="32" cy="32" r="6.5" fill="${CORE}" opacity="0.85"/>`;
}

/**
 * A full icon: midnight ground with a low glow, and the bloom centred.
 *
 * @param size    canvas edge in px
 * @param content fraction of the canvas the bloom's diameter may occupy.
 *                The background always bleeds to the edge.
 */
export function iconSvg(size, content) {
  /* The bloom's outer petal tips sit 28 units from centre in a 64-unit box,
     so its diameter is 56 units. Scale that to `content` of the canvas. */
  const scale = (content * size) / 56;
  const offset = size / 2 - 32 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Arun">
  <defs>
    <linearGradient id="n" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NIGHT_TOP}"/>
      <stop offset="1" stop-color="${NIGHT_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${PINK}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${PINK}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#n)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${(content * size) / 1.45}" fill="url(#g)"/>
  <g transform="translate(${offset.toFixed(2)} ${offset.toFixed(2)}) scale(${scale.toFixed(4)})">${bloomElements()}</g>
</svg>`;
}
