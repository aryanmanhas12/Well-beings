/**
 * One minute, the reel that ends, and the three tabs they live under.
 *
 * Against the built export in a real Chromium, like every suite here. What
 * is held: the path to the safety plan (Me, first row, offline too); that
 * Home asks one question at a time; that a minute leaves nothing behind
 * when left half way and only ids when finished; that "did it happen?"
 * waits for the move's time; that the cards can be thrown, tapped or keyed
 * to the same result; that the reel is five cards and then stops, never
 * moves by itself and keeps no answer; that both are withheld after a
 * report of thoughts of suicide; and that all of it speaks Hinglish.
 */
import { chromium, BASE, AXE, LAUNCH, goRoom, roomOf } from "./lib.mjs";
const browser = await chromium.launch({ executablePath: LAUNCH.executablePath, args: ["--no-sandbox"] });
{
  const __real = browser.newContext.bind(browser);
  browser.newContext = async (o = {}) => {
    const c = await __real(o);
    await c.addInitScript(() => { try { sessionStorage.setItem("arun-intro-session", "e2e"); } catch {} });
    return c;
  };
}
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ✓ " + m); } else { fail++; console.log("  ✗ " + m); } };
const errors = [];
const KEY = "wellbeings-safe-v1";
async function fresh(state, opts = {}, path = "") {
  const { settings, ...rest } = opts;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", timezoneId: "Asia/Kolkata", ...rest });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  if (state) await p.addInitScript(([k, s]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(s)); }, [KEY, state]);
  if (settings) await p.addInitScript((s) => { if (!localStorage.getItem("wellbeings-v1")) localStorage.setItem("wellbeings-v1", JSON.stringify({ settings: s })); }, settings);
  await p.goto(BASE + path); await p.waitForTimeout(450);
  return { ctx, p };
}
const safe = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), KEY);
const ago = (h) => new Date(Date.now() - h * 3_600_000).toISOString();
const a = (h, mood, hope, safety) => ({ at: ago(h), mood, hope, ...(safety ? { safety } : {}) });
const steady = (extra = {}) => ({ introSeen: true, region: "in", arrivals: [a(0.2, 4, 4)], ...extra });
const heavy = (extra = {}) => ({ introSeen: true, region: "in", arrivals: [a(100, 3, 2), a(60, 3, 1), a(30, 3, 2), a(0.2, 4, 3)], ...extra });
const current = async (p) => (await p.locator(".tabbar [aria-current=page]").innerText()).trim();
const tile = (p, topic) => p.locator(`main .tension[data-topic="${topic}"]`);
const openMinute = async (p, topic) => { await tile(p, topic).click(); await p.locator(".stage .sort, .stage .minute-pick").first().waitFor(); await p.waitForTimeout(150); };
const sort = async (p, piles) => { for (const pile of piles) { await p.locator(pile === "sky" ? ".sort-sky" : ".sort-sun").click(); await p.waitForTimeout(140); } };
const axe = async (p) => {
  if (!(await p.evaluate(() => !!window.axe))) await p.addScriptTag({ content: AXE });
  return p.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
    return res.violations.map((v) => `${v.id} (${v.nodes.slice(0, 2).map((x) => x.target.join(" ")).join("; ")})`);
  });
};

