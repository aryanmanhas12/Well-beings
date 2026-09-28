"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { oohSvg } from "@/lib/ooh.mjs";
import type { OohBeat, OohLine, OohRoom, OohScene } from "@/lib/oohScript";
import { oohScript, pageHeadingLine } from "@/lib/oohScript";
import { OOH_SERVER, markOohSeen, readOoh, subscribeOoh } from "@/lib/oohStore";
import { chime } from "@/lib/ambient";
import { tick } from "@/lib/haptics";

/**
 * Ooh, narrating the page like the guide in a game, from top to bottom.
 *
 * AT THE TOP, Ooh speaks in the page: a comic bubble in the flow that
 * pushes things down rather than covering them, and stays until tapped
 * away. (The first version floated here and landed on "How are you
 * arriving?", the one thing a struggling person most needs to tap.)
 *
 * AS THE PAGE SCROLLS, Ooh rides along in a narrator bar docked just above
 * the tab bar, like the dialogue box in a game, and describes whichever
 * part of the page is being read: the part whose heading most recently
 * crossed the middle of the screen. The line changes only once that part
 * has held for a quarter of a second, so a fast flick does not strobe
 * through every sentence. At the bottom of a room the bar offers the next
 * one. On site pages it narrates each heading (lib/oohScript.ts
 * pageHeadingLine).
 *
 * The bar stays out of the way where it matters: it is never on screen at
 * the same time as the greeting, it hides while someone is typing (the
 * keyboard is up), it can be put away with × for the rest of the page (Ooh
 * waits in the corner; tap to bring the bar back), Settings can turn Ooh
 * off, and on a heavy day there is no bar at all: Ooh waits quietly in the
 * corner so the plan and the numbers come first.
 *
 * A screen reader hears each new line once, through a polite live region;
 * every control is a real button or link.
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
const DOCK_TYPE_MS = 16;
const SETTLE_MS = 260;
const READ_LINE = 0.55;
const LINGER_MS = 9_000;
const RETURN_AFTER_TYPING_MS = 900;

/* Is a finger (or the mouse button) down anywhere right now? */
let pressing = false;
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", () => (pressing = true), true);
  for (const t of ["pointerup", "pointercancel"]) window.addEventListener(t, () => setTimeout(() => (pressing = false), 60), true);
}
const SCROLL_CLOSE_PX = 260;
let lastChimeAt = 0;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/* Only fields that bring up a keyboard. A checkbox, a switch or a button
   taking focus is not typing: treating every <input> as typing hid the
   bar on each tap on iPhone (see lib/haptics.ts) and swallowed the tap. */
const TEXT_ENTRY =
  "textarea, [contenteditable='true'], input:not([type]), input[type='text'], input[type='search'], input[type='email'], input[type='tel'], input[type='url'], input[type='number'], input[type='password']";
function isTypingTarget(el: Element | null) {
  return !!el && !el.closest(".haptic-switch") && el.matches(TEXT_ENTRY);
}

interface Part {
  key: string;
  el: Element;
  line: OohLine;
  go?: OohBeat["go"];
  edge?: boolean;
}

