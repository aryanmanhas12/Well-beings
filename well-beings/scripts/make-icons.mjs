/**
 * Regenerates the app icon set.
 *
 * Run: npm run icons
 *
 * History: a heart with an ECG line (a medical signifier on an app that is
 * not medical), then four descending bars (the literal output of the
 * check-in, which is no longer the point of the app), now the Arun symbol
 * from lib/mark-geometry.mjs: the sun rising out of a square window over
 * blue sky and mountains.
 *
 * any / apple   full-bleed square, no rounding, no transparency. The OS
 *               rounds it; anything rounded here gets rounded twice.
 * maskable      shrunk so the whole symbol sits inside the circle whose
 *               radius is 40% of the width, which adaptive launchers keep.
 * favicon       16/32/48 in a real .ico, with rays and the ridge dropped as
 *               the size falls (detailFor).
 */
import { chromium } from "playwright-core";
import { writeFileSync, readFileSync, mkdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { markSvgBody, detailFor } from "../lib/mark-geometry.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = resolve(ROOT, "public");
const EXECUTABLE = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

/* The night version, always: the blue sky and gold sun need the dark
   around them to read as light. The logo canvas drew it on its own
   brown-black (#1A0F0D); this is the app's plum night (--color-bg,
   #110921) instead, so the icon, the manifest's splash background and the
   first frame of the app are one colour when a phone opens it. */
const GROUND = "#110921";

/**
 * One square icon.
 *
 * @param size  canvas edge in px
 * @param kind  "any" (full-bleed square the OS rounds), "maskable" (shrunk
 *              into the 80% safe circle) or "favicon" (enlarged, less detail)
 */
function svg(size, kind = "any") {
  const detail = detailFor(size);
  /* The symbol runs from the ray tips (y 11) to the frame's foot (y 119),
     so it is scaled about the centre to leave room at both edges. */
  const scale = kind === "maskable" ? 0.7 : kind === "favicon" ? 0.98 : 0.84;
  const body = `<g transform="translate(60 61) scale(${scale}) translate(-60 -65)">${markSvgBody({ detail })}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="Arun">
  <rect width="120" height="120" fill="${GROUND}"/>${body}</svg>`;
}

const page = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>`;

const browser = await chromium.launch({ executablePath: EXECUTABLE, args: ["--no-sandbox"] });

async function render(size, kind, out) {
  const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await p.setContent(page + svg(size, kind));
  const buf = await p.screenshot({ omitBackground: false });
  writeFileSync(out, buf);
  await p.close();
  return buf;
}

mkdirSync(PUB, { recursive: true });

await render(192, "any", resolve(PUB, "icon-192.png"));
await render(512, "any", resolve(PUB, "icon-512.png"));
// iOS never honours `maskable` and never honours transparency; it wants one
// opaque square at 180 and rounds it itself.
await render(180, "any", resolve(PUB, "apple-touch-icon.png"));
await render(512, "maskable", resolve(PUB, "icon-maskable.png"));

const ico16 = await render(16, "favicon", resolve(PUB, "_f16.png"));
const ico32 = await render(32, "favicon", resolve(PUB, "_f32.png"));
const ico48 = await render(48, "favicon", resolve(PUB, "_f48.png"));

/* A real multi-size .ico. The format allows a PNG payload per entry, which is
   what every browser since IE11 reads, so there is no need to emit BMP. */
function ico(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 0);
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1);
    dir.writeUInt8(0, o + 2); // palette
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // colour planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(e.buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.buf.length;
  });
  return Buffer.concat([header, dir, ...entries.map((e) => e.buf)]);
}

const icoBuf = ico([
  { size: 16, buf: ico16 },
  { size: 32, buf: ico32 },
  { size: 48, buf: ico48 },
]);
/* public/, not app/. Next runs app/favicon.ico through its image pipeline,
   which rejects a PNG payload without an alpha channel — and Chromium writes
   opaque RGB when the page has an opaque background, which this one does by
   design. public/ is copied verbatim, and the <link> is declared explicitly
   in app/layout.tsx, so nothing is lost by keeping it out of the pipeline. */
writeFileSync(resolve(PUB, "favicon.ico"), icoBuf);

/* The vector. Browsers use it for the tab when they prefer SVG, and an SVG
   cannot know what size it will be drawn at, so it carries the mid-detail
   favicon rendering: a bigger sun and no rays. That reads at 16px and
   still looks deliberate at 512. */
writeFileSync(resolve(PUB, "icon.svg"), svg(48, "favicon").replace('width="48" height="48"', 'width="512" height="512"'));

await browser.close();

// Scratch PNGs used only to build the .ico.
for (const f of ["_f16.png", "_f32.png", "_f48.png"]) unlinkSync(resolve(PUB, f));

console.log("icons written:");
for (const f of ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "icon-maskable.png", "icon.svg"]) {
  console.log("  public/" + f, readFileSync(resolve(PUB, f)).length + " bytes");
}
console.log("  public/favicon.ico", icoBuf.length + " bytes (16/32/48)");
