import type { OohMood } from "./ooh.mjs";
import type { CareLevel } from "./care";

/**
 * What Ooh says, page by page.
 *
 * Ooh narrates like the guide in a game: the first time someone reaches a
 * page, a few short lines that say what the page is for and what to do
 * first; after that, one line, so a person coming back every day is not
 * made to sit through the tour again.
 *
 * The rules every line keeps, checked by scripts/test-ooh.mjs:
 *   - Short enough for a phone bubble (120 characters).
 *   - No em dashes, like the rest of the copy.
 *   - Nothing that says or implies someone is watching, waiting, or will
 *     come. The app has no staff. On a heavy day Ooh points at people who
 *     can actually answer: the lines, the plan, someone they choose.
 *   - On the heavy, thoughts and urgent levels, only the gentle moods (care,
 *     calm, listen). A character grinning or going "ooh!" at someone who
 *     just said they are not safe would be worse than no character at all.
 */

export interface OohLine {
  mood: OohMood;
  text: string;
}

/** A room Ooh can take someone to. */
export type OohRoom = "here" | "watch" | "hope" | "plan" | "reach";

/**
 * What Ooh says about one part of a page. As someone scrolls, the narrator
 * bar describes whichever part they are reading: the element `at` (a CSS
 * selector; `nth` picks one of several, -1 the last). `go` offers a way to
 * another room, which is how Ooh walks someone round the whole place:
 * Here to Hope, Hope to Plan, Plan to Reach out, Reach out back to Hope.
 */
export interface OohBeat {
  id: string;
  at: string;
  nth?: number;
  mood: OohMood;
  text: string;
  go?: { room: OohRoom; view?: string; label: string };
  /** The page's last thing: it never reaches the upper part of the screen,
      so it counts as arrived as soon as any of it shows. */
  edge?: boolean;
}

export interface OohScript {
  /** Stable id, remembered once the full version has been seen. */
  id: string;
  lines: OohLine[];
  /** What Ooh says on every later visit. */
  short: OohLine;
  /** Start tucked in the corner instead of speaking in the page. For heavy
      days and worse: the safety plan and the numbers come first on those
      screens, and nothing may push them further down. */
  quiet?: boolean;
  /** What Ooh says about each part of the page as it scrolls past. Never
      on a quiet script. */
  beats?: OohBeat[];
  /** On site pages: also narrate each heading (see pageHeadingLine). */
  headings?: boolean;
}

export type OohScene =
  | { kind: "here"; level: CareLevel | null; returning: boolean; hour: number | null }
  | { kind: "watch" }
  | { kind: "hope" }
  | { kind: "plan"; written: boolean }
  | { kind: "reach" }
  | { kind: "results" }
  | { kind: "page"; path: string };

export const GENTLE_MOODS: OohMood[] = ["care", "calm", "listen"];

const l = (mood: OohMood, text: string): OohLine => ({ mood, text });
const b = (id: string, at: string, mood: OohMood, text: string, go?: OohBeat["go"], nth?: number): OohBeat => ({
  id,
  at,
  mood,
  text,
  ...(go ? { go } : {}),
  ...(nth !== undefined ? { nth } : {}),
  ...(at === APP_BOTTOM || at === SITE_BOTTOM ? { edge: true } : {}),
});

/* The bottom of every room in the safe place is its footer. */
const APP_BOTTOM = ".app-foot-tabbed";
const SITE_BOTTOM = ".site-foot";

const HERE_BEATS: OohBeat[] = [
  b("checkin", ".checkin-q", "listen", "Two taps, that's all. Pick whatever's closest. There's no wrong answer."),
  b("keep", "#keep-title", "care", "You saved this for a day like today. Read it slowly."),
  b("video", "#now-video", "ooh", "Ooh, a video picked for right now. It asks before anything loads."),
  b("path", "#path-here", "think", "Your hope path. One small step this week is plenty."),
  b("tiny", "#tiny-title", "happy", "Tiny counts! Tap “I did it” and watch the sky lift a little."),
  b("calm", "#calm-now", "calm", "Breathe with the sun, come back to the room, or just sit with me a minute."),
  b("good", "#good-title", "ooh", "Ooh, a good thing! Even “the chai was hot” counts."),
  b("words", "section[aria-label='Words for right now']", "listen", "Today's line. A new one arrives every morning."),
  b("pattern", "#pattern-title", "listen", "Here's how your days have looked. Just noticing, no judging."),
  b("resume", "#resume-title", "think", "Your wellbeing check is half done. It waited for you."),
  b("daily", "#daily-title", "happy", "Your daily plan, built from your wellbeing check."),
  b("check", "#check-title", "think", "When there's more room, a gentle look at sleep, food and rest."),
  b("install", "#install-title", "happy", "Keep me on your home screen? Then I'm one tap away."),
  b("next", APP_BOTTOM, "hello", "That's everything here. Want somewhere to keep hope?", { room: "hope", label: "Go to Hope" }),
];

