import { chromium, BASE, LAUNCH } from "./lib.mjs";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
/* Screenshots for a person to look at: E2E_SHOTS, or a temporary folder. */
const SHOTS = process.env.E2E_SHOTS || join(tmpdir(), "arun-e2e");
mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({ executablePath: LAUNCH.executablePath, args: ["--no-sandbox"] });

/* The sunrise now plays once per session. Tests start past it, unless a
   context is made with { __intro: true } to test the sunrise itself. */
{
  const __real = browser.newContext.bind(browser);
  browser.newContext = async (o = {}) => {
    const { __intro, ...rest } = o;
    const c = await __real(rest);
    if (!__intro) await c.addInitScript(() => { try { sessionStorage.setItem("arun-intro-session", "e2e"); } catch {} });
    return c;
  };
}
let fail = 0;
for (const scheme of ["dark", "light"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme });
  await ctx.addInitScript(() => {
    const d = new Date(); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true, goodThings: [{ date: k, items: ["the chai was hot", "a friend replied"] }] }));
  });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(BASE, { waitUntil: "networkidle" });
  const frame = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--mark-frame").trim());
  const word = await p.locator("header .arun-wordmark").innerText();
  console.log(scheme, "frame", frame, "wordmark", JSON.stringify(word));
  if (word !== "arun") fail++;
  await p.locator("header").screenshot({ path: `${SHOTS}/logo-header-${scheme}.png` });
  await p.getByRole("button", { name: /^Hope$/ }).first().click();
  await p.getByRole("button", { name: /Good things/ }).first().click();
  const note = await p.locator(".rays-note").innerText();
  console.log(" rays:", note);
  if (!note.startsWith("3 of 5")) fail++;
  await p.locator(".rays-week").screenshot({ path: `${SHOTS}/logo-rays-${scheme}.png` });
  await p.goto(BASE + "about/", { waitUntil: "networkidle" });
  await p.locator(".site-head").screenshot({ path: `${SHOTS}/logo-site-${scheme}.png` });
  if (errs.length) { fail++; console.log(errs); }
  await ctx.close();
}
const ctx = await browser.newContext({ viewport: { width: 200, height: 120 } });
const p = await ctx.newPage();
await p.setContent(`<body style="margin:0;background:#ddd;display:flex;gap:12px;padding:12px"><img src="${BASE}icon.svg" width="16"><img src="${BASE}icon.svg" width="32"><img src="${BASE}icon-192.png" width="64"><img src="${BASE}icon-maskable.png" width="64" style="border-radius:50%"></body>`);
await p.waitForTimeout(500);
await p.screenshot({ path: `${SHOTS}/logo-icons.png` });
console.log(fail ? `${fail} FAILED` : "logo checks passed");
await browser.close();
