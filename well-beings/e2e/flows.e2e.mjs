import { chromium, BASE, LAUNCH, OUT, goRoom, namedAssets } from "./lib.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
const ok = (c, m) => { if (c) { pass++; console.log("  ✓ " + m); } else { fail++; console.log("  ✗ " + m); } };
const errors = [];
async function fresh(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", acceptDownloads: true, ...opts });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return { ctx, p };
}
const safe = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("wellbeings-safe-v1") || "null"));
/* Rooms by their ids (here, watch, me, hope, plan, reach), reached the way
   a person reaches them now that there are three tabs. */
const tab = (p, room) => goRoom(p, room);

console.log("1. first visit, intro, check-in");
{
  const { ctx, p } = await fresh({ __intro: true });
  await p.goto(BASE); await p.waitForTimeout(300);
  ok(await p.locator(".intro").isVisible(), "intro shows on first visit");
  await p.getByRole("button", { name: "Skip" }).click(); await p.waitForTimeout(200);
  ok(!(await p.locator(".intro").isVisible()), "Skip closes the intro");
  ok((await safe(p))?.introSeen === true, "introSeen persisted");
  ok(!!(await safe(p))?.region, `region guessed on device (${(await safe(p))?.region})`);
  await p.getByRole("button", { name: "Okay", exact: true }).click();
  await p.getByRole("button", { name: "Some light" }).click(); await p.waitForTimeout(300);
  const s = await safe(p);
  ok(s.arrivals.length === 1 && s.arrivals[0].mood === 4 && s.arrivals[0].hope === 4 && !s.arrivals[0].safety, "okay/some light saved without asking the safety question");
  ok((await p.locator("h1").innerText()).includes("Good to have you here"), "steady reply in the sky");
  ok(s.dawn.steps.includes("arrive"), "check-in lifts the sun");
  ok((await p.locator("main .tension").count()) === 8, "and the one question follows: what's the tension, with eight answers");
  /* Good things live in Me now, with everything else a person keeps. */
  await tab(p, "me");
  await p.locator(".me .tool-row", { hasText: "Good things" }).click();
  await p.fill("#good-0", "The bus was on time");
  await p.getByRole("button", { name: "Keep them" }).click(); await p.waitForTimeout(150);
  ok((await safe(p)).goodThings[0]?.items[0] === "The bus was on time", "good thing kept, from Me");
  ok((await safe(p)).dawn.steps.includes("grateful"), "and it lifts the sun");
  // Opening Arun again (a reload counts) plays the sunrise every time, and
  // Skip lands back on the same day with nothing lost.
  await p.reload(); await p.waitForTimeout(300);
  ok(await p.locator(".intro").isVisible(), "the sunrise plays again on the next visit");
  await p.getByRole("button", { name: "Skip" }).click(); await p.waitForTimeout(200);
  ok(!(await p.locator(".intro").isVisible()) && (await safe(p)).goodThings[0]?.items[0] === "The bus was on time", "skip returns to the same day");
  await ctx.close();
}

console.log("2. thoughts, then urgent, then back");
{
  const { ctx, p } = await fresh();
  await p.addInitScript(() => localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true, region: "uk" })));
  await p.goto(BASE); await p.waitForTimeout(300);
  await p.getByRole("button", { name: "Low", exact: true }).click();
  await p.getByRole("button", { name: "Hard to picture" }).click();
  ok(await p.getByText("some people have thoughts of ending their life").isVisible(), "direct question asked on low hope");
  await p.getByRole("button", { name: "Yes, but I'm safe right now" }).click(); await p.waitForTimeout(300);
  ok(await p.getByRole("heading", { name: /keep you safe/ }).isVisible(), "safety panel appears");
  ok(await p.locator('a[href="tel:116123"]').first().isVisible(), "UK Samaritans number is a tap-to-call link (region respected)");
  await p.getByRole("button", { name: "Check in again" }).click();
  await p.getByRole("button", { name: "Really heavy" }).click();
  await p.getByRole("button", { name: "I can't see a way forward" }).click();
  await p.getByRole("button", { name: "Yes, and I don't feel safe" }).click(); await p.waitForTimeout(300);
  ok(await p.locator(".urgent").isVisible(), "urgent screen opens");
  ok(await p.getByText("nobody has been alerted").isVisible(), "urgent screen says nobody was alerted");
  ok((await p.evaluate(() => document.activeElement?.className)).includes("call-btn"), "focus lands on the first line to call");
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  ok(!(await p.locator(".urgent").isVisible()), "Escape closes it, never a trap");
  const s = await safe(p);
  ok(s.arrivals.map((a) => a.safety).join(",") === "thoughts,unsafe", "both answers recorded on device only");
  await ctx.close();
}

