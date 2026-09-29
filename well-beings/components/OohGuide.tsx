"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";
import { oohSvg } from "@/lib/ooh.mjs";
import type { OohBeat, OohLine, OohRoom, OohScene } from "@/lib/oohScript";
import { oohScript, pageHeadingLine } from "@/lib/oohScript";
import { OOH_SERVER, markOohSeen, readOoh, subscribeOoh } from "@/lib/oohStore";
import { chime } from "@/lib/ambient";
import { tick } from "@/lib/haptics";
import { sfx } from "@/lib/sfx";

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
 *
 * OOH IS ALIVE, AS IN RONAK. It breathes (a slow bob), blinks every few
 * seconds, nods as its words come out, and its sprout sways while it
 * talks; each few letters make a soft blip of a voice, higher when Ooh is
 * surprised and lower when it is being gentle (PITCH). The breathing and
 * the nod are transforms on HTML wrappers around the drawing, never
 * animations inside the SVG: Ronak measured the in-SVG kind at ~300ms of
 * main-thread work per 4s on a slow phone, because the browser redraws the
 * picture every frame. The outline filter sits on the drawing inside the
 * moving wrapper, so moving it never redraws the filter either.
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
const MEASURE_EVERY_MS = 90;
let lastChimeAt = 0;

/* Ooh's voice: the typing blip at a pitch for each mood (Ronak's values). */
const PITCH: Record<string, number> = { hello: 1.1, ooh: 1.18, happy: 1.14, calm: 0.92, listen: 0.98, care: 0.88, think: 0.96, sleepy: 0.82 };

/* Every Ooh on the page blinks now and then: the eyes squash for 130ms,
   every 2.8 to 6.4 seconds. One loop for all of them. */
let blinkers = 0;
let blinkTimer: ReturnType<typeof setTimeout> | null = null;
function blinkLoop() {
  blinkTimer = setTimeout(() => {
    if (!document.hidden && !reducedMotion()) {
      document.querySelectorAll(".ooh-talkw .ooh-svg").forEach((svg) => {
        if (!svg.querySelector(".ooh-blink")) return;
        svg.classList.add("blink");
        setTimeout(() => svg.classList.remove("blink"), 130);
      });
    }
    if (blinkers > 0) blinkLoop();
    else blinkTimer = null;
  }, 2800 + Math.random() * 3600);
}
function useBlinking() {
  useEffect(() => {
    blinkers++;
    if (!blinkTimer) blinkLoop();
    return () => {
      blinkers--;
    };
  }, []);
}

/* A screen open over the page. Dialogs are only in the page while open;
   the opening sunrise's is always there, hidden unless data-intro says it
   is up. Read from attributes, never from layout: this runs while words
   are typing, and measuring would force a layout every few letters. */
function screenOver() {
  return !!document.querySelector("[aria-modal='true']:not(.intro)") || document.documentElement.dataset.intro === "pending";
}

/** A little nod as words come out: a transform on the wrapper, run by the compositor. */
function nod(el: HTMLElement | null) {
  if (!el || reducedMotion() || typeof el.animate !== "function") return;
  el.animate(
    [{ transform: "none" }, { transform: "translateY(-2px) rotate(-3deg)" }, { transform: "none" }],
    { duration: 220, easing: "ease-out" },
  );
}