console.log("1. three tabs, and the way to the plan");
{
  const { ctx, p } = await fresh({ introSeen: true, region: "in" });
  ok((await p.locator(".tabbar button").allInnerTexts()).map((s) => s.trim()).join(",") === "Home,Me,Talk", "the tab bar is Home, Me, Talk");
  ok((await roomOf(p)) === "here" && (await current(p)) === "Home", "it opens on Home");
  await goRoom(p, "me"); await p.waitForTimeout(250);
  ok((await roomOf(p)) === "me" && (await current(p)) === "Me", "Me is a room of its own");
  ok((await p.locator(".me .tool-row").first().innerText()).includes("My safety plan"), "the safety plan is the first row in Me");
  await p.locator(".me .tool-row").first().click(); await p.waitForTimeout(250);
  ok((await roomOf(p)) === "plan" && (await current(p)) === "Me", "it opens the plan, and Me stays lit in the tab bar");
  ok(await p.locator("#plan-warningSigns").isVisible(), "an unwritten plan opens ready to write");
  ok((await p.locator(".back-chip").innerText()).includes("Me"), "a chip says the way back");
  await p.locator(".back-chip").click(); await p.waitForTimeout(250);
  ok((await roomOf(p)) === "me", "and takes it");
  await p.locator(".me .tool-row", { hasText: "My hope box" }).click(); await p.waitForTimeout(700);
  ok((await roomOf(p)) === "hope" && (await p.getByRole("heading", { name: "Words I want to keep" }).count()) === 1, "the hope box opens from Me, with a place for words");
  await goRoom(p, "reach"); await p.waitForTimeout(250);
  ok((await roomOf(p)) === "reach" && (await current(p)) === "Talk" && (await p.locator("#lines-title").isVisible()), "Talk is the people: the lines come first");
  await goRoom(p, "watch"); await p.waitForTimeout(700);
  ok((await roomOf(p)) === "watch" && (await current(p)) === "Home", "Watch is a door on Home");
  await p.locator(".back-chip").click(); await p.waitForTimeout(250);
  ok((await roomOf(p)) === "here", "with a chip back to Home");
  await p.locator(".door", { hasText: "One minute with the sun" }).click(); await p.waitForTimeout(900);
  ok((await roomOf(p)) === "watch" && (await p.locator("#watch-breathe").evaluate((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })), "the Breathe door lands on breathing");
  for (const [q, want] of [["?room=hope&view=box", "hope"], ["?room=plan&view=daily", "plan"], ["?room=watch", "watch"], ["?room=me", "me"], ["?room=reach", "reach"]]) {
    await p.goto(BASE + q); await p.waitForTimeout(600);
    ok((await roomOf(p)) === want && !p.url().includes("room="), `a link written before the three tabs still lands: ${q}`);
  }
  await p.goto(BASE); await p.waitForTimeout(1200);
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(700);
  await goRoom(p, "plan"); await p.waitForTimeout(300);
  ok((await roomOf(p)) === "plan" && (await p.locator("#plan-warningSigns").isVisible()), "offline, Me and the safety plan still open");
  await ctx.close();
}

console.log("2. Home asks one question at a time");
{
  const { ctx, p } = await fresh({ introSeen: true, region: "in" });
  ok((await p.locator(".checkin-q").isVisible()) && (await p.locator("main .tension").count()) === 0, "before the check-in, only the check-in asks");
  ok(await p.locator(".reel-door").isVisible(), "today's five is there from the start");
  await p.getByRole("button", { name: "Okay", exact: true }).click();
  await p.getByRole("button", { name: "Some light" }).click(); await p.waitForTimeout(400);
  ok((await p.locator("main .tension").count()) === 8, "after it, eight tensions to choose from");
  ok((await p.locator("#tension-title").innerText()) === "What's the tension right now?", "in India the question says tension");
  ok((await p.locator("main.haven").getAttribute("data-energy")) === "bright", "an okay day is bright");
  ok((await p.locator("#now-video, #tiny-title, #good-title, #pattern-title, #check-title").count()) === 0, "the ten cards Home used to carry are gone from it");
  ok((await p.locator(".door").count()) === 4, "four doors: breathe, watch, sit with me, play");
  const order = await p.evaluate(() => ["#tension-title", "#reel-title", "#doors-title"].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().top + scrollY)));
  ok(order[0] < order[1] && order[1] < order[2], "in order: the tension, today's five, the doors");
  await ctx.close();
  const b = await fresh({ introSeen: true, arrivals: [a(0.2, 4, 4)] }, { timezoneId: "Europe/Berlin" });
  ok((await b.p.locator("#tension-title").innerText()) === "What's weighing on you right now?", "elsewhere it is asked in other words");
  await b.ctx.close();
  const skip = await fresh({ introSeen: true, region: "in" });
  await skip.p.getByRole("button", { name: "Not right now" }).click(); await skip.p.waitForTimeout(250);
  ok((await skip.p.locator("main .tension").count()) === 8, "skipping the check-in still gets to the minute");
  await skip.ctx.close();
}

