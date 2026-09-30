import { chromium, BASE, LAUNCH } from "./lib.mjs";
const b = await chromium.launch({ executablePath: LAUNCH.executablePath, args: ["--no-sandbox"] });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${m}`); };
for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("arun-intro-session", "e2e"); localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true })); localStorage.setItem("arun-install-v1", JSON.stringify({ notNowAt: new Date().toISOString() })); } catch {} });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE, { waitUntil: "networkidle" });
  const current = () => p.evaluate(() => document.querySelector(".tabbar [aria-current='page']")?.textContent?.trim());
  for (const room of ["Watch", "Hope", "Plan", "Reach out"]) {
    await p.locator(".tabbar button", { hasText: room }).first().click();
    await p.waitForTimeout(300);
    await p.mouse.wheel(0, 1500); await p.waitForTimeout(400);
    await p.locator(".nav-brand").click();
    await p.waitForTimeout(500);
    ok(await current() === "Here" && await p.evaluate(() => scrollY) === 0, `${vp.width}px: from ${room}, tapping arun lands on Here at the top`);
  }
  await p.mouse.wheel(0, 1500); await p.waitForTimeout(500);
  const before = await p.evaluate(() => scrollY);
  await p.locator(".nav-brand").scrollIntoViewIfNeeded().catch(() => {});
  await p.evaluate(() => window.scrollTo({ top: 900 })); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector(".nav-brand").click());
  await p.waitForTimeout(1200);
  ok(before > 0 && await p.evaluate(() => scrollY) === 0 && await current() === "Here", `${vp.width}px: already on Here, it glides back to the top`);
  ok(errs.length === 0, "no page errors " + errs.join("|"));
  await ctx.close();
}
console.log(`${pass} passed, ${fail} failed`);
await b.close();
