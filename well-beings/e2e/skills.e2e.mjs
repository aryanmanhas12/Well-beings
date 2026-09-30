import { chromium, BASE, OUT, LAUNCH } from "./lib.mjs";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
const b = await chromium.launch({ executablePath: LAUNCH.executablePath, args: ["--no-sandbox"] });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${m}`); };
const seed = (extra) => { try { sessionStorage.setItem("arun-intro-session", "e2e"); localStorage.setItem("wellbeings-safe-v1", JSON.stringify(Object.assign({ introSeen: true, region: "in" }, extra || {}))); localStorage.setItem("arun-install-v1", JSON.stringify({ notNowAt: new Date().toISOString() })); } catch {} };
async function open(ctxOpts = {}, extra) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, ...ctxOpts });
  await ctx.addInitScript(seed, extra);
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(BASE, { waitUntil: "networkidle" });
  return { ctx, p, errs };
}
const tab = (p, name) => p.locator(".tabbar button", { hasText: name }).first().click();

console.log("1. a removal can be taken back (web interface guidelines: undo)");
{
  const { ctx, p, errs } = await open({}, { hope: [{ id: "a1", kind: "people", text: "Didi", at: "2026-09-20T10:00:00Z" }, { id: "a2", kind: "people", text: "Kabir from the hostel", at: "2026-09-21T10:00:00Z" }] });
  await tab(p, "Hope");
  await p.getByRole("button", { name: /Hope box/i }).first().click().catch(() => {});
  await p.locator("#hope-people-title").waitFor({ timeout: 4000 });
  const sec = p.locator("section[aria-labelledby='hope-people-title']");
  await sec.getByRole("button", { name: "Remove: Didi" }).click();
  ok(await sec.locator(".undo-bar").innerText().then((t) => /Removed “Didi”\./.test(t)), "removing says what went, in place");
  ok(await sec.locator(".undo-bar").getAttribute("role") === "status", "and is announced politely to a screen reader");
  ok(!(await sec.innerText()).includes("Remove: Didi") && await sec.locator("li").count() === 1, "the item is gone from the list");
  await sec.locator(".undo-bar").getByRole("button", { name: "Undo" }).click();
  const names = await sec.locator("li > span").allInnerTexts();
  ok(names[0] === "Didi" && names[1] === "Kabir from the hostel", `Undo puts it back where it was (${names.join(", ")})`);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem("wellbeings-safe-v1")).hope.map((h) => h.id).join()) === "a1,a2", "and it is saved again");
  await sec.getByRole("button", { name: "Remove: Kabir from the hostel" }).click();
  await p.waitForTimeout(7400);
  ok(await sec.locator(".undo-bar").innerText() === "", "the offer goes after seven seconds, taking no room");
  /* a photo */
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8DwnwEIGBmhAoMRAAAm5AQBRuN8RAAAAABJRU5ErkJggg==", "base64");
  await p.locator("input[type=file]").setInputFiles({ name: "sea.png", mimeType: "image/png", buffer: png });
  await p.locator(".photo-grid figure").first().waitFor({ timeout: 4000 });
  const img = p.locator(".photo-grid img").first();
  ok(await img.getAttribute("width") === "160" && await img.getAttribute("height") === "160", "photos carry their size, so nothing shifts as they draw");
  await p.getByRole("button", { name: /^Remove photo/ }).first().click();
  ok(await p.locator(".photo-grid figure").count() === 0 && /Removed a photo\./.test(await p.locator("section[aria-labelledby='photos-title'] .undo-bar").innerText()), "a photo can be removed and says so");
  await p.locator("section[aria-labelledby='photos-title'] .undo-bar").getByRole("button", { name: "Undo" }).click();
  ok(await p.locator(".photo-grid figure").count() === 1, "and Undo brings the photo back");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await ctx.close();
}

console.log("2. rooms opened by a tap: parts step in, the name is drawn in by the dawn");
{
  const { ctx, p } = await open();
  ok(await p.evaluate(() => document.querySelector("main.haven").hasAttribute("data-moved")) === false, "not on first load: the page opens still");
  await tab(p, "Plan");
  await p.waitForTimeout(60);
  const info = await p.evaluate(() => {
    const h = document.querySelector("main.haven h1");
    const kids = [...document.querySelectorAll("main.haven > *")].slice(0, 5).map((k) => getComputedStyle(k).animationDelay);
    return { moved: document.querySelector("main.haven").dataset.moved, name: h?.getAnimations().map((a) => a.animationName).join(), kids };
  });
  ok(info.moved === "true", "a room opened by a tap is marked as moved");
  ok(/nameDawn/.test(info.name), `its name is wiped in by the light (${info.name})`);
  ok(info.kids[1] === "0.045s" && info.kids[2] === "0.09s", `its parts step in one after another (${info.kids.join(" ")})`);
  ok(await p.evaluate(() => [...document.querySelectorAll("main.haven > *")].every((k) => getComputedStyle(k).opacity === "1")), "moving only: nothing fades, every word at full contrast");
  await ctx.close();
}
{
  const { ctx, p } = await open({ reducedMotion: "reduce" });
  await tab(p, "Plan"); await p.waitForTimeout(60);
  ok(await p.evaluate(() => (document.querySelector("main.haven h1")?.getAnimations() ?? []).length) === 0, "reduced motion: the name is simply there");
  await ctx.close();
}

console.log("3. a whisper of grain on the night, behind everything");
{
  const { ctx, p } = await open({ colorScheme: "dark" });
  const g = await p.evaluate(() => { const a = document.querySelector(".haven-atmos"); const cs = getComputedStyle(a, "::after"); return { img: cs.backgroundImage.includes("feTurbulence"), op: cs.opacity, z: getComputedStyle(a).zIndex, hz: getComputedStyle(document.querySelector("main.haven")).zIndex, pe: getComputedStyle(a).pointerEvents, pos: getComputedStyle(a).position }; });
  ok(g.img && g.op === "0.07", `grain is drawn at 7% (${g.op})`);
  ok(Number(g.z) < Number(g.hz) && g.pe === "none" && g.pos === "fixed", "on the fixed layer behind the page, never over words or taps");
  await ctx.close();
}

console.log("4. a spotlight follows a mouse around a card's edge (desktop only)");
{
  const { ctx, p } = await open({ viewport: { width: 1280, height: 800 } });
  const card = p.locator(".panel").first();
  await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
  const box = await card.boundingBox();
  await p.mouse.move(box.x + 40, box.y + 30); await p.waitForTimeout(80);
  await p.mouse.move(box.x + 60, box.y + 40); await p.waitForTimeout(120);
  const s = await p.evaluate(() => { const el = document.querySelector(".fx-spot"); if (!el) return null; const r = el.getBoundingClientRect(); return { on: el.dataset.on, w: Math.round(r.width), mx: el.style.getPropertyValue("--mx"), pe: getComputedStyle(el).pointerEvents }; });
  ok(s?.on === "true" && Math.abs(s.w - Math.round(box.width)) <= 1, `a spotlight sits on the card under the mouse (${JSON.stringify(s)})`);
  ok(s?.mx === "60px", "and follows the pointer");
  ok(s?.pe === "none", "and never catches a click");
  await p.mouse.move(2, 790); await p.waitForTimeout(80);
  await ctx.close();
}
{
  const { ctx, p } = await open({ hasTouch: true, isMobile: true });
  const box = await p.locator(".panel").first().boundingBox();
  await p.touchscreen.tap(box.x + 30, box.y + 20); await p.waitForTimeout(100);
  ok(await p.locator(".fx-spot").count() === 0, "on a phone there is no spotlight (the tap ring answers instead)");
  await ctx.close();
}

console.log("5. web interface guidelines, applied");
{
  const { ctx, p } = await open();
  const g = await p.evaluate(() => ({
    h: getComputedStyle(document.querySelector("h1, h2")).textWrap || getComputedStyle(document.querySelector("h1, h2")).textWrapStyle,
    pad: getComputedStyle(document.documentElement).scrollPaddingTop,
    padB: getComputedStyle(document.documentElement).scrollPaddingBottom,
    num: getComputedStyle(document.querySelector(".crisis-strip a")).fontVariantNumeric,
    brand: document.querySelector(".nav-wordmark")?.getAttribute("translate"),
    ooh: document.querySelector(".ooh-name")?.getAttribute("translate"),
  }));
  ok(/balance/.test(g.h), `headings break in balanced lines (${g.h})`);
  ok(g.pad === "64px" && g.padB === "200px", `nothing pinned covers what is scrolled or tabbed to (${g.pad} / ${g.padB})`);
  ok(/tabular-nums/.test(g.num), "helpline numbers sit on even columns");
  ok(g.brand === "no" && g.ooh === "no", "the wordmark and Ooh's name are never machine-translated");
  const fields = [];
  for (const room of ["Here", "Hope", "Plan", "Reach out"]) {
    await tab(p, room); await p.waitForTimeout(700);
    if (room === "Hope") { await p.getByRole("button", { name: /Hope box/i }).first().click().catch(() => {}); await p.waitForTimeout(300); }
    fields.push(...(await p.evaluate(() => [...document.querySelectorAll("main input:not([type=hidden]), main textarea")].map((f) => ({ id: f.id || f.name, name: f.name, ac: f.getAttribute("autocomplete"), type: f.type, ph: f.placeholder })))));
  }
  const noName = fields.filter((f) => !f.name);
  ok(fields.length > 5 && noName.length === 0, `every field has a name (${fields.length} checked${noName.length ? "; missing: " + noName.map((f) => f.id).join(",") : ""})`);
  const noAc = fields.filter((f) => !["checkbox", "radio", "file"].includes(f.type) && !f.ac);
  ok(noAc.length === 0, `every text field says how to autocomplete${noAc.length ? ": " + noAc.map((f) => f.id).join(",") : ""}`);
  const badPh = fields.filter((f) => f.ph && !f.ph.endsWith("…") && !f.ph.endsWith(")"));
  ok(badPh.length === 0, `placeholders end with an ellipsis${badPh.length ? ": " + badPh.map((f) => f.ph).join(" | ") : ""}`);
  await ctx.close();
}

console.log("6. split into parts, loaded before they are needed, honest when they cannot arrive");
{
  const html = readFileSync(join(OUT, "index.html"), "utf8");
  const initial = new Set([...html.matchAll(/_next\/static\/chunks\/[\w-]+\.js/g)].map((m) => m[0]));
  const { ctx, p } = await open();
  await p.waitForTimeout(1600);
  const later = await p.evaluate(() => performance.getEntriesByType("resource").map((e) => e.name).filter((n) => n.includes("/_next/static/chunks/") && n.endsWith(".js")));
  const extra = later.filter((n) => ![...initial].some((i) => n.endsWith(i)));
  ok(extra.length >= 3, `the rooms not on the first screen are their own files, fetched once the phone is idle (${extra.length})`);
  await ctx.close();
  /* Offline before a part ever arrived: those files are refused. */
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx2.addInitScript(seed);
  await ctx2.route("**/_next/static/chunks/*.js", (r) => ([...initial].some((i) => r.request().url().endsWith(i)) ? r.continue() : r.abort()));
  const p2 = await ctx2.newPage();
  const errs = []; p2.on("pageerror", (e) => errs.push(e.message));
  await p2.goto(BASE, { waitUntil: "load" });
  await p2.waitForTimeout(800);
  await tab(p2, "Watch");
  await p2.locator(".part-offline").waitFor({ timeout: 4000 }).catch(() => {});
  const t = await p2.locator(".part-offline").innerText().catch(() => "");
  ok(/needs a connection the first time/.test(t) && /safety plan, your people and the helpline numbers work offline/.test(t), "a part that cannot arrive says so, and where the offline help is");
  ok(await p2.locator(".part-offline").getByRole("button", { name: "Try again" }).count() === 1, "with a way to try again");
  await tab(p2, "Plan"); await p2.waitForTimeout(500);
  ok(await p2.locator("main h1").innerText() === "Plan", "the Plan room still opens: it is never split off");
  await tab(p2, "Reach out"); await p2.waitForTimeout(500);
  ok(await p2.locator("a[href^='tel:']").count() > 0, "and Reach out's numbers are there too");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await ctx2.close();
}

console.log("7. zero em dashes anywhere a reader can see");
{
  const pages = [];
  const walk = (d) => { for (const f of readdirSync(d)) { const q = join(d, f); if (statSync(q).isDirectory()) { if (f !== "_next") walk(q); } else if (f.endsWith(".html")) pages.push(q); } };
  walk(OUT);
  const found = [];
  for (const f of pages) {
    const s = readFileSync(f, "utf8").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<!--[\s\S]*?-->/g, "");
    const txt = s.replace(/<[^>]+>/g, " ");
    if (txt.includes("—")) found.push(f.replace(OUT, ""));
  }
  ok(found.length === 0, `no em dash in the text of any of ${pages.length} pages${found.length ? ": " + found.join(", ") : ""}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
