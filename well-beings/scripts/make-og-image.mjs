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
 * Colours are pasted from the dark-theme tokens in app/globals.css. If those
 * change, change them here too and re-run; there is no way to import CSS
 * custom properties into a standalone renderer.
 */
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/og.png");
const EXECUTABLE = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

/* The card used to carry the same orbiting rings and radial glow the welcome
   screen had. Both are gone from the product for the same reason: a glowing
   orb is decoration that says nothing. What replaces it is the mark itself —
   four bars, descending, the first in clay — which is the actual shape of
   what the app produces and now the shape of its icon. */
const html = `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Karla:wght@400;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;background:#17120E;color:#F3E9DC;
       font-family:Karla,system-ui,sans-serif;display:flex;
       padding:72px 80px;gap:64px;align-items:center;overflow:hidden}
  .copy{flex:1;min-width:0}
  .mark{font-size:27px;font-weight:600;letter-spacing:-.02em;margin-bottom:30px}
  h1{font-size:66px;line-height:1.05;font-weight:600;letter-spacing:-.025em;max-width:660px}
  p{font-size:24px;line-height:1.45;color:#C7B6A0;max-width:620px;margin-top:20px}
  .foot{display:flex;gap:12px;margin-top:38px;font-size:18px;color:#A8967E}
  .pill{border:1px solid rgba(243,233,220,.20);border-radius:6px;padding:6px 16px}
  /* The mark, at poster scale. Same geometry as scripts/make-icons.mjs. */
  .bars{flex:none;width:250px;display:flex;flex-direction:column;gap:22px}
  .bars i{display:block;height:34px;border-radius:9px;background:#8C7B66}
  .bars i:nth-child(1){width:100%;background:#E9A579}
  .bars i:nth-child(2){width:74%}
  .bars i:nth-child(3){width:50%}
  .bars i:nth-child(4){width:29%}
</style>
<div class="copy">
  <div class="mark">Wellbeings</div>
  <h1>Understand your everyday wellbeing</h1>
  <p>Sleep, movement, food, stress, connection and routine. Five minutes, then two or three changes worth actually making.</p>
  <div class="foot">
    <span class="pill">Runs in your browser</span>
    <span class="pill">Nothing is sent anywhere</span>
    <span class="pill">Not a diagnosis</span>
  </div>
</div>
<div class="bars"><i></i><i></i><i></i><i></i></div>`;

const browser = await chromium.launch({ executablePath: EXECUTABLE, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT });
await browser.close();
console.log("wrote", OUT);
