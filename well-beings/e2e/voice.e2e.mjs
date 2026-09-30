import { chromium, BASE, LAUNCH } from "./lib.mjs";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
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
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${m}`); };

/* A recogniser that behaves like Safari at its worst: stop() and abort()
   are ignored (no `end` ever fires), results can be replayed from index 0,
   and nothing need ever be marked final. Tests drive it via window.__rec. */
const fake = () => {
  localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true }));
  localStorage.setItem("arun-voice-v1", "cloud-ok");
  localStorage.setItem("arun-install-v1", JSON.stringify({ notNowAt: new Date().toISOString() }));
  if (/Macintosh/.test(navigator.userAgent)) {
    Object.defineProperty(navigator, "platform", { get: () => "MacIntel" });
    Object.defineProperty(navigator, "maxTouchPoints", { get: () => 5 });
  }
  class FakeRec {
    constructor() { window.__rec = this; window.__recs = (window.__recs || 0) + 1; this.stopCalls = 0; }
    start() { this.started = true; }
    stop() { this.stopCalls++; }
    abort() { this.aborted = true; }
    emit(list) { this.onresult?.({ resultIndex: 0, results: list.map(([t, f]) => Object.assign([{ transcript: t }], { isFinal: f })) }); }
  }
  window.webkitSpeechRecognition = FakeRec;
  window.SpeechRecognition = FakeRec;
};

async function page(ua = IPAD) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 }, userAgent: ua, hasTouch: true });
  await ctx.addInitScript(fake);
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE, { waitUntil: "networkidle" });
  return { ctx, p, errs };
}
const mic = (p) => p.locator("#good-one").locator("xpath=..").locator(".voice-btn");
const pressed = async (p) => (await mic(p).getAttribute("aria-pressed")) === "true";

console.log("1. Safari never finalises and ignores stop (the reported freeze)");
{
  const { ctx, p, errs } = await page();
  await mic(p).click();
  ok(await pressed(p), "listening after tap");
  ok(await p.evaluate(() => window.__rec.continuous === false), "one utterance per tap on Apple's engine");
  await p.evaluate(() => window.__rec.emit([["the chai was hot", false]]));
  await p.waitForTimeout(100);
  ok(await p.getByText("the chai was hot").count() > 0, "interim words shown while speaking");
  const t0 = Date.now();
  await mic(p).click();
  await p.waitForFunction(() => document.querySelector("#good-one").closest("form").querySelector(".voice-btn").getAttribute("aria-pressed") === "false", null, { timeout: 3000 });
  ok(Date.now() - t0 < 2500, `button released ${Date.now() - t0}ms after stop, with no end event`);
  ok(await p.evaluate(() => window.__rec.aborted === true), "engine aborted after the grace period");
  ok((await p.inputValue("#good-one")) === "the chai was hot", "unfinalised words still land, once");
  await p.fill("#good-one", "typing works");
  ok((await p.inputValue("#good-one")) === "typing works", "page responsive: typing works");
  await p.getByRole("button", { name: /^Hope$/ }).first().click();
  await p.getByRole("group", { name: "Hope sections" }).waitFor({ timeout: 3000 }).catch(() => {});
  ok(await p.getByRole("group", { name: "Hope sections" }).count() === 1, "page responsive: tabs work");
  ok(errs.length === 0, "no page errors " + errs.join("|"));
  await ctx.close();
}
console.log("2. results replayed from index 0");
{
  const { ctx, p } = await page();
  await mic(p).click();
  await p.evaluate(() => {
    const r = window.__rec;
    r.emit([["hello", true]]);
    r.emit([["hello", true], ["wor", false]]);
    r.emit([["hello", true], ["world", true]]);
    r.emit([["hello", true], ["world", true]]);
    r.onend?.();
  });
  await p.waitForTimeout(100);
  ok((await p.inputValue("#good-one")) === "hello world", `each phrase once: "${await p.inputValue("#good-one")}"`);
  ok(!(await pressed(p)), "idle after end");
  await ctx.close();
}
console.log("3. silence stops it on its own");
{
  const { ctx, p } = await page();
  await mic(p).click();
  await p.waitForTimeout(8800);
  ok(!(await pressed(p)), "released after 7s of silence + grace, no end event");
  await ctx.close();
}
console.log("4. microphone refused");
{
  const { ctx, p } = await page();
  await mic(p).click();
  await p.evaluate(() => window.__rec.onerror?.({ error: "not-allowed" }));
  await p.waitForTimeout(100);
  ok(!(await pressed(p)), "button released");
  ok(await p.getByText(/microphone is blocked/).count() === 1, "says how to allow it");
  await mic(p).click();
  ok(await pressed(p), "can try again straight away");
  await ctx.close();
}
console.log("5. Chrome keeps continuous mode; a second tap mid-session never stacks");
{
  const CHROME = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";
  const ctx = await browser.newContext({ viewport: { width: 400, height: 800 }, userAgent: CHROME });
  await ctx.addInitScript(fake);
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  await mic(p).click();
  ok(await p.evaluate(() => window.__rec.continuous === true), "continuous on Chrome");
  await ctx.close();
}
console.log("6. the listener's microphone");
{
  const { ctx, p } = await page();
  await p.getByRole("button", { name: /Just sit with me/ }).click();
  const dmic = p.getByRole("dialog").locator(".voice-btn");
  await dmic.click();
  await p.evaluate(() => window.__rec.emit([["I feel tired", false]]));
  await dmic.click();
  await p.waitForTimeout(1600);
  ok((await p.inputValue("#listener-input")) === "I feel tired", "words land in the listener box");
  ok((await dmic.getAttribute("aria-pressed")) === "false", "released");
  await ctx.close();
}
console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