/** Ooh, drawn inside two wrappers: one breathes, one nods and talks. */
function OohFigure({ mood, size, talkRef }: { mood: OohLine["mood"]; size: number; talkRef?: Ref<HTMLSpanElement> }) {
  return (
    <span className="ooh-bobw" aria-hidden="true">
      <span className="ooh-talkw" ref={talkRef} dangerouslySetInnerHTML={{ __html: oohSvg({ mood, size }) }} />
    </span>
  );
}

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
  /** Where it starts on the page (not the screen), measured at collect. */
  top: number;
  shown: boolean;
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
        if (el) next.push({ key: beat.id, el, line: beat, go: beat.go, edge: beat.edge, top: 0, shown: false });
      }
      if (script.headings) {
        document.querySelectorAll("main h2").forEach((h, i) => {
          if (h.closest(".ooh-strip")) return;
          next.push({ key: `h${i}`, el: h, line: pageHeadingLine(h.textContent ?? "", i), top: 0, shown: false });
        });
      }
      parts = next;
      place();
    };

    /* Where each part sits on the page, read once here, so a scroll frame
       is arithmetic on the scroll position and reads nothing from the page.
       Reading positions during the scroll was forcing a fresh layout on
       almost every frame while Ooh's words were typing (measured: 151
       layouts in one scroll of Here, 6 with Ooh off). Positions are read
       again only when the page changes: new parts, a card first gliding
       into place, the page resizing. */
    const place = () => {
      const y = window.scrollY;
      for (const p of parts) {
        const r = p.el.getBoundingClientRect();
        p.shown = !!(r.width || r.height);
        /* A card still waiting to glide in sits 26px low (Feedback.tsx). */
        const waiting = p.el.closest("[data-reveal='pending']") ? 26 : 0;
        p.top = r.top + y - waiting;
      }
    };

    let lastMeasure = 0;
    let pendingKey: string | undefined;
    let trailing: ReturnType<typeof setTimeout> | null = null;
    const measure = () => {
      lastMeasure = performance.now();
      const vh = window.innerHeight;
      const readAt = vh * READ_LINE;
      const y = window.scrollY;
      let best: Part | null = null;
      let bestTop = -Infinity;
      for (const p of parts) {
        if (p.edge || !p.shown) continue;
        const top = p.top - y;
        if (top <= readAt && top > bestTop) {
          best = p;
          bestTop = top;
        }
      }
      /* At the very bottom, the way onward. */
      const edge = parts.find((p) => p.edge);
      if (edge && edge.shown && edge.top - y < vh - 24) best = edge;
      const next: Current | null = best ? { key: best.key, line: best.line, go: best.go, edge: best.edge } : null;
      /* Already on its way to this part: let it land rather than starting
         the quarter-second over (repeated measures kept pushing it back). */
      if (settle && next?.key === pendingKey) return;
      pendingKey = next?.key;
      if (settle) clearTimeout(settle);
      const apply = () => {
        /* Never change under a finger that is down: the bar could appear
           or grow over the very thing being tapped. */
        if (pressing) {
          settle = setTimeout(apply, 120);
          return;
        }
        settle = null;
        setCurrent((prev) => (prev?.key === next?.key ? prev : next));
      };
      settle = setTimeout(apply, SETTLE_MS);
    };

    /* One frame's work, at most once a frame, reads before writes. The
       first version did this on every scroll event: it read the scroll
       position, wrote the lean, then measured every part, which made the
       browser recompute style and layout mid-scroll again and again. It
       was the single largest cost of a scroll (measured on a phone slowed
       4x). Now the parts are measured at most every 90ms, with one last
       measure when the scroll stops, and the lean is written only when it
       changes. */
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      const now = performance.now();
      if (now - lastMeasure >= MEASURE_EVERY_MS) measure();
      if (trailing) clearTimeout(trailing);
      trailing = setTimeout(measure, MEASURE_EVERY_MS + 30);
      /* Ooh leans into the scroll, and straightens when it stops. */
      const el = dockRef.current;
      if (el && !reducedMotion() && Math.abs(y - lastY) > 2) {
        const dir = y > lastY ? "down" : "up";
        if (el.dataset.lean !== dir) el.dataset.lean = dir;
        if (leanTimer) clearTimeout(leanTimer);
        leanTimer = setTimeout(() => {
          if (dockRef.current) delete dockRef.current.dataset.lean;
        }, 180);
      }
      lastY = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    collect();
    measure();
    /* Parts that appear later: a view switch inside a room, a panel that
       opens. Batched, because the typewriter changes the page constantly. */
    const mo = new MutationObserver((records) => {
      /* The lights (Feedback.tsx) come and go on the page all the time;
         they are not new parts. */
      const fx = (n: Node) => n instanceof Element && n.matches(".fx-glow, .fx-ring, .fx-sweep");
      if (records.every((r) => r.type === "childList" && (r.addedNodes.length || r.removedNodes.length) && [...r.addedNodes, ...r.removedNodes].every(fx))) return;
      if (collectTimer) return;
      collectTimer = setTimeout(() => {
        collectTimer = null;
        collect();
        onScroll();
      }, 200);
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-reveal", "open"] });
    /* The page changing height without new elements (a picture arriving,
       text wrapping differently): the positions are read again. */
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (resizeTimer) return;
            resizeTimer = setTimeout(() => {
              resizeTimer = null;
              place();
              onScroll();
            }, 150);
          });
    ro?.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      mo.disconnect();
      ro?.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const t of [settle, collectTimer, leanTimer, trailing]) if (t) clearTimeout(t);
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

  const stripTalk = useRef<HTMLSpanElement | null>(null);
  const dockTalk = useRef<HTMLSpanElement | null>(null);
  const cornerTalk = useRef<HTMLSpanElement | null>(null);
  useBlinking();

  function tuckStrip() {
    markOohSeen(script.id);
    setStripOpen(false);
    sfx("close");
  }

  const closeAsk = useCallback(() => {
    setAsk(false);
    sfx("close");
  }, []);
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
          <span className="ooh-figure">
            <OohFigure mood={line.mood} size={lines.length > 1 ? 84 : 66} talkRef={stripTalk} />
          </span>
          <Bubble
            key={`${index}-${take}`}
            line={line}
            last={last}
            talk={stripTalk}
            greet={index === 0}
            onDone={() => {
              if (last) markOohSeen(script.id);
            }}
            onAdvance={() => {
              if (last) tuckStrip();
              else {
                sfx("progress-step");
                setIndex((i) => i + 1);
              }
            }}
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
            <button
              type="button"
              className="ooh-dock-me"
              aria-label="Ooh, your guide. Put the narration away"
              onClick={() => {
                setDockAway(true);
                sfx("close");
              }}
            >
              <span key={current.key} className="ooh-hop">
                <OohFigure mood={current.line.mood} size={64} talkRef={dockTalk} />
              </span>
            </button>
            <DockBubble
              key={current.key}
              line={current.line}
              go={current.go}
              talk={dockTalk}
              onGo={
                onGo && current.go
                  ? () => {
                      const g = current.go!;
                      onGo(g.room, g.view);
                    }
                  : undefined
              }
              onClose={() => {
                setDockAway(true);
                sfx("close");
              }}
            />
          </div>,
          document.body,
        )}

      {cornered &&
        createPortal(
          <div className={`ooh-guide ooh-dock-${dock}`} data-open={ask}>
            {ask && <Bubble key="ask" line={script.short} last linger={LINGER_MS} talk={cornerTalk} onAdvance={closeAsk} onClose={closeAsk} />}
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
                  sfx("open");
                  return;
                }
                sfx(ask ? "close" : "open");
                setAsk((a) => !a);
              }}
            >
              <OohFigure mood={script.short.mood} size={ask ? 72 : 54} talkRef={cornerTalk} />
            </button>
          </div>,
          document.body,
        )}

      <p className="sr-only" aria-live="polite">
        {narrating && current ? `Ooh says: ${current.line.text}` : ask ? `Ooh says: ${script.short.text}` : stripOpen ? `Ooh says: ${line.text}` : ""}
      </p>
    </>
  );
}

