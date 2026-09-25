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
 * The symbol comes from lib/mark-geometry.mjs; the text colours are pasted
 * from the dark-theme tokens in app/globals.css. If those change, change them
 * here too and re-run: there is no way to import CSS custom properties into a
 * standalone renderer.
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { markSvgBody } from "../lib/mark-geometry.mjs";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/og.png");
const EXECUTABLE = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

/* The card carries the symbol at poster scale, from the same geometry as the
   icon, so a shared link and the installed app look like the same thing.
   The copy promises only what is true with every setting at its default:
   voice typing and the optional AI listener can send words off the device
   when someone turns them on, so "nothing is sent anywhere" is no longer a
   claim this card is allowed to make. */
const GROUND = "#1A0F0D";

/* Karla comes from Google Fonts by default. Behind a proxy the headless
   browser cannot always reach it, and a card rendered in the fallback face
   gets committed without anyone noticing, so KARLA_TTF can point at a local
   copy of the variable font instead; it is embedded as a data URI because
   an about:blank page may not load file:// URLs. */
const fontFace = process.env.KARLA_TTF
  ? `<style>@font-face{font-family:Karla;font-weight:400 800;src:url(data:font/${process.env.KARLA_TTF.endsWith(".woff2") ? "woff2" : "ttf"};base64,${readFileSync(process.env.KARLA_TTF).toString("base64")})}</style>`
  : `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Karla:wght@400;600;700&display=swap" rel="stylesheet">`;

const html = `<!doctype html><meta charset="utf-8">
${fontFace}
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;background:${GROUND};color:#FFF1DE;
       font-family:Karla,system-ui,sans-serif;display:flex;
       padding:72px 72px 72px 80px;gap:48px;align-items:center;overflow:hidden}
  .copy{flex:1;min-width:0}
  .mark{font-size:30px;font-weight:700;letter-spacing:-.03em;margin-bottom:28px;color:#FFD25E}
  h1{font-size:70px;line-height:1.02;font-weight:700;letter-spacing:-.03em;max-width:600px}
  p{font-size:24px;line-height:1.45;color:#C9AE95;max-width:560px;margin-top:22px}
  .foot{display:flex;gap:12px;margin-top:36px;font-size:18px;color:#B19680}
  .pill{border:1px solid rgba(255,241,222,.22);border-radius:6px;padding:6px 16px;white-space:nowrap}
  svg{flex:none;display:block}
</style>
<div class="copy">
  <div class="mark">arun</div>
  <h1>A little light, every day.</h1>
  <p>A new line of hope each morning, one good thing noticed, and somewhere quiet to be heard.</p>
  <div class="foot">
    <span class="pill">Runs in your browser</span>
    <span class="pill">No account</span>
    <span class="pill">Not a diagnosis</span>
  </div>
</div>
<svg width="440" height="474" viewBox="8 8 104 112" aria-hidden="true">${markSvgBody({ detail: "full" })}</svg>`;

const browser = await chromium.launch({ executablePath: EXECUTABLE, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT });
await browser.close();
console.log("wrote", OUT);