console.log("3. hope box, photo, note");
{
  const { ctx, p } = await fresh();
  await p.addInitScript(() => localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true, region: "in" })));
  await p.goto(BASE); await p.waitForTimeout(300);
  await tab(p, "hope"); await p.getByRole("button", { name: "Hope box" }).click();
  await p.fill("#hope-people-text", "Didi");
  await p.locator("#hope-people-text").press("Enter"); await p.waitForTimeout(100);
  await p.fill("#hope-sounds-text", "Road trip song");
  await p.fill("#hope-sounds-url", "open.spotify.com/track/x");
  await p.locator("#hope-sounds-url").press("Enter"); await p.waitForTimeout(100);
  const s = await safe(p);
  ok(s.hope.some((h) => h.kind === "people" && h.text === "Didi"), "person added");
  ok(s.hope.some((h) => h.url === "https://open.spotify.com/track/x"), "link normalised to https");
  // photo: generate a PNG in the page
  const png = await p.evaluate(() => { const c = document.createElement("canvas"); c.width = 1600; c.height = 1200; const g = c.getContext("2d"); g.fillStyle = "#e8677e"; g.fillRect(0, 0, 1600, 1200); return c.toDataURL("image/png").split(",")[1]; });
  await p.fill("#photo-caption", "Beach day");
  await p.setInputFiles("#photo-file", { name: "beach.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
  await p.waitForTimeout(800);
  const photos = await p.evaluate(() => JSON.parse(localStorage.getItem("wellbeings-photos-v1") || "[]"));
  ok(photos.length === 1 && photos[0].caption === "Beach day", "photo stored with caption");
  ok(photos[0]?.src.startsWith("data:image/jpeg") && photos[0].src.length < 200000, `photo downscaled to JPEG (${Math.round((photos[0]?.src.length || 0) / 1024)} KB)`);
  ok(await p.locator('.photo-grid img[alt="Beach day"]').isVisible(), "photo shown with its caption as alt text");
  await p.getByRole("button", { name: "A note for later" }).click();
  await p.fill("#letter", "You got through last winter. You will get through this.");
  await p.getByRole("button", { name: "Keep this note" }).click(); await p.waitForTimeout(100);
  ok((await safe(p)).letter?.text.startsWith("You got through"), "note saved");
  // crisis words in hope box trigger support
  await p.getByRole("button", { name: "Good things" }).click();
  await p.fill("#good-0", "I want to kill myself");
  await p.getByRole("button", { name: "Keep them" }).click(); await p.waitForTimeout(200);
  ok(await p.getByRole("heading", { name: "That sounded really hard" }).isVisible(), "crisis words offer help instead of filing silently");
  // low check-in surfaces the note
  await tab(p, "here");
  await p.getByRole("button", { name: "Low", exact: true }).click();
  await p.getByRole("button", { name: "Not sure" }).click();
  await p.getByRole("button", { name: "No", exact: true }).click(); await p.waitForTimeout(300);
  ok(await p.getByText("You got through last winter").isVisible(), "low check-in brings back the person's own note");
  await ctx.close();
}

console.log("4. safety plan");
{
  const { ctx, p } = await fresh();
  await p.addInitScript(() => localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true, region: "in" })));
  await p.goto(BASE); await p.waitForTimeout(300);
  await tab(p, "plan");
  await p.fill("#plan-warningSigns", "Not replying to anyone");
  await p.fill("#plan-coping", "Cold water on my face");
  await p.getByRole("button", { name: "+ Add someone" }).first().click();
  await p.fill("#helper-name-0", "Didi"); await p.fill("#helper-phone-0", "+91 98765 43210");
  await p.getByRole("button", { name: "+ Tele-MANAS" }).click();
  await p.fill("#plan-reason", "My sister");
  await p.getByRole("button", { name: "Save my plan" }).click(); await p.waitForTimeout(300);
  const s = await safe(p);
  ok(s.plan.helpers[0]?.phone === "+91 98765 43210" && s.plan.professionals[0]?.name === "Tele-MANAS", "plan saved with contacts");
  ok(await p.getByRole("heading", { name: "Take it one step at a time" }).isVisible(), "saving switches to use-it-now");
  ok(await p.locator('a[href="tel:+919876543210"]').isVisible(), "a helper's number is a tap-to-call link");
  ok((await p.locator(".quote-line").first().innerText()).includes("My sister"), "reason for staying leads the plan");
  await tab(p, "here"); await tab(p, "plan"); await p.waitForTimeout(200);
  ok(await p.getByRole("heading", { name: "Take it one step at a time" }).isVisible(), "a written plan reopens ready to use");
  await ctx.close();
}

