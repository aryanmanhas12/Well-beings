"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { oohSvg } from "@/lib/ooh.mjs";
import type { OohBeat, OohLine, OohRoom, OohScene } from "@/lib/oohScript";
import { oohScript } from "@/lib/oohScript";
import { OOH_SERVER, markOohSeen, readOoh, subscribeOoh } from "@/lib/oohStore";
import { chime } from "@/lib/ambient";

/**
 * Ooh, narrating the page like the guide in a game, all the way down it.
 *
 * AT THE TOP, Ooh speaks in the page: a comic bubble in the flow that
 * pushes things down rather than covering them, and stays until tapped
 * away. (The first version floated here and landed on "How are you
 * arriving?", the one thing a struggling person most needs to tap.)
 *
 * FURTHER DOWN, Ooh follows along in the corner (above the tab bar on a
 * phone) and, as each part of the page arrives, says something about it,
 * and at the bottom offers the next room: Here to Hope, Hope to Plan, Plan
 * to Reach out. These remarks are the one place Ooh floats over the page,
 * so they are kept on a short leash:
 *   - only once the scrolling pauses, never mid-swipe;
 *   - never while someone is typing (the keyboard is up, and a bubble
 *     arriving then is an interruption, not company);
 *   - at least fifteen seconds apart, once each per visit;
 *   - gone again after a few seconds, or as soon as scrolling resumes;
 *   - never at all on a heavy day, when the plan and the numbers come
 *     first (the script is "quiet" and has no remarks).
 *
 * Tapping Ooh in the corner brings back the page's line at any time.
 * The words and the rules they keep are in lib/oohScript.ts. A screen
 * reader hears each line once through a polite live region, and every
 * control is a real button or link.
 */
export function OohGuide({
  scene,
  dock = "corner",
  onGo,
}: {
  scene: OohScene;
  dock?: "corner" | "tabbar";
  /** In the safe place, moves between rooms without a page load. */
  onGo?: (room: OohRoom, view?: string) => void;
}) {
  const prefs = useSyncExternalStore(subscribeOoh, readOoh, () => OOH_SERVER);
  if (prefs.hidden) return null;
  const script = oohScript(scene);
  /* Keyed by the script, so a new page or a new check-in starts fresh. */
  return <OohRun key={script.id} script={script} seen={prefs.seen.includes(script.id)} dock={dock} onGo={onGo} />;
}

const TYPE_MS = 26;
const REMARK_GAP_MS = 15_000;
const SETTLE_MS = 700;
const LINGER_MS = 7_000;
const LINGER_GO_MS = 11_000;
const SCROLL_CLOSE_PX = 260;

/* Remarks already made this visit, across rooms, so going back and forth
   between two tabs does not replay them. Memory only. */
const SAID = new Set<string>();
let lastRemarkAt = 0;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function isTypingTarget(el: Element | null) {
  return !!el && el.matches("input, textarea, select, [contenteditable='true']");
}

type Float = { kind: "ask"; line: OohLine } | { kind: "beat"; beat: OohBeat } | null;

