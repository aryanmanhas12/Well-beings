import { chromium, BASE, LAUNCH, goRoom } from "./lib.mjs";
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
const seed = { introSeen: true, region: "in", arrivals: [{ at: new Date(Date.now() - 3600e3).toISOString(), mood: 2, hope: 2, safety: "thoughts" }, { at: new Date(Date.now() - 86400e3 * 2).toISOString(), mood: 2, hope: 1 }], hope: [{ id: "a", kind: "people", text: "Didi, who always calls on Sundays and never asks why", at: "2026-09-20" }], goodThings: [{ date: "2026-09-24", items: ["Chai on the terrace after the exams ended"] }], letter: { text: "You got through last winter.", at: "2026-09-01T00:00:00Z" }, plan: { warningSigns: "Not replying", coping: "Cold water", distractions: "Library", helpers: [{ name: "Didi", phone: "+91 98765 43210" }], professionals: [{ name: "Tele-MANAS", phone: "14416" }], saferSurroundings: "Not alone tonight", reason: "My sister", updatedAt: "2026-09-20T00:00:00Z" }, care: { name: "Dr Rao", role: "therapist", phone: "+919999999999", agreedAt: "2026-09-01T00:00:00Z", nudge: true } };
/* An okay day, for the pages a heavy one does not show: the tension tiles,
   the minute and the reel. */
const steady = { introSeen: true, region: "in", arrivals: [{ at: new Date(Date.now() - 600e3).toISOString(), mood: 4, hope: 4 }], minutes: [{ at: new Date(Date.now() - 86400e3).toISOString(), topic: "studies", mine: ["s-hour"], notMine: ["s-result", "s-log"], move: { id: "m-askfriend", cue: "now", status: "open" } }] };
const problems = [];
let checks = 0;
for (const width of [320, 360, 390, 414, 768, 1024, 1440]) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: "reduce", hasTouch: width < 768, isMobile: width < 768 });
  let p = await ctx.newPage();
  await p.addInitScript((s) => localStorage.setItem("wellbeings-safe-v1", JSON.stringify(s)), seed);
  const audit = async (label) => {
    checks++;
    const r = await p.evaluate(() => {
      const doc = document.documentElement;
      const over = doc.scrollWidth - doc.clientWidth;
      const offenders = [];
      if (over > 0) for (const el of document.querySelectorAll("body *")) { const b = el.getBoundingClientRect(); if (b.right > doc.clientWidth + 1 && getComputedStyle(el).position !== "fixed" && b.width > 0) offenders.push(el.tagName + "." + [...el.classList].join(".")); }
      const small = [];
      /* The stage is a fixed layer, so the page's own width says nothing
         about it: anything of its that carries words or can be pressed
         must sit inside the screen. */
      for (const el of document.querySelectorAll(".stage button, .stage p, .stage h2, .stage blockquote, .stage summary")) { const b = el.getBoundingClientRect(); if (b.width > 0 && (b.right > doc.clientWidth + 1 || b.left < -1)) offenders.push("stage " + el.tagName + "." + [...el.classList].join(".")); }
      for (const el of document.querySelectorAll("main button, main a.btn, .tabbar button, .nav button, .call-btn, .stage button")) {
        const b = el.getBoundingClientRect(); if (!b.width || getComputedStyle(el).visibility === "hidden") continue;
        if (b.height < 40 || b.width < 40) small.push(`${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24)} ${Math.round(b.width)}x${Math.round(b.height)}`);
      }
      const tiny = [];
      for (const el of document.querySelectorAll("main *, .stage *")) { if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) tiny.push(`${el.textContent.trim().slice(0, 20)} ${fs}px`); }
      return { over, offenders: offenders.slice(0, 5), small: [...new Set(small)].slice(0, 8), tiny: [...new Set(tiny)].slice(0, 5) };
    });
    if (r.over > 0 || r.offenders.length) problems.push(`${width}px ${label}: horizontal overflow ${r.over}px ${r.offenders.join(", ")}`);
    if (r.small.length && width < 768) problems.push(`${width}px ${label}: small targets ${r.small.join(" | ")}`);
    if (r.tiny.length) problems.push(`${width}px ${label}: text under 12px ${r.tiny.join(" | ")}`);
  };
  await p.goto(BASE); await p.waitForTimeout(500);
  await audit("here");
  for (const t of ["watch", "me", "hope", "plan", "reach"]) { await goRoom(p, t); await p.waitForTimeout(350); await audit(t); }
  await goRoom(p, "hope"); await p.getByRole("button", { name: "Hope box" }).click(); await audit("hope box");
  await goRoom(p, "plan"); await p.getByRole("button", { name: "Edit my plan" }).click(); await audit("plan edit");
  for (const path of ["about/", "privacy/", "terms/", "resources/", "guides/", "guides/stress/"]) { await p.goto(BASE + path); await p.waitForTimeout(250); await audit("/" + path); }
  await ctx.close();

  /* The same widths on an okay day, in both languages: Home with the
     follow-up, the tiles and the reel's door; every step of a minute;
     every card of the reel. Hinglish runs longer than English, so it is
     the one that finds a tile or a button too narrow. */
  for (const lang of ["en", "hinglish"]) {
    const c2 = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: "reduce", hasTouch: width < 768, isMobile: width < 768, timezoneId: "Asia/Kolkata" });
    const q = await c2.newPage();
    await q.addInitScript(([st, l]) => { localStorage.setItem("wellbeings-safe-v1", JSON.stringify(st)); localStorage.setItem("wellbeings-v1", JSON.stringify({ settings: { lang: l } })); }, [steady, lang]);
    const was = p; p = q;
    await q.goto(BASE); await q.waitForTimeout(500);
    await audit(`${lang} home, tiles`);
    await q.locator('main .tension[data-topic="family"]').click(); await q.locator(".stage .sort").waitFor(); await q.waitForTimeout(150);
    await audit(`${lang} minute, sort`);
    for (const z of [".sort-sun", ".sort-sky", ".sort-sun"]) { await q.locator(z).click(); await q.waitForTimeout(140); }
    await audit(`${lang} minute, move`);
    await q.locator(".move-opt").first().click(); await q.waitForTimeout(140);
    await audit(`${lang} minute, when`);
    await q.locator(".cue-opt").nth(2).click(); await q.waitForTimeout(250);
    await audit(`${lang} minute, done`);
    await q.locator(".stage-link").first().click(); await q.waitForTimeout(200);
    await audit(`${lang} minute, pick`);
    await q.keyboard.press("Escape"); await q.waitForTimeout(200);
    await q.locator(".reel-door .btn").click(); await q.locator(".stage .reel").waitFor(); await q.waitForTimeout(150);
    for (let i = 0; i < 5; i++) {
      await audit(`${lang} reel card ${i + 1}`);
      if (i === 2) { await q.locator(".ask-opt").first().click(); await q.waitForTimeout(120); await audit(`${lang} reel card 3, answered`); }
      await q.locator(".reel-next").click(); await q.waitForTimeout(150);
    }
    await audit(`${lang} reel end`);
    p = was;
    await c2.close();
  }
}
await browser.close();
console.log(problems.length ? problems.join("\n") : "no problems");
console.log(`${checks} layout checks`);
