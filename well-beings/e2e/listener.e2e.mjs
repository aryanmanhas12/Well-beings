import { chromium, BASE, AXE, LAUNCH } from "./lib.mjs";
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
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => { if (!localStorage.getItem("wellbeings-safe-v1")) localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true })); });
const page = await ctx.newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(BASE, { waitUntil: "networkidle" });
ok((await page.title()).startsWith("Arun"), `title is "${await page.title()}"`);
ok(await page.locator(".nav-wordmark", { hasText: "Arun" }).count() > 0 || (await page.locator("header").innerText()).includes("Arun"), "header says Arun");
const line = await page.locator("text=Today's line").count();
ok(line === 1, "today's line card shown");
await page.getByRole("button", { name: /Just sit with me/ }).click();
const dlg = page.getByRole("dialog", { name: "Sit with me" });
ok(await dlg.isVisible(), "listener opens");
ok(await dlg.locator("svg").first().isVisible(), "listener header shows bloom-sun");
await page.fill("#listener-input", "I have been so tired and stressed about exams for weeks");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
ok(await dlg.locator(".listener-listener").count() === 2, "on-device reply arrives");
ok(await dlg.getByText(/Ronak/).count() > 0, "long-running wording offers Ronak");
await page.addScriptTag({ content: AXE });
const r = await page.evaluate(async () => (await axe.run(document.querySelector(".listener"))).violations.map((v) => v.id));
ok(r.length === 0, `axe on listener: ${r.join(",") || "clean"}`);
await page.fill("#listener-input", "I want to kill myself");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
ok(await dlg.locator("[role=alert]").count() === 1, "crisis words show helplines in the listener");
ok((await dlg.innerText()).includes("Tele-MANAS") || (await dlg.innerText()).match(/\d{3}/), "a real number is listed");
ok((await dlg.innerText()).includes("Nobody reads this"), "footer says nobody reads it");
await page.keyboard.press("Escape");
ok(await dlg.count() === 0, "Escape closes listener, conversation gone");
// good thing crisis intercept
const good = page.locator("#good-one");
if (await good.count()) {
  await good.fill("no reason to live");
  await page.getByRole("button", { name: "Keep it" }).click();
  ok(await page.locator("[role=alert]", { hasText: "really heavy" }).count() === 1, "frightening good thing gets support");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("wellbeings-safe-v1")).goodThings?.length ?? 0);
  ok(saved === 0, "and is not filed as a good thing");
  await good.fill("the chai was hot");
  await page.getByRole("button", { name: "Keep it" }).click();
  const saved2 = await page.evaluate(() => JSON.parse(localStorage.getItem("wellbeings-safe-v1")).goodThings?.length ?? 0);
  ok(saved2 === 1, "an ordinary good thing is kept");
} else ok(false, "good thing input present");
if (process.env.E2E_SHOTS) await page.screenshot({ path: process.env.E2E_SHOTS + "/arun-home.png", fullPage: false });
// delete all removes arun keys
await page.evaluate(() => { localStorage.setItem("arun-voice-v1", "{}"); localStorage.setItem("arun-listener-v1", "{}"); });
await page.getByRole("button", { name: /settings/i }).first().click();
await page.getByRole("button", { name: /Delete all my data/ }).click();
const confirm = page.getByRole("button", { name: /Delete everything|Yes, delete/ });
if (await confirm.count()) await confirm.first().click();
await page.waitForTimeout(300);
const left = await page.evaluate(() => Object.keys(localStorage).filter((k) => /^(wellbeings|arun)-/.test(k)));
ok(left.length === 0, `delete all leaves no keys (left: ${left.join(",") || "none"})`);
// hope tab voice / note
ok(errors.length === 0, `no page errors ${errors.join(" | ")}`);
console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