console.log("3. one minute, by tap and by key");
{
  const { ctx, p } = await fresh(steady());
  await openMinute(p, "studies");
  const stage = p.locator(".stage");
  ok((await stage.getAttribute("role")) === "dialog" && (await stage.getAttribute("aria-label")) === "One minute", "the minute opens as a named dialog");
  const strip = await p.locator(".crisis-strip").boundingBox(), box = await stage.boundingBox();
  ok(strip && box && Math.abs(box.y - (strip.y + strip.height)) < 2, "under the crisis strip, which stays on screen");
  ok(await p.evaluate(() => document.querySelector(".stage").contains(document.activeElement)), "focus moves into it");
  ok((await stage.getAttribute("data-energy")) === "bright", "bright, like the day");
  ok((await p.locator(".sort-card-wrap").getAttribute("style")) === null, "under reduced motion nothing has moved the card");
  await p.locator(".stage-help").click(); await p.waitForTimeout(250);
  ok(await p.locator(".urgent").isVisible(), "Help now opens the urgent screen over it");
  await p.keyboard.press("Escape"); await p.waitForTimeout(250);
  ok(!(await p.locator(".urgent").isVisible()) && (await stage.isVisible()), "closing that leaves the minute where it was");
  for (let i = 0; i < 12; i++) await p.keyboard.press("Tab");
  ok(await p.evaluate(() => document.querySelector(".stage").contains(document.activeElement)), "Tab stays inside the minute");
  await sort(p, ["sky"]);
  await p.keyboard.press("Escape"); await p.waitForTimeout(250);
  ok(!(await stage.isVisible()) && ((await safe(p)).minutes ?? []).length === 0, "left half way, it keeps nothing");
  ok(await p.evaluate(() => document.activeElement?.getAttribute("data-topic") === "studies"), "and focus goes back to the tile that opened it");

  await openMinute(p, "studies");
  const first = [];
  for (let i = 0; i < 3; i++) {
    first.push(await p.locator("#sort-card").innerText());
    if (i === 0) await p.locator(".sort-sky").click();
    else if (i === 1) await p.keyboard.press("ArrowDown");
    else await p.locator(".sort-sun").click();
    await p.waitForTimeout(160);
  }
  ok(new Set(first).size === 3, "three different cards");
  ok((await p.locator(".sort-star").count()) === 0 && (await p.getByRole("heading", { name: "One small move" }).isVisible()), "then one small move");
  const moves = await p.locator(".move-opt").count();
  ok(moves >= 2 && moves <= 3, `two or three to choose from (${moves})`);
  const chosen = await p.locator(".move-opt").first().innerText();
  await p.locator(".move-opt").first().click(); await p.waitForTimeout(150);
  ok((await p.getByRole("heading", { name: "When?" }).isVisible()) && (await p.locator(".cue-opt").count()) === 4, "and when: four times to pick from");
  await p.locator(".cue-opt", { hasText: "Right now" }).click(); await p.waitForTimeout(400);
  ok(await p.getByRole("heading", { name: "That's your minute." }).isVisible(), "that's the minute");
  ok((await p.locator(".plan-what").innerText()) === chosen && (await p.locator(".plan-when").innerText()) === "Right now:", "the move and its when, together");
  const s = await safe(p);
  const m = s.minutes[0];
  ok(s.minutes.length === 1 && m.topic === "studies" && m.mine.length === 2 && m.notMine.length === 1, "what was sorted is kept, pile by pile");
  ok(m.move.status === "open" && m.move.cue === "now" && /^m-[a-z0-9]+$/.test(m.move.id), "with the move, open");
  ok([...m.mine, ...m.notMine].every((id) => /^[a-z]-[a-z]+$/.test(id)) && Object.keys(m).sort().join() === "at,mine,move,notMine,topic", "as ids of ready-made cards: nothing anyone typed");
  ok(s.dawn.steps.includes("minute"), "and the sun lifts a step");
  ok((await axe(p)).length === 0, "the done screen passes axe");
  await p.locator(".stage-cta").click(); await p.waitForTimeout(300);
  ok(!(await stage.isVisible()) && (await p.locator("#follow-title").count()) === 0, "back on Home, nobody asks \"did it happen?\" seconds later");

  await openMinute(p, "studies");
  const second = [];
  for (let i = 0; i < 3; i++) { second.push(await p.locator("#sort-card").innerText()); await sort(p, ["sun"]); }
  ok(!second.some((t) => first.includes(t)), "the next minute on the same tension deals different cards");
  ok((await p.locator(".move-opt").count()) === 3, "three in my hands, three moves");
  await p.getByRole("button", { name: "Skip the move" }).click(); await p.waitForTimeout(300);
  ok((await safe(p)).minutes[1]?.move === null && (await p.locator(".plan-card").count()) === 0, "a minute can end without a move");
  await ctx.close();
}

