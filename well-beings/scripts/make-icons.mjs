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
 * The bloom-sun: a sun with eight petals instead of rays, on a midnight
 * plum ground with a low pink glow behind it. It replaced the four bars
 * when the app became a safe place first and a wellbeing check second;
 * the bars described what the app used to output, the bloom describes
 * what it is for. It is still not a heart, not a medical cross, not a
 * monogram, and it is still legible at 16px because the petals are few
 * and fat. Geometry lives in scripts/bloom.mjs, shared with the social
 * card and matching components/haven/BloomSun.tsx.
 *
 * GEOMETRY, AND WHY EACH FILE DIFFERS
 *
 *   any / apple   full-bleed square, no rounding, no transparency. The OS
 *                 rounds it. Anything we round ourselves gets rounded twice.
 *   maskable      the same mark shrunk to 56% of the tile. The W3C maskable
 *                 safe zone is a circle of 40% radius (80% across), and
 *                 Android's own adaptive icons keep 66 of 108dp (about 61%);
 *                 56% sits inside both, so no launcher shape cuts a petal.
 *   favicon       16/32/48 stacked into a real .ico, because browsers still
 *                 ask for /favicon.ico by path.
 */
import { chromium } from "playwright-core";
import { iconSvg } from "./bloom.mjs";
import { writeFileSync, readFileSync, mkdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = resolve(ROOT, "public");
const EXECUTABLE = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

/* The mark and its ground live in scripts/bloom.mjs. */
const svg = iconSvg;

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

await render(192, 0.72, resolve(PUB, "icon-192.png"));
await render(512, 0.72, resolve(PUB, "icon-512.png"));
// iOS never honours `maskable` and never honours transparency; it wants one
// opaque square at 180 and rounds it itself.
await render(180, 0.72, resolve(PUB, "apple-touch-icon.png"));
// 0.56: inside both the W3C safe zone and Android's 61% (see header).
await render(512, 0.56, resolve(PUB, "icon-maskable.png"));

// At favicon sizes the glow is mush, so the bloom takes nearly the tile.
const ico16 = await render(16, 0.92, resolve(PUB, "_f16.png"));
const ico32 = await render(32, 0.9, resolve(PUB, "_f32.png"));
const ico48 = await render(48, 0.86, resolve(PUB, "_f48.png"));

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
writeFileSync(resolve(PUB, "icon.svg"), svg(512, 0.72));

await browser.close();

// Scratch PNGs used only to build the .ico.
for (const f of ["_f16.png", "_f32.png", "_f48.png"]) unlinkSync(resolve(PUB, f));

console.log("icons written:");
for (const f of ["icon-192.png", "icon-512.png", "apple-touch-icon.png", "icon-maskable.png", "icon.svg"]) {
  console.log("  public/" + f, readFileSync(resolve(PUB, f)).length + " bytes");
}
console.log("  public/favicon.ico", icoBuf.length + " bytes (16/32/48)");
