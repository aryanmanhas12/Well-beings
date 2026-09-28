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
        lines: [
          l("care", "Thanks for telling me. Low days count too."),
          l("calm", "Try one small thing below. Just one is plenty."),
        ],
        short: l("calm", "One small thing below. Just one is plenty today."),
      };
    case "steady":
      return {
        id: "here-steady",
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
          lines: [l("care", "You came back. I'm really glad."), l("hello", "How is it now? Tap how you're arriving.")],
          short: l("hello", "Welcome back. Tap how you're arriving, whenever you're ready."),
        };
      return {
        id: "here-new",
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
            lines: [l("happy", "Your plan is ready. Every number in it is one tap.")],
            short: l("happy", "Your plan is ready. Every number in it is one tap."),
          }
        : {
            id: "plan",
            lines: [
              l("think", "A plan written on a calmer day helps on a harder one."),
              l("calm", "A few lines is enough. You can change it any time."),
            ],
            short: l("think", "Five minutes, a few lines. Future you will be glad."),
          };
    case "reach":
      return {
        id: "reach",
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
  const one = (id: string, line: OohLine): OohScript => ({ id, lines: [line], short: line });
  if (path === "/guides/") return one("p-guides", l("think", "Short guides on sleep, movement, food and stress. Pick one that fits today."));
  if (path.startsWith("/guides/")) return one("p-guide", l("ooh", "Ooh, a good one. The studies are named at the bottom if you're curious."));
  if (path === "/resources/") return one("p-resources", l("care", "Every line here is free. If today is hard, calling one is a good idea."));
  if (path === "/about/") return one("p-about", l("hello", "Here's what Arun is, and what it isn't."));
  if (path === "/privacy/") return one("p-privacy", l("calm", "What you write stays on this phone. This page shows exactly where."));
  if (path === "/terms/") return one("p-terms", l("think", "The small print, kept short."));
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
