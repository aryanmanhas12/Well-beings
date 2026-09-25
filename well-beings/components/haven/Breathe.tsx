"use client";

import { useEffect, useRef, useState } from "react";
import { BloomSun } from "./BloomSun";

/**
 * Breathe with the sun: in for four, out for six.
 *
 * Six breaths a minute with a longer out-breath is the pattern with the most
 * consistent evidence for slowing the body's alarm response. The sun grows
 * as you breathe in and settles as you breathe out, so it can be followed
 * with eyes half-closed. The words change too, because not everyone can
 * follow a shape.
 *
 * Nothing counts down on screen. A countdown is a small test, and a person
 * reaching for this is not in the mood to be tested.
 */
const IN_MS = 4000;
const OUT_MS = 6000;

export function Breathe({ onDone, rounds = 6 }: { onDone?: () => void; rounds?: number }) {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"in" | "out" | "rest">("rest");
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function start() {
    setRunning(true);
    setCount(0);
    cycle(0);
  }

  function cycle(n: number) {
    if (n >= rounds) {
      setRunning(false);
      setPhase("rest");
      onDone?.();
      return;
    }
    setPhase("in");
    timer.current = setTimeout(() => {
      setPhase("out");
      timer.current = setTimeout(() => {
        setCount(n + 1);
        cycle(n + 1);
      }, OUT_MS);
    }, IN_MS);
  }

  function stop() {
    if (timer.current) clearTimeout(timer.current);
    setRunning(false);
    setPhase("rest");
  }

  const scale = phase === "in" ? 1 : 0.6;
  const dur = phase === "in" ? IN_MS : phase === "out" ? OUT_MS : 600;
  const cue =
    phase === "in" ? "Breathe in…" : phase === "out" ? "…and slowly out" : count >= rounds ? "That's a minute. Well done." : "";

  return (
    <div>
      <div className="breath-stage">
        <div
          className="breath-sun"
          style={{ ["--b" as string]: running ? scale : 0.72, ["--bt" as string]: `${dur}ms` }}
          aria-hidden="true"
        >
          <BloomSun size={150} />
        </div>
        <p className="breath-cue" aria-live="polite">
          {cue}
        </p>
      </div>
      <div className="btn-row" style={{ justifyContent: "center" }}>
        {running ? (
          <button type="button" className="btn btn-secondary" onClick={stop} style={{ minHeight: 44 }}>
            Stop
          </button>
        ) : (
          <button type="button" className="btn btn-sun" onClick={start}>
            {count >= rounds ? "Again" : "Start breathing"}
          </button>
        )}
      </div>
    </div>
  );
}