console.log("4. what is not in my hands, and what is not a tension");
{
  const { ctx, p } = await fresh(steady());
  await openMinute(p, "family");
  ok((await p.locator(".sort-unsafe").innerText()).includes("that is not a tension to sort"), "family: being hurt is named as not a tension to sort");
  ok((await axe(p)).length === 0, "the sort screen passes axe");
  await sort(p, ["sky", "sky", "sky"]);
  ok((await p.locator(".sort-star").count()) === 0 && (await p.getByRole("heading", { name: "None of it is in your hands." }).isVisible()), "nothing in my hands is an answer, not a dead end");
  const opts = await p.locator(".move-opt").allInnerTexts();
  ok(opts.some((t) => t.includes("Tell one person")) && opts.some((t) => t.includes("free line")), "the moves are a person, a line, a breath or rest");
  ok((await axe(p)).length === 0, "the move screen passes axe");
  await p.locator(".move-opt", { hasText: "free line" }).click();
  await p.locator(".cue-opt", { hasText: "Right now" }).click(); await p.waitForTimeout(350);
  await p.getByRole("button", { name: "Do it now" }).click(); await p.waitForTimeout(350);
  ok((await roomOf(p)) === "reach" && !(await p.locator(".stage").isVisible()), "\"Do it now\" goes to the lines");
  await goRoom(p, "here"); await p.waitForTimeout(250);
  await openMinute(p, "love");
  await p.getByRole("button", { name: "See who can help" }).click(); await p.waitForTimeout(350);
  ok((await roomOf(p)) === "reach" && !(await p.locator(".stage").isVisible()), "\"See who can help\" leaves the cards for Talk");
  await ctx.close();
  const none = await fresh(steady());
  await openMinute(none.p, "studies");
  ok((await none.p.locator(".sort-unsafe").count()) === 0, "studies has no such note");
  await none.ctx.close();
}

console.log("5. did it happen?");
{
  const rec = (h, cue = "now", status = "open") => ({ at: ago(h), topic: "studies", mine: ["s-hour"], notMine: ["s-result", "s-log"], move: { id: "m-20min", cue, status } });
  let { ctx, p } = await fresh(steady({ minutes: [rec(30)] }));
  ok((await p.locator("#follow-title").innerText()) === "Did it happen?", "a day later, one question");
  ok((await p.locator(".follow-plan").innerText()) === "Right now: Set a 20-minute timer and do one topic only.", "about the move as it was chosen");
  await p.getByRole("button", { name: "Did it", exact: true }).click(); await p.waitForTimeout(250);
  let s = await safe(p);
  ok(s.minutes[0].move.status === "done" && !!s.minutes[0].move.closedAt && s.dawn.steps.includes("move"), "\"Did it\" closes it and lifts the sun");
  ok((await p.getByText("That's one thing you did for yourself").isVisible()) && (await p.locator("#follow-title").count()) === 0, "the reply stays; the question does not");
  await ctx.close();

  ({ ctx, p } = await fresh(steady({ minutes: [rec(30)] })));
  await p.getByRole("button", { name: "Not yet", exact: true }).click(); await p.waitForTimeout(200);
  ok((await safe(p)).minutes[0].move.status === "open" && (await p.getByText("That's fine. It's still here when you want it.").isVisible()), "\"Not yet\" is a full answer and closes nothing");
  await p.reload(); await p.waitForTimeout(500);
  ok((await p.locator("#follow-title").count()) === 1, "so it is there next time");
  await p.getByRole("button", { name: "Make it smaller" }).click(); await p.waitForTimeout(200);
  ok((await safe(p)).minutes[0].move.id === "m-5min" && (await p.locator(".follow-plan").innerText()).includes("read for five minutes"), "\"Make it smaller\" swaps in the smaller move");
  await ctx.close();

  ({ ctx, p } = await fresh(steady({ minutes: [rec(30)] })));
  await p.getByRole("button", { name: "Let it go" }).click(); await p.waitForTimeout(200);
  ok((await safe(p)).minutes[0].move.status === "dropped" && (await p.locator(".follow").count()) === 0, "\"Let it go\" drops it without a word");
  await ctx.close();

  for (const [label, minutes] of [["chosen an hour ago for tonight", [rec(1, "sleep")]], ["more than a week old", [rec(24 * 8)]], ["already done", [rec(30, "now", "done")]]]) {
    ({ ctx, p } = await fresh(steady({ minutes })));
    ok((await p.locator(".follow").count()) === 0 && (await p.locator("main .tension").count()) === 8, `no question about a move ${label}`);
    await ctx.close();
  }
}

