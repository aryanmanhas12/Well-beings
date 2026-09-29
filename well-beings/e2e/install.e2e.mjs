import { chromium, BASE, AXE, LAUNCH } from "./lib.mjs";
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
    if (!__intro) await c.addInitScript(() => { try { sessionStorage.setItem("arun-intro-session", "played"); } catch {} });
    return c;
  };
}
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${m}`); };
const seed = () => { if (!localStorage.getItem("wellbeings-safe-v1")) localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true })); };
async function ctxWith(opts = {}, extra) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: "dark", ...opts });
  await ctx.addInitScript(seed);
  if (extra) await ctx.addInitScript(extra);
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(BASE, { waitUntil: "networkidle" });
  return { ctx, p, errs };
}
const panel = (p) => p.locator("section.install-panel");

console.log("1. a browser that offers a prompt");
{
  const { ctx, p, errs } = await ctxWith();
  ok(await panel(p).count() === 1, "card shows on Here");
  ok(await p.getByRole("button", { name: "Install Arun" }).count() === 0, "no install button before a prompt exists");
  await p.evaluate(() => {
    const e = new Event("beforeinstallprompt", { cancelable: true });
    e.prompt = async () => { window.__prompted = true; };
    e.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(e);
  });
  await p.waitForTimeout(100);
  const btn = panel(p).getByRole("button", { name: "Install Arun" });
  ok(await btn.count() === 1, "prompt captured: Install Arun button appears");
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async () => (await axe.run(document.querySelector(".install-panel"))).violations.map((x) => x.id));
  ok(v.length === 0, `axe on card: ${v.join(",") || "clean"}`);
  await panel(p).scrollIntoViewIfNeeded();
  await panel(p).screenshot({ path: `${SHOTS}/install-ready.png` });
  await btn.click();
  await p.waitForTimeout(150);
  ok(await p.evaluate(() => window.__prompted === true), "tapping it opens the browser's install prompt");
  ok(await panel(p).getByText("Arun is on your home screen").count() === 1, "accepted: says it's on the home screen");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await ctx.close();
}
console.log("2. Not now");
{
  const { ctx, p } = await ctxWith();
  await panel(p).getByRole("button", { name: "Not now" }).click();
  ok(await panel(p).count() === 0, "card goes away");
  ok(await p.evaluate(() => !!localStorage.getItem("arun-install-v1")), "remembered on this phone");
  await p.reload({ waitUntil: "networkidle" });
  ok(await panel(p).count() === 0, "still away after reload");
  await p.getByRole("button", { name: /settings/i }).first().click();
  ok(await p.getByText("Install Arun as an app").count() === 1, "Settings still offers it");
  await p.getByRole("dialog").screenshot({ path: `${SHOTS}/install-settings.png` });
  await ctx.close();
}
console.log("3. iPhone Safari");
{
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
  const { ctx, p } = await ctxWith({ userAgent: ua });
  const t = await panel(p).innerText();
  ok(/Share/.test(t) && /Add to Home Screen/.test(t), "shows Share → Add to Home Screen steps");
  await panel(p).screenshot({ path: `${SHOTS}/install-ios.png` });
  await ctx.close();
}
console.log("4. Instagram in-app browser");
{
  const ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 Instagram 350.0.0.0";
  const { ctx, p } = await ctxWith({ userAgent: ua });
  ok(/Open in browser/.test(await panel(p).innerText()), "tells them to open in a real browser first");
  await ctx.close();
}
console.log("5. already installed");
{
  const { ctx, p } = await ctxWith({}, () => {
    const orig = window.matchMedia.bind(window);
    window.matchMedia = (q) => (q.includes("display-mode: standalone") ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : orig(q));
  });
  ok(await panel(p).count() === 0, "no card inside the installed app");
  await p.getByRole("button", { name: /settings/i }).first().click();
  ok(await p.getByText(/Installed\. You're using the app right now/).count() === 1, "Settings says it's installed");
  await ctx.close();
}
console.log("6. manifest");
{
  const ctx = await browser.newContext(); const p = await ctx.newPage();
  const r = await p.goto(BASE + "manifest.webmanifest"); const m = await r.json();
  ok(m.id && m.screenshots?.length === 4 && m.icons.some((i) => i.purpose === "maskable"), "id, 4 screenshots, maskable icon");
  for (const s of m.screenshots) { const rr = await p.goto(BASE + s.src); ok(rr.status() === 200, `${s.src} served`); }
  await ctx.close();
}
console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