function here(s: Extract<OohScene, { kind: "here" }>): OohScript {
  switch (s.level) {
    case "urgent":
      return {
        id: "here-urgent",
        quiet: true,
        lines: [
          l("care", "Thank you for telling me. Please call one of the numbers at the top now."),
          l("calm", "A real person answers those lines, any hour. Your safety plan is right there too."),
        ],
        short: l("care", "Please call one of the numbers at the top. A real person will answer."),
      };
    case "thoughts":
      return {
        id: "here-thoughts",
        quiet: true,
        lines: [
          l("care", "Thank you for telling me. That took courage."),
          l("calm", "Your safety plan and the helplines are at the top. The people on those lines answer any time."),
        ],
        short: l("care", "Your safety plan and the helplines are at the top, whenever you need them."),
      };
    case "heavy":
      return {
        id: "here-heavy",
        quiet: true,
        lines: [
          l("care", "That's a lot to carry. You don't have to carry it alone."),
          l("listen", "Telling someone can help. The button just below makes it a little easier."),
        ],
        short: l("care", "Heavy days are real days. Telling someone can help."),
      };
    case "low":
      return {
        id: "here-low",
        beats: HERE_BEATS,
        lines: [
          l("care", "Thanks for telling me. Low days count too."),
          l("calm", "Try one small thing below. Just one is plenty."),
        ],
        short: l("calm", "One small thing below. Just one is plenty today."),
      };
    case "steady":
      return {
        id: "here-steady",
        beats: HERE_BEATS,
        lines: [
          l("happy", "Lovely. Keep one good thing from today and watch the sky lift."),
          l("ooh", "Ooh, and there's a video just for right now, if you'd like one."),
        ],
        short: l("happy", "Keep one good thing from today. The sky lifts a little each time."),
      };
    default: {
      const late = s.hour !== null && (s.hour >= 22 || s.hour < 5);
      if (s.returning)
        return {
          id: "here-back",
          beats: HERE_BEATS,
          lines: [l("care", "You came back. I'm really glad."), l("hello", "How is it now? Tap how you're arriving.")],
          short: l("hello", "Welcome back. Tap how you're arriving, whenever you're ready."),
        };
      return {
        id: "here-new",
        beats: HERE_BEATS,
        lines: [
          l("hello", "Ooh, hello! I'm Ooh. I'll show you around this quiet place."),
          l("ooh", "Nothing here is a test. There are no wrong answers."),
          l("happy", "Start with how you're arriving. Two taps, that's all."),
          l("listen", "Soft music plays while you're here. The speaker at the top turns it off."),
        ],
        short: late
          ? l("sleepy", "It's late. Be gentle with yourself tonight.")
          : l("hello", "Hello again. Tap how you're arriving, or just look around."),
      };
    }
  }
}