console.log("6. thrown, not tapped");
{
  const { ctx, p } = await fresh(steady(), { reducedMotion: "no-preference" });
  await openMinute(p, "work"); await p.waitForTimeout(700);
  const card = p.locator(".sort-card-wrap");
  const text = () => p.locator("#sort-card").innerText();
  const drag = async (dy, steps, pause) => {
    const b = await card.boundingBox();
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await p.mouse.move(x, y); await p.mouse.down();
    for (let i = 1; i <= steps; i++) { await p.mouse.move(x, y + (dy * i) / steps); await p.waitForTimeout(pause); }
    await p.mouse.up(); await p.waitForTimeout(1100);
  };
  const one = await text();
  await drag(-170, 12, 16);
  const two = await text();
  ok(two !== one && (await p.locator(".sort-star").count()) === 1, "dragged up, the card is set down in the sky");
  await drag(34, 4, 16);
  ok((await text()) === two && Math.abs((await card.boundingBox()).y - (await p.locator(".sort-pile").boundingBox()).y) < 3, "let go too soon, it springs back");
  await drag(150, 5, 8);
  ok((await text()) !== two, "flicked down, it goes to the sun");
  await p.locator(".sort-sun").click(); await p.waitForTimeout(900);
  ok(await p.getByRole("heading", { name: "One small move" }).isVisible(), "a tap finishes what the throws began");
  await p.locator(".move-opt").first().click(); await p.waitForTimeout(300);
  await p.locator(".cue-opt").first().click(); await p.waitForTimeout(1200);
  const m = (await safe(p)).minutes[0];
  ok(m.notMine.length === 1 && m.mine.length === 2, "and the piles are what was thrown where");
  ok((await p.locator(".done-title").getAttribute("aria-label")) === "That's your minute.", "the rising words are still one line to a screen reader");
  await ctx.close();
}

console.log("7. a heavy stretch, and a day the minute is held back");
{
  let { ctx, p } = await fresh(heavy());
  ok(await p.getByRole("heading", { name: "Worth telling someone" }).isVisible(), "a heavy stretch says so first");
  ok((await p.locator("main.haven").getAttribute("data-energy")) === "calm" && (await p.locator("main .tension").count()) === 8, "the tiles are still there, a step quieter");
  await openMinute(p, "studies");
  ok((await p.locator(".stage").getAttribute("data-energy")) === "calm", "the stage is dusk, not sunrise");
  ok((await axe(p)).length === 0, "the calm sort screen passes axe");
  await sort(p, ["sun", "sun", "sun"]);
  ok((await p.locator(".move-opt").allInnerTexts()).some((t) => t.includes("Tell one person")), "whatever is sorted, telling one person is among the moves");
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  await p.locator(".reel-door .btn").click(); await p.locator(".stage .reel").waitFor(); await p.waitForTimeout(200);
  const kinds = [];
  for (let i = 0; i < 5; i++) { kinds.push(await p.locator(".reel").getAttribute("data-kind")); await p.locator(".reel-next").click(); await p.waitForTimeout(150); }
  ok(kinds[0] === "breath" && !kinds.includes("ask") && kinds.join() === "breath,spark,fact,now,person", `a heavy day's five start with breath and ask nothing (${kinds.join(", ")})`);
  await ctx.close();

  for (const [label, arrivals] of [["thoughts in the last three days", [a(20, 2, 2, "thoughts"), a(0.2, 4, 4)]], ["\"I don't feel safe\"", [a(0.1, 1, 1, "unsafe")]]]) {
    ({ ctx, p } = await fresh({ introSeen: true, region: "in", arrivals }));
    ok(await p.getByRole("heading", { name: /keep you safe/ }).isVisible(), `after ${label}: the plan and the lines lead`);
    ok((await p.locator("main .tension").count()) === 0 && (await p.locator(".reel-door").count()) === 0, "no tension tiles and no reel");
    ok((await p.locator(".door").count()) === 4 && (await p.locator("main.haven").getAttribute("data-energy")) === "still", "the four doors stay, and the page is still");
    await ctx.close();
  }
}

