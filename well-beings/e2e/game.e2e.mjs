/**
 * Scoops & Snowballs, in a real browser: where it is, that it covers the
 * screen without covering the crisis strip, that "Help now" works over
 * it, that it plays with keys and with touch, pauses, ends with the two of
 * them holding hands, keeps nothing, and has no accessibility violations.
 * The game's rules themselves are tested in scripts/test-game.mjs.
 */
import { chromium, BASE, LAUNCH, AXE } from "./lib.mjs";
const b = await chromium.launch({ executablePath: LAUNCH.executablePath, args: ["--no-sandbox"] });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${m}`); };
const seed = () => { try { sessionStorage.setItem("arun-intro-session", "e2e"); localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true })); localStorage.setItem("arun-install-v1", JSON.stringify({ notNowAt: new Date().toISOString() })); } catch {} };
const G = (p, f) => p.evaluate(f);
/* Stand the rival 140 px from the player in a direction with nothing in
   between: straight east was sometimes through a building, wherever the
   stick had walked to. Holds it still. */
const faceRival = (p) => p.evaluate(() => {
  const g = window.__scoops, k = window.__scoopsKit;
  const me = g.actors.find((a) => a.player), r = g.actors.find((a) => a.leader && !a.player);
  r.ai = null;
  for (const [dx, dy] of [[140, 0], [-140, 0], [0, 140], [0, -140], [100, 100], [-100, 100], [100, -100], [-100, -100]]) {
    const at = { x: me.x + dx, y: me.y + dy };
    if (!k.solidAt(g.city, at.x, at.y, 16) && k.clearLine(g.city, me, at, 8)) {
      r.x = at.x; r.y = at.y; r.vx = r.vy = 0;
      /* Throw aims at the nearest one on the other side; Biscuit's pals
         go and stand well behind Biscuit, so the splat is Biscuit's. */
      for (const o of g.actors) if (!o.leader && o.team === r.team) { o.x = r.x + dx * 1.6; o.y = r.y + dy * 1.6; o.vx = o.vy = 0; }
      return true;
    }
  }
  return false;
});
/* A press on Throw, if Throw is still there: a splat already in the air can
   end the round, and the controls go with it. */
async function press(p, id, ms = 200) {
  if (!(await p.locator(".game-throw").count())) return;
  await p.locator(".game-throw").dispatchEvent("pointerdown", { pointerId: id, pointerType: "touch", isPrimary: true }, { timeout: 2000 }).catch(() => {});
  await p.waitForTimeout(ms);
  if (await p.locator(".game-throw").count()) await p.locator(".game-throw").dispatchEvent("pointerup", { pointerId: id, pointerType: "touch", isPrimary: true }, { timeout: 2000 }).catch(() => {});
}
const blank = (p, sel) => p.evaluate((sel) => {
  const c = document.querySelector(sel);
  if (!c || !c.width) return true;
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  const seen = new Set();
  for (let i = 0; i < d.length; i += 4 * 97) seen.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`);
  return seen.size < 6;
}, sel);
async function axe(p, label) {
  await p.addScriptTag({ content: AXE });
  const r = await p.evaluate(async () => (await window.axe.run(document.querySelector(".game"), { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] })).violations.map((v) => `${v.id}: ${v.nodes.length}`));
  ok(r.length === 0, `${label}: no axe violations ${r.join(", ")}`);
}