console.log("5. care team and summary");
{
  const { ctx, p } = await fresh();
  const now = Date.now();
  await p.addInitScript((n) => localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true, region: "in", arrivals: [{ at: new Date(n - 86400000 * 3).toISOString(), mood: 2, hope: 2 }, { at: new Date(n - 86400000).toISOString(), mood: 1, hope: 1, safety: "thoughts" }, { at: new Date(n - 3600000 * 8).toISOString(), mood: 2, hope: 2, safety: "no" }] })), now);
  await p.goto(BASE); await p.waitForTimeout(300);
  ok(await p.getByRole("heading", { name: /keep you safe/ }).isVisible(), "thoughts yesterday keep the plan pinned today");
  await tab(p, "reach");
  const save = p.getByRole("button", { name: "Save", exact: true });
  ok(await save.isDisabled(), "cannot save a care contact without agreeing");
  await p.fill("#care-name", "Dr Rao"); await p.fill("#care-phone", "+91 99999 99999");
  await p.getByRole("checkbox").check();
  await save.click(); await p.waitForTimeout(200);
  ok((await safe(p)).care?.agreedAt, "consent date recorded");
  await p.getByRole("button", { name: "Send Dr Rao my summary" }).click();
  const text = await p.locator("pre").innerText();
  ok(/3 check-ins/.test(text) && /Thoughts of ending my life: reported on 1 check-in/.test(text), "summary text is accurate");
  ok(!/Didi|hope box/i.test(text), "summary carries no hope-box contents");
  ok((await p.locator("a", { hasText: "Text Dr Rao" }).getAttribute("href")).startsWith("sms:+919999999999"), "text link pre-addressed");
  const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "Save as a file" }).click()]);
  const json = JSON.parse(readFileSync(await dl.path(), "utf8"));
  ok(json.schema === "wellbeings.care-summary/1" && json.checkins === 3 && json.thoughtsReported === 1, "JSON file matches the documented schema");
  await tab(p, "here");
  ok(await p.getByRole("heading", { name: /keep you safe/ }).isVisible(), "home still leads with safety");
  ok((await p.locator("main .tension").count()) === 0 && (await p.locator(".reel-door").count()) === 0, "and offers no cards to sort or swipe above or below it");
  await ctx.close();
}

console.log("6. delete everything from settings");
{
  const { ctx, p } = await fresh();
  await p.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true, region: "in", hope: [{ id: "a", kind: "people", text: "x", at: "2026-01-01" }] })); localStorage.setItem("wellbeings-photos-v1", "[]"); localStorage.setItem("wellbeings-tour-seen-v1", "1"); localStorage.setItem("wellbeings-v1", JSON.stringify({ settings: { theme: "dark" } })); } });
  await p.goto(BASE); await p.waitForTimeout(300);
  await p.getByRole("button", { name: "Settings" }).click();
  await p.getByRole("button", { name: "Delete all my data" }).click();
  await p.getByRole("button", { name: "Delete everything" }).click(); await p.waitForTimeout(300);
  const keys = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("wellbeings")));
  ok(keys.length === 0, `every wellbeings key removed (left: ${keys.join(",") || "none"})`);
  await p.getByRole("button", { name: "Close" }).last().click().catch(() => {});
  await tab(p, "hope"); await p.getByRole("button", { name: "Hope box" }).click();
  ok(!(await p.getByText("x", { exact: true }).count()), "in-memory hope box cleared too");
  await ctx.close();
}