function OohRun({
  script,
  seen,
  dock,
  onGo,
}: {
  script: ReturnType<typeof oohScript>;
  seen: boolean;
  dock: string;
  onGo?: (room: OohRoom, view?: string) => void;
}) {
  const [lines] = useState<OohLine[]>(() => (seen ? [script.short] : script.lines));
  const [stripOpen, setStripOpen] = useState(!script.quiet);
  const [index, setIndex] = useState(0);
  const [take, setTake] = useState(0);
  const [stripInView, setStripInView] = useState(true);
  const [float, setFloat] = useState<Float>(null);
  const [typing, setTyping] = useState(false);
  const stripRef = useRef<HTMLElement | null>(null);
  const state = useRef({ stripShowing: true, float: false, typing: false });
  useEffect(() => {
    state.current = { stripShowing: stripOpen && stripInView, float: !!float, typing };
  });

  const line = lines[Math.min(index, lines.length - 1)];
  const last = index >= lines.length - 1;

  /* Behind the first-visit sunrise Ooh is hidden (see the CSS). When the
     sunrise lifts, Ooh starts again from the first letter. */
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro !== "pending") return;
    const mo = new MutationObserver(() => {
      if (root.dataset.intro === "pending") return;
      mo.disconnect();
      setIndex(0);
      setTake((t) => t + 1);
    });
    mo.observe(root, { attributes: true, attributeFilter: ["data-intro"] });
    return () => mo.disconnect();
  }, []);

  /* Is the greeting still on screen? If not, Ooh is in the corner. */
  useEffect(() => {
    const el = stripRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setStripInView(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [stripOpen]);

  /* The keyboard is up: Ooh steps out of the way. */
  useEffect(() => {
    const onIn = (e: FocusEvent) => setTyping(isTypingTarget(e.target as Element));
    const onOut = () => setTimeout(() => setTyping(isTypingTarget(document.activeElement)), 0);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  /* Remarks as the page scrolls. */
  useEffect(() => {
    const beats = script.beats ?? [];
    if (script.quiet || !beats.length || typeof IntersectionObserver === "undefined") return;
    const byEl = new Map<Element, OohBeat>();
    /* Everything on screen that Ooh has not remarked on yet. When several
       arrive together (the bottom of a short room), the way onward wins,
       then whichever is furthest down; the rest wait their turn. */
    const arrived = new Map<string, OohBeat>();
    const pick = () => {
      const list = [...arrived.values()];
      return list.find((x) => x.go) ?? list.sort((x, y) => beats.indexOf(y) - beats.indexOf(x))[0] ?? null;
    };
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tryShow = () => {
      timer = null;
      const next = pick();
      if (!next) return;
      const s = state.current;
      if (s.stripShowing || s.float || s.typing) return;
      const wait = REMARK_GAP_MS - (Date.now() - lastRemarkAt);
      if (wait > 0) {
        timer = setTimeout(tryShow, wait);
        return;
      }
      const beat = next;
      arrived.delete(beat.id);
      SAID.add(`${script.id}:${beat.id}`);
      lastRemarkAt = Date.now();
      setFloat({ kind: "beat", beat });
    };
    const settle = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(tryShow, SETTLE_MS);
    };
    const seen = (entries: IntersectionObserverEntry[]) => {
      for (const e of entries) {
        const beat = byEl.get(e.target);
        if (!beat) continue;
        if (e.isIntersecting && !SAID.has(`${script.id}:${beat.id}`)) arrived.set(beat.id, beat);
        else if (!e.isIntersecting) arrived.delete(beat.id);
      }
      settle();
    };
    /* "Arrived" means in the upper two thirds, not peeking at the edge;
       the page's last thing counts as soon as it shows at all. */
    const io = new IntersectionObserver(seen, { rootMargin: "0px 0px -33% 0px", threshold: 0 });
    const edge = new IntersectionObserver(seen, { threshold: 0 });
    const resolve = () => {
      for (const beat of beats) {
        const all = document.querySelectorAll(beat.at);
        const el = all[beat.nth === undefined ? 0 : beat.nth < 0 ? all.length + beat.nth : beat.nth];
        if (el && !byEl.has(el)) {
          byEl.set(el, beat);
          (beat.edge ? edge : io).observe(el);
        }
      }
    };
    resolve();
    /* Sections that appear later, like a switch of view inside a room. */
    const mo = new MutationObserver(resolve);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", settle, { passive: true });
    return () => {
      io.disconnect();
      edge.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", settle);
      if (timer) clearTimeout(timer);
    };
  }, [script]);

  /* A floating bubble tidies itself away on a real scroll. */
  const closeFloat = useCallback(() => setFloat(null), []);
  useEffect(() => {
    if (!float) return;
    const start = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - start) > SCROLL_CLOSE_PX) setFloat(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [float]);

  function tuckStrip() {
    markOohSeen(script.id);
    setStripOpen(false);
  }

  const cornerShown = (!stripOpen || !stripInView) && !typing;
  const floatLine: OohLine | null = float ? (float.kind === "ask" ? float.line : float.beat) : null;
  const floatGo = float?.kind === "beat" ? float.beat.go : undefined;

  return (
    <>
      {stripOpen && (
        <section className="ooh-strip" aria-label="Ooh, your guide" ref={stripRef}>
          <span
            className="ooh-figure"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: oohSvg({ mood: line.mood, size: lines.length > 1 ? 84 : 66 }) }}
          />
          <Bubble
            key={`${index}-${take}`}
            line={line}
            last={last}
            onDone={() => {
              if (last) markOohSeen(script.id);
            }}
            onAdvance={() => (last ? tuckStrip() : setIndex((i) => i + 1))}
            onClose={tuckStrip}
          />
        </section>
      )}

      {cornerShown && (
        <div className={`ooh-guide ooh-dock-${dock}`} data-open={!!float}>
          {float && floatLine && (
            <Bubble
              key={float.kind === "beat" ? float.beat.id : "ask"}
              line={floatLine}
              last
              linger={floatGo ? LINGER_GO_MS : LINGER_MS}
              onAdvance={closeFloat}
              onClose={closeFloat}
              go={floatGo}
              onGo={
                floatGo && onGo
                  ? () => {
                      setFloat(null);
                      onGo(floatGo.room, floatGo.view);
                    }
                  : undefined
              }
            />
          )}
          <button
            type="button"
            className="ooh-me"
            aria-expanded={!!float}
            aria-label={float ? "Ooh, your guide. Hide what Ooh says" : "Ooh, your guide. Hear what Ooh says"}
            onClick={() => (float ? setFloat(null) : setFloat({ kind: "ask", line: script.short }))}
            dangerouslySetInnerHTML={{ __html: oohSvg({ mood: floatLine ? floatLine.mood : script.short.mood, size: float ? 72 : 54 }) }}
          />
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {floatLine ? `Ooh says: ${floatLine.text}` : stripOpen ? `Ooh says: ${line.text}` : ""}
      </p>
    </>
  );
}

/** One speech bubble: typed out; tap to finish the line or move on. */
function Bubble({
  line,
  last,
  onAdvance,
  onClose,
  onDone,
  linger,
  go,
  onGo,
}: {
  line: OohLine;
  last: boolean;
  onAdvance: () => void;
  onClose: () => void;
  onDone?: () => void;
  /** Close by itself this long after the line is fully out. */
  linger?: number;
  go?: OohBeat["go"];
  onGo?: () => void;
}) {
  const [typed, setTyped] = useState(() => (reducedMotion() ? Infinity : 0));
  const done = typed >= line.text.length;
  const doneRef = useRef(onDone);
  const closeRef = useRef(onClose);
  useEffect(() => {
    doneRef.current = onDone;
    closeRef.current = onClose;
  });

  /* A soft bowl tone as Ooh starts speaking, if the music is on. */
  useEffect(() => {
    chime();
  }, []);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setTyped((n) => n + 1), TYPE_MS);
    return () => clearInterval(t);
  }, [done]);

  useEffect(() => {
    if (done) doneRef.current?.();
  }, [done]);

  useEffect(() => {
    if (!done || !linger) return;
    const t = setTimeout(() => closeRef.current(), linger);
    return () => clearTimeout(t);
  }, [done, linger]);

  const shown = Math.min(typed, line.text.length);
  const href = go ? `/?room=${go.room}${go.view ? `&view=${go.view}` : ""}` : "";

  return (
    <div className="ooh-bubble">
      <button type="button" className="ooh-say" onClick={() => (done ? onAdvance() : setTyped(Infinity))}>
        <span className="ooh-name" aria-hidden="true">
          Ooh
        </span>
        <span className="ooh-text">
          {line.text.slice(0, shown)}
          {/* The rest is there but invisible, so the bubble is its final
              size from the first letter and nothing below it jumps. */}
          <span className="ooh-rest" aria-hidden="true">
            {line.text.slice(shown)}
          </span>
        </span>
        {!go && (
          <span className="ooh-next" data-ready={done}>
            {last ? "Got it" : "Next"}
            <span aria-hidden="true"> ▸</span>
          </span>
        )}
      </button>
      {go &&
        (onGo ? (
          <button type="button" className="ooh-go" onClick={onGo}>
            {go.label}
            <span aria-hidden="true"> ▸</span>
          </button>
        ) : (
          <Link className="ooh-go" href={href}>
            {go.label}
            <span aria-hidden="true"> ▸</span>
          </Link>
        ))}
      <button type="button" className="ooh-x" aria-label="Close what Ooh is saying" onClick={onClose}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