interface Current {
  key: string;
  line: OohLine;
  go?: OohBeat["go"];
  edge?: boolean;
}

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
  const [current, setCurrent] = useState<Current | null>(null);
  const [dockAway, setDockAway] = useState(false);
  const [ask, setAsk] = useState(false);
  const [typing, setTyping] = useState(false);
  const stripRef = useRef<HTMLElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);

  const line = lines[Math.min(index, lines.length - 1)];
  const last = index >= lines.length - 1;

  /* Behind the opening sunrise Ooh is hidden (see the CSS). When the
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

  /* Is the greeting still on screen? */
  useEffect(() => {
    const el = stripRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setStripInView(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [stripOpen]);

  /* The keyboard is up: Ooh steps out of the way, and comes back only a
     while after typing ends. Coming back at once was a real bug: tapping
     "Keep it" after typing moves the focus on the way down, the bar
     reappeared under the finger, and the tap landed on Ooh instead of the
     button. */
  useEffect(() => {
    let back: ReturnType<typeof setTimeout> | null = null;
    const onIn = (e: FocusEvent) => {
      if (!isTypingTarget(e.target as Element)) return;
      if (back) clearTimeout(back);
      setTyping(true);
    };
    const onOut = () => {
      if (back) clearTimeout(back);
      back = setTimeout(() => {
        if (pressing) return onOut();
        setTyping(isTypingTarget(document.activeElement));
      }, RETURN_AFTER_TYPING_MS);
    };
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
      if (back) clearTimeout(back);
    };
  }, []);

  /* Which part of the page is being read. */
  useEffect(() => {
    if (script.quiet) return;
    let parts: Part[] = [];
    let raf = 0;
    let settle: ReturnType<typeof setTimeout> | null = null;
    let collectTimer: ReturnType<typeof setTimeout> | null = null;
    let lastY = window.scrollY;
    let leanTimer: ReturnType<typeof setTimeout> | null = null;

    const collect = () => {
      const next: Part[] = [];
      for (const beat of script.beats ?? []) {
        const all = document.querySelectorAll(beat.at);
        const el = all[beat.nth === undefined ? 0 : beat.nth < 0 ? all.length + beat.nth : beat.nth];
        if (el) next.push({ key: beat.id, el, line: beat, go: beat.go, edge: beat.edge });
      }
      if (script.headings) {
        document.querySelectorAll("main h2").forEach((h, i) => {
          if (h.closest(".ooh-strip")) return;
          next.push({ key: `h${i}`, el: h, line: pageHeadingLine(h.textContent ?? "", i) });
        });
      }
      parts = next;
    };

    const measure = () => {
      raf = 0;
      const vh = window.innerHeight;
      const readAt = vh * READ_LINE;
      let best: Part | null = null;
      let bestTop = -Infinity;
      for (const p of parts) {
        if (p.edge) continue;
        const r = p.el.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        if (r.top <= readAt && r.top > bestTop) {
          best = p;
          bestTop = r.top;
        }
      }
      /* At the very bottom, the way onward. */
      const edge = parts.find((p) => p.edge);
      if (edge) {
        const r = edge.el.getBoundingClientRect();
        if (r.top < vh - 24 && (r.width || r.height)) best = edge;
      }
      const next: Current | null = best ? { key: best.key, line: best.line, go: best.go, edge: best.edge } : null;
      if (settle) clearTimeout(settle);
      const apply = () => {
        /* Never change under a finger that is down: the bar could appear
           or grow over the very thing being tapped. */
        if (pressing) {
          settle = setTimeout(apply, 120);
          return;
        }
        setCurrent((prev) => (prev?.key === next?.key ? prev : next));
      };
      settle = setTimeout(apply, SETTLE_MS);
    };

    const onScroll = () => {
      /* Ooh leans into the scroll, and straightens when it stops. Written
         straight to the element: re-rendering on every scroll frame would
         cost more than the lean is worth. */
      const y = window.scrollY;
      const el = dockRef.current;
      if (el && !reducedMotion() && Math.abs(y - lastY) > 2) {
        el.dataset.lean = y > lastY ? "down" : "up";
        if (leanTimer) clearTimeout(leanTimer);
        leanTimer = setTimeout(() => {
          if (dockRef.current) delete dockRef.current.dataset.lean;
        }, 180);
      }
      lastY = y;
      if (!raf) raf = requestAnimationFrame(measure);
    };

    collect();
    measure();
    /* Parts that appear later: a view switch inside a room, a panel that
       opens. Batched, because the typewriter changes the page constantly. */
    const mo = new MutationObserver(() => {
      if (collectTimer) return;
      collectTimer = setTimeout(() => {
        collectTimer = null;
        collect();
        onScroll();
      }, 200);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const t of [settle, collectTimer, leanTimer]) if (t) clearTimeout(t);
    };
  }, [script]);

  /* The corner's bubble tidies itself away on a real scroll. */
  useEffect(() => {
    if (!ask) return;
    const start = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - start) > SCROLL_CLOSE_PX) setAsk(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ask]);

  function tuckStrip() {
    markOohSeen(script.id);
    setStripOpen(false);
  }

  const closeAsk = useCallback(() => setAsk(false), []);
  const past = !stripOpen || !stripInView;
  /* The way onward is offered at the bottom even if the greeting is still
     on screen. On a tall iPad a short room (Hope) fits whole, the
     greeting never scrolls away, and the bar, with its link to the next
     room, used never to appear at all. */
  const onward = !!current?.edge && !!current.go;
  const narrating = (past || onward) && !typing && !script.quiet && !dockAway && !!current;
  const cornered = past && !typing && !narrating;

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

      {/* The bar and the corner Ooh are fixed to the screen, so they live
          at the root of the page: inside a room they would ride along with
          the room's slide-in animation instead of staying put. */}
      {narrating &&
        current &&
        createPortal(
          <div className={`ooh-dock ooh-dock-${dock}`} ref={dockRef} role="region" aria-label="Ooh, narrating this page">
            <button type="button" className="ooh-dock-me" aria-label="Ooh, your guide. Put the narration away" onClick={() => setDockAway(true)}>
              <span key={current.key} className="ooh-hop" dangerouslySetInnerHTML={{ __html: oohSvg({ mood: current.line.mood, size: 64 }) }} />
            </button>
            <DockBubble
              key={current.key}
              line={current.line}
              go={current.go}
              onGo={
                onGo && current.go
                  ? () => {
                      const g = current.go!;
                      onGo(g.room, g.view);
                    }
                  : undefined
              }
              onClose={() => setDockAway(true)}
            />
          </div>,
          document.body,
        )}

      {cornered &&
        createPortal(
          <div className={`ooh-guide ooh-dock-${dock}`} data-open={ask}>
            {ask && <Bubble key="ask" line={script.short} last linger={LINGER_MS} onAdvance={closeAsk} onClose={closeAsk} />}
            <button
              type="button"
              className="ooh-me"
              aria-expanded={ask}
              aria-label={ask ? "Ooh, your guide. Hide what Ooh says" : "Ooh, your guide. Hear what Ooh says"}
              onClick={() => {
                /* Narration put away? Bring it back. Otherwise, the page's line. */
                if (dockAway && !script.quiet && current) {
                  setDockAway(false);
                  setAsk(false);
                  return;
                }
                setAsk((a) => !a);
              }}
              dangerouslySetInnerHTML={{ __html: oohSvg({ mood: script.short.mood, size: ask ? 72 : 54 }) }}
            />
          </div>,
          document.body,
        )}

      <p className="sr-only" aria-live="polite">
        {narrating && current ? `Ooh says: ${current.line.text}` : ask ? `Ooh says: ${script.short.text}` : stripOpen ? `Ooh says: ${line.text}` : ""}
      </p>
    </>
  );
}

