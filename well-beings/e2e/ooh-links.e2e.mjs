import { chromium, BASE, LAUNCH } from "./lib.mjs";
const b = await chromium.launch({ executablePath: LAUNCH.executablePath, args: ["--no-sandbox"] });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${m}`); };
const IPAD = "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const seed = (apple) => { try { sessionStorage.setItem("arun-intro-session", "played"); localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true })); localStorage.setItem("arun-install-v1", JSON.stringify({ notNowAt: new Date().toISOString() })); } catch {}
  if (apple) { try { Object.defineProperty(Navigator.prototype, "vibrate", { value: undefined, configurable: true }); } catch {} } };
const NEXT = { Here: "Hope", Watch: "Hope", Hope: "Plan", Plan: "Reach out", "Reach out": "Hope" };
for (const [vp, apple, name] of [[{ width: 390, height: 844 }, true, "iPhone path"], [{ width: 1024, height: 1366 }, true, "iPad portrait, iPhone path"], [{ width: 1366, height: 1024 }, true, "iPad landscape"], [{ width: 390, height: 844 }, false, "Android path"], [{ width: 1280, height: 800 }, false, "desktop"]]) {
  const ctx = await b.newContext({ viewport: vp, hasTouch: true, userAgent: apple ? IPAD : undefined });
  await ctx.addInitScript(seed, apple);
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE, { waitUntil: "networkidle" });
  for (const room of Object.keys(NEXT)) {
    await p.locator(".tabbar button", { hasText: room }).first().tap();
    await p.waitForTimeout(400);
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(900);
    const go = p.locator(".ooh-dock .ooh-go");
    if (!(await go.count())) { ok(false, `${name}: ${room}: Ooh offers the next room at the bottom`); continue; }
    await go.tap();
    await p.waitForTimeout(700);
    const now = await p.evaluate(() => [document.querySelector(".tabbar [aria-current='page']")?.textContent?.trim(), Math.round(scrollY), document.activeElement?.closest?.(".haptic-switch") ? "switch" : "ok"]);
    ok(now[0] === NEXT[room] && now[1] === 0 && now[2] === "ok", `${name}: ${room}: tapping Ooh's link opens ${NEXT[room]} at the top (${now.join(", ")})`);
  }
  ok(errs.length === 0, `${name}: no page errors ${errs.join("|")}`);
  await ctx.close();
}
console.log(`${pass} passed, ${fail} failed`);
await b.close();
