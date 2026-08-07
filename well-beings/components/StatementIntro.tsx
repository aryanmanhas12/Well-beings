import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { STATEMENTS } from "@/lib/statements";
import { Lang, t } from "@/lib/i18n";

/**
 * `prefers-reduced-motion`, read as an external store rather than into state.
 *
 * The server has no matchMedia, so computing this during render would make
 * the first client render disagree with the server markup for exactly the
 * people who set the preference. useSyncExternalStore is built for this: it
 * takes a separate server snapshot (false), then subscribes for real.
 */
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const mq = window.matchMedia?.(MOTION_QUERY);
  if (!mq) return () => {};
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia?.(MOTION_QUERY).matches ?? false,
    () => false
  );
}

/** Enough hue separation that two consecutive cards never read as one card
    whose text changed. Values are hues, not colours — the card mixes its own
    gradient from them so light/dark themes need no second palette. */
const HUES = [258, 292, 218, 340, 172, 268, 200, 318, 240];

const DWELL_MS = 7000;

/**
 * The landing page's first screen: a claim, two buttons, and — only once
 * you've committed to an answer — what the research actually found.
 *
 * Why a quiz rather than a hero paragraph: the app's whole argument is that
 * popular wellbeing advice is often wrong and the evidence is checkable.
 * Being wrong about "21 days to build a habit" in the first ten seconds
 * makes that argument far better than a sentence claiming it does.
 *
 * Timing rules, in order of precedence:
 *   - Answered → the timer stops. Nothing moves text out from under someone
 *     who is mid-sentence; advancing becomes an explicit tap.
 *   - Paused, or prefers-reduced-motion → never auto-advances. WCAG 2.2.2
 *     wants a pause control for anything that moves on its own; reduced
 *     motion is the standing version of pressing it.
 *   - Otherwise → 7s per card, with the bar showing it coming.
 */
export function StatementIntro({
  lang,
  showCitations,
  onStartChat,
}: {
  lang: Lang;
  /** The Help-tab preference: when off, the reference folds away until asked for. */
  showCitations: boolean;
  onStartChat: () => void;
}) {
  const s = t(lang);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [paused, setPaused] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statement = STATEMENTS[index];
  const hue = HUES[index % HUES.length];
  const answered = picked !== null;
  const correct = picked === statement.researchAgrees;

  const go = useCallback((delta: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPicked(null);
    setSourceOpen(false);
    setIndex((i) => (i + delta + STATEMENTS.length) % STATEMENTS.length);
  }, []);

  const reducedMotion = useReducedMotion();
  const running = !answered && !paused && !reducedMotion;

  useEffect(() => {
    if (!running) return;
    timerRef.current = setTimeout(() => go(1), DWELL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, index, go]);

  function pick(value: boolean) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPicked(value);
    // Opening the source with the reveal is the point when citations are on;
    // when they're off it stays a link, and this is what "off" means.
    setSourceOpen(showCitations);
  }

  return (
    <section
      aria-label={s.heroPrompt}
      style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 620 }}
    >
      <div className="tag tag-accent" style={{ alignSelf: "flex-start" }}>
        {s.heroKicker}
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          letterSpacing: "var(--font-display-tracking)",
          fontSize: "clamp(24px,3.4vw,34px)",
          lineHeight: 1.08,
          margin: 0,
        }}
      >
        {s.heroPrompt}
      </h1>

      {/* key= restarts the enter animation and the timer bar on every card. */}
      <div
        key={statement.id}
        className="statement-card statement-enter"
        style={{ ["--stmt-hue" as string]: String(hue) }}
      >
        <span className="statement-quote statement-quote-open" aria-hidden="true">
          &ldquo;
        </span>
        <p className="statement-text">{statement.text[lang]}</p>
        <span className="statement-quote statement-quote-close" aria-hidden="true">
          &rdquo;
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          className="stmt-btn stmt-btn-no"
          style={{ ["--stmt-hue" as string]: String(hue) }}
          data-picked={picked === false}
          aria-pressed={picked === false}
          onClick={() => pick(false)}
        >
          {s.disagree}
        </button>
        <button
          className="stmt-btn stmt-btn-yes"
          style={{ ["--stmt-hue" as string]: String(hue) }}
          data-picked={picked === true}
          aria-pressed={picked === true}
          onClick={() => pick(true)}
        >
          {s.agree}
        </button>
      </div>

      {/* aria-live so the verdict is announced when it appears, not silently
          painted for sighted users only. */}
      <div aria-live="polite">
        {answered && (
          <div
            className="card anim-in"
            style={{
              padding: "14px 16px",
              gap: 8,
              border: "1px solid var(--color-accent-700)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "var(--font-display-tracking)",
                fontSize: 18,
                color: correct ? "var(--color-accent-300)" : "var(--color-neutral-200)",
              }}
            >
              {correct
                ? lang === "hi"
                  ? "सही — शोध भी यही कहता है।"
                  : "Right — the research agrees."
                : lang === "hi"
                  ? "यहाँ ज़्यादातर लोग चूक जाते हैं।"
                  : "This is the one most people get wrong."}
            </div>
            <p style={{ fontSize: 13, color: "var(--color-neutral-300)", margin: 0, textWrap: "pretty" }}>
              {statement.reveal[lang]}
            </p>

            {/* The reference, folded by default unless the citations setting
                says otherwise — the whole point of that preference. */}
            {sourceOpen ? (
              <a
                href={statement.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11.5, color: "var(--color-neutral-500)" }}
              >
                {statement.cite} ↗
              </a>
            ) : (
              <button
                onClick={() => setSourceOpen(true)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  fontSize: 11.5,
                  color: "var(--color-accent-400)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                {s.showSource}
              </button>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => go(1)}
              style={{ fontSize: 12.5, alignSelf: "flex-start", marginTop: 2 }}
            >
              {s.statementNext} →
            </button>
          </div>
        )}
      </div>

      {/* Deck controls: position, a visible timer, and a real pause. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: 11,
            color: "var(--color-neutral-600)",
            fontVariantNumeric: "tabular-nums",
            flex: "none",
          }}
        >
          {index + 1} / {STATEMENTS.length}
        </span>
        <div className="deck-timer" style={{ flex: 1 }} aria-hidden="true">
          {running && <span key={index} />}
        </div>
        <button
          onClick={() => setPaused((v) => !v)}
          aria-pressed={paused}
          style={{ all: "unset", cursor: "pointer", fontSize: 11.5, color: "var(--color-neutral-500)", flex: "none" }}
        >
          {paused || reducedMotion ? `▶ ${s.playDeck}` : `❚❚ ${s.pauseDeck}`}
        </button>
        <button
          onClick={() => go(-1)}
          aria-label={s.statementPrev}
          style={{ all: "unset", cursor: "pointer", fontSize: 13, color: "var(--color-neutral-500)", flex: "none" }}
        >
          ←
        </button>
        <button
          onClick={() => go(1)}
          aria-label={s.statementNext}
          style={{ all: "unset", cursor: "pointer", fontSize: 13, color: "var(--color-neutral-500)", flex: "none" }}
        >
          →
        </button>
      </div>

      <button
        className="btn btn-primary"
        onClick={onStartChat}
        style={{ fontSize: 14, padding: "11px 22px", alignSelf: "flex-start" }}
      >
        {s.startCheckin}
      </button>
    </section>
  );
}
