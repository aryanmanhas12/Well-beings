/**
 * Regenerates public/og.png, the social preview card.
 *
 * Run: npm run og
 *
 * Requires playwright-core and a Chromium binary, neither of which is a
 * dependency of this project: the PNG it produces is committed, and it only
 * needs regenerating when the wording or the palette changes. Install them ad
 * hoc (`npm i -D playwright-core && npx playwright install chromium`) or point
 * CHROMIUM_PATH at an existing browser.
 *
 * It is a build-time artefact, identical for every visitor and every page, and
 * that is deliberate rather than a limitation: a per-page or per-result social
 * image is exactly the mechanism by which a wellbeing tool leaks somebody's
 * answers into a link preview. There is no code path here that can see user
 * data, because this runs on a developer's machine long before anyone answers
 * anything.
 *
 * Colours are pasted from the tokens and the sky in app/globals.css, and the
 * mark comes from scripts/bloom.mjs. If those change, re-run; there is no
 * way to import CSS custom properties into a standalone renderer.
 */
import { chromium } from "playwright-core";
import { bloomElements } from "./bloom.mjs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { readdirSync, readFileSync, existsSync } from "node:fs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/og.png");

/* Karla, taken from the last build rather than from Google Fonts. The
   headless browser that renders this card often has no route to
   fonts.googleapis.com, and when it does not the card silently renders in
   whatever sans the machine has, which is how an earlier run of this
   script shipped a card in DejaVu. Run a build first; the Latin subset is
   the file whose unicode-range starts at U+00. */
function karlaDataUrl() {
  const dir = join(ROOT, "out/_next/static/chunks");
  if (!existsSync(dir)) throw new Error("Run a build first: the card takes Karla from out/_next.");
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".css"))) {
    const css = readFileSync(join(dir, f), "utf8");
    for (const face of css.match(/@font-face\{[^}]*\}/g) || []) {
      if (!/font-family:Karla;/.test(face) || !/unicode-range:U\+\?\?/.test(face)) continue;
      const url = face.match(/url\(\.\.\/media\/([^)]+)\)/)?.[1];
      if (!url) continue;
      const buf = readFileSync(join(ROOT, "out/_next/static/media", url));
      return "data:font/woff2;base64," + buf.toString("base64");
    }
  }
  throw new Error("Karla's Latin subset was not found in the build CSS.");
}
const KARLA = karlaDataUrl();
const EXECUTABLE = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

/* The card is the app's own first screen, flattened: a sunrise panel with
   the bloom-sun coming up over the hills, and the one sentence that says
   what the place is. No screenshot of a real person's check-in could ever
   end up here, because this runs once at build time on a developer's
   machine. */
const html = `<!doctype html><meta charset="utf-8">
<style>
  @font-face{font-family:Karla;font-weight:200 800;src:url(${KARLA}) format("woff2")}
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;background:#110921;color:#FFF4E8;
       font-family:Karla,system-ui,sans-serif;display:flex;
       padding:64px 64px 64px 80px;gap:56px;align-items:center;overflow:hidden}
  .copy{flex:1;min-width:0}
  .mark{display:flex;align-items:center;gap:14px;font-size:28px;font-weight:600;letter-spacing:-.02em;margin-bottom:34px}
  h1{font-size:64px;line-height:1.04;font-weight:700;letter-spacing:-.025em;max-width:600px}
  p{font-size:24px;line-height:1.45;color:#CFC3DE;max-width:560px;margin-top:22px}
  .foot{display:flex;gap:12px;margin-top:34px;font-size:18px;color:#BDB0D0}
  .pill{border:1px solid rgba(251,241,230,.22);border-radius:999px;padding:6px 16px}
  .sky{position:relative;flex:none;width:400px;height:500px;border-radius:28px;overflow:hidden;
       background:linear-gradient(180deg,#3B1D63 0%,#7A2E7E 48%,#E8677E 78%,#FFB26B 100%)}
  .glow{position:absolute;left:50%;bottom:-150px;width:520px;height:420px;margin-left:-260px;border-radius:50%;
        background:radial-gradient(closest-side,#FFC857,transparent);opacity:.75}
  .sun{position:absolute;left:50%;bottom:14px;margin-left:-120px}
  .hills{position:absolute;left:0;right:0;bottom:0;width:100%;height:120px}
  .star{position:absolute;width:4px;height:4px;border-radius:50%;background:#FFF4DE;opacity:.7}
</style>
<div class="copy">
  <div class="mark"><svg width="44" height="44" viewBox="0 0 64 64">${bloomElements()}</svg>Wellbeings</div>
  <h1>A quiet place for the hard days</h1>
  <p>Check in with two taps. Breathe with the sun, keep a hope box and a safety plan, and reach the right people fast.</p>
  <div class="foot">
    <span class="pill">Nothing leaves your phone</span>
    <span class="pill">Free helplines, one tap</span>
  </div>
</div>
<div class="sky">
  <span class="star" style="left:70%;top:9%"></span><span class="star" style="left:84%;top:18%"></span>
  <span class="star" style="left:22%;top:12%"></span><span class="star" style="left:48%;top:6%"></span>
  <div class="glow"></div>
  <svg class="sun" width="240" height="240" viewBox="0 0 64 64">${bloomElements()}</svg>
  <svg class="hills" viewBox="0 0 400 90" preserveAspectRatio="none">
    <path fill="#5B2A6E" d="M0 52 C 60 30, 110 34, 170 48 S 290 26, 400 40 L 400 90 L 0 90 Z"/>
    <path fill="#3A1B4F" d="M0 70 C 70 52, 140 58, 210 66 S 330 54, 400 62 L 400 90 L 0 90 Z"/>
  </svg>
</div>`;

const browser = await chromium.launch({ executablePath: EXECUTABLE, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT });
await browser.close();
console.log("wrote", OUT);