export function oohScript(s: OohScene): OohScript {
  switch (s.kind) {
    case "here":
      return here(s);
    case "watch":
      return {
        id: "watch",
        beats: [
          b("deck", ".deck", "ooh", "Swipe the big cards. Each one is someone who found a way through."),
          b("lift", "#shelf-lift", "happy", "These all say one thing: you matter more than you know."),
          b("heavy", "#shelf-heavy", "care", "For heavy days. Gentle ones, with no pressure to feel better."),
          b("understand", "#shelf-understand", "think", "These explain what's going on in a mind. Knowing helps."),
          b("room", "#shelf-room", "ooh", "For days with a bit of room. Big ideas about a good life."),
          b("maker", "#shelf-maker", "hello", "Videos from Aryan, who made me!"),
          b("why", "#why-watch", "think", "Why stories? Hearing how someone got through can make it feel possible."),
          b("breathe", "#watch-breathe", "calm", "Breathe with the sun. In for four, out for six."),
          b("ground", "#watch-ground", "listen", "Five things you can see. It brings you back into the room."),
          b("next", APP_BOTTOM, "happy", "Did something help? Keep it in your hope box for next time.", { room: "hope", view: "box", label: "Open my hope box" }),
        ],
        lines: [
          l("ooh", "Ooh, stories! Each one is someone who found a way through."),
          l("happy", "Tap a card to watch. It asks before anything loads."),
          l("calm", "Can't watch right now? Breathing and grounding are further down."),
        ],
        short: l("ooh", "Pick whichever story feels right today."),
      };
    case "hope":
      return {
        id: "hope",
        beats: [
          b("hero", "#hope-title", "happy", "This is where your hope lives. Yours, and nobody else's."),
          b("rooms", "[aria-label='Hope sections']", "ooh", "Four little rooms: a path, good things, a hope box and a note."),
          b("path", "#path-title", "think", "Small enough to actually happen. “Call my cousin” is perfect."),
          b("three", "#three-title", "ooh", "Ooh, good things! One is plenty on a hard day."),
          b("jar", "#jar-title", "happy", "Look at all these good things. They're yours to keep."),
          b("box", "#box-title", "happy", "Your hope box. A hard day can open it."),
          b("people", "#hope-people-title", "listen", "The people who matter. Even one name counts."),
          b("ahead", "#hope-ahead-title", "ooh", "Things to look forward to. Small ones are the best ones."),
          b("moments", "#hope-moments-title", "happy", "Good moments, kept like photos in a drawer."),
          b("through", "#hope-through-title", "care", "Hard times you got through. Proof you can do hard things."),
          b("sounds", "#hope-sounds-title", "ooh", "Songs that help. Ooh, I love this part."),
          b("photos", "#photos-title", "happy", "Photos that help. They stay on this phone."),
          b("letter", "#letter-title", "listen", "A note from a calmer you to a heavier day. It shows up when it's needed."),
          b("next", APP_BOTTOM, "think", "Hope and a plan go well together. Shall we write yours?", { room: "plan", label: "Go to Plan" }),
        ],
        lines: [
          l("happy", "This is where your hope lives."),
          l("ooh", "Keep good things, people and songs here. Each good thing lights a ray this week."),
        ],
        short: l("happy", "What's one good thing from today?"),
      };
    case "plan":
      return s.written
        ? {
            id: "plan-ready",
        beats: [
          b("daily-none", "#daily-none", "think", "Your daily plan grows from a quick wellbeing check."),
          b("intro", "#plan-intro", "calm", "Your safety plan. Write it on a calmer day, keep it for a harder one."),
          b("warning", "#plan-warningSigns", "think", "What tells you a hard time is coming? Noticing early helps."),
          b("coping", "#plan-coping", "calm", "Things you can do on your own that help, even a little."),
          b("distract", "#plan-distractions", "happy", "Places and people that take your mind somewhere else."),
          b("safer", "#plan-safer", "care", "Making things a bit safer for now. Only what feels doable."),
          b("reason", "#plan-reason", "happy", "What's most worth staying for. This one matters most."),
          b("reason-card", "section[aria-label='Most worth staying for']", "happy", "Most worth staying for. Read it slowly."),
          b("use", "#use-title", "calm", "One step at a time. Every number here is one tap."),
          b("lines", "#lines-title", "care", "If it's still too much, these lines are free and a real person answers."),
          b("next", APP_BOTTOM, "listen", "People belong in a plan too. Reach out has words you can borrow.", { room: "reach", label: "Go to Reach out" }),
        ],
            lines: [l("happy", "Your plan is ready. Every number in it is one tap.")],
            short: l("happy", "Your plan is ready. Every number in it is one tap."),
          }
        : {
            id: "plan",
        beats: [
          b("daily-none", "#daily-none", "think", "Your daily plan grows from a quick wellbeing check."),
          b("intro", "#plan-intro", "calm", "Your safety plan. Write it on a calmer day, keep it for a harder one."),
          b("warning", "#plan-warningSigns", "think", "What tells you a hard time is coming? Noticing early helps."),
          b("coping", "#plan-coping", "calm", "Things you can do on your own that help, even a little."),
          b("distract", "#plan-distractions", "happy", "Places and people that take your mind somewhere else."),
          b("safer", "#plan-safer", "care", "Making things a bit safer for now. Only what feels doable."),
          b("reason", "#plan-reason", "happy", "What's most worth staying for. This one matters most."),
          b("reason-card", "section[aria-label='Most worth staying for']", "happy", "Most worth staying for. Read it slowly."),
          b("use", "#use-title", "calm", "One step at a time. Every number here is one tap."),
          b("lines", "#lines-title", "care", "If it's still too much, these lines are free and a real person answers."),
          b("next", APP_BOTTOM, "listen", "People belong in a plan too. Reach out has words you can borrow.", { room: "reach", label: "Go to Reach out" }),
        ],
            lines: [
              l("think", "A plan written on a calmer day helps on a harder one."),
              l("calm", "A few lines is enough. You can change it any time."),
            ],
            short: l("think", "Five minutes, a few lines. Future you will be glad."),
          };
    case "reach":
      return {
        id: "reach",
        beats: [
          b("lines", "#lines-title", "care", "Free, and they answer any time. Calling is a brave thing to do."),
          b("ronak", "#ronak-title", "ooh", "Ooh, Ronak! I live there too. It's a closer look at how you've been."),
          b("msg", "#msg-title", "listen", "Not sure what to say? Borrow one of these and send it."),
          b("care", "#care-title", "think", "Your care team. Someone you trust, and you choose what they see."),
          b("next", APP_BOTTOM, "happy", "After reaching out, keep one good thing from today?", { room: "hope", view: "good", label: "Keep a good thing" }),
        ],
        lines: [
          l("listen", "Reaching out is brave, and it's allowed."),
          l("happy", "These lines are free and answer any time. There are words you can borrow, too."),
        ],
        short: l("listen", "Who could you send a message to today?"),
      };
    case "results":
      return {
        id: "results",
        lines: [l("ooh", "Ooh, here's your snapshot."), l("think", "Start with just one change. The easiest one counts.")],
        short: l("think", "Start with just one change. The easiest one counts."),
      };
    case "page":
      return page(s.path);
  }
}

