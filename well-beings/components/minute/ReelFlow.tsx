"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Haven } from "@/hooks/useHaven";
import { say, type MinuteLang } from "@/lib/minute";
import { REEL_STRINGS, buildReel, reelKey, type ReelCard, type ReelLevel } from "@/lib/reel";
import { sfx } from "@/lib/sfx";
import { tick } from "@/lib/haptics";
import { BloomSun } from "../haven/BloomSun";
import { Breathe } from "../haven/Breathe";
import { Draggable, MOTION_OK, gsap, useGSAP } from "./gsap";
import { RiseText } from "./RiseText";
import { Send } from "./Send";
import { Stage, type StageEnergy } from "./Stage";

const motionOk = () => typeof window !== "undefined" && !!window.matchMedia?.(MOTION_OK).matches;

/**
 * The reel that ends, on its stage.
 *
 * Five cards (lib/reel.ts), one at a time, full screen. Swipe up or tap
 * Next; swipe down or tap Back. After the fifth there is an end, said in
 * words, with nothing loading behind it. The cards are decided once, when
 * it opens, so they cannot change under a thumb.
 *
 * It never moves by itself. No card advances on a timer, because a card
 * that leaves before it has been read is the feed this is here instead of.
 */
export function ReelFlow({
  haven,
  lang,
  level,
  india,
  energy,
  helpLabel,
  backLabel,
  canMinute,
  onClose,
  onMinute,
  openUrgent,
}: {
  haven: Haven;
  lang: MinuteLang;
  level: ReelLevel;
  india: boolean;
  energy: StageEnergy;
  helpLabel: string;
  backLabel: string;
  /** False on a day the minute is held back (lib/care.ts, minuteOffer). */
  canMinute: boolean;
  onClose: () => void;
  onMinute: () => void;
  openUrgent: () => void;
}) {
  const s = REEL_STRINGS[lang];
  const calm = energy === "calm";
  const [opened] = useState(() => new Date());
  const [cards] = useState<ReelCard[]>(() => buildReel(opened, level, india));
  const [i, setI] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const from = useRef<1 | -1>(1);
  const total = cards.length;
  const ended = i >= total;

  const show = useCallback(
    (next: number) => {
      from.current = next > i ? 1 : -1;
      setI(next);
      busy.current = false;
      if (next >= total) {
        haven.markReelSeen(reelKey(opened));
        sfx("complete");
        tick("success");
      }
    },
    [i, total, haven, opened],
  );

  /** One card on or one back. `thrown`: the card has already left under
      the finger that threw it. */
  const turn = useCallback(
    (dir: 1 | -1, thrown = false) => {
      const next = i + dir;
      if (busy.current || next < 0 || next > total) return;
      busy.current = true;
      const el = wrap.current;
      if (thrown) {
        sfx(dir > 0 ? "forward" : "back");
        tick("light");
        show(next);
        return;
      }
      if (!el || !motionOk()) {
        show(next);
        return;
      }
      gsap.to(el, { yPercent: dir > 0 ? -115 : 115, duration: calm ? 0.4 : 0.26, ease: "power2.in", onComplete: () => show(next) });
    },
    [i, total, show, calm],
  );

  /* Each card comes in from the side it was called from, and can be thrown
     up for the next or down for the one before. Words are never faded: the
     card moves whole. */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = wrap.current;
        if (!el) return;
        gsap.fromTo(el, { yPercent: 105 * from.current }, { yPercent: 0, duration: calm ? 0.6 : 0.42, ease: "power3.out" });
        if (ended) return;
        const far = window.innerHeight;
        const reach = Math.min(96, window.innerHeight * 0.12);
        const [drag] = Draggable.create(el, {
          type: "y",
          inertia: true,
          maxDuration: 0.4,
          minDuration: 0.16,
          /* Buttons, links and the breathing sun inside a card are for
             tapping, not for dragging the card by. */
          dragClickables: false,
          allowContextMenu: true,
          snap: { y: (end: number) => (end < -reach ? -far : end > reach && i > 0 ? far : 0) },
          onThrowComplete() {
            if (this.y <= -far + 2) turn(1, true);
            else if (this.y >= far - 2) turn(-1, true);
          },
        });
        return () => drag.kill();
      });
      return () => mm.revert();
    },
    { dependencies: [i, ended, turn, calm] },
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector(".urgent, .dialog-backdrop")) return;
      const t = e.target as HTMLElement | null;
      /* Space and the arrows belong to a focused button first. */
      if (e.key === " " && t?.closest("button, a, summary")) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        turn(1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        turn(-1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [turn]);

  useEffect(() => {
    if (i === 0) return;
    body.current?.querySelector<HTMLElement>("[data-focus]")?.focus({ preventScroll: true });
  }, [i]);

  const card = cards[i];

  return (
    <Stage
      label={s.door}
      energy={energy}
      backLabel={backLabel}
      helpLabel={helpLabel}
      progress={{ n: Math.min(i + (ended ? 0 : 1), total), total: Math.max(total, 1), label: ended ? s.endTitle : s.card(i + 1, total) }}
      onClose={onClose}
      openUrgent={openUrgent}
    >
      <div className="reel" ref={body} data-kind={ended ? "end" : card.kind}>
        <div className="reel-card" ref={wrap} key={ended ? "end" : card.id}>
          {ended ? (
            <div className="reel-end">
              <div className="done-sun" aria-hidden="true">
                <BloomSun size={132} />
              </div>
              <RiseText as="h2" className="stage-title done-title" text={s.endTitle} calm={calm} />
              <p className="stage-sub" tabIndex={-1} data-focus>
                {s.endSub}
              </p>
              <button type="button" className="stage-cta" onClick={onClose}>
                {s.endDone}
              </button>
              {canMinute && (
                <button type="button" className="stage-btn" onClick={onMinute}>
                  {s.endMinute}
                </button>
              )}
              <button
                type="button"
                className="stage-link"
                onClick={() => {
                  from.current = -1;
                  setI(0);
                }}
              >
                {s.again}
              </button>
              <details className="stage-why">
                <summary>{lang === "en" ? "Why it stops" : "Yeh rukti kyun hai"}</summary>
                <p>{s.why}</p>
              </details>
            </div>
          ) : (
            <Card card={card} lang={lang} haven={haven} calm={calm} />
          )}
        </div>

        {!ended && (
          <div className="reel-nav">
            <button type="button" className="stage-btn reel-back" onClick={() => turn(-1)} disabled={i === 0}>
              <span aria-hidden="true">↑ </span>
              {s.prevBtn}
            </button>
            <button type="button" className="stage-cta reel-next" onClick={() => turn(1)}>
              {s.nextBtn}
              <span aria-hidden="true"> ↓</span>
            </button>
          </div>
        )}
        {!ended && i === 0 && <p className="reel-hint">{s.swipe}</p>}
      </div>
    </Stage>
  );
}

