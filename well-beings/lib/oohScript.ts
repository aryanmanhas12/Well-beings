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
 * A remark for further down the page. When the element `at` (a CSS
 * selector; `nth` picks one of several, -1 the last) scrolls into view and
 * the scrolling pauses, Ooh says it from the corner. `go` offers a way to
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
  /** Remarks as the page scrolls. Never on a quiet script. */
  beats?: OohBeat[];
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
  b("tiny", "#tiny-title", "happy", "Tiny counts. Tap “I did it” and the sky lifts a little."),
  b("video", "#now-video", "ooh", "Ooh, a video picked for right now. It asks before anything loads."),
  b("calm", "#calm-now", "calm", "Breathing with the sun takes a minute. Slow in, slower out."),
  b("good", "#good-title", "ooh", "Ooh, a good thing! Even “the chai was hot” counts."),
  b("path", "#path-here", "think", "Your hope path lives here. One small step at a time."),
  b("words", "section[aria-label='Words for right now']", "listen", "A new line arrives every day. Tap “Another” if this one doesn't fit."),
  b("pattern", "#pattern-title", "listen", "This is how your days have looked. Just noticing, no judging."),
  b("next", APP_BOTTOM, "hello", "Want somewhere to keep hope? Let's visit your Hope room.", { room: "hope", label: "Go to Hope" }),
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
          b("shelf", ".shelf-row", "ooh", "Swipe along a shelf. Each one is for a different kind of day."),
          b("why", "#why-watch", "think", "Why stories? Hearing how someone got through can make it feel possible."),
          b("breathe", "#watch-breathe", "calm", "In for four, out for six. Let your shoulders drop."),
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
          b("path", "#path-title", "think", "Small enough to actually happen. “Call my cousin” is perfect."),
          b("three", "#three-title", "ooh", "Ooh, good things! One is plenty on a hard day."),
          b("box", "#box-title", "happy", "People, songs, good memories. A hard day can open this box."),
          b("letter", "#letter-title", "listen", "Write to future you on a calmer day. It shows up when it's needed."),
          b("jar", "#jar-title", "happy", "Look at all these good things. They're yours."),
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
          b("intro", "#plan-intro", "calm", "One line per box is plenty. You can change it any time."),
          b("use", "#use-title", "calm", "Every number here is one tap. Start at the top."),
          b("lines", "#lines-title", "care", "These lines are free, and a real person answers."),
          b("next", APP_BOTTOM, "listen", "People belong in a plan too. Reach out has words you can borrow.", { room: "reach", label: "Go to Reach out" }),
        ],
            lines: [l("happy", "Your plan is ready. Every number in it is one tap.")],
            short: l("happy", "Your plan is ready. Every number in it is one tap."),
          }
        : {
            id: "plan",
        beats: [
          b("intro", "#plan-intro", "calm", "One line per box is plenty. You can change it any time."),
          b("use", "#use-title", "calm", "Every number here is one tap. Start at the top."),
          b("lines", "#lines-title", "care", "These lines are free, and a real person answers."),
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
          b("msg", "#msg-title", "listen", "Not sure what to say? Borrow one of these and send it."),
          b("care", "#care-title", "think", "Someone you trust. You choose exactly what they see."),
          b("ronak", "#ronak-title", "ooh", "Ooh, Ronak! I live there too. It's for a closer look at how you've been."),
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
  const one = (id: string, line: OohLine, beats: OohBeat[] = []): OohScript => ({ id, lines: [line], short: line, beats });
  if (path === "/guides/")
    return one("p-guides", l("think", "Short guides on sleep, movement, food and stress. Pick one that fits today."), [
      b("next", SITE_BOTTOM, "hello", "Want to try one of these tomorrow? Your plan can hold it.", { room: "plan", view: "daily", label: "Go to my plan" }),
    ]);
  if (path.startsWith("/guides/"))
    return one("p-guide", l("ooh", "Ooh, a good one. The studies are named at the bottom if you're curious."), [
      b("first", "main h2", "think", "Pick one change from here, not all of them.", undefined, 1),
      b("related", "main h2", "ooh", "Ooh, more guides just below if you're curious.", undefined, -1),
      b("next", SITE_BOTTOM, "hello", "Ready to try it? Let's put it in your plan.", { room: "plan", view: "daily", label: "Go to my plan" }),
    ]);
  if (path === "/resources/")
    return one("p-resources", l("care", "Every line here is free. If today is hard, calling one is a good idea."), [
      b("save", "main h2", "care", "Save one number in your phone today, just in case.", undefined, 0),
      b("pro", "main h2", "think", "A GP or a counsellor is a strong next step, not a last resort.", undefined, -1),
      b("next", SITE_BOTTOM, "listen", "Want words for messaging someone? Reach out has some.", { room: "reach", label: "Go to Reach out" }),
    ]);
  if (path === "/about/")
    return one("p-about", l("hello", "Here's what Arun is, and what it isn't."), [
      b("rooms", "main h2", "ooh", "Ooh, this is my home. Here's what's in each room.", undefined, 0),
      b("next", SITE_BOTTOM, "happy", "Come and see the quiet place?", { room: "here", label: "Go to Here" }),
    ]);
  if (path === "/privacy/")
    return one("p-privacy", l("calm", "What you write stays on this phone. This page shows exactly where."), [
      b("keys", "main h2", "calm", "Every key is listed. Nothing hidden.", undefined, 0),
      b("delete", "main h2", "think", "One tap deletes everything, whenever you want.", undefined, -1),
      b("next", SITE_BOTTOM, "hello", "Back to the quiet place?", { room: "here", label: "Go to Here" }),
    ]);
  if (path === "/terms/")
    return one("p-terms", l("think", "The small print, kept short."), [
      b("crisis", "main h2", "care", "If you're ever in danger, call a helpline or your local emergency number.", undefined, 2),
      b("next", SITE_BOTTOM, "hello", "That's all of it. Short, as promised.", { room: "here", label: "Back to Here" }),
    ]);
  return one("p-404", l("ooh", "Ooh, this page wandered off. The links below know the way home."));
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