function page(path: string): OohScript {
  const one = (id: string, line: OohLine, beats: OohBeat[] = []): OohScript => ({ id, lines: [line], short: line, beats, headings: true });
  if (path === "/guides/")
    return one("p-guides", l("think", "Short guides on sleep, movement, food and stress. Pick one that fits today."), [
      b("next", SITE_BOTTOM, "hello", "Want to try one of these tomorrow? Your plan can hold it.", { room: "plan", view: "daily", label: "Go to my plan" }),
    ]);
  if (path.startsWith("/guides/"))
    return one("p-guide", l("ooh", "Ooh, a good one. The studies are named at the bottom if you're curious."), [
      b("next", SITE_BOTTOM, "hello", "Ready to try it? Let's put it in your plan.", { room: "plan", view: "daily", label: "Go to my plan" }),
    ]);
  if (path === "/resources/")
    return one("p-resources", l("care", "Every line here is free. If today is hard, calling one is a good idea."), [
      b("next", SITE_BOTTOM, "listen", "Want words for messaging someone? Reach out has some.", { room: "reach", label: "Go to Reach out" }),
    ]);
  if (path === "/about/")
    return one("p-about", l("hello", "Here's what Arun is, and what it isn't."), [
      b("next", SITE_BOTTOM, "happy", "Come and see the quiet place?", { room: "here", label: "Go to Here" }),
    ]);
  if (path === "/privacy/")
    return one("p-privacy", l("calm", "What you write stays on this phone. This page shows exactly where."), [
      b("next", SITE_BOTTOM, "hello", "Back to the quiet place?", { room: "here", label: "Go to Here" }),
    ]);
  if (path === "/terms/")
    return one("p-terms", l("think", "The small print, kept short."), [
      b("next", SITE_BOTTOM, "hello", "That's all of it. Short, as promised.", { room: "here", label: "Back to Here" }),
    ]);
  return { id: "p-404", lines: [l("ooh", "Ooh, this page wandered off. The links below know the way home.")], short: l("ooh", "Ooh, this page wandered off. The links below know the way home.") };
}

/* What Ooh says about a heading on a site page, found by what the heading
   is about. Checked in order; the first match wins. */