function Card({ card, lang, haven, calm }: { card: ReelCard; lang: MinuteLang; haven: Haven; calm: boolean }) {
  const s = REEL_STRINGS[lang];
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (card.kind === "spark") {
    const text = say(card.text, lang);
    const kept = haven.state.hope.some((h) => h.kind === "words" && h.text === text);
    return (
      <div className="reel-face reel-spark">
        <span className="spark-sun" aria-hidden="true">
          <BloomSun size={132} />
        </span>
        <div tabIndex={-1} data-focus>
          <RiseText as="h2" className="spark-line" text={text} calm={calm} />
        </div>
        {kept || done ? (
          <p className="reel-reply" role="status">
            {s.kept}
          </p>
        ) : (
          <button
            type="button"
            className="stage-btn"
            data-answer="success"
            onClick={() => {
              haven.addHope({ kind: "words", text });
              setDone(true);
            }}
          >
            {s.keep}
          </button>
        )}
      </div>
    );
  }

  if (card.kind === "fact") {
    return (
      <div className="reel-face reel-fact">
        <p className="reel-kicker">{s.factKicker}</p>
        <p className="fact-figure">{say(card.figure, lang)}</p>
        <p className="fact-text" tabIndex={-1} data-focus>
          {say(card.text, lang)}
        </p>
        <p className="fact-cite">{card.cite}</p>
      </div>
    );
  }

  if (card.kind === "ask") {
    const answer = card.options.find((o) => o.id === picked);
    return (
      <div className="reel-face reel-ask">
        <p className="reel-kicker">{s.askKicker}</p>
        <h2 className="ask-q" tabIndex={-1} data-focus>
          {say(card.q, lang)}
        </h2>
        <div className="ask-opts" role="group" aria-label={say(card.q, lang)}>
          {card.options.map((o) => (
            <button key={o.id} type="button" className="move-opt ask-opt" data-answer="select" aria-pressed={picked === o.id} onClick={() => setPicked(o.id)}>
              {say(o.label, lang)}
            </button>
          ))}
        </div>
        <p className="reel-reply" role="status">
          {answer ? say(answer.reply, lang) : ""}
        </p>
      </div>
    );
  }

  if (card.kind === "now") {
    return (
      <div className="reel-face reel-now">
        <p className="reel-kicker">{s.nowKicker}</p>
        <h2 className="now-text" tabIndex={-1} data-focus>
          {say(card.text, lang)}
        </h2>
        {done ? (
          <p className="reel-reply" role="status">
            {s.didItReply}
          </p>
        ) : (
          <button
            type="button"
            className="stage-btn"
            data-answer="success"
            onClick={() => {
              haven.markStep("tiny");
              setDone(true);
            }}
          >
            {s.didIt}
          </button>
        )}
      </div>
    );
  }

  if (card.kind === "person") {
    return (
      <div className="reel-face reel-person">
        <p className="reel-kicker">{s.personKicker}</p>
        <h2 className="now-text" tabIndex={-1} data-focus>
          {say(card.text, lang)}
        </h2>
        <Send text={say(card.send, lang)} label={s.send} copied={s.copied} onSent={() => haven.markStep("reach")} />
      </div>
    );
  }

  return (
    <div className="reel-face reel-breath">
      <h2 className="now-text" tabIndex={-1} data-focus>
        {say(card.text, lang)}
      </h2>
      <Breathe
        rounds={3}
        onDone={() => haven.markStep("breathe")}
        words={{ in: s.breathIn, out: s.breathOut, done: s.breathDone, start: s.breathStart, stop: lang === "en" ? "Stop" : "Roko", again: lang === "en" ? "Again" : "Phir se" }}
      />
    </div>
  );
}