/**
 * The words coming out, a letter at a time, written straight into the two
 * text nodes rather than through React: re-rendering the bubble for every
 * letter cost a render every 16 to 26ms, and replacing text nodes woke
 * every observer on the page. A pause after a full stop, a shorter one
 * after a comma, as a person would. Every few letters: a blip of Ooh's
 * voice at its mood's pitch, and a nod. Instant under reduced motion.
 */
function useTyped(text: string, mood: OohLine["mood"], speed: number, talk: RefObject<HTMLSpanElement | null> | undefined, voiceEvery: number, voiceGain = 1) {
  const typedRef = useRef<HTMLSpanElement | null>(null);
  const restRef = useRef<HTMLSpanElement | null>(null);
  /* Under reduced motion the whole line is there at once. */
  const [done, setDone] = useState(reducedMotion);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const write = (n: number) => {
      const t = typedRef.current;
      const r = restRef.current;
      if (!t || !r) return;
      if (!t.firstChild) t.append(document.createTextNode(""));
      if (!r.firstChild) r.append(document.createTextNode(""));
      (t.firstChild as Text).data = text.slice(0, n);
      (r.firstChild as Text).data = text.slice(n);
    };
    if (reducedMotion()) {
      write(text.length);
      return;
    }
    const figure = talk?.current ?? null;
    const parts = Array.from(text);
    let n = 0;
    let shown = 0;
    write(0);
    figure?.classList.add("ooh-talking");
    const pitch = PITCH[mood] ?? 1;
    /* Faster than a frame, letters go out two at a time: the same pace
       with half the redraws. */
    const per = speed < 30 ? 2 : 1;
    const step = () => {
      if (n >= parts.length) {
        timer.current = null;
        figure?.classList.remove("ooh-talking");
        setDone(true);
        return;
      }
      let g = "";
      let spoke = false;
      for (let k = 0; k < per && n < parts.length; k++) {
        g = parts[n++];
        shown += g.length;
        if (n % voiceEvery === 1 && /\S/.test(g)) spoke = true;
        if (/[.!?,;:]/.test(g)) break;
      }
      write(shown);
      let wait = speed * per;
      if (/[.!?]/.test(g)) wait = speed * 7;
      else if (/[,;:]/.test(g)) wait = speed * 4;
      /* Silent while a screen is open over the page (help, settings, the
         urgent screen): nobody wants a chattering guide behind a helpline. */
      if (spoke && !screenOver()) {
        sfx("typing", pitch * (0.95 + Math.random() * 0.1), voiceGain);
        nod(figure);
      }
      timer.current = setTimeout(step, wait);
    };
    timer.current = setTimeout(step, 0);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      figure?.classList.remove("ooh-talking");
    };
  }, [text, mood, speed, talk, voiceEvery, voiceGain]);

  /* A tap mid-line: the rest of it at once. */
  const finish = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const t = typedRef.current;
    const r = restRef.current;
    if (t && r) {
      t.textContent = text;
      r.textContent = "";
    }
    talk?.current?.classList.remove("ooh-talking");
    setDone(true);
  };

  return { typedRef, restRef, done, finish };
}