const HEADING_LINES: [RegExp, OohMood, string][] = [
  [/not safe|alert|crisis/i, "care", "Nobody is alerted. If you're in danger, call a line yourself, any time."],
  [/professional|\bgp\b|doctor|right call/i, "care", "Talking to a professional is a strong step, not a last resort."],
  [/helpline|directories|worldwide/i, "care", "Every line here is free. Save one number, just in case."],
  [/evidence|research|stud/i, "think", "This part is what the studies found. The honest version."],
  [/first|change/i, "happy", "Pick one change from here, not all of them."],
  [/enough|how much/i, "think", "How much is enough? Often less than you'd think."],
  [/caffeine|coffee|chai|tea\b/i, "think", "Caffeine lasts longer than it feels. When you have it matters most."],
  [/alcohol/i, "care", "Alcohol can help you drift off, then break up the second half of the night."],
  [/falling asleep/i, "sleepy", "Can't drop off? A few gentle things to try tonight."],
  [/sleep/i, "sleepy", "Sleep. The thing everything else leans on."],
  [/related/i, "ooh", "Ooh, more guides, if you're curious."],

  [/never sent|leave the device|leaves/i, "calm", "Your words stay on this phone. This part explains how."],
  [/delet/i, "think", "One tap deletes everything, whenever you want."],
  [/care team|sharing/i, "listen", "Sharing is always your choice, shown in full first."],
  [/video/i, "ooh", "Videos load only when you say yes."],
  [/\bstored\b|\bwhere\b/i, "calm", "Every key is listed. Nothing hidden."],
  [/question/i, "think", "Questions people ask. Maybe yours is here."],
  [/who made/i, "hello", "Made by Aryan, with a lot of care."],
  [/ronak/i, "ooh", "Ooh, Ronak! My other home."],
  [/careful|words/i, "think", "Words like “encrypted” mean something. This page uses them carefully."],
  [/not healthcare|is not|isn'?t/i, "think", "What this isn't matters too. Honest limits."],
  [/move|activity|exercise|walk/i, "happy", "Moving a little counts. A walk is plenty."],
  [/food|eat|drink|caffeine|meal/i, "ooh", "Food and drink, for energy, not rules."],
  [/stress|recover|rest/i, "calm", "Rest is part of the work, not a reward for it."],
  [/habit/i, "think", "Small habits, and a missed day doesn't reset anything."],
  [/student|exam/i, "listen", "Exams are one season, not the whole of you."],
];
const FALLBACKS: [OohMood, (h: string) => string][] = [
  ["listen", (h) => `Next up: ${h}.`],
  ["think", (h) => `This bit is about ${h.toLowerCase()}.`],
  ["ooh", (h) => `Ooh, ${h.toLowerCase()}. Take your time here.`],
];

/** Ooh's line for the `index`th heading of a site page, from its text. */
export function pageHeadingLine(heading: string, index: number): OohLine {
  const h = heading.replace(/\s+/g, " ").trim().replace(/[.:]+$/, "");
  for (const [re, mood, text] of HEADING_LINES) if (re.test(h)) return { mood, text };
  const short = h.length > 60 ? `${h.slice(0, 57).replace(/\s+\S*$/, "")}…` : h;
  const [mood, make] = FALLBACKS[index % FALLBACKS.length];
  return { mood, text: make(short) };
}

/** Every script the app can show, for the tests. */
export function allScripts(): OohScript[] {
  const levels: (CareLevel | null)[] = [null, "steady", "low", "heavy", "thoughts", "urgent"];
  const out: OohScript[] = [];
  for (const level of levels) for (const returning of [false, true]) out.push(oohScript({ kind: "here", level, returning, hour: 23 }), oohScript({ kind: "here", level, returning, hour: 10 }));
  out.push(
    oohScript({ kind: "watch" }),
    oohScript({ kind: "hope" }),
    oohScript({ kind: "plan", written: false }),
    oohScript({ kind: "plan", written: true }),
    oohScript({ kind: "reach" }),
    oohScript({ kind: "results" }),
  );
  for (const p of ["/guides/", "/guides/sleep/", "/resources/", "/about/", "/privacy/", "/terms/", "/nope/"]) out.push(oohScript({ kind: "page", path: p }));
  return out;
}