/* ── a phone ─────────────────────────────────────────────────────── */
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await ctx.addInitScript(seed);
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE, { waitUntil: "networkidle" });

  /* From Here, the shortcut lands on the game in Watch. */
  await p.getByRole("button", { name: /Play something silly/ }).click();
  await p.waitForTimeout(1200);
  ok(await G(p, () => document.querySelector(".tabbar [aria-current='page']")?.textContent?.trim()) === "Watch", "Here's “Play something silly” opens Watch");
  ok(await G(p, () => { const r = document.querySelector("#watch-play")?.getBoundingClientRect(); return !!r && r.top < innerHeight && r.bottom > 0; }), "and scrolls to the game");
  ok(!(await blank(p, ".play-poster")), "the poster of the city is drawn");
  ok(await p.locator("#shelf-talks").isVisible() && (await p.locator("#shelf-talks + .shelf-row li").count()) === 4, "Watch has the four new TED talks on their own shelf");

  const keysBefore = await G(p, () => Object.keys(localStorage).sort().join(","));
  await p.getByRole("button", { name: "Play Scoops & Snowballs" }).click();
  await p.waitForSelector(".game-menu", { timeout: 8000 });
  await p.waitForTimeout(400);
  ok(await G(p, () => document.documentElement.classList.contains("game-open")), "the page under the game stops scrolling");
  ok(await G(p, () => document.elementFromPoint(20, 20)?.closest(".crisis-strip") !== null), "the crisis strip stays visible above the game");
  ok(await G(p, () => { const g = document.querySelector(".game").getBoundingClientRect(); return g.left === 0 && Math.abs(g.right - innerWidth) < 1 && Math.abs(g.bottom - innerHeight) < 1; }), "the game fills the screen below the strip");
  ok(await G(p, () => !!document.elementFromPoint(195, 820)?.closest(".game")), "the tab bar is under the game, not over it");
  ok(!(await blank(p, ".game-canvas")), "the skyline is drawn behind the title");
  ok(await p.getByRole("radio", { name: /Team Dog/ }).isChecked(), "Team Dog is picked to start with");
  await axe(p, "title card");

  /* Help now opens the urgent screen over the game. */
  await p.locator(".game-help").click();
  await p.waitForTimeout(500);
  ok(await p.locator(".urgent").isVisible(), "“Help now” opens the urgent screen over the game");
  ok(await G(p, () => { const u = document.querySelector(".urgent"); const r = u.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest(".urgent") !== null; }), "and it is on top, not behind");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(400);
  if (await p.locator(".urgent").isVisible()) await p.locator(".urgent").getByRole("button", { name: /close|back/i }).first().click().catch(() => {});
  await p.waitForTimeout(300);

  /* Night, cat. */
  await p.locator(".game-team", { hasText: "Team Cat" }).click();
  await p.locator(".game-seg label", { hasText: "Night" }).click();
  await p.getByRole("button", { name: "Play", exact: true }).click();
  await p.waitForTimeout(2300);
  ok(await G(p, () => window.__scoops?.phase) === "play", "after “Ready” the round starts");
  ok(await G(p, () => window.__scoops.playerTeam === "cat" && window.__scoops.sky === "night"), "as the cat, at night, as chosen");
  ok(!(await blank(p, ".game-canvas")), "the city is drawn");
  ok(await p.locator(".game-bar.is-me .game-bar-name").textContent() === "Miso" && (await p.locator(".game-bar.is-rival .game-bar-name").textContent()) === "Biscuit", "the bars name Miso and Biscuit");
  ok((await p.locator(".game-bar.is-me .game-num").textContent()) === "100/100" && (await p.locator(".game-bar.is-me [role='meter']").getAttribute("aria-valuenow")) === "100", "each bar shows its exact number, 100 of 100, and is a meter");
  const place = await G(p, () => document.querySelector(".game-place strong")?.textContent);
  ok(!!place && (await G(p, () => window.__scoops.stats.places.includes(document.querySelector(".game-place strong").textContent))), `a street sign names where Miso is (${place})`);

  /* A stick under the left thumb. */
  const before = await G(p, () => { const a = window.__scoops.actors.find((x) => x.player); return { x: a.x, y: a.y }; });
  const cv = await p.locator(".game-canvas").boundingBox();
  const sx = cv.x + 90, sy = cv.y + cv.height - 200;
  await p.touchscreen.tap(sx, sy).catch(() => {});
  await p.dispatchEvent(".game-canvas", "pointerdown", { pointerId: 7, pointerType: "touch", clientX: sx, clientY: sy, isPrimary: true, bubbles: true });
  await p.dispatchEvent(".game-canvas", "pointermove", { pointerId: 7, pointerType: "touch", clientX: sx - 40, clientY: sy + 30, isPrimary: true, bubbles: true });
  ok(await G(p, () => document.querySelector(".game-stick")?.classList.contains("is-on")), "a stick appears under the thumb");
  await p.waitForTimeout(900);
  await p.dispatchEvent(".game-canvas", "pointerup", { pointerId: 7, pointerType: "touch", clientX: sx - 40, clientY: sy + 30, isPrimary: true, bubbles: true });
  const after = await G(p, () => { const a = window.__scoops.actors.find((x) => x.player); return { x: a.x, y: a.y }; });
  ok(Math.hypot(after.x - before.x, after.y - before.y) > 40, `and moves Miso (${Math.round(Math.hypot(after.x - before.x, after.y - before.y))} px)`);

  /* Throwing: tap the right half; then the Throw button. */
  const thrown0 = await G(p, () => window.__scoops.stats.thrown);
  await p.dispatchEvent(".game-canvas", "pointerdown", { pointerId: 8, pointerType: "touch", clientX: cv.x + cv.width * 0.8, clientY: cv.y + cv.height * 0.4, isPrimary: true, bubbles: true });
  await p.waitForTimeout(400);
  await press(p, 9, 700);
  const thrown1 = await G(p, () => window.__scoops.stats.thrown);
  ok(thrown1 - thrown0 >= 2, `a tap on the right throws there, and holding Throw keeps throwing (${thrown1 - thrown0})`);
  await p.locator(".game-swap").click();
  await p.waitForTimeout(300);
  ok(await G(p, () => window.__scoops.actors.find((x) => x.player).ammo) === "snow", "Swap switches to snowballs");

  /* A splat lowers the rival's bar, on the page as well. */
  ok(await faceRival(p), "there is a clear line to stand Biscuit on");
  for (let i = 0; i < 6; i++) {
    await faceRival(p);
    await press(p, 10, 250);
  }
  await p.waitForTimeout(500);
  const hp = await G(p, () => window.__scoops.actors.find((a) => a.leader && !a.player).hp);
  const bar = await G(p, () => document.querySelector(".game-bar.is-rival .game-fill").style.transform);
  ok(hp < 100 && /scaleX\(0\.\d+\)/.test(bar), `the rival's bar goes down (${hp}, ${bar})`);
  const shown = await G(p, () => ({ n: document.querySelector(".game-bar.is-rival .game-num b").textContent, v: document.querySelector(".game-bar.is-rival [role='meter']").getAttribute("aria-valuenow"), hp: window.__scoops.actors.find((a) => a.leader && !a.player).hp, fill: document.querySelector(".game-bar.is-rival .game-fill").style.transform }));
  ok(shown.n === String(shown.hp) && shown.v === String(shown.hp) && shown.fill === `scaleX(${shown.hp / 100})`, `the number, the meter and the fill all say exactly ${shown.hp}`);
  ok(await G(p, () => window.__scoops.actors.find((a) => a.leader && !a.player).stains.length > 0), "and there is snow on Biscuit's fur");

  /* Pausing stops the clock. */
  await p.getByRole("button", { name: "Pause" }).click();
  await p.waitForTimeout(200);
  const t0 = await G(p, () => window.__scoops.t);
  await p.waitForTimeout(600);
  ok(await p.getByRole("heading", { name: "Paused" }).isVisible() && (await G(p, () => window.__scoops.t)) === t0, "Pause stops the game");
  await axe(p, "paused");
  await p.getByRole("button", { name: "Keep playing" }).click();
  ok((await p.locator(".fx-sparkles.at-tap").count()) === 1, "“Keep playing” sends a little burst of stars");
  await p.waitForTimeout(300);
  ok((await G(p, () => window.__scoops.t)) > t0, "and Keep playing starts it again");

  /* The army, and a pack of pies. */
  await G(p, () => { const g = window.__scoops; const me = g.actors.find((a) => a.player); g.pickups.push({ id: 9001, kind: "army", x: me.x, y: me.y, t: 0 }); });
  await p.waitForTimeout(500);
  ok(await G(p, () => window.__scoops.actors.filter((a) => a.minion && a.team === "cat").length) === 6, "calling the army brings six kittens");
  ok((await p.locator(".game-army").textContent()) === "+6", "and the team row counts them");
  await G(p, () => { const g = window.__scoops; const me = g.actors.find((a) => a.player); g.pickups.push({ id: 9002, kind: "pie", x: me.x, y: me.y, t: 0 }); });
  await p.waitForTimeout(500);
  ok((await p.locator(".game-throw").getAttribute("aria-label")) === "Throw: Cream pies, 3 left" && (await p.locator(".game-count").textContent()) === "3", "a pack of pies goes on the Throw button, with how many are left");

  /* The end. */
  await G(p, () => { const g = window.__scoops; const r = g.actors.find((a) => a.leader && !a.player); r.hp = 1; });
  for (let i = 0; i < 20 && (await G(p, () => window.__scoops.phase)) === "play"; i++) {
    await faceRival(p);
    await G(p, () => { window.__scoops.actors.find((a) => a.leader && !a.player).shield = 0; });
    await press(p, 11);
  }
  await p.waitForTimeout(900);
  ok(["slowmo", "makeup", "done"].includes(await G(p, () => window.__scoops.phase)), "a bar at zero ends the round");
  ok((await p.locator(".game-throw").count()) === 0, "and the controls go away");
  await p.waitForFunction(() => window.__scoops.handsAt > 0, null, { timeout: 12000 }).catch(() => {});
  ok(await G(p, () => window.__scoops.handsAt > 0), "the two of them hold hands");
  ok(await G(p, () => window.__scoops.cakes.length >= 4 && window.__scoops.fx.some((f) => f.kind === "heart")), "with cupcakes and hearts");
  await p.waitForSelector(".game-card", { timeout: 12000 }).catch(() => {});
  ok(await p.getByRole("heading", { name: "Friends again" }).isVisible(), "and the card says “Friends again”");
  ok(/Nobody gets hurt/.test(await p.locator(".game-card").textContent()), "and that nobody gets hurt");
  await p.waitForTimeout(900);
  const card = await p.locator(".game-stats").textContent();
  ok(/off Biscuit's bar/.test(card) && /of 16 streets/.test(card), "the card counts what came off each bar and the streets explored");
  await axe(p, "the end card");
  ok((await G(p, () => Object.keys(localStorage).sort().join(","))) === keysBefore, "a round saves nothing: no scores, no streaks");

  await p.getByRole("button", { name: "Play again" }).click();
  await p.waitForTimeout(600);
  ok(await G(p, () => window.__scoops.phase === "ready" && window.__scoops.actors.every((a) => !a.leader || a.hp === 100)), "Play again starts a fresh round");
  await p.getByRole("button", { name: "Back" }).click();
  await p.waitForTimeout(500);
  ok((await p.locator(".game").count()) === 0 && !(await G(p, () => document.documentElement.classList.contains("game-open"))), "Back closes the game and the page scrolls again");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await ctx.close();
}