function useTypewriter(length: number, speed: number) {
  const [typed, setTyped] = useState(() => (reducedMotion() ? Infinity : 0));
  const done = typed >= length;
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setTyped((n) => n + 1), speed);
    return () => clearInterval(t);
  }, [done, speed]);
  return { shown: Math.min(typed, length), done, finish: () => setTyped(Infinity) };
}

/** The narrator bar's bubble: one line, typed quickly, a way onward at the bottom. */
function DockBubble({ line, go, onGo, onClose }: { line: OohLine; go?: OohBeat["go"]; onGo?: () => void; onClose: () => void }) {
  const { shown } = useTypewriter(line.text.length, DOCK_TYPE_MS);
  /* A soft bowl tone and a light tick as a new line lands, spaced out so a
     long scroll does not become a drum roll. */
  useEffect(() => {
    if (Date.now() - lastChimeAt < 5_000) return;
    lastChimeAt = Date.now();
    chime();
    tick("light");
  }, []);
  const href = go ? `/?room=${go.room}${go.view ? `&view=${go.view}` : ""}` : "";
  return (
    <div className="ooh-dock-bubble">
      <span className="ooh-name" aria-hidden="true">
        Ooh
      </span>
      <p className="ooh-dock-text">
        {line.text.slice(0, shown)}
        <span className="ooh-rest" aria-hidden="true">
          {line.text.slice(shown)}
        </span>
      </p>
      {go &&
        (onGo ? (
          <button type="button" className="ooh-go" onClick={onGo}>
            {go.label}
            <span aria-hidden="true">▸</span>
          </button>
        ) : (
          <Link className="ooh-go" href={href}>
            {go.label}
            <span aria-hidden="true">▸</span>
          </Link>
        ))}
      <button type="button" className="ooh-x" aria-label="Put Ooh's narration away" onClick={onClose}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
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
}: {
  line: OohLine;
  last: boolean;
  onAdvance: () => void;
  onClose: () => void;
  onDone?: () => void;
  /** Close by itself this long after the line is fully out. */
  linger?: number;
}) {
  const { shown, done, finish } = useTypewriter(line.text.length, TYPE_MS);
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
    if (done) doneRef.current?.();
  }, [done]);

  useEffect(() => {
    if (!done || !linger) return;
    const t = setTimeout(() => closeRef.current(), linger);
    return () => clearTimeout(t);
  }, [done, linger]);

  return (
    <div className="ooh-bubble">
      <button type="button" className="ooh-say" onClick={() => (done ? onAdvance() : finish())}>
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
        <span className="ooh-next" data-ready={done}>
          {last ? "Got it" : "Next"}
          <span aria-hidden="true"> ▸</span>
        </span>
      </button>
      <button type="button" className="ooh-x" aria-label="Close what Ooh is saying" onClick={onClose}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