console.log("8. Hinglish");
{
  let { ctx, p } = await fresh(steady());
  await p.locator(".lang-flip").getByRole("button", { name: "Hinglish" }).click(); await p.waitForTimeout(300);
  ok((await p.evaluate(() => document.documentElement.lang)) === "hi-Latn", "the page says it is Hindi in Latin script");
  ok((await p.locator("#tension-title").innerText()) === "Abhi kis baat ki tension hai?" && (await tile(p, "studies").innerText()).trim() === "Padhai aur exams", "the question and the tiles change at once");
  ok((await p.evaluate(() => JSON.parse(localStorage.getItem("wellbeings-v1")).settings.lang)) === "hinglish", "and the choice is remembered");
  await openMinute(p, "studies");
  ok((await p.locator(".sort-sky strong").innerText()).includes("Mere haath mein nahi") && (await p.locator(".stage-help").innerText()) === "Abhi help", "the minute speaks it too");
  ok(!/[ऀ-ॿ]/.test(await p.locator(".stage").innerText()), "in Roman letters throughout");
  await sort(p, ["sun", "sky", "sun"]);
  await p.locator(".move-opt").first().click(); await p.locator(".cue-opt").first().click(); await p.waitForTimeout(350);
  ok(await p.getByRole("heading", { name: "Ho gaya. Yeh tha ek minute." }).isVisible(), "to the end");
  await ctx.close();

  ({ ctx, p } = await fresh({ introSeen: true, region: "in" }, { settings: { lang: "hinglish" } }));
  ok((await p.locator(".checkin-q").innerText()) === "Abhi kaisa lag raha hai?", "the check-in asks in Hinglish");
  await p.getByRole("button", { name: "Bahut bhaari" }).click();
  await p.getByRole("button", { name: "Aage koi raasta nahi dikh raha" }).click(); await p.waitForTimeout(150);
  ok((await p.locator(".checkin-q").innerText()).includes("zindagi khatam karne ke khayal"), "the direct question is asked as plainly");
  await p.getByRole("button", { name: "Haan, par abhi main safe hoon" }).click(); await p.waitForTimeout(350);
  const arrival = (await safe(p)).arrivals[0];
  ok(arrival.mood === 1 && arrival.hope === 1 && arrival.safety === "thoughts", "and its answers mean exactly what the English ones do");
  ok((await p.getByRole("heading", { name: /keep you safe/ }).isVisible()) && (await p.locator("main .tension").count()) === 0, "so the plan leads and the minute is held back");
  await ctx.close();

  ({ ctx, p } = await fresh(steady(), { settings: { lang: "hi" } }));
  ok((await tile(p, "family").innerText()).trim() === "Ghar-parivaar" && (await p.locator(".lang-flip").count()) === 0, "with Hindi chosen, the minute speaks Hinglish, not English");
  await ctx.close();
}

