/**
 * Regenerates the app icon set.
 *
 * Run: npm run icons
 *
 * WHAT WAS WRONG WITH THE OLD ONE
 *
 * Three things, and the third was an actual bug on phones.
 *
 *   1. It was a heart with an ECG trace through it. That is the stock icon
 *      for every health app there has ever been, and worse, it is a *medical*
 *      signifier on a product whose entire position is that it is not medical
 *      and does not diagnose. The icon was making a claim the app spends five
 *      pages walking back.
 *   2. It was violet on blue-black, left over from a palette the app stopped
 *      using. It matched nothing.
 *   3. It had pre-rounded corners with transparent margins outside them. iOS
 *      applies its own corner radius to a home-screen icon and composites it
 *      on an opaque background, so a pre-rounded source gets rounded twice and
 *      lands visibly smaller and mis-shapen than every icon beside it. Android
 *      adaptive launchers clip it again. This is why it "didn't reflect
 *      properly on mobile devices".
 *
 * WHAT IT IS NOW
 *
 * Four bars, descending in length, the first in clay and the rest in muted
 * warm neutral. That is the literal output of the product: your areas, sorted,
 * with one of them named as the place to start. It is not a heart, not a leaf,
 * not a sparkle, not a monogram, and it is legible at 16px because it is four
 * rectangles.
 *
 * GEOMETRY, AND WHY EACH FILE DIFFERS
 *
 *   any / apple   full-bleed square, no rounding, no transparency. The OS
 *                 rounds it. Anything we round ourselves gets rounded twice.
 *   maskable      the same mark shrunk into the central 60% circle, which is
 *                 the safe zone Android adaptive icons guarantee. Drawn on a
 *                 larger bleed so aggressive launcher shapes never cut it.
 *   favicon       16/32/48 stacked into a real .ico, because browsers still
 *                 ask for /favicon.ico by path.
 */
import { chromium } from "playwright-core";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = resolve(ROOT, "public");
const EXECUTABLE = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

/* Straight from the dark-theme tokens in app/globals.css. */
const GROUND = "#17120E";
const CLAY = "#E9A579";
const MUTED = "#8C7B66";

/**
 * The mark: four bars, descending, first one clay.
 *
 * @param size    canvas edge in px
 * @param content fraction of the canvas the MARK may occupy. The background
 *                always bleeds to the edge; only the bars are inset. 0.68 for
 *                a normal icon, 0.54 for maskable so an aggressive launcher
 *                shape still cannot clip a bar.
 */
function svg(size, content) {
  const box = size * content;
  const left = (size - box) / 2;

  /* Rhythm: 4 bars and 3 gaps. Bar height 2 units, gap 1.3 units, so the
     stack reads as separated rows rather than a solid block. */
  const unit = box / 11.9;
  const h = unit * 2;
  const gap = unit * 1.3;
  const stack = h * 4 + gap * 3;
  const top = (size - stack) / 2;

  /* Lengths are the point of the mark: one long, then three shorter. */
  const widths = [1, 0.74, 0.5, 0.29];

  /* Softened corners, not capsules. A fully rounded end at r = h/2 turns
     each bar into a pill, which is the pillowy look this palette avoids. */
  const r = h * 0.26;

  const bars = widths
    .map((w, i) => {
      const y = top + i * (h + gap);
      const bw = Math.max(box * w, h);
      return `<rect x="${left.toFixed(2)}" y="${y.toFixed(2)}" width="${bw.toFixed(2)}" height="${h.toFixed(2)}" rx="${r.toFixed(2)}" fill="${i === 0 ? CLAY : MUTED}"/>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Wellbeings">
  <rect width="${size}" height="${size}" fill="${GROUND}"/>${bars}</svg>`;
}

const page = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>`;

const browser = await chromium.launch({ executablePath: EXECUTABLE, args: ["--no-sandbox"] });

async function render(size, safe, out) {
  const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await p.setContent(page + svg(size, safe));
  const buf = await p.screenshot({ omitBackground: false });
  writeFileSync(out, buf);
  await p.close();
  return buf;
}

mkdirSync(PUB, { recursive: true });

await render(192, 0.68, resolve(PUB, "icon-192.png"));
await render(512, 0.68, resolve(PUB, "icon-512.png"));
// iOS never honours `maskable` and never honours transparency; it wants one
// opaque square at 180 and rounds it itself.
await render(180, 0.68, resolve(PUB, "apple-touch-icon.png"));
// 0.6 keeps every bar inside the guaranteed circle of an adaptive icon.
await render(512, 0.54, resolve(PUB, "icon-maskable.png"));

const ico16 = await render(16, 0.74, resolve(PUB, "_f16.png"));
const ico32 = await render(32, 0.74, resolve(PUB, "_f32.png"));
const ico48 = await render(48, 0.74, resolve(PUB, "_f48.png"));

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

// The vector, for anything that prefers it.
writeFileSync(resolve(PUB, "icon.svg"), svg(512, 0.68));

await browser.close();

// Scratch PNGs used only to build the .ico.
for (const f of ["_f16.png", "_f32.png", "_f48.png"]) {
  writeFileSync(resolve(PUB, f), Buffer.alloc(0));
}
import { unlinkSync } from "node:fs";
for (const f of ["_f16.png", "_f32.png", "_f48.png"]) unlinkSync(resolve(PUB, f));

console.log("icons written:");
for (const f of ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "icon-maskable.png", "icon.svg"]) {
  console.log("  public/" + f, readFileSync(resolve(PUB, f)).length + " bytes");
}
console.log("  public/favicon.ico", icoBuf.length + " bytes (16/32/48)");
