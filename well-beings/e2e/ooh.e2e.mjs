import { chromium, BASE, AXE, LAUNCH } from "./lib.mjs";
const b = await chromium.launch({ executablePath: LAUNCH.executablePath, args: ["--no-sandbox"] });

/* The sunrise now plays once per session. Tests start past it, unless a
   context is made with { __intro: true } to test the sunrise itself. */
{
  const __real = b.newContext.bind(b);
  b.newContext = async (o = {}) => {
    const { __intro, ...rest } = o;
    const c = await __real(rest);
    if (!__intro) await c.addInitScript(() => { try { sessionStorage.setItem("arun-intro-session", "played"); } catch {} });
    return c;
  };
}
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${m}`); };
const now = () => new Date().toISOString();
async function open({ w = 390, h = 844, seed = { introSeen: true }, reduced = false, path = "", intro = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: reduced ? "reduce" : "no-preference", __intro: intro });
  await ctx.addInitScript((seed) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("wellbeings-safe-v1", JSON.stringify(seed));
      localStorage.setItem("arun-install-v1", JSON.stringify({ notNowAt: new Date().toISOString() }));
      sessionStorage.setItem("seeded", "1");
    }
    /* Count audio contexts and their states. */
    const AC = window.AudioContext;
    window.__acs = [];
    window.__sfx = []; window.AudioContext = class extends AC { constructor(o) { super(o); (o && o.latencyHint === "interactive" ? window.__sfx : window.__acs).push(this); } };
  }, seed);
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  return { ctx, p, errs };
}
const strip = (p) => p.locator(".ooh-strip");
const corner = (p) => p.locator(".ooh-guide .ooh-me");
async function finishTyping(p) { await p.waitForFunction(() => document.querySelector(".ooh-next")?.dataset.ready === "true", null, { timeout: 5000 }); }

console.log("1. first visit: narration in the page, then tucked");
{
  const { ctx, p, errs } = await open();
  ok(await strip(p).count() === 1, "Ooh speaks in the page on Here");
  ok(/Ooh, hello!/.test(await strip(p).textContent()), "first line is the hello");
  const boxStrip = await strip(p).boundingBox();
  const boxCheck = await p.locator("text=How are you arriving?").boundingBox();
  ok(boxStrip.y + boxStrip.height <= boxCheck.y, "sits above the check-in, covering nothing");
  await finishTyping(p);
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async () => (await axe.run(document.querySelector(".ooh-strip"))).violations.map((x) => x.id));
  ok(v.length === 0, `axe on the strip: ${v.join(",") || "clean"}`);
  let steps = 0;
  while ((await p.locator(".ooh-next").innerText()).startsWith("Next") && steps < 6) { await p.locator(".ooh-say").click(); await finishTyping(p); steps++; }
  ok(steps === 3, `four lines on the first visit (${steps + 1})`);
  ok(/speaker/.test(await strip(p).textContent()), "last line points at the music switch");
  await p.locator(".ooh-say").click();
  ok(await strip(p).count() === 0, "Got it removes the strip");
  ok(await corner(p).count() === 1, "Ooh tucks into the corner");
  const tb = await p.locator(".tabbar").boundingBox(), oc = await corner(p).boundingBox();
  ok(oc.y + oc.height <= tb.y, "corner Ooh sits above the tab bar");
  await corner(p).click();
  ok(await p.locator(".ooh-guide .ooh-bubble").count() === 1, "tapping Ooh brings the bubble back as a float");
  await finishTyping(p);
  await p.waitForTimeout(500);
  await p.addScriptTag({ content: AXE });
  const v2 = await p.evaluate(async () => (await axe.run(document.querySelector(".ooh-guide"))).violations.map((x) => x.id));
  ok(v2.length === 0, `axe on the float: ${v2.join(",") || "clean"}`);
  await p.locator(".ooh-x").click();
  ok(await p.locator(".ooh-guide .ooh-bubble").count() === 0, "× puts it away");
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem("arun-ooh-v1")).seen.includes("here-new")), "remembers the tour was heard");
  await p.reload({ waitUntil: "networkidle" });
  ok(/Hello again|late/.test(await strip(p).textContent()), "next visit: one short line");
  ok((await p.locator(".ooh-next").innerText()).startsWith("Got it"), "and only one");
  await p.getByRole("button", { name: /^Watch$/ }).first().click();
  ok(/stories/.test(await strip(p).textContent()), "Watch has its own narration");
  ok(errs.length === 0, "no page errors " + errs.join("|"));
  await ctx.close();
}
console.log("2. heavy days: the plan and the numbers come first");
for (const [level, arr] of [["thoughts", [{ at: now(), mood: 1, hope: 1, safety: "thoughts" }]], ["heavy", [{ at: new Date(Date.now() - 2 * 864e5).toISOString(), mood: 2, hope: 1, safety: "no" }, { at: new Date(Date.now() - 864e5).toISOString(), mood: 1, hope: 1, safety: "no" }, { at: now(), mood: 1, hope: 1, safety: "no" }]]]) {
  const { ctx, p } = await open({ seed: { introSeen: true, arrivals: arr } });
  await p.waitForTimeout(600);
  ok(await strip(p).count() === 0, `${level}: no strip pushing things down`);
  ok(await corner(p).count() === 1, `${level}: Ooh waits in the corner`);
  if (level === "thoughts") {
    const s = await p.locator("#stay-safe").boundingBox();
    ok(s && s.y < 844, `thoughts: the safety panel starts on the first screen (y=${Math.round(s?.y)})`);
  }
  await corner(p).click();
  ok(/plan|number|line|telling someone/i.test(await p.locator(".ooh-guide .ooh-bubble").textContent()), `${level}: tapped, Ooh points at people and the plan`);
  await ctx.close();
}
console.log("3. turned off, intro, pages, reduced motion");
{
  const { ctx, p } = await open();
  await p.getByRole("button", { name: "Settings" }).click();
  await p.getByRole("dialog", { name: "Settings" }).getByRole("switch", { name: /Ooh, your guide/ }).click();
  await p.keyboard.press("Escape");
  ok(await p.locator(".ooh-strip, .ooh-guide").count() === 0, "Settings switch removes Ooh");
  await p.reload({ waitUntil: "networkidle" });
  ok(await p.locator(".ooh-strip, .ooh-guide").count() === 0, "and it stays off");
  await ctx.close();
}
{
  const { ctx, p } = await open({ seed: {}, intro: true });
  const vis = await p.locator(".ooh-strip").isVisible().catch(() => false);
  ok(!vis, "hidden behind the first-visit sunrise");
  await ctx.close();
}
{
  const { ctx, p } = await open({ path: "privacy/" });
  ok(/stays on this phone/.test(await strip(p).textContent()), "site pages narrate too");
  await ctx.close();
}
{
  const { ctx, p } = await open({ reduced: true });
  ok(await p.locator(".ooh-next").getAttribute("data-ready") === "true", "reduced motion: whole line at once");
  await ctx.close();
}
for (const w of [320, 360]) {
  const { ctx, p } = await open({ w, h: 640 });
  const over = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  ok(!over, `${w}px: no sideways scroll`);
  await ctx.close();
}
console.log("4. music");
{
  const { ctx, p, errs } = await open();
  const tog = p.getByRole("button", { name: "Music" }).first();
  ok((await tog.getAttribute("aria-pressed")) === "true", "on by default");
  ok(await p.evaluate(() => window.__acs.length) === 0, "silent until the first tap");
  await p.locator("text=How are you arriving?").click();
  await p.waitForTimeout(400);
  ok(await p.evaluate(() => window.__acs.length === 1 && window.__acs[0].state === "running"), "first tap starts it");
  await p.getByRole("button", { name: /^Watch$/ }).first().click();
  await p.locator(".deck .scene-play, .deck button").first().click();
  await p.waitForTimeout(3200);
  ok(await p.evaluate(() => window.__acs[0].state === "suspended"), "pauses while a video sheet is open");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(600);
  ok(await p.evaluate(() => window.__acs[0].state === "running"), "resumes when it closes");
  await tog.click();
  await p.waitForTimeout(3200);
  ok(await p.evaluate(() => window.__acs[0].state === "suspended"), "the speaker turns it off");
  ok(await p.evaluate(() => localStorage.getItem("arun-sound-v1") === "off"), "remembered as off");
  await p.reload({ waitUntil: "networkidle" });
  await p.locator("body").click();
  await p.waitForTimeout(400);
  ok(await p.evaluate(() => window.__acs.length === 0), "stays off after reload: no music player created");
  ok(errs.length === 0, "no page errors " + errs.join("|"));
  await ctx.close();
}
console.log("5. delete all");
{
  const { ctx, p } = await open();
  await p.evaluate(() => { localStorage.setItem("arun-sound-v1", "off"); localStorage.setItem("arun-ooh-v1", '{"hidden":false,"seen":["x"]}'); });
  await p.getByRole("button", { name: "Settings" }).click();
  await p.getByRole("button", { name: /Delete all my data/ }).click();
  await p.getByRole("button", { name: /Delete everything/ }).click();
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => !localStorage.getItem("arun-sound-v1") && !localStorage.getItem("arun-ooh-v1")), "music and Ooh keys removed");
  await ctx.close();
}
console.log("6. all the way down the page: the narrator bar");
const dockText = (p) => p.evaluate(() => document.querySelector(".ooh-dock .ooh-dock-text")?.textContent ?? "");
async function scrollTo(p, sel) {
  await p.evaluate((sel) => { const el = document.querySelector(sel); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.4); }, sel);
  await p.waitForTimeout(700);
}
{
  const { ctx, p, errs } = await open();
  ok(await p.locator(".ooh-dock").count() === 0, "no bar while the greeting is on screen");
  await scrollTo(p, "#tiny-title");
  ok(/Tiny counts/.test(await dockText(p)), `the bar describes the part being read: "${await dockText(p)}"`);
  await scrollTo(p, "#good-title");
  ok(/good thing/.test(await dockText(p)), `and changes as the page moves: "${await dockText(p)}"`);
  await scrollTo(p, "#calm-now");
  ok(/Breathe with the sun/.test(await dockText(p)), "back up, back to that part's line");
  const tb = await p.locator(".tabbar").boundingBox(), db = await p.locator(".ooh-dock").boundingBox();
  ok(db.y + db.height <= tb.y + 1, "the bar sits above the tab bar");
  await p.waitForTimeout(900);
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async () => (await axe.run(document.querySelector(".ooh-dock"))).violations.map((x) => x.id));
  ok(v.length === 0, `axe on the bar: ${v.join(",") || "clean"}`);
  await p.locator("#good-one").focus();
  await p.waitForTimeout(150);
  ok(await p.locator(".ooh-dock, .ooh-guide").count() === 0, "Ooh steps aside while someone is typing");
  await p.locator("#good-one").blur();
  await p.waitForTimeout(250);
  ok(await p.locator(".ooh-dock").count() === 0, "not straight away, so it cannot land under a tap");
  await p.waitForTimeout(1000);
  ok(await p.locator(".ooh-dock").count() === 1, "and comes back a moment later");
  await scrollTo(p, "#good-title");
  await p.locator("#good-one").fill("the bus came on time");
  await p.getByRole("button", { name: "Keep it" }).click();
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem("wellbeings-safe-v1")).goodThings?.[0]?.items?.[0]) === "the bus came on time", "typing then tapping “Keep it” always reaches the button");
  await p.locator(".ooh-dock .ooh-x").click();
  ok(await p.locator(".ooh-dock").count() === 0 && (await corner(p).count()) === 1, "× puts the bar away; Ooh waits in the corner");
  await corner(p).click();
  ok(await p.locator(".ooh-dock").count() === 1, "tapping Ooh brings the bar back");
  ok(errs.length === 0, "no page errors " + errs.join("|"));
  await ctx.close();
}
{
  const { ctx, p } = await open();
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(900);
  const go = p.locator(".ooh-dock").getByRole("button", { name: /Go to Hope/ });
  ok(await go.count() === 1, "at the bottom, the bar offers the next room");
  await go.click();
  ok((await p.locator(".tabbar [aria-current=page]").innerText()).includes("Hope"), "and takes you there");
  await ctx.close();
}
{
  const { ctx, p } = await open({ path: "guides/sleep/" });
  const heads = await p.locator("main h2").allInnerTexts();
  await p.evaluate(() => { const h = document.querySelectorAll("main h2")[1]; window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.4); });
  await p.waitForTimeout(800);
  ok(/change/.test(await dockText(p)), `a guide's headings are narrated ("${heads[1]}": "${await dockText(p)}")`);
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(900);
  const go = p.locator(".ooh-dock").getByRole("link", { name: /Go to my plan/ });
  ok(await go.count() === 1, "a guide hands over to the plan");
  await go.click();
  await p.waitForURL(/Well-beings\/($|\?)/, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(800);
  ok((await p.locator(".tabbar [aria-current=page]").innerText().catch(() => "")).includes("Plan"), "landing in the Plan room");
  ok(!/room=/.test(p.url()), `and the address bar is tidied (${p.url().replace(BASE, "/")})`);
  await ctx.close();
}
{
  const { ctx, p } = await open({ seed: { introSeen: true, arrivals: [{ at: now(), mood: 1, hope: 1, safety: "thoughts" }] } });
  for (const y of [400, 900, 1400, 99999]) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(500); }
  ok(await p.locator(".ooh-dock").count() === 0, "thoughts day: no narrator bar at all");
  ok(await corner(p).count() === 1, "just Ooh, quietly, in the corner");
  await ctx.close();
}
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