console.log("9. the reel that ends");
{
  let { ctx, p } = await fresh(steady());
  ok((await p.locator("#reel-title").innerText()) === "Today's five" && (await p.locator(".reel-door .btn").innerText()) === "Open", "a door on Home: today's five");
  await p.locator(".reel-door .btn").click(); await p.locator(".stage .reel").waitFor(); await p.waitForTimeout(200);
  const reel = p.locator(".reel");
  const kind = () => reel.getAttribute("data-kind");
  ok((await p.locator(".stage").getAttribute("aria-label")) === "Today's five" && (await kind()) === "spark", "it opens on a line worth reading");
  const line = await p.locator(".spark-line").innerText();
  await p.waitForTimeout(3600);
  ok((await kind()) === "spark" && (await p.locator(".spark-line").innerText()) === line, "left alone, it does not move by itself");
  ok((await axe(p)).length === 0, "the line card passes axe");
  await p.getByRole("button", { name: "Keep this line" }).click(); await p.waitForTimeout(200);
  ok((await safe(p)).hope.some((h) => h.kind === "words" && h.text === line) && (await p.getByText("Kept in your hope box.").isVisible()), "a line can be kept, in the hope box");
  await p.locator(".reel-next").click(); await p.waitForTimeout(160);
  ok((await kind()) === "fact" && (await p.locator(".fact-cite").innerText()).length > 12, "then one thing known about the mind, with its source on the card");
  ok((await axe(p)).length === 0, "the fact card passes axe");
  await p.locator(".reel-next").click(); await p.waitForTimeout(160);
  ok((await kind()) === "ask" && (await p.locator(".ask-opt").count()) === 4, "then one question with four answers");
  const before = JSON.stringify({ ...(await safe(p)), lastVisit: 0 });
  await p.locator(".ask-opt").nth(1).click(); await p.waitForTimeout(150);
  ok((await p.locator(".reel-reply").innerText()).length > 10 && (await p.locator(".ask-opt").nth(1).getAttribute("aria-pressed")) === "true", "a tap gets a reply");
  ok(JSON.stringify({ ...(await safe(p)), lastVisit: 0 }) === before, "and the answer is not kept anywhere");
  ok((await axe(p)).length === 0, "the question card passes axe");
  await p.locator(".reel-next").click(); await p.waitForTimeout(160);
  ok((await kind()) === "now", "then one thing to do now");
  await p.getByRole("button", { name: "Did it", exact: true }).click(); await p.waitForTimeout(150);
  ok((await safe(p)).dawn.steps.includes("tiny"), "doing it lifts the sun");
  await p.keyboard.press("ArrowDown"); await p.waitForTimeout(160);
  ok((await kind()) === "person" && (await p.locator(".send-text").isVisible()), "then one person, with the message shown in full");
  await p.keyboard.press("ArrowUp"); await p.waitForTimeout(160);
  ok((await kind()) === "now", "the arrows go back as well as on");
  await p.keyboard.press("ArrowDown"); await p.waitForTimeout(160);
  await p.locator(".reel-next").click(); await p.waitForTimeout(350);
  ok((await kind()) === "end" && (await p.getByRole("heading", { name: "That's all five." }).isVisible()), "and after the fifth, it ends");
  ok((await p.locator(".reel-nav").count()) === 0 && (await p.getByText("ends here, on purpose").isVisible()), "there is no next, and it says so");
  const s = await safe(p);
  ok(/^\d{4}-\d\d-\d\d-(morning|day|night)$/.test(s.reelSeen) && s.dawn.steps.includes("reel"), `it is marked seen (${s.reelSeen})`);
  ok((await axe(p)).length === 0, "the end passes axe");
  await p.locator(".reel-end").getByRole("button", { name: "See them again" }).click(); await p.waitForTimeout(200);
  ok((await kind()) === "spark" && (await p.locator(".spark-line").innerText()) === line, "\"See them again\" is the same five, from the first");
  await p.keyboard.press("Escape"); await p.waitForTimeout(250);
  ok((await p.locator(".reel-door p").innerText()).startsWith("Seen. The next five come") && (await p.locator(".reel-door .btn").innerText()) === "See them again", "the door now says seen, and when the next five come");
  await p.locator(".reel-door .btn").click(); await p.locator(".stage .reel").waitFor();
  for (let i = 0; i < 5; i++) { await p.locator(".reel-next").click(); await p.waitForTimeout(140); }
  await p.locator(".reel-end").getByRole("button", { name: "Take one minute" }).click(); await p.waitForTimeout(350);
  ok((await p.locator(".stage").getAttribute("aria-label")) === "One minute" && (await p.locator(".stage .tension").count()) === 8, "from the end, one tap to the minute");
  await ctx.close();

  ({ ctx, p } = await fresh(steady(), { reducedMotion: "no-preference" }));
  await p.locator(".reel-door .btn").click(); await p.locator(".stage .reel").waitFor(); await p.waitForTimeout(900);
  const b = await p.locator(".reel-card").boundingBox();
  await p.mouse.move(b.x + b.width / 2, b.y + b.height * 0.3); await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(b.x + b.width / 2, b.y + b.height * 0.3 - i * 20); await p.waitForTimeout(12); }
  await p.mouse.up(); await p.waitForTimeout(1200);
  ok((await p.locator(".reel").getAttribute("data-kind")) === "fact", "a swipe up turns the card");
  await ctx.close();
}

