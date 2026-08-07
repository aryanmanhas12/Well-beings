import { useEffect, useRef, useState } from "react";
import { Tab } from "@/hooks/useWellBeings";
import { TourStep } from "@/lib/tour";

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
}: {
  steps: TourStep[];
  currentTab: Tab;
  setTab: (t: Tab) => void;
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
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
    if (step.tab && step.tab !== currentTab) setTab(step.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

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

  useEffect(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      next();
    }, 7000);
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function next() {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (isLast) onFinish();
    else setIndex((i) => i + 1);
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

  // Place the bubble on whichever side has the most room, then clamp it
  // horizontally so it never runs off a narrow viewport.
  const bubbleWidth = Math.min(320, vw - 32);
  let bubbleLeft = (vw - bubbleWidth) / 2;
  let bubbleTop: number | undefined = vh / 2 - 60;
  let bubbleBottom: number | undefined;
  let placeBelow = true;
  let arrowLeft = bubbleWidth / 2;

  if (spot) {
    const roomBelow = vh - (spot.top + spot.height);
    const roomAbove = spot.top;
    placeBelow = roomBelow >= 150 || roomBelow >= roomAbove;
    const idealLeft = spot.left + spot.width / 2 - bubbleWidth / 2;
    bubbleLeft = Math.max(16, Math.min(idealLeft, vw - bubbleWidth - 16));
    bubbleTop = placeBelow ? Math.min(spot.top + spot.height + 16, vh - 40) : undefined;
    bubbleBottom = !placeBelow ? vh - spot.top + 16 : undefined;
    arrowLeft = Math.max(20, Math.min(spot.left + spot.width / 2 - bubbleLeft, bubbleWidth - 20));
  }

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
        style={{
          position: "fixed",
          top: bubbleTop,
          bottom: bubbleBottom,
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
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
          <span style={{ fontSize: 11, color: "var(--color-neutral-500)", flex: "none", marginLeft: 10 }}>
            {index + 1} / {steps.length}
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--color-neutral-300)", margin: "0 0 10px", textWrap: "pretty" }}>{step.body}</p>
        {/* The 7s auto-advance, made visible — a step that moves on its own
            with no warning reads as a glitch. key= restarts it per step. */}
        <div className="deck-timer" style={{ marginBottom: 12 }} aria-hidden="true">
          <span key={index} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={onFinish}
            style={{ all: "unset", cursor: "pointer", fontSize: 11.5, color: "var(--color-neutral-500)" }}
          >
            Skip tour
          </button>
          <div style={{ flex: 1 }} />
          {index > 0 && (
            <button className="btn btn-secondary" onClick={back} style={{ fontSize: 12 }}>
              Back
            </button>
          )}
          <button className="btn btn-primary" onClick={next} style={{ fontSize: 12 }}>
            {isLast ? "Done" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
