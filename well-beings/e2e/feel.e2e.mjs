import { chromium, BASE, LAUNCH } from "./lib.mjs";
const b = await chromium.launch({ executablePath: LAUNCH.executablePath, args: ["--no-sandbox"] });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`  ${c ? "✓" : "✗"} ${m}`); };
const now = () => new Date().toISOString();

/* Every page: count audio contexts, record the audio state at the instant
   the sunrise starts rising, and stub vibrate() to record ticks. */
function probe({ safe = { introSeen: true }, local = {}, session = {}, vibrate = true } = {}) {
  return [({ safe, local, session, vibrate }) => {
    if (!sessionStorage.getItem("__seeded")) {
      sessionStorage.setItem("__seeded", "1");
      localStorage.setItem("wellbeings-safe-v1", JSON.stringify(safe));
      localStorage.setItem("arun-install-v1", JSON.stringify({ notNowAt: new Date().toISOString() }));
      for (const [k, v] of Object.entries(local)) localStorage.setItem(k, v);
      for (const [k, v] of Object.entries(session)) sessionStorage.setItem(k, v);
    }
    const AC = window.AudioContext; window.__acs = [];
    window.__sfx = []; window.AudioContext = class extends AC { constructor(o) { super(o); (o && o.latencyHint === "interactive" ? window.__sfx : window.__acs).push(this); } };
    window.__ticks = []; window.__plays = [];
    const st = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...a) { window.__plays.push(this.buffer?.duration ?? 0); return st.apply(this, a); };
    if (vibrate === "real") {}
    else if (vibrate) navigator.vibrate = (p) => { window.__ticks.push(p); return true; };
    else { try { Object.defineProperty(Navigator.prototype, "vibrate", { value: undefined, configurable: true }); } catch {} }
    const watch = () => { if (!document.documentElement) return setTimeout(watch, 0); new MutationObserver(() => {
      const r = document.documentElement;
      if (r.dataset.intro === "pending" && !r.hasAttribute("data-intro-gate") && window.__roseAt === undefined && window.__gated) {
        window.__roseAt = performance.now();
        window.__audioAtRise = window.__acs[0]?.state ?? "none";
      }
      if (r.hasAttribute("data-intro-gate")) window.__gated = true;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-intro", "data-intro-gate"] }); };
    watch();
  }, { safe, local, session, vibrate }];
}
async function open(opts = {}, ctxOpts = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, ...ctxOpts });
  await ctx.addInitScript(...probe(opts));
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(BASE + (opts.path ?? ""), { waitUntil: "networkidle" });
  await p.evaluate(() => { if (document.documentElement.hasAttribute("data-intro-gate")) window.__gated = true; });
  return { ctx, p, errs };
}
const attr = (p, a) => p.evaluate((a) => document.documentElement.getAttribute(a), a);