/** The narrator bar's bubble: one line, typed quickly, a way onward at the bottom. */
function DockBubble({
  line,
  go,
  onGo,
  onClose,
  talk,
}: {
  line: OohLine;
  go?: OohBeat["go"];
  onGo?: () => void;
  onClose: () => void;
  talk?: RefObject<HTMLSpanElement | null>;
}) {
  /* Quieter and sparser than the greeting's voice: the bar talks often. */
  const { typedRef, restRef } = useTyped(line.text, line.mood, DOCK_TYPE_MS, talk, 4, 0.75);
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
      <span className="ooh-name" aria-hidden="true" translate="no">
        Ooh
      </span>
      <p className="ooh-dock-text">
        <span ref={typedRef} />
        <span className="ooh-rest" aria-hidden="true" ref={restRef}>
          {line.text}
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
  talk,
  greet,
}: {
  line: OohLine;
  last: boolean;
  onAdvance: () => void;
  onClose: () => void;
  onDone?: () => void;
  /** Close by itself this long after the line is fully out. */
  linger?: number;
  talk?: RefObject<HTMLSpanElement | null>;
  /** The first line on a page: Ooh wakes with a little chime. */
  greet?: boolean;
}) {
  const { typedRef, restRef, done, finish } = useTyped(line.text, line.mood, TYPE_MS, talk, 3);
  const doneRef = useRef(onDone);
  const closeRef = useRef(onClose);
  useEffect(() => {
    doneRef.current = onDone;
    closeRef.current = onClose;
  });

  /* A soft bowl tone as Ooh starts speaking, if the music is on; and the
     first line on a page wakes Ooh with its own little sound. */
  useEffect(() => {
    chime();
    if (greet) sfx("wake");
  }, [greet]);

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
        <span className="ooh-name" aria-hidden="true" translate="no">
          Ooh
        </span>
        <span className="ooh-text">
          <span ref={typedRef} />
          {/* The rest is there but invisible, so the bubble is its final
              size from the first letter and nothing below it jumps. */}
          <span className="ooh-rest" aria-hidden="true" ref={restRef}>
            {line.text}
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
