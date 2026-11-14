/**
 * Tests for One minute (lib/minute.ts) and the reel that ends (lib/reel.ts).
 *
 * Run: node --test scripts/test-minute.mjs   (part of npm run verify)
 *
 * Both are words put in front of people who may be having a hard day, in two
 * languages. These are the rules every line must keep, and the rules of the
 * small machinery around them: the deal, the moves, what is noticed, and
 * when there is no reel at all.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CUES,
  HAND,
  MINUTE_STRINGS,
  MOVES,
  MOVE_OPEN_DAYS,
  NOTICE_MIN,
  SUPPORT_MOVES,
  TOPICS,
  TOPIC_ORDER,
  allMinuteWords,
  cardById,
  dealCards,
  minuteLang,
  moveDueAt,
  movesFor,
  noticing,
  openMove,
  planLine,
  saysTension,
  smallerMove,
} from "../lib/minute.ts";
import { ASKS, BREATH, FACTS, GENTLE_LINES, NOWS, PEOPLE, REEL_LENGTH, REEL_STRINGS, SPARKS, allReelWords, buildReel, reelKey, reelNumber, reelPart } from "../lib/reel.ts";

const words = [...allMinuteWords().map((w) => ({ ...w, from: "minute" })), ...allReelWords().map((w) => ({ ...w, from: "reel" }))];
const each = (fn) => {
  for (const w of words) for (const lang of ["en", "hinglish"]) fn(w[lang], `${w.from}/${lang}: ${w[lang]}`);
};

/* ── every line ────────────────────────────────────────────────────── */

test("every line exists in both languages", () => {
  assert.ok(words.length > 300, `only ${words.length} lines found`);
  each((text, where) => assert.ok(typeof text === "string" && text.trim().length > 0, where));
});

test("no em or en dashes, like the rest of the copy", () => {
  each((text, where) => assert.ok(!/[—–]/.test(text), where));
});

test("none of the words this house does not use", () => {
  const banned = /\b(seamless(ly)?|elevate|unlock|empower(s|ed|ing)?|delve|robust|leverage|cutting-edge|game-changing|journey|toxic|just let (it )?go)\b/i;
  each((text, where) => assert.ok(!banned.test(text), where));
});

