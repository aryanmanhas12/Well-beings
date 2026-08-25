import { useEffect, useRef, useState } from "react";
import { Tab } from "@/hooks/useWellBeings";
import { TourStep, TOUR_DWELL_MS } from "@/lib/tour";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6; // spotlight ring padding around the real element
const MAX_MISS_FRAMES = 90; // ~1.5s at 60fps before giving up on a step

export function Tour({
  steps,
  currentTab,
  setTab,
  onFinish,
  onComplete,
  finishLabel = "Done",
}: {
  steps: TourStep[];
  /* Optional, because this now also runs on the welcome screen, which has no
     tabs at all. Steps that carry a `tab` are simply inert there. */
  currentTab?: Tab;
  setTab?: (t: Tab) => void;
  /** Dismissal, however it happened — Skip, Escape, or finishing. */
  onFinish: () => void;
  /** Finishing specifically, so the welcome tour can hand straight off into
      the check-in without Skip doing the same thing. */
  onComplete?: () => void;
  finishLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const [rect, setRect] = useState<Rect | null>(null);
  /* The bubble's own height, measured rather than assumed. The previous
     placement clamped the bubble's TOP to `vh - 40`, which on a phone put
     roughly all of a ~170px bubble below the fold — the tour was there, and
     unreadable. Clamping needs the height, so we measure it. */
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [bubbleH, setBubbleH] = useState(170);
  /* The dialog itself — not the bubble inside it — is the focus target,
     and it mounts unconditionally on the first render. An earlier version
     focused the bubble instead, but the bubble only exists once `rect` is
     measured, which happens a frame or two later: `.focus()` landed on a
     still-null ref and silently did nothing, so arrow keys and Escape never
     reached the handler at all. Keeping a stable, always-mounted focus
     target fixes that regardless of when the spotlight itself appears. */
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  useEffect(() => {
    if (step.tab && setTab && step.tab !== currentTab) setTab(step.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Height changes with the copy of each step, and with the text-size
  // control, so this observes rather than measuring once.
  useEffect(() => {
    const el = bubbleRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setBubbleH(el.offsetHeight));
    ro.observe(el);
    setBubbleH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // A continuous measure loop, not a one-shot: it re-queries the selector
  // and re-measures every frame. That's what makes the spotlight track a
  // smooth-scroll into view AND follow the user if they scroll by hand,
  // without wiring separate scroll/resize listeners. If the target never
  // shows up (a step referencing a tab that failed to render, say), it
  // gives up after MAX_MISS_FRAMES and skips forward — a tour that can
  // silently hang on a missing element is worse than one that skips a step.
  useEffect(() => {
    let raf = 0;
    let misses = 0;
    let scrolledOnce = false;
    const tick = () => {
      const el = document.querySelector<HTMLElement>(step.selector);
      if (el) {
        misses = 0;
        if (!scrolledOnce) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          scrolledOnce = true;
        }
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        misses++;
        if (misses > MAX_MISS_FRAMES) {
          if (index < steps.length - 1) setIndex((i) => i + 1);
          else onFinish();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, [index]);

  /* The timer only ever moves BETWEEN cards.

     It used to run on the last step too, where next() takes the isLast branch
     and fires onComplete — which WellBeingsApp wires to startChat. Leaving the
     welcome tour open for ~42s therefore began the five-minute check-in on its
     own, resetting state and switching screen, for someone who had merely
     looked away. Advancing between explanations is a convenience; starting a
     questionnaire is an action, and actions need a tap.

     Reduced motion stops it entirely, matching the statement deck. That
     matters more here than it looks: the progress bar is hidden under
     reduced motion (the global rule collapses its duration, so it would sit
     full and lie about the time left), which without this check would mean
     steps swapping every 7s with no visible warning at all — for exactly the
     people least able to tolerate that. */
  const autoAdvancing = !isLast && !paused && !reducedMotion;

  useEffect(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (!autoAdvancing) return;
    autoAdvanceRef.current = setTimeout(() => {
      next();
    }, TOUR_DWELL_MS);
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, autoAdvancing]);

  function next() {
    /* Both sides of this: the auto-advance timer has to be cleared however
       the step ends, and finishing on the last step is distinct from
       skipping out of it — only finishing hands off to onComplete. */
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (isLast) {
      onComplete?.();
      onFinish();
    } else setIndex((i) => i + 1);
  }
  function back() {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setIndex((i) => Math.max(0, i - 1));
  }

  // Enter is deliberately not wired here: focus can land on the Next/Back/
  // Skip buttons themselves after a click, and a native Enter activation on
  // a focused button plus this handler both firing would double-advance.
  // Arrow keys and Escape never collide with a button's own behaviour.
  function onKeyDown(e: React.KeyboardEvent) {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (e.key === "Escape") {
      e.stopPropagation();
      onFinish();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      back();
    }
  }

  /* The text-size control zooms the document root, and zoom splits the two
     coordinate systems this component straddles: getBoundingClientRect
     reports SCREEN pixels, while a CSS `left` set on a fixed child is
     multiplied by zoom when painted. Measured directly, the spotlight
     landed 224px off its target at 1.35. Dividing measurements (and the
     viewport used for clamping) by the zoom factor puts every number in
     the same space the styles are interpreted in. */
  const zoom =
    typeof window !== "undefined"
      ? parseFloat(getComputedStyle(document.documentElement).zoom || "1") || 1
      : 1;
  const vw = (typeof window !== "undefined" ? window.innerWidth : 1280) / zoom;
  const vh = (typeof window !== "undefined" ? window.innerHeight : 800) / zoom;

  const spot = rect
    ? {
        top: rect.top / zoom - PAD,
        left: rect.left / zoom - PAD,
        width: rect.width / zoom + PAD * 2,
        height: rect.height / zoom + PAD * 2,
      }
    : null;

  /* Placement has two modes.

     On a phone the bubble docks to whichever half of the screen the
     spotlight is NOT in, full-bleed minus a small margin. Chasing the
     element the way the desktop layout does costs more than it buys at
     360px wide: there is no "beside", the copy is the same length, and a
     bubble that floats mid-screen leaves the thumb reaching. Docked, the
     controls land in the same place on every step, which is what makes a
     six-step tour feel short instead of fiddly.

     On wider screens it keeps hugging the target, since there the bubble
     is genuinely small relative to the viewport. */
  const EDGE = 16;
  const GAP = 14;
  const isNarrow = vw < 640;

  const bubbleWidth = isNarrow ? Math.max(240, vw - EDGE * 2) : Math.min(320, vw - 32);
  let bubbleLeft = (vw - bubbleWidth) / 2;
  let bubbleTop: number | undefined = (vh - bubbleH) / 2;
  let bubbleBottom: number | undefined;
  let placeBelow = true;
  let arrowLeft = bubbleWidth / 2;

  if (spot) {
    const spotBottom = spot.top + spot.height;
    if (isNarrow) {
      placeBelow = spot.top + spot.height / 2 < vh / 2;
      bubbleLeft = EDGE;
      bubbleTop = placeBelow ? undefined : EDGE;
      bubbleBottom = placeBelow ? EDGE : undefined;
    } else {
      const roomBelow = vh - spotBottom;
      const roomAbove = spot.top;
      placeBelow = roomBelow >= bubbleH + GAP || roomBelow >= roomAbove;
      const idealLeft = spot.left + spot.width / 2 - bubbleWidth / 2;
      bubbleLeft = Math.max(EDGE, Math.min(idealLeft, vw - bubbleWidth - EDGE));
      // Both clamps keep the whole bubble on screen, not just its anchor edge.
      bubbleTop = placeBelow ? Math.min(spotBottom + GAP, vh - bubbleH - EDGE) : undefined;
      bubbleBottom = placeBelow ? undefined : Math.min(vh - spot.top + GAP, vh - bubbleH - EDGE);
    }
    arrowLeft = Math.max(20, Math.min(spot.left + spot.width / 2 - bubbleLeft, bubbleWidth - 20));
  }

  /* Docked to the bottom edge, the controls would otherwise sit under the
     iOS home indicator. */
  const bottomStyle =
    bubbleBottom === undefined
      ? undefined
      : isNarrow
        ? `calc(${bubbleBottom}px + env(safe-area-inset-bottom, 0px))`
        : bubbleBottom;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Guided tour"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{ position: "fixed", inset: 0, zIndex: 200, outline: "none" }}
    >
      {spot && (
        <>
          {/* Four-panel spotlight frame — robust across border-radius and
              zoom, unlike a clip-path cutout. Each panel blocks clicks; the
              hole over the real element does not, but nothing inside is
              meant to be interactive during the tour, so this stays purely
              visual. */}
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: Math.max(0, spot.top), background: "rgba(8,9,16,.72)" }} />
          <div style={{ position: "fixed", top: spot.top + spot.height, left: 0, right: 0, bottom: 0, background: "rgba(8,9,16,.72)" }} />
          <div style={{ position: "fixed", top: spot.top, left: 0, width: Math.max(0, spot.left), height: spot.height, background: "rgba(8,9,16,.72)" }} />
          <div style={{ position: "fixed", top: spot.top, left: spot.left + spot.width, right: 0, height: spot.height, background: "rgba(8,9,16,.72)" }} />

          {/* The ring itself — a soft glow, not a hard box, to read as guidance rather than an error state. */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              top: spot.top,
              left: spot.left,
              width: spot.width,
              height: spot.height,
              borderRadius: 10,
              boxShadow: "0 0 0 2px var(--color-accent), 0 0 24px 2px color-mix(in srgb, var(--color-accent) 55%, transparent)",
              pointerEvents: "none",
              transition: "top .2s var(--ease-out,ease), left .2s var(--ease-out,ease), width .2s var(--ease-out,ease), height .2s var(--ease-out,ease)",
            }}
          />
        </>
      )}

      <div
        ref={bubbleRef}
        className="tour-bubble"
        style={{
          position: "fixed",
          top: bubbleTop,
          bottom: bottomStyle,
          left: bubbleLeft,
          width: bubbleWidth,
          /* A tinted, glowing bubble rather than a plain surface panel: it
             has to read as the one live thing on a dimmed page, and the flat
             card blended into the very panels it was pointing at. */
          background:
            "linear-gradient(150deg, color-mix(in srgb, var(--color-accent-900) 92%, var(--color-surface)), var(--color-surface))",
          border: "1px solid var(--color-accent-500)",
          borderRadius: "var(--radius-lg)",
          boxShadow:
            "var(--shadow-lg), 0 0 26px -6px color-mix(in srgb, var(--color-accent) 55%, transparent)",
          padding: "16px 18px",
        }}
      >
        {/* A small triangular pointer toward the spotlighted element — the
            "arrow" pointing at each feature as the tour steps through them.
            Skipped while a target hasn't been located yet (first paint, or
            a step whose element never appears). */}
        {spot && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: arrowLeft - 7,
              [placeBelow ? "top" : "bottom"]: -7,
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              ...(placeBelow
                ? { borderBottom: "7px solid var(--color-accent-500)" }
                : { borderTop: "7px solid var(--color-accent-500)" }),
            }}
          />
        )}
        {/* Announced as one block on each step change: a screen reader gets
            "step 2 of 6, <title>, <body>" rather than three stray updates. */}
        <div aria-live="polite" aria-atomic="true">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 10 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "var(--font-display-tracking)",
                fontSize: 19,
                lineHeight: 1.1,
              }}
            >
              {step.title}
            </span>
            <span style={{ fontSize: 11, color: "var(--color-neutral-500)", flex: "none" }}>
              <span className="sr-only">step </span>
              {index + 1} / {steps.length}
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--color-neutral-300)", margin: "0 0 10px", textWrap: "pretty" }}>{step.body}</p>
        </div>
        {/* The auto-advance, made visible — a step that moves on its own with
            no warning reads as a glitch. key= restarts the bar per step. The
            bar renders ONLY while the timer is actually running: on the last
            step, when paused, or under reduced motion there is nothing to
            count down, and a bar sitting there would be claiming otherwise. */}
        <div className="deck-timer" style={{ marginBottom: 10 }} aria-hidden="true">
          {autoAdvancing && <span key={index} />}
        </div>
        {/* WCAG 2.2.2 wants anything that moves on its own to be stoppable.
            Skip is a "hide", which technically satisfies it, but leaving is a
            poor substitute for reading at your own pace. Hidden on the last
            step, where the timer no longer runs. */}
        {!isLast && !reducedMotion && (
          <button
            className="deck-ctl"
            onClick={() => setPaused((v) => !v)}
            aria-pressed={paused}
            style={{ fontSize: 11, color: "var(--color-neutral-500)", marginBottom: 6 }}
          >
            {paused ? "▶ Resume" : "❚❚ Pause"}
          </button>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Was `all: unset`, which left a ~14px tap target on a control
              people reach for precisely when they're already frustrated. */}
          <button className="btn btn-ghost tour-skip" onClick={onFinish} style={{ fontSize: 12 }}>
            Skip
          </button>
          <div style={{ flex: 1 }} />
          {index > 0 && (
            <button className="btn btn-secondary" onClick={back} style={{ fontSize: 12 }}>
              Back
            </button>
          )}
          <button className="btn btn-primary" onClick={next} style={{ fontSize: 12 }}>
            {isLast ? finishLabel : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