/* ── a desktop, with a keyboard ──────────────────────────────────── */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(seed);
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.locator(".tabbar button", { hasText: "Watch" }).click();
  await p.waitForTimeout(600);
  await p.getByRole("button", { name: "Play Scoops & Snowballs" }).click();
  await p.waitForSelector(".game-menu", { timeout: 8000 });
  await p.locator(".game-seg label", { hasText: "Sunset" }).click();
  await p.getByRole("button", { name: "Play", exact: true }).click();
  await p.waitForTimeout(2200);
  ok(await G(p, () => window.__scoops.sky === "sunset"), "a sunset sky, as chosen");
  const at = await G(p, () => { const a = window.__scoops.actors.find((x) => x.player); return { x: a.x, y: a.y }; });
  await p.keyboard.down("ArrowUp");
  await p.keyboard.down("d");
  await p.waitForTimeout(800);
  await p.keyboard.up("ArrowUp");
  await p.keyboard.up("d");
  const moved = await G(p, () => { const a = window.__scoops.actors.find((x) => x.player); return { x: a.x, y: a.y }; });
  ok(moved.x > at.x + 30 && moved.y < at.y - 30, "arrows and WASD move Biscuit");
  const n0 = await G(p, () => window.__scoops.stats.thrown);
  await p.keyboard.press(" ");
  /* Past the 0.3 s between throws. */
  await p.waitForTimeout(450);
  await p.mouse.click(900, 300);
  await p.waitForTimeout(150);
  ok((await G(p, () => window.__scoops.stats.thrown)) - n0 >= 2, "Space throws, and so does a click on the city");
  await p.keyboard.press("q");
  await p.waitForTimeout(100);
  ok(await G(p, () => window.__scoops.actors.find((x) => x.player).ammo) === "snow", "Q swaps to snowballs");
  await G(p, () => { window.__scoops.actors.find((x) => x.player).special = 1; });
  await p.keyboard.press("e");
  await p.waitForTimeout(200);
  ok(await G(p, () => window.__scoops.storms.length === 1 && window.__scoops.stats.specials === 1), "E lets the Sundae Storm go when it is charged");
  await p.keyboard.press("p");
  await p.waitForTimeout(200);
  ok(await p.getByRole("heading", { name: "Paused" }).isVisible(), "P pauses");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(200);
  ok(!(await p.getByRole("heading", { name: "Paused" }).isVisible()), "Escape carries on");
  ok(await G(p, () => document.querySelector(".game-bars").getBoundingClientRect().top < 120), "the bars sit along the top on a wide screen");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await ctx.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