test("nothing implies anyone is watching, waiting or coming", () => {
  const bad =
    /\b(watching|monitor(ed|ing)?|we('| a)re here|i'?m here for you|i'?ll be here|someone will (call|come|reach)|we'?ll (call|contact|check)|we will (call|contact|check)|alert(ed)?|notif(y|ied)|hum (dekh|nazar)|nazar rakh)\b/i;
  each((text, where) => assert.ok(!bad.test(text), where));
});

test("safe messaging: no word about a method or about hurting oneself", () => {
  const bad = /\b(kill|suicid\w*|overdose|hang(ing)?|pills?|blade|cut(ting)? (my|your)self|jump|poison|khudkushi|jaan (de|le)|mar (ja|jaa))\b/i;
  each((text, where) => assert.ok(!bad.test(text), where));
});

test("no diagnosis and no promise: the words never say what a person is or will be", () => {
  const bad = /\b(you (are|have) (depress\w*|anxi\w*|a disorder)|you('ll| will) (feel better|be fine|be okay)|guarantee\w*|cure[sd]?|aap (theek|thik) ho (jaoge|jayenge))\b/i;
  each((text, where) => assert.ok(!bad.test(text), where));
});

test("Hinglish is in Roman script, and does not guess anyone's gender", () => {
  for (const w of words) {
    assert.ok(!/[ऀ-ॿ]/.test(w.hinglish), `Devanagari in ${w.hinglish}`);
    /* Second-person future and habitual endings are the ones that pick a
       gender in Hindi (karoge/karogi, sakta/sakti hoon). */
    assert.ok(!/\b(\w+oge|\w+ogi|sakta hoon|sakti hoon|raha hoon|rahi hoon|jaunga|jaungi|karunga|karungi)\b/i.test(w.hinglish), `gendered: ${w.hinglish}`);
  }
});

test("lines fit a phone: cards, moves and buttons stay short", () => {
  for (const id of TOPIC_ORDER) {
    for (const c of TOPICS[id].cards) for (const lang of ["en", "hinglish"]) assert.ok(c.text[lang].length <= 48, `${c.id}/${lang}: ${c.text[lang].length}`);
    for (const lang of ["en", "hinglish"]) assert.ok(TOPICS[id].label[lang].length <= 18, `${id} label`);
  }
  for (const m of Object.values(MOVES)) for (const lang of ["en", "hinglish"]) assert.ok(m.text[lang].length <= 84, `${m.id}/${lang}: ${m.text[lang].length}`);
  for (const s of [...SPARKS, ...GENTLE_LINES]) for (const lang of ["en", "hinglish"]) assert.ok(s.text[lang].length <= 96, `${s.id}/${lang}: ${s.text[lang].length}`);
  for (const a of ASKS) {
    for (const lang of ["en", "hinglish"]) assert.ok(a.q[lang].length <= 70, `${a.id}/${lang}`);
    for (const o of a.options) for (const lang of ["en", "hinglish"]) assert.ok(o.label[lang].length <= 26 && o.reply[lang].length <= 110, `${a.id}.${o.id}/${lang}`);
  }
  for (const x of FACTS) for (const lang of ["en", "hinglish"]) assert.ok(x.text[lang].length <= 215 && x.figure[lang].length <= 14, `${x.id}/${lang}: ${x.text[lang].length}`);
});

/* ── the minute ────────────────────────────────────────────────────── */

test("eight topics, each with enough cards on both sides to deal a mixed hand", () => {
  assert.equal(TOPIC_ORDER.length, 8);
  for (const id of TOPIC_ORDER) {
    const cards = TOPICS[id].cards;
    assert.ok(cards.filter((c) => c.lean === "mine").length >= 3, `${id}: mine`);
    assert.ok(cards.filter((c) => c.lean === "not").length >= 3, `${id}: not`);
  }
});

test("card and move ids are unique, and every move a card offers exists", () => {
  const ids = TOPIC_ORDER.flatMap((t) => TOPICS[t].cards.map((c) => c.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    const card = cardById(id);
    assert.ok(card.moves.length >= 1, id);
    for (const m of card.moves) assert.ok(MOVES[m], `${id} offers ${m}`);
  }
  for (const m of Object.values(MOVES)) if (m.smaller) assert.ok(MOVES[m.smaller], `${m.id} shrinks to ${m.smaller}`);
  for (const id of SUPPORT_MOVES) assert.ok(MOVES[id], id);
});

test("\"Make it smaller\" always ends: no move shrinks in a circle", () => {
  for (const m of Object.values(MOVES)) {
    const seen = new Set([m.id]);
    let next = smallerMove(m.id);
    while (next) {
      assert.ok(!seen.has(next.id), `${m.id} loops at ${next.id}`);
      seen.add(next.id);
      next = smallerMove(next.id);
    }
    assert.ok(seen.size <= 4, `${m.id} takes ${seen.size} steps to bottom out`);
  }
});

test("a hand is three different cards with both piles in it, for every topic and seed", () => {
  for (const id of TOPIC_ORDER) {
    for (let seed = 1; seed <= 200; seed++) {
      const hand = dealCards(id, seed);
      assert.equal(hand.length, HAND);
      assert.equal(new Set(hand.map((c) => c.id)).size, HAND, `${id}/${seed}: repeated card`);
      assert.ok(hand.some((c) => c.lean === "mine"), `${id}/${seed}: nothing that could be in my hands`);
      assert.ok(hand.some((c) => c.lean === "not"), `${id}/${seed}: nothing to set down`);
    }
  }
});

test("the same seed deals the same hand, and the next minute avoids the last one's cards", () => {
  assert.deepEqual(dealCards("studies", 42), dealCards("studies", 42));
  for (const id of TOPIC_ORDER) {
    const first = dealCards(id, 7).map((c) => c.id);
    for (let seed = 1; seed <= 50; seed++) {
      const second = dealCards(id, seed, first).map((c) => c.id);
      assert.ok(!second.some((c) => first.includes(c)), `${id}/${seed}: dealt a card from the last minute`);
    }
  }
});

test("moves come from what was put in my hands, three at most, best first", () => {
  const moves = movesFor(["s-hour", "s-ask"]);
  assert.ok(moves.length >= 2 && moves.length <= 3);
  assert.equal(moves[0].id, "m-20min");
  assert.equal(moves[1].id, "m-askfriend");
});

test("when nothing is in my hands the answer is a person, a line, a breath or rest, never nothing", () => {
  const moves = movesFor([]);
  assert.deepEqual(moves.map((m) => m.id), SUPPORT_MOVES);
  assert.ok(moves.some((m) => m.send), "a message to send");
  assert.ok(moves.some((m) => m.go === "lines"), "a free line");
});

test("on a gentle day a way to tell one person is always among the moves", () => {
  for (const id of TOPIC_ORDER) {
    for (const card of TOPICS[id].cards) {
      const moves = movesFor([card.id], true);
      assert.ok(moves.some((m) => m.id === "m-tell"), card.id);
      assert.ok(moves.length <= 4);
    }
  }
});

test("topics where the trouble may be a person say that being hurt is not a tension to sort", () => {
  for (const id of ["family", "love"]) {
    assert.ok(TOPICS[id].unsafe, id);
    assert.match(TOPICS[id].unsafe.en, /not a tension to sort/);
  }
  /* And no card anywhere names being hit, shouted at or controlled as a
     thing to sort into a pile. */
  for (const id of TOPIC_ORDER) for (const c of TOPICS[id].cards) assert.ok(!/\b(hit|hits|beat|abus\w+|violen\w+|threat\w*|maar|peet)\b/i.test(`${c.text.en} ${c.text.hinglish}`), c.id);
});

test("the plan line joins the when and the what", () => {
  assert.equal(planLine("m-phoneaway", "sleep", "en"), "Tonight, before I sleep: Phone on charge, away from the bed tonight.");
  assert.equal(planLine("m-phoneaway", "sleep", "hinglish"), "Aaj raat, sone se pehle: Aaj raat phone bed se door, charge par.");
  assert.equal(planLine("nope", "sleep", "en"), "");
  assert.equal(CUES.length, 4);
});

test("Hindi in Devanagari is not written yet, so it gets Hinglish, not English", () => {
  assert.equal(minuteLang("en"), "en");
  assert.equal(minuteLang("hinglish"), "hinglish");
  assert.equal(minuteLang("hi"), "hinglish");
});

test("the done line counts what was set down, in words", () => {
  assert.equal(MINUTE_STRINGS.en.doneSub(2, true), "Two things set down in the sky. One thing in your hands.");
  assert.equal(MINUTE_STRINGS.en.doneSub(3, false), "Three things set down in the sky.");
  assert.equal(MINUTE_STRINGS.en.doneSub(0, true), "Nothing set down in the sky. One thing in your hands.");
});

/* ── did it happen? ────────────────────────────────────────────────── */

const NOW = new Date("2026-11-12T21:00:00");
const ago = (h) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const rec = (h, topic, mine, notMine, move) => ({ at: ago(h), topic, mine, notMine, move: move ? { id: "m-20min", cue: "now", status: move } : null });

test("the newest open move is asked about, for a week and no longer", () => {
  assert.equal(openMove([], NOW), null);
  const one = [rec(20, "studies", ["s-hour"], ["s-result", "s-log"], "open")];
  assert.equal(openMove(one, NOW).index, 0);
  assert.equal(openMove([rec(24 * (MOVE_OPEN_DAYS + 1), "studies", ["s-hour"], [], "open")], NOW), null, "after a week it is not mentioned again");
});

test("the question waits until the move's time has passed: never seconds after it was chosen", () => {
  const local = (h, m = 0) => new Date(2026, 10, 12, h, m);
  const iso = (d) => d.toISOString();
  const one = (at, cue) => [{ at: iso(at), topic: "studies", mine: ["s-hour"], notMine: [], move: { id: "m-20min", cue, status: "open" } }];
  /* Right now: twenty minutes. */
  assert.equal(openMove(one(local(10), "now"), local(10, 1)), null, "one minute later");
  assert.equal(openMove(one(local(10), "now"), local(10, 19)), null);
  assert.ok(openMove(one(local(10), "now"), local(10, 21)));
  /* After my next meal: three hours. */
  assert.equal(openMove(one(local(10), "meal"), local(12, 30)), null);
  assert.ok(openMove(one(local(10), "meal"), local(13, 1)));
  /* Tonight, before I sleep: not that evening, not at midnight, yes in the morning. */
  assert.equal(openMove(one(local(21), "sleep"), local(21, 5)), null, "asked the same evening");
  assert.equal(openMove(one(local(21), "sleep"), new Date(2026, 10, 13, 0, 30)), null, "asked at half past midnight");
  assert.ok(openMove(one(local(21), "sleep"), new Date(2026, 10, 13, 7, 0)), "the next morning");
  /* Tomorrow, first thing: after nine the next morning. */
  assert.equal(openMove(one(local(21), "morning"), new Date(2026, 10, 13, 8, 0)), null);
  assert.ok(openMove(one(local(21), "morning"), new Date(2026, 10, 13, 9, 30)));
  /* Chosen after midnight, "tonight" and "tomorrow" mean the night and the morning it already is. */
  assert.deepEqual(moveDueAt(new Date(2026, 10, 13, 2, 0), "sleep"), new Date(2026, 10, 13, 5, 0));
  assert.deepEqual(moveDueAt(new Date(2026, 10, 13, 2, 0), "morning"), new Date(2026, 10, 13, 9, 0));
});

test("\"tension\" is asked where it is the word, and not where it is not", () => {
  assert.equal(saysTension("in"), true);
  assert.equal(saysTension(null), true, "unknown defaults to India, like the helplines");
  assert.equal(saysTension("intl", "Asia/Dhaka"), true);
  assert.equal(saysTension("intl", "Asia/Karachi"), true);
  assert.equal(saysTension("intl", "Europe/Berlin"), false);
  assert.equal(saysTension("uk", "Europe/London"), false);
  assert.equal(saysTension("us", "Asia/Kolkata"), false, "someone who chose another region is taken at their word");
});

test("an answered move is never asked about again, and an older open one does not come back", () => {
  assert.equal(openMove([rec(20, "studies", ["s-hour"], [], "done")], NOW), null);
  assert.equal(openMove([rec(20, "studies", ["s-hour"], [], "dropped")], NOW), null);
  const xs = [rec(50, "work", ["w-next"], [], "open"), rec(20, "studies", ["s-hour"], [], "done")];
  assert.equal(openMove(xs, NOW), null, "only the newest move counts: no backlog of things not done");
});

test("a minute without a move does not hide the open move before it", () => {
  const xs = [rec(50, "work", ["w-next"], [], "open"), rec(20, "studies", [], ["s-result", "s-log", "s-compare"], null)];
  assert.equal(openMove(xs, NOW).index, 0);
});

/* ── what your minutes show ────────────────────────────────────────── */

test("nothing is noticed from fewer than three minutes", () => {
  assert.equal(NOTICE_MIN, 3);
  assert.equal(noticing([], NOW), null);
  assert.equal(noticing([rec(5, "studies", ["s-hour"], ["s-result"], "open"), rec(30, "studies", ["s-hour"], ["s-result"], "done")], NOW), null);
});

test("it says what came up most, only when one topic really did", () => {
  const xs = [rec(5, "studies", ["s-hour"], ["s-result", "s-log"], "done"), rec(30, "studies", ["s-ask"], ["s-result", "s-compare"], "open"), rec(60, "family", ["f-talk"], ["f-expect", "f-fights"], "open")];
  const n = noticing(xs, NOW);
  assert.deepEqual(n.top, { topic: "studies", n: 2 });
  assert.match(n.lines[0].en, /Studies & exams: 2 of your last 3 minutes/);
  const tie = noticing([rec(5, "studies", ["s-hour"], [], null), rec(30, "family", ["f-talk"], [], null), rec(60, "work", ["w-next"], [], null)], NOW);
  assert.equal(tie.top, null, "three different topics: there is no 'most often'");
});

test("when most of what was sorted is not in their hands, it says so as a reason to lean on someone", () => {
  const xs = [rec(5, "family", [], ["f-expect", "f-fights", "f-health"], null), rec(30, "family", ["f-talk"], ["f-expect", "f-marriage"], "open"), rec(60, "family", [], ["f-compare", "f-fights", "f-health"], null)];
  const n = noticing(xs, NOW);
  assert.equal(n.sorted, 9);
  assert.equal(n.notMine, 8);
  const line = n.lines.find((l) => /not in your hands/.test(l.en));
  assert.match(line.en, /lean on someone, not a failing/);
});

test("moves not done are never held against anyone", () => {
  const xs = [rec(5, "work", ["w-next"], ["w-boss", "w-emi"], "open"), rec(30, "work", ["w-ask"], ["w-boss", "w-job"], "open"), rec(60, "work", ["w-stop"], ["w-market", "w-emi"], "dropped")];
  const n = noticing(xs, NOW);
  assert.equal(n.done, 0);
  const line = n.lines.at(-1).en;
  assert.match(line, /that's allowed/);
  assert.ok(!/fail|only|should|missed|behind/i.test(line), line);
});

test("only the last thirty days are read", () => {
  const old = [rec(24 * 40, "studies", ["s-hour"], [], "done"), rec(24 * 41, "studies", ["s-hour"], [], "done"), rec(24 * 42, "studies", ["s-hour"], [], "done")];
  assert.equal(noticing(old, NOW), null);
});

/* ── the reel ──────────────────────────────────────────────────────── */

const at = (h) => new Date(2026, 10, 12, h, 30);

test("three reels a day, on the music's hours, and before 5 am it is still last night's", () => {
  assert.equal(reelPart(at(5)), "morning");
  assert.equal(reelPart(at(11)), "morning");
  assert.equal(reelPart(at(12)), "day");
  assert.equal(reelPart(at(17)), "day");
  assert.equal(reelPart(at(18)), "night");
  assert.equal(reelPart(at(2)), "night");
  assert.equal(reelKey(at(23)), "2026-11-12-night");
  assert.equal(reelKey(new Date(2026, 10, 13, 2, 0)), "2026-11-12-night");
  assert.equal(reelKey(new Date(2026, 10, 13, 6, 0)), "2026-11-13-morning");
  assert.equal(reelNumber(at(13)) - reelNumber(at(8)), 1);
  assert.equal(reelNumber(new Date(2026, 10, 13, 2, 0)), reelNumber(at(23)));
  assert.equal(reelNumber(new Date(2026, 10, 13, 6, 0)) - reelNumber(at(23)), 1);
});

test("a reel is exactly five cards, and the same five every time it is opened", () => {
  for (const level of [null, "steady", "low", "heavy"]) {
    const a = buildReel(at(9), level);
    assert.equal(a.length, REEL_LENGTH, String(level));
    assert.deepEqual(a.map((c) => c.id), buildReel(new Date(2026, 10, 12, 11, 59), level).map((c) => c.id), String(level));
    assert.equal(new Set(a.map((c) => c.id)).size, REEL_LENGTH);
  }
});

test("the next reel is a different one", () => {
  const a = buildReel(at(9), null).map((c) => c.id);
  const b = buildReel(at(13), null).map((c) => c.id);
  assert.ok(!a.some((id) => b.includes(id)), "morning and afternoon share a card");
});

test("an okay day: a line, a fact, a question, something to do, a person", () => {
  assert.deepEqual(buildReel(at(9), "steady").map((c) => c.kind), ["spark", "fact", "ask", "now", "person"]);
});

test("after thoughts of suicide or 'I don't feel safe' there is no reel at all", () => {
  assert.deepEqual(buildReel(at(9), "thoughts"), []);
  assert.deepEqual(buildReel(at(9), "urgent"), []);
});

test("a heavy day starts with breath, asks nothing, and every card is a gentle one", () => {
  for (let d = 0; d < 60; d++) {
    const now = new Date(2026, 10, 1 + Math.floor(d / 3), [8, 14, 21][d % 3]);
    const cards = buildReel(now, "heavy");
    assert.equal(cards[0].id, BREATH.id);
    assert.ok(!cards.some((c) => c.kind === "ask"), "a question on a heavy day");
    assert.ok(GENTLE_LINES.some((g) => g.id === cards[1].id));
    for (const c of cards.slice(2)) assert.equal(c.gentle, true, c.id);
    const low = buildReel(now, "low");
    assert.equal(low[0].id, BREATH.id);
    assert.equal(low[3].gentle, true);
  }
});

test("cards naming an Indian service are left out elsewhere", () => {
  for (let d = 0; d < 60; d++) {
    const now = new Date(2026, 10, 1 + Math.floor(d / 3), [8, 14, 21][d % 3]);
    for (const level of [null, "heavy"]) for (const c of buildReel(now, level, false)) assert.ok(!c.india, c.id);
  }
  assert.ok(FACTS.filter((x) => x.gentle && !x.india).length >= 2, "enough gentle facts left for other regions");
});

test("every fact names its source, and every figure on it is in the text or the citation", () => {
  for (const x of FACTS) {
    assert.ok(/\b(19|20)\d\d\b|Tele-MANAS/.test(x.cite), `${x.id}: ${x.cite}`);
    assert.ok(x.cite.length > 12, x.id);
  }
  /* The numbers this app has checked. A figure not on this list should not
     appear on a card without someone reading the paper again. */
  const checked = ["94", "7", "10", "1", "71", "98,299", "14416", "20", "38", "17", "21", "22", "2,452", "122", "2", "5"];
  for (const x of FACTS) {
    const nums = `${x.figure.en} ${x.text.en}`.match(/\d[\d,]*/g) ?? [];
    for (const num of nums) assert.ok(checked.includes(num), `${x.id}: unchecked figure ${num}`);
    const hi = `${x.figure.hinglish} ${x.text.hinglish}`.match(/\d[\d,]*/g) ?? [];
    for (const num of hi) assert.ok(checked.includes(num), `${x.id} (hinglish): unchecked figure ${num}`);
  }
});

test("the study about scrolling is reported as a link, not a cause", () => {
  const card = FACTS.find((x) => x.id === "f-reels");
  assert.match(card.text.en, /can't say which causes which/);
  assert.match(REEL_STRINGS.en.why, /can't say which causes which/);
});

test("every question has four answers and a reply to each", () => {
  for (const a of ASKS) {
    assert.equal(a.options.length, 4, a.id);
    assert.equal(new Set(a.options.map((o) => o.id)).size, 4, a.id);
  }
  assert.ok(ASKS.length >= 10 && SPARKS.length >= 18 && NOWS.length >= 12 && PEOPLE.length >= 7);
});

test("the end of the reel says it has ended, and offers no more cards", () => {
  for (const lang of ["en", "hinglish"]) {
    const s = REEL_STRINGS[lang];
    assert.ok(s.endSub.length > 10);
    assert.ok(!/\b(more|keep (going|scrolling)|next reel now|aur dekho)\b/i.test(`${s.endTitle} ${s.endDone} ${s.endMinute}`), lang);
  }
  assert.match(REEL_STRINGS.en.endSub, /ends here, on purpose/);
});
