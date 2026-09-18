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

const html = `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Karla:wght@400;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;background:#17120E;color:#F3E9DC;
       font-family:Karla,system-ui,sans-serif;display:flex;flex-direction:column;
       justify-content:space-between;padding:72px 80px;overflow:hidden;position:relative}
  /* The same warm orbit the welcome screen opens on, flattened to a still. */
  .glow{position:absolute;width:760px;height:760px;right:-240px;top:-190px;border-radius:50%;
        background:radial-gradient(circle,rgba(233,165,121,.20) 0%,rgba(233,165,121,.05) 45%,transparent 70%)}
  .ring{position:absolute;border:1.5px solid rgba(233,165,121,.30);border-radius:50%}
  .r1{width:430px;height:170px;right:-40px;top:130px;transform:rotate(-24deg)}
  .r2{width:170px;height:430px;right:95px;top:0;transform:rotate(-24deg)}
  .dot{position:absolute;width:44px;height:44px;border-radius:50%;right:158px;top:193px;
       background:radial-gradient(circle at 35% 30%,#F5C4A3,#C26C42)}
  .mark{font-size:30px;font-weight:600;letter-spacing:-.02em;position:relative}
  h1{font-size:72px;line-height:1.04;font-weight:600;letter-spacing:-.025em;max-width:790px;position:relative}
  p{font-size:26px;line-height:1.45;color:#C7B6A0;max-width:720px;margin-top:22px;position:relative}
  .foot{display:flex;gap:14px;align-items:center;font-size:19px;color:#A8967E;position:relative}
  .pill{border:1px solid rgba(243,233,220,.20);border-radius:999px;padding:7px 18px}
</style>
<div class="glow"></div><div class="ring r1"></div><div class="ring r2"></div><div class="dot"></div>
<div class="mark">Wellbeings</div>
<div>
  <h1>Understand your everyday wellbeing</h1>
  <p>Sleep, movement, food, stress, connection and routine — five minutes, then two or three changes worth actually making.</p>
</div>
<div class="foot">
  <span class="pill">Runs in your browser</span>
  <span class="pill">Nothing is sent anywhere</span>
  <span class="pill">Not a diagnosis</span>
</div>`;

const browser = await chromium.launch({ executablePath: EXECUTABLE, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT });
await browser.close();
console.log("wrote", OUT);