console.log("10. what the minutes show");
{
  const rec = (h, topic, mine, notMine, status) => ({ at: ago(h), topic, mine, notMine, move: status ? { id: "m-20min", cue: "now", status } : null });
  let { ctx, p } = await fresh(steady());
  await goRoom(p, "me"); await p.waitForTimeout(250);
  ok(await p.getByText("After three minutes, this shows what keeps coming up").isVisible(), "with fewer than three minutes, it says nothing about anyone");
  await ctx.close();
  ({ ctx, p } = await fresh(steady({ minutes: [rec(80, "family", ["f-talk"], ["f-expect", "f-fights"], "done"), rec(50, "studies", ["s-ask"], ["s-result", "s-compare"], "open"), rec(26, "studies", ["s-hour"], ["s-result", "s-log"], "done")] })));
  await goRoom(p, "me"); await p.waitForTimeout(250);
  const lines = await p.locator(".notice-list li").allInnerTexts();
  ok(lines[0] === "Most often it was Studies & exams: 2 of your last 3 minutes.", "after three, what came up most");
  ok(lines.some((t) => t.startsWith("Of 9 things you sorted, 6 were not in your hands.")) && lines.some((t) => t.startsWith("You did 2 of the 3 moves you picked.")), "how much was in their hands, and what they did");
  ok(await p.getByText("only you can see it").isVisible(), "and that only they can see it");
  ok((await axe(p)).length === 0, "Me passes axe");
  await ctx.close();
}

console.log("11. smooth scroll on the reading pages only");
{
  const lenis = async (path, opts) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(BASE + path); await p.waitForTimeout(2600);
    const on = await p.evaluate(() => document.documentElement.classList.contains("lenis"));
    return { ctx, p, on };
  };
  let r = await lenis("guides/sleep/", { reducedMotion: "no-preference" });
  ok(r.on, "a guide, with a mouse: the wheel is eased");
  await r.p.keyboard.press("Tab"); await r.p.keyboard.press("Enter"); await r.p.waitForTimeout(400);
  ok(r.p.url().endsWith("#main") && (await r.p.evaluate(() => document.querySelector("#main").getBoundingClientRect().top < 200)), "the skip link still jumps to the page's content");
  await r.p.mouse.move(640, 400); await r.p.mouse.wheel(0, 600); await r.p.waitForTimeout(1200);
  ok((await r.p.evaluate(() => scrollY)) > 300, "and the wheel still scrolls the real page");
  await r.ctx.close();
  r = await lenis("guides/sleep/", { reducedMotion: "reduce" }); ok(!r.on, "not under reduced motion"); await r.ctx.close();
  r = await lenis("guides/sleep/", { reducedMotion: "no-preference", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); ok(!r.on, "not on a phone"); await r.ctx.close();
  r = await lenis("resources/", { reducedMotion: "no-preference" }); ok(!r.on, "not on Support lines"); await r.ctx.close();
  r = await lenis("", { reducedMotion: "no-preference" }); ok(!r.on, "and never in the app"); await r.ctx.close();
}

await browser.close();
const uniq = [...new Set(errors)].filter((e) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e));
console.log(`\n${pass} passed, ${fail} failed, ${uniq.length} page errors${uniq.length ? ":\n" + uniq.join("\n") : ""}`);
if (fail || uniq.length) process.exitCode = 1;
