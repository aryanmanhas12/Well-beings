import { chromium, BASE, AXE, LAUNCH, goRoom } from "./lib.mjs";
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
const seen = { v: 1, arrivals: [], goodThings: [{date:"2026-09-24",items:["Chai on the terrace"]}], hope: [{id:"a",kind:"people",text:"Didi",at:"2026-09-20T10:00:00Z"}], letter: {text:"You got through last winter.",at:"2026-09-01T10:00:00Z"}, plan: { warningSigns: "Not replying to anyone", coping: "Cold water, a walk", distractions: "", helpers: [{name:"Didi",phone:"+91 98765 43210"}], professionals: [], saferSurroundings: "", reason: "My sister", updatedAt:"2026-09-20T10:00:00Z" }, care: {name:"Dr Rao",role:"therapist",phone:"+919999999999",agreedAt:"2026-09-01T10:00:00Z",nudge:true}, dawn: { date: "", steps: [] }, region: "in", introSeen: true, lastVisit: null };
const results = [];
async function scan(label, setup, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.vp || { width: 390, height: 844 }, colorScheme: opts.scheme || "dark", reducedMotion: "reduce", __intro: !!opts.intro });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  if (opts.state !== false) await p.addInitScript((s) => { if (!localStorage.getItem("wellbeings-safe-v1")) localStorage.setItem("wellbeings-safe-v1", JSON.stringify(s)); }, opts.state || seen);
  if (opts.theme) await p.addInitScript((t) => localStorage.setItem("wellbeings-v1", JSON.stringify({ settings: { theme: t } })), opts.theme);
  await p.goto(BASE + (opts.path || ""));
  await p.waitForTimeout(500);
  if (setup) await setup(p);
  await p.waitForTimeout(400);
  await p.addScriptTag({ content: AXE });
  const r = await p.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, target: v.nodes.slice(0, 3).map((x) => x.target.join(" ")) }));
  });
  results.push({ label, violations: r, errs });
  await ctx.close();
}
const tab = (room) => async (p) => { await goRoom(p, room); await p.waitForTimeout(300); };
/* Past the check-in, where the tension tiles and the minute are. */
const checkedIn = async (p) => {
  await p.getByRole("button", { name: "Okay", exact: true }).click();
  await p.getByRole("button", { name: "Some light" }).click(); await p.waitForTimeout(300);
};
const minute = (steps) => async (p) => {
  await checkedIn(p);
  await p.locator('main .tension[data-topic="family"]').click(); await p.locator(".stage .sort").waitFor();
  for (let i = 0; i < steps; i++) { await p.locator(i % 2 ? ".sort-sky" : ".sort-sun").click(); await p.waitForTimeout(140); }
  if (steps >= 3) { await p.locator(".move-opt").first().click(); await p.locator(".cue-opt").nth(2).click(); }
};
const reel = (cards) => async (p) => {
  await p.locator(".reel-door .btn").click(); await p.locator(".stage .reel").waitFor();
  for (let i = 0; i < cards; i++) { await p.locator(".reel-next").click(); await p.waitForTimeout(140); }
};
for (const scheme of ["dark", "light"]) {
  await scan(`${scheme} intro, waiting`, null, { scheme, state: false, intro: true });
  await scan(`${scheme} intro, rising`, async (p) => { await p.getByRole("button", { name: "Wake the sun" }).click(); await p.waitForTimeout(400); }, { scheme, state: false, intro: true });
  await scan(`${scheme} home`, null, { scheme });
  await scan(`${scheme} thoughts response`, async (p) => {
    await p.getByRole("button", { name: "Low", exact: true }).click();
    await p.getByRole("button", { name: "Hard to picture" }).click();
    await p.getByRole("button", { name: "Yes, but I'm safe right now" }).click();
  }, { scheme });
  await scan(`${scheme} urgent`, async (p) => {
    await p.getByRole("button", { name: "Really heavy" }).click();
    await p.getByRole("button", { name: "I can't see a way forward" }).click();
    await p.getByRole("button", { name: "Yes, and I don't feel safe" }).click();
  }, { scheme });
  await scan(`${scheme} home, the tension tiles`, checkedIn, { scheme });
  await scan(`${scheme} minute, sorting`, minute(1), { scheme });
  await scan(`${scheme} minute, done`, minute(3), { scheme });
  for (const [n, what] of [[0, "line"], [1, "fact"], [2, "question"], [3, "now"], [4, "person"], [5, "end"]]) await scan(`${scheme} reel, ${what}`, reel(n), { scheme });
  await scan(`${scheme} me`, tab("me"), { scheme });
  await scan(`${scheme} calm`, tab("watch"), { scheme });
  await scan(`${scheme} calm consent`, async (p) => { await tab("watch")(p); await p.getByRole("button", { name: "Watch: I See Something" }).click(); }, { scheme });
  await scan(`${scheme} hope good`, tab("hope"), { scheme });
  await scan(`${scheme} hope box`, async (p) => { await tab("hope")(p); await p.getByRole("button", { name: "Hope box" }).click(); }, { scheme });
  await scan(`${scheme} hope note`, async (p) => { await tab("hope")(p); await p.getByRole("button", { name: "A note for later" }).click(); }, { scheme });
  await scan(`${scheme} plan use`, tab("plan"), { scheme });
  await scan(`${scheme} plan edit`, async (p) => { await tab("plan")(p); await p.getByRole("button", { name: "Edit my plan" }).click(); }, { scheme });
  await scan(`${scheme} reach`, tab("reach"), { scheme });
  await scan(`${scheme} reach summary`, async (p) => { await tab("reach")(p); await p.getByRole("button", { name: /Send Dr Rao my summary/ }).click(); }, { scheme });
  await scan(`${scheme} settings`, async (p) => { await p.getByRole("button", { name: "Settings" }).click(); }, { scheme });
  await scan(`${scheme} help dialog`, async (p) => { await p.getByRole("button", { name: /Help now/ }).click(); }, { scheme });
  await scan(`${scheme} desktop home`, null, { scheme, vp: { width: 1280, height: 900 } });
  for (const path of ["about/", "privacy/", "terms/", "resources/", "guides/", "guides/sleep/"]) await scan(`${scheme} /${path}`, null, { scheme, path });
}
for (const theme of ["light", "dark"]) {
  for (const [label, fn] of [["home", null], ["tiles", checkedIn], ["minute", minute(1)], ["reel", reel(1)], ["me", tab("me")], ["plan", tab("plan")], ["reach", tab("reach")], ["calm", tab("watch")]]) {
    await scan(`high contrast ${theme} ${label}`, async (p) => { await p.evaluate((t) => { document.documentElement.setAttribute("data-contrast", "high"); document.documentElement.setAttribute("data-theme", t); }, theme); if (fn) await fn(p); }, {});
  }
}
await browser.close();
let total = 0;
for (const r of results) {
  total += r.violations.length;
  if (r.violations.length || r.errs.length) console.log(`✗ ${r.label}: ${JSON.stringify(r.violations)} ${r.errs.length ? "ERRS " + r.errs.join(" | ") : ""}`);
}
console.log(`${results.length} scans, ${total} violation groups, ${results.reduce((n, r) => n + r.errs.length, 0)} console errors`);
