"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BloomSun } from "./BloomSun";
import { Hills } from "./DawnSky";
import { oohSvg } from "@/lib/ooh.mjs";
import { playSunrise, setSoundWanted } from "@/lib/ambient";
import { markIntroPlayed } from "@/lib/intro";
import { HAVEN_KEY } from "@/lib/haven";

/**
 * The opening sunrise, every time Arun is opened.
 *
 * TWO MOMENTS
 *
 *   Waiting: a night sky, stars, and Ooh asleep on the hill, the two
 *   things worth knowing before anything else (nothing you write leaves
 *   the phone, and it costs nothing), a hint that something is coming, and
 *   one big button, "Wake the sun". The words are the owner's: say those
 *   two things and leave the sunrise as a surprise, so the gate does not
 *   describe what is about to happen. This is the "press start" of a
 *   game, and it is also the only honest way to put music under the sunrise: browsers
 *   refuse to make sound before a tap, so without it the music would start
 *   halfway through, or not at all. "Without music" beside it turns the
 *   music off and wakes the sun quietly, for anyone on a bus or in a
 *   waiting room.
 *
 *   Rising: from the tap, the music swells in over 3.2 seconds while the
 *   sun rises for 3.2 seconds, and a bowl tone rings for each pair of
 *   petals as they open (lib/ambient.ts SUNRISE_BELLS holds the timings,
 *   matched to the CSS). The rise is started only once the sound is
 *   actually running, so the two land together. With music off there is
 *   no waiting moment at all: the sun simply rises.
 *
 * Which moment shows first, and whether the opening shows at all, is
 * decided before the first paint by INTRO_BOOTSTRAP in app/page.tsx, which
 * sets data-intro="pending" and, when music is on, data-intro-gate on
 * <html>. CSS does the rest, so nothing flashes. That script also skips
 * the opening on a day after thoughts of suicide or not feeling safe were
 * reported.
 *
 * "Skip" is on screen from the first frame, and so is "Need help now",
 * which goes straight to the helplines. Words were chosen for someone who
 * may have arrived in a bad place: nothing is promised and nothing is
 * asked.
 */
const STARS: [number, number, number][] = [
  [10, 12, 2], [22, 26, 1.5], [31, 8, 2], [47, 18, 1.5], [58, 6, 2], [66, 24, 1.5],
  [78, 11, 2], [89, 21, 1.5], [14, 38, 1.5], [37, 34, 1.5], [83, 36, 2], [94, 7, 1.5],
];

const SLEEPY = oohSvg({ mood: "sleepy", size: 86 });
const AWAKE = oohSvg({ mood: "hello", size: 86 });

const noop = () => () => {};
function visitedBefore(): boolean {
  try {
    return !!JSON.parse(window.localStorage.getItem(HAVEN_KEY) || "null")?.introSeen;
  } catch {
    return false;
  }
}

export function IntroDawn({
  onDone,
  onHelp,
  replayKey,
}: {
  onDone: () => void;
  onHelp: () => void;
  replayKey: number;
}) {
  const [leaving, setLeaving] = useState(false);
  const [awake, setAwake] = useState(false);
  const goRef = useRef<HTMLButtonElement | null>(null);
  const wakeRef = useRef<HTMLButtonElement | null>(null);
  const returning = useSyncExternalStore(noop, visitedBefore, () => false);

  // Replaying restarts the opening from the top.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLeaving(false);
    setAwake(false);
  }, [replayKey]);

  /* Focus follows the moment: the wake button while waiting, "Come in"
     once the words have arrived. */
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro !== "pending") return;
    if (root.hasAttribute("data-intro-gate")) {
      const t = setTimeout(() => wakeRef.current?.focus({ preventScroll: true }), 50);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => goRef.current?.focus({ preventScroll: true }), 4200);
    return () => clearTimeout(t);
  }, [replayKey, awake]);

  async function wake(withMusic: boolean) {
    if (!withMusic) setSoundWanted(false);
    else await playSunrise();
    /* Removing the gate is what starts every rising animation in the CSS,
       at the same instant the music's swell and bells were scheduled. */
    document.documentElement.removeAttribute("data-intro-gate");
    setAwake(true);
  }

  function finish() {
    setLeaving(true);
    markIntroPlayed();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setTimeout(
      () => {
        document.documentElement.removeAttribute("data-intro");
        document.documentElement.removeAttribute("data-intro-gate");
        onDone();
      },
      reduce ? 0 : 480,
    );
  }

  return (
    <div
      key={replayKey}
      className={leaving ? "intro leaving" : "intro"}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Arun"
    >
      <div className="intro-top">
        <button
          type="button"
          className="intro-skip"
          onClick={() => {
            finish();
            onHelp();
          }}
        >
          Need help now
        </button>
        <button type="button" className="intro-skip" onClick={finish}>
          Skip
        </button>
      </div>
      <div className="intro-stars" aria-hidden="true">
        {STARS.map(([x, y, r], i) => (
          <span key={i} style={{ left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, animationDelay: `${(i % 5) * 0.5}s, 1.6s` }} />
        ))}
      </div>

      {/* Waiting for the tap. */}
      <div className="intro-gate">
        <p className="intro-gate-line">Nothing you write leaves your phone.</p>
        <p className="intro-gate-sub">And it&apos;s free. No account, nothing to sign up for.</p>
        <p className="intro-gate-hint">Tap below, then wait for a little surprise.</p>
        <button ref={wakeRef} type="button" className="btn btn-sun intro-wake" onClick={() => void wake(true)}>
          <span className="intro-wake-sun" aria-hidden="true">
            <BloomSun size={26} />
          </span>
          Wake the sun
        </button>
        <button type="button" className="intro-quiet" data-sound-control onClick={() => void wake(false)}>
          Without music
        </button>
      </div>

      {/* Rising. */}
      <div className="intro-sun" aria-hidden="true">
        <BloomSun size={128} />
      </div>
      <p className="intro-line" style={{ animationDelay: "1.3s" }}>
        {returning ? "Welcome back." : "You made it here."}
      </p>
      <p className="intro-line" style={{ animationDelay: "2.3s" }}>
        {returning ? "The sun came up for you again." : "That counts for something."}
      </p>
      {/* After the gate the person has just read the privacy and cost, so
          the rise does not repeat them; with music off there was no gate,
          and this is where they are said. */}
      <p className="intro-small">
        {awake
          ? "This is a quiet place. Nothing here is a test."
          : "Nothing here is a test. Nothing you write leaves your phone, and it's free."}
      </p>
      <button ref={goRef} type="button" className="btn btn-sun intro-go" onClick={finish}>
        Come in
      </button>

      {/* Both faces are drawn and the CSS shows the right one, so Ooh is
          asleep from the very first paint and wakes on the same frame as
          the sun, with or without React in the loop. */}
      <span className="intro-ooh" aria-hidden="true">
        <span className="intro-ooh-asleep" dangerouslySetInnerHTML={{ __html: SLEEPY }} />
        <span className="intro-ooh-awake" dangerouslySetInnerHTML={{ __html: AWAKE }} />
      </span>
      <Hills className="intro-hills" />
    </div>
  );
}