console.log("1. the sunrise, every time Arun is opened, with the music in step");
{
  const { ctx, p, errs } = await open();
  ok(await attr(p, "data-intro") === "pending" && await attr(p, "data-intro-gate") === "1", "a new session opens on the waiting sky");
  ok(await p.getByRole("button", { name: "Wake the sun" }).isVisible(), "with one big button to wake the sun");
  ok(await p.evaluate(() => document.activeElement?.textContent?.includes("Wake the sun")), "which has the focus");
  ok(await p.evaluate(() => window.__acs.length) === 0, "and not a sound before the tap");
  const gateText = await p.locator(".intro-gate").innerText();
  ok(gateText.includes("Nothing you write leaves your phone.") && gateText.includes("free") && gateText.includes("surprise"), "the waiting sky says it stays on the phone, it's free, and a surprise is coming");
  ok(!/sunrise|sun is|music plays/i.test(gateText.replace("Wake the sun", "")), "and does not give the surprise away");
  await p.getByRole("button", { name: "Wake the sun" }).click();
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__audioAtRise) === "running", "the music is already running at the instant the sun starts to rise");
  const anim = await p.evaluate(() => document.querySelector(".intro-sun")?.getAnimations().map((a) => a.animationName));
  ok(anim?.includes("introRise"), "and the sun is rising");
  ok(await p.evaluate(() => getComputedStyle(document.querySelector(".intro-ooh-awake")).display !== "none"), "Ooh wakes up with it");
  ok((await p.locator(".intro-small").innerText()).startsWith("This is a quiet place."), "the rise does not repeat what the gate just said");
  await p.waitForTimeout(4400);
  await p.getByRole("button", { name: "Come in" }).click();
  await p.waitForTimeout(700);
  ok(await attr(p, "data-intro") === null, "Come in lets you in");
  ok(await p.evaluate(() => window.__acs[0].state) === "running", "and the music carries on");
  await p.reload({ waitUntil: "networkidle" });
  ok(await attr(p, "data-intro") === null, "a reload does not replay it");
  ok(errs.length === 0, "no page errors " + errs.join("|"));
  await ctx.close();
}
{
  const { ctx, p } = await open();
  ok(await p.locator(".intro-line").first().innerText() === "Welcome back.", "someone who has been before is welcomed back");
  await p.getByRole("button", { name: "Without music" }).click();
  await p.waitForTimeout(600);
  ok(await attr(p, "data-intro-gate") === null, "“Without music” wakes the sun too");
  ok(await p.evaluate(() => localStorage.getItem("arun-sound-v1")) === "off", "and turns the music off");
  await p.waitForTimeout(600);
  ok(await p.evaluate(() => window.__acs.every((a) => a.state !== "running")), "so nothing plays");
  await ctx.close();
}
{
  const { ctx, p } = await open({ safe: {} });
  ok(await p.locator(".intro-line").first().innerText() === "You made it here.", "a first visit gets the first-visit words");
  await ctx.close();
}
{
  const { ctx, p } = await open({ local: { "arun-sound-v1": "off" } });
  ok(await attr(p, "data-intro") === "pending" && await attr(p, "data-intro-gate") === null, "music off: the sun simply rises, no waiting");
  ok((await p.locator(".intro-small").innerText()).includes("leaves your phone, and it's free"), "and says it stays on the phone and is free, since there was no gate");
  await ctx.close();
}
{
  const { ctx, p } = await open({ safe: { introSeen: true, arrivals: [{ at: now(), mood: 1, hope: 1, safety: "thoughts" }] } });
  ok(await attr(p, "data-intro") === null, "after thoughts of suicide were reported, no sunrise: the plan comes first");
  await ctx.close();
}
{
  const { ctx, p } = await open({ safe: { introSeen: true, arrivals: [{ at: new Date(Date.now() - 5 * 864e5).toISOString(), mood: 1, hope: 1, safety: "thoughts" }] } });
  ok(await attr(p, "data-intro") === "pending", "five days on, the sunrise comes back");
  await ctx.close();
}
{
  const { ctx, p } = await open({ local: { "arun-intro-v1": "off" } });
  ok(await attr(p, "data-intro") === "pending", "permanent: an old “off” from the removed switch no longer stops the sunrise");
  ok(await p.evaluate(() => localStorage.getItem("arun-intro-v1")) === null, "and the old “off” is cleared from the device");
  await ctx.close();
}
{
  const { ctx, p } = await open();
  await p.getByRole("button", { name: "Need help now" }).click();
  await p.waitForTimeout(700);
  ok(await attr(p, "data-intro") === null, "“Need help now” leaves the sunrise at once");
  ok(/14416|Tele-MANAS|helpline/i.test(await p.locator("[role=dialog]").last().innerText().catch(() => "")), "and opens the helplines");
  await ctx.close();
}
{
  const { ctx, p } = await open();
  await p.getByRole("button", { name: "Skip" }).click();
  await p.waitForTimeout(700);
  await p.getByRole("button", { name: "Settings" }).click();
  ok(await p.getByRole("dialog", { name: "Settings" }).getByRole("switch", { name: /Sunrise/ }).count() === 0, "Settings has no switch to turn the sunrise off");
  await p.keyboard.press("Escape");
  await ctx.close();
}
{
  /* Coming back to the app. The page is told it went to the background
     and returned; the note of when it left is backdated. */
  const { ctx, p } = await open({ session: { "arun-intro-session": "played" } });
  ok(await attr(p, "data-intro") === null, "inside a visit there is no sunrise on the way in");
  const away = (mins) => p.evaluate((mins) => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
    sessionStorage.setItem("arun-intro-left", String(Date.now() - mins * 60000));
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  }, mins);
  await away(5);
  await p.waitForTimeout(300);
  ok(await attr(p, "data-intro") === null, "back after 5 minutes: carries on where it was");
  await away(25);
  await p.waitForTimeout(300);
  ok(await attr(p, "data-intro") === "pending" && await attr(p, "data-intro-gate") === "1", "back after 25 minutes: that is opening Arun again, and the sunrise waits for its tap");
  await p.getByRole("button", { name: "Wake the sun" }).click();
  await p.waitForTimeout(4600);
  await p.getByRole("button", { name: "Come in" }).click();
  await p.waitForTimeout(700);
  ok(await attr(p, "data-intro") === null, "and Come in lets you back in");
  await p.evaluate(() => sessionStorage.setItem("arun-intro-left", String(Date.now() - 30 * 60000)));
  await p.reload({ waitUntil: "networkidle" });
  ok(await attr(p, "data-intro") === "pending", "a launch after 30 minutes away (the app reloaded by the phone) plays it too");
  await ctx.close();
}
{
  const { ctx, p } = await open({ session: { "arun-intro-session": "played" }, safe: { introSeen: true, arrivals: [{ at: new Date().toISOString(), mood: 1, hope: 1, safety: "unsafe" }] } });
  await p.evaluate(() => {
    sessionStorage.setItem("arun-intro-left", String(Date.now() - 60 * 60000));
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await p.waitForTimeout(300);
  ok(await attr(p, "data-intro") === null, "back after an hour on a day someone said they were not safe: the plan comes first, no sunrise");
  await ctx.close();
}

console.log("2. feedback you can feel");
{
  const { ctx, p } = await open({ session: { "arun-intro-session": "played" } });
  await p.getByRole("button", { name: /^Watch$/ }).first().click();
  await p.waitForTimeout(200);
  ok((await p.evaluate(() => window.__ticks)).some((t) => JSON.stringify(t) === "[6,36,6]"), "a double tick when the room changes");
  await p.evaluate(() => (window.__ticks = []));
  await p.evaluate(() => window.scrollTo(0, 900));
  await p.waitForTimeout(700);
  ok((await p.evaluate(() => window.__ticks)).includes(8), "a lighter tick as a new section arrives");
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.getByRole("button", { name: "Settings" }).click();
  await p.getByRole("dialog", { name: "Settings" }).getByRole("switch", { name: /Vibration/ }).click();
  await p.keyboard.press("Escape");
  await p.evaluate(() => (window.__ticks = []));
  await p.getByRole("button", { name: /^Hope$/ }).first().click();
  await p.evaluate(() => window.scrollTo(0, 1200));
  await p.waitForTimeout(700);
  ok((await p.evaluate(() => window.__ticks)).length === 0, "Vibration off: no ticks at all");
  ok(await p.evaluate(() => localStorage.getItem("arun-haptics-v1")) === "off", "and it is remembered");
  await ctx.close();
}
{
  const IPAD = "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
  const { ctx, p } = await open({ vibrate: false, session: { "arun-intro-session": "played" } }, { userAgent: IPAD, hasTouch: true });
  const before = await p.evaluate(() => typeof navigator.vibrate);
  await p.getByRole("button", { name: /^Hope$/ }).first().click();
  await p.waitForTimeout(150);
  const sw = await p.evaluate(() => { const i = document.getElementById("arun-haptic-switch"); return i ? { checked: i.checked, sw: i.hasAttribute("switch") } : null; });
  ok(before !== "function" && sw?.sw && sw.checked === true, "no vibrate() (iPhone, iPad): the system switch ticks on a tap instead");
  await ctx.close();
}

console.log("3. feedback you can see");
{
  const { ctx, p } = await open({ session: { "arun-intro-session": "played" } });
  const lineScale = () => p.evaluate(() => { const m = getComputedStyle(document.querySelector(".scroll-dawn")).transform; return m === "none" ? 1 : new DOMMatrix(m).a; });
  ok(await lineScale() < 0.01, "the sunrise line is empty at the top");
  const below = await p.evaluate(() => [...document.querySelectorAll("[data-reveal='pending']")].length);
  ok(below > 0, `sections below the fold wait to glide in (${below})`);
  ok(await p.evaluate(() => [...document.querySelectorAll("[data-reveal]")].every((el) => el.getBoundingClientRect().top > 0)), "nothing already on screen is held back");
  await p.evaluate(() => window.scrollTo(0, 1100));
  await p.waitForTimeout(800);
  ok(await p.evaluate(() => document.querySelectorAll("[data-reveal='in']").length) > 0, "and glide in, glowing, as they arrive");
  const scale = await lineScale();
  ok(scale > 0.1, `the sunrise line fills as the page scrolls (${scale.toFixed(2)})`);
  ok(await p.evaluate(() => { const el = document.querySelector("[data-reveal='in']"); return el && getComputedStyle(el).opacity === "1"; }), "revealed sections never fade: text keeps full contrast");
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(200);
  const btn = p.getByRole("button", { name: "Settings" });
  const box = await btn.boundingBox();
  await p.mouse.move(box.x + 10, box.y + 10);
  await p.mouse.down();
  ok(await p.locator(".fx-ring").count() >= 1, "a ring of light where the finger lands");
  await p.mouse.up();
  await p.waitForTimeout(900);
  ok(await p.locator(".fx-ring").count() === 0, "and it clears itself away");
  await ctx.close();
}
{
  const { ctx, p } = await open({ session: { "arun-intro-session": "played" } }, { reducedMotion: "reduce" });
  ok(await p.evaluate(() => document.querySelectorAll("[data-reveal]").length) === 0, "reduced motion: nothing glides");
  const box = await p.getByRole("button", { name: "Settings" }).boundingBox();
  await p.mouse.move(box.x + 10, box.y + 10); await p.mouse.down();
  const ring = await p.evaluate(() => { const r = document.querySelector(".fx-ring"); if (!r) return null; const a = r.getAnimations()[0]; return a?.animationName; });
  ok(ring === "fxFade", `but the lights stay: the ring is there and fades in place, without growing (${ring})`);
  await p.mouse.up();
  await p.keyboard.press("Escape");
  await p.locator(".tabbar button", { hasText: "Watch" }).click();
  ok(await p.evaluate(() => document.querySelector(".fx-sweep")?.className) === "fx-sweep still", "a room change is a soft wash of light, not a sweep");
  await p.evaluate(() => window.scrollTo(0, 1400));
  await p.waitForTimeout(250);
  ok(await p.evaluate(() => { const g = document.querySelector(".fx-glow"); return !!g && !g.classList.contains("gliding"); }), "and cards still light up as they arrive, in place");
  await ctx.close();
}
console.log("4. Ronak's feel: sounds, sweep, glow, and Ooh alive");
{
  {
    /* The real vibrate(): a refused call shows up as a console error. */
    const { ctx: c2, p: p2, errs: e2 } = await open({ vibrate: "real", session: { "arun-intro-session": "played" } });
    await p2.evaluate(() => window.scrollTo(0, 900));
    await p2.waitForTimeout(700);
    ok(!e2.some((e) => /vibrate/.test(e)), "no refused vibration as cards arrive before the first tap " + e2.join(" | "));
    await c2.close();
  }
  const { ctx, p, errs } = await open({ session: { "arun-intro-session": "played" } });
  ok(await p.evaluate(() => window.__sfx.length) === 0, "and no sound player before the first tap");
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.locator(".tabbar button", { hasText: "Watch" }).click();
  ok(await p.locator(".fx-sweep").count() === 1, "another room: a sweep of light down the screen");
  await p.waitForTimeout(1500);
  ok(await p.locator(".fx-sweep").count() === 0, "which clears itself away");
  ok(await p.evaluate(() => window.__sfx.length === 1 && window.__sfx[0].state === "running"), "the first tap wakes the sound player");
  const fetched = await p.evaluate(() => performance.getEntriesByType("resource").filter((e) => e.name.includes("/sounds/")).map((e) => e.name.split("/").pop().split("?")[0]));
  ok(["press.mp3", "typing.mp3", "forward.mp3", "wake.mp3"].every((f) => fetched.includes(f)), `the everyday sounds load after that tap, from Arun itself (${fetched.length})`);
  await p.evaluate(() => (window.__plays = []));
  await p.locator(".tabbar button", { hasText: "Hope" }).click();
  await p.waitForTimeout(250);
  ok(await p.evaluate(() => window.__plays.length) >= 1, "a room change makes a page-turn sound");
  /* Ooh talking */
  await p.locator(".tabbar button", { hasText: "Here" }).click();
  await p.evaluate(() => (window.__plays = []));
  await p.waitForTimeout(250);
  const talking = await p.evaluate(() => !!document.querySelector(".ooh-strip .ooh-talkw.ooh-talking"));
  ok(talking, "while Ooh's words come out, Ooh is talking (the sprout sways)");
  await p.waitForTimeout(900);
  const blips = await p.evaluate(() => window.__plays.filter((d) => d > 0 && d < 0.2).length);
  ok(blips >= 3, `with a little voice, a blip every few letters (${blips})`);
  await p.waitForTimeout(3500);
  ok(await p.evaluate(() => !document.querySelector(".ooh-strip .ooh-talking")), "and stops talking when the line is out");
  ok(await p.evaluate(() => document.querySelector(".ooh-strip .ooh-bobw")?.getAnimations().some((a) => a.animationName === "oohBreathe")), "Ooh breathes: a slow bob on the wrapper, not inside the drawing");
  ok(await p.evaluate(() => getComputedStyle(document.querySelector(".ooh-strip .ooh-figure")).filter === "none" && getComputedStyle(document.querySelector(".ooh-strip .ooh-svg")).filter !== "none"), "the outline filter is on the drawing inside the moving wrapper, so a breath never redraws it");
  const blinked = await p.evaluate(() => new Promise((r) => { const svg = document.querySelector(".ooh-strip .ooh-svg"); const mo = new MutationObserver(() => { if (svg.classList.contains("blink")) { mo.disconnect(); r(true); } }); mo.observe(svg, { attributes: true }); setTimeout(() => r(false), 7500); }));
  ok(blinked, "and blinks every few seconds");
  /* the glow, every time a card arrives */
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  await p.evaluate(() => window.scrollTo(0, 1300)); await p.waitForTimeout(200);
  const g1 = await p.evaluate(() => document.querySelectorAll(".fx-glow").length);
  ok(g1 >= 1, `cards light up as they arrive (${g1})`);
  ok(await p.evaluate(() => { const g = document.querySelector(".fx-glow"); return g && getComputedStyle(g).pointerEvents === "none"; }), "the light never catches a tap");
  await p.waitForTimeout(5400);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  await p.evaluate(() => window.scrollTo(0, 1300)); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelectorAll(".fx-glow").length) >= 1, "and light up again when they come back into view: the lights are always there");
  await p.evaluate(() => window.scrollTo(0, 0));
  /* sounds off */
  await p.getByRole("button", { name: "Settings" }).click();
  await p.getByRole("dialog", { name: "Settings" }).getByRole("switch", { name: /^Sounds/ }).click();
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  await p.evaluate(() => (window.__plays = []));
  await p.locator(".tabbar button", { hasText: "Plan" }).click();
  await p.waitForTimeout(1200);
  ok(await p.evaluate(() => window.__plays.length) === 0, "Sounds off: silent, Ooh's voice included");
  ok(await p.evaluate(() => localStorage.getItem("arun-sfx-v1")) === "off", "and it is remembered");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await ctx.close();
}
{
  const { ctx, p } = await open({ safe: { introSeen: true, region: "in" }, session: { "arun-intro-session": "played" } });
  await p.locator(".tabbar button", { hasText: "Watch" }).click();
  await p.waitForTimeout(700);
  await p.getByRole("button", { name: /Help now/ }).first().click();
  await p.waitForTimeout(500);
  await p.evaluate(() => { window.__plays = []; window.__ticks = []; });
  const tel = p.locator("[role=dialog] a[href^='tel:']").first();
  if (await tel.count()) {
    await tel.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault(), { once: true }));
    await tel.click();
    await p.waitForTimeout(200);
    const heard = await p.evaluate(() => JSON.stringify({ plays: window.__plays, ticks: window.__ticks }));
    ok(await p.evaluate(() => window.__plays.length === 0 && window.__ticks.length === 0), "a helpline number: no sound, no buzz " + heard);
  } else ok(false, "a helpline number is on the help screen");
  await ctx.close();
}
for (const w of [320, 390, 1280]) {
  const { ctx, p } = await open({ session: { "arun-intro-session": "played" } }, { viewport: { width: w, height: 800 } });
  for (const y of [600, 1400, 99999]) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(350); }
  const over = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  ok(!over, `${w}px: no sideways scroll with the bar and effects`);
  await ctx.close();
}
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