console.log("7. wellbeing check to daily plan");
{
  const { ctx, p } = await fresh();
  await p.addInitScript(() => localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true, region: "in" })));
  await p.goto(BASE); await p.waitForTimeout(300);
  /* The wellbeing check moved to Me with the daily plan it builds. */
  await tab(p, "me");
  await p.locator(".me .tool-row", { hasText: "A wellbeing check" }).click();
  let guard = 0;
  while (guard++ < 80) {
    await p.waitForTimeout(650);
    if (await p.locator(".app-measure-results").isVisible().catch(() => false)) break;
    const opt = p.locator("main .btn.btn-secondary");
    if (await opt.count()) { await opt.first().click(); continue; }
    const input = p.locator("main input.input");
    if (await input.isVisible().catch(() => false)) { await input.fill("Asha"); await p.locator("main .btn.btn-primary").last().click(); }
  }
  ok(await p.locator(".app-measure-results").isVisible().catch(() => false), `quick check reaches results (${guard} steps)`);
  const build = p.locator(".app-measure-results button.btn-primary").last();
  if (await build.isVisible().catch(() => false)) await build.click();
  await p.waitForTimeout(800);
  ok(await p.locator('[data-screen-label="App"]').isVisible().catch(() => false), "finishing the check lands on the daily plan inside the safe place");
  ok(await p.locator(".tabbar").isVisible(), "tab bar still there, so the safe place is one tap away");
  await ctx.close();
}

console.log("8. handoff from Ronak and offline");
{
  const { ctx, p } = await fresh();
  await p.addInitScript(() => localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true, region: "in" })));
  await p.goto(BASE + "?ref=psych-screener&band=3"); await p.waitForTimeout(400);
  ok(await p.getByRole("button", { name: "Talk to someone" }).isVisible(), "band 3 arrival offers people first");
  ok(!p.url().includes("band="), "band stripped from the URL after reading");
  /* One visit and no reload: the way a person opens Arun once on wifi
     and next on a train. Home's scripts load before the worker takes over,
     so until November 2026 none of them were cached after a first visit
     and Home offline drew but answered no tap; and the support page, never
     opened, lost its helplines to Next's error screen in 6 of 8 offline
     opens. The worker now caches both pages with everything they name
     while it installs, so wait for it to be active, not for a moment. */
  const ready = await p.evaluate(() => Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((r) => setTimeout(() => r(false), 15000))]));
  ok(ready, "the offline worker is active after one visit");
  const needs = [...new Set(["index.html", "resources/index.html"].flatMap((f) => namedAssets(readFileSync(join(OUT, f), "utf8"))))];
  const missing = await p.evaluate(async (want) => { const out = []; for (const u of want) if (!(await caches.match(u))) out.push(u.split("/").pop()); return out; }, needs);
  ok(needs.length > 10 && missing.length === 0, `all ${needs.length} scripts, styles and fonts of Home and the support page are cached after one visit${missing.length ? " (missing " + missing.join(", ") + ")" : ""}`);
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(600);
  ok(await p.locator(".sky").isVisible(), "the safe place opens offline");
  await tab(p, "plan");
  ok(await p.evaluate(() => document.querySelector("main.haven")?.className.includes("haven-plan")), "and answers taps: Me, then the safety plan, opens offline");
  await p.goto(BASE + "resources/").catch(() => {}); await p.waitForTimeout(1500);
  ok(await p.locator('main a[href="tel:14416"]').first().isVisible().catch(() => false), "support lines open offline, on a phone that never opened that page");
  ok((await p.getByText(/couldn.t load|stopped working/).count()) === 0, "and stay: nothing replaces them once the page's scripts run");
  /* Watch is a part loaded when it is needed, so one visit does not
     promise it offline (it says so and offers Try again, section 6 of the
     skills suite). Once it has been opened online, it opens offline, and
     a video there says honestly that it cannot play. */
  await ctx.setOffline(false);
  await p.goto(BASE); await p.waitForTimeout(400);
  await tab(p, "watch"); await p.getByRole("button", { name: "Watch: I See Something" }).waitFor();
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(600);
  await tab(p, "watch"); await p.getByRole("button", { name: "Watch: I See Something" }).click();
  ok(await p.getByText(/offline, so this can.t load/).isVisible(), "offline videos say so honestly");
  await ctx.close();
}

