"use client";

import { useEffect, useRef, useState } from "react";
import { BloomSun } from "./BloomSun";
import { Hills } from "./DawnSky";

/**
 * The first-visit sunrise.
 *
 * Night sky, a few stars, and the bloom-sun rising out of the dark with its
 * petals opening, while four short lines arrive one at a time. About five
 * seconds, and "Skip" is on screen from the first frame.
 *
 * It is shown once. The decision is made before the first paint by a tiny
 * inline script in app/page.tsx that sets data-intro="pending" on <html>
 * when there is no record of a previous visit; CSS does the rest. That is
 * why this component is always in the markup and never conditionally
 * rendered: a React-decided intro would appear only after hydration, so a
 * first-time visitor would see the home screen flash and then be covered.
 *
 * Words were chosen for someone who may have arrived in a bad place. It
 * does not promise to fix anything and it does not ask for anything. It
 * says where they are and what this place will not do to them.
 */
const STARS: [number, number, number][] = [
  [10, 12, 2], [22, 26, 1.5], [31, 8, 2], [47, 18, 1.5], [58, 6, 2], [66, 24, 1.5],
  [78, 11, 2], [89, 21, 1.5], [14, 38, 1.5], [37, 34, 1.5], [83, 36, 2], [94, 7, 1.5],
];

export function IntroDawn({ onDone, replayKey }: { onDone: () => void; replayKey: number }) {
  const [leaving, setLeaving] = useState(false);
  const goRef = useRef<HTMLButtonElement | null>(null);

  // Replaying restarts the animation from the top.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLeaving(false);
  }, [replayKey]);

  useEffect(() => {
    if (document.documentElement.dataset.intro !== "pending") return;
    const t = setTimeout(() => goRef.current?.focus({ preventScroll: true }), 4200);
    return () => clearTimeout(t);
  }, [replayKey]);

  function finish() {
    setLeaving(true);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setTimeout(
      () => {
        document.documentElement.removeAttribute("data-intro");
        onDone();
      },
      reduce ? 0 : 480
    );
  }

  return (
    <div
      key={replayKey}
      className={leaving ? "intro leaving" : "intro"}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Wellbeings"
    >
      <button type="button" className="intro-skip" onClick={finish}>
        Skip
      </button>
      <div className="intro-stars" aria-hidden="true">
        {STARS.map(([x, y, r], i) => (
          <span key={i} style={{ left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, animationDelay: `${(i % 5) * 0.5}s, 1.6s` }} />
        ))}
      </div>
      <div className="intro-sun" aria-hidden="true">
        <BloomSun size={128} />
      </div>
      <p className="intro-line" style={{ animationDelay: "1.3s" }}>
        You made it here.
      </p>
      <p className="intro-line" style={{ animationDelay: "2.3s" }}>
        That counts for something.
      </p>
      <p className="intro-small">
        This is a quiet place. Nothing here is a test, and nothing you write leaves your phone.
      </p>
      <button ref={goRef} type="button" className="btn btn-sun intro-go" onClick={finish}>
        Come in
      </button>
      <Hills className="intro-hills" />
    </div>
  );
}