console.log("9. delete everything takes the minutes too");
{
  const { ctx, p } = await fresh();
  await p.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("wellbeings-safe-v1", JSON.stringify({ introSeen: true, region: "in", reelSeen: "2026-11-12-night", minutes: [{ at: new Date(Date.now() - 86400e3).toISOString(), topic: "family", mine: ["f-talk"], notMine: ["f-expect", "f-fights"], move: { id: "m-10talk", cue: "now", status: "open" } }] })); } });
  await p.goto(BASE); await p.waitForTimeout(300);
  ok((await safe(p)).minutes.length === 1, "(a minute is stored, under the same key as the rest)");
  await p.getByRole("button", { name: "Settings" }).click();
  await p.getByRole("button", { name: "Delete all my data" }).click();
  await p.getByRole("button", { name: "Delete everything" }).click(); await p.waitForTimeout(300);
  ok((await safe(p)) === null, "the minutes, the move and the reel mark go with everything else");
  await p.getByRole("button", { name: "Close" }).last().click().catch(() => {});
  await p.getByRole("button", { name: "Not right now" }).click().catch(() => {}); await p.waitForTimeout(200);
  ok((await p.locator(".follow").count()) === 0, "and nothing asks about a move that no longer exists");
  await ctx.close();
}
console.log("10. a crash keeps the crisis lines on screen");
{
  /* The support page's own scripts refused a second after they are asked
     for, the way the empty offline cache failed them: the page had started,
     needed one, and crashed. (Refused at once, React never starts and the
     page simply stays as it was served.) app/global-error.tsx takes over
     with the crisis strip on it; Next's own "This page couldn't load",
     which drops the strip, never shows; and once the scripts can arrive,
     "Try again" brings the page back whole. Not counted as page errors:
     they are the point. */
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", serviceWorkers: "block" });
  const p = await ctx.newPage();
  const home = new Set(namedAssets(readFileSync(join(OUT, "index.html"), "utf8")));
  const own = namedAssets(readFileSync(join(OUT, "resources/index.html"), "utf8")).filter((u) => u.endsWith(".js") && !home.has(u));
  const refuse = (u) => own.includes(u.pathname);
  await p.route(refuse, async (r) => { await new Promise((done) => setTimeout(done, 1000)); await r.abort().catch(() => {}); });
  await p.goto(BASE + "resources/");
  await p.locator(".crash").waitFor({ timeout: 6000 }).catch(() => {});
  ok(own.length > 0 && (await p.locator(".crash").isVisible()), `the crash screen takes over (${own.length} of the page's own scripts refused)`);
  ok(await p.locator('.crisis-strip a[href="tel:14416"]').isVisible(), "with Tele-MANAS still a button to call");
  ok((await p.getByText(/couldn.t load/).count()) === 0, "and Next's own error screen, which drops the strip, never shows");
  await p.unroute(refuse);
  await p.getByRole("button", { name: "Try again" }).click();
  await p.locator('main a[href="tel:14416"]').first().waitFor({ timeout: 6000 }).catch(() => {});
  ok((await p.locator(".crash").count()) === 0 && (await p.locator('main a[href="tel:14416"]').first().isVisible()), "Try again brings the page back whole once its scripts arrive");
  await ctx.close();
}
await browser.close();
const uniq = [...new Set(errors)].filter((e) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e));
console.log(`\n${pass} passed, ${fail} failed, ${uniq.length} page errors${uniq.length ? ":\n" + uniq.join("\n") : ""}`);
