"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Haven } from "@/hooks/useHaven";
import { CUES, HAND, MINUTE_STRINGS, MOVES, TOPICS, TOPIC_ORDER, dealCards, movesFor, say, smallerMove, type CueId, type MinuteLang, type TensionCard, type TopicId } from "@/lib/minute";
import { sfx } from "@/lib/sfx";
import { tick } from "@/lib/haptics";
import { BloomSun } from "../haven/BloomSun";
import type { GoTo } from "../haven/shared";
import { Draggable, MOTION_OK, gsap, useGSAP } from "./gsap";
import { RiseText } from "./RiseText";
import { Send } from "./Send";
import { Stage, type StageEnergy } from "./Stage";

type Step = "topic" | "sort" | "move" | "when" | "done";

/** Cards, then the move, then its when: the five marks in the top bar. */
const MARKS = HAND + 2;

const motionOk = () => typeof window !== "undefined" && !!window.matchMedia?.(MOTION_OK).matches;

/**
 * One minute, on its stage.
 *
 * The rules and every word are in lib/minute.ts; this is only the screen.
 * A card goes up to the sky ("not in my hands") or down to the sun ("in my
 * hands") three ways, and all three do the same thing: drag or throw it
 * (GSAP Draggable), tap the sky or the sun, or press the up or down arrow.
 * There are no right answers and nothing here reacts as if there were.
 *
 * Nothing is kept until the end. A minute left half way leaves no trace,
 * so nobody is ever shown a thing they started and did not finish.
 */
export function MinuteFlow({
  haven,
  lang,
  topic: startTopic,
  gentle,
  energy,
  helpLabel,
  onClose,
  openUrgent,
  goTo,
}: {
  haven: Haven;
  lang: MinuteLang;
  topic: TopicId | null;
  /** A heavy stretch (lib/care.ts, minuteOffer): a way to tell one person
      is always among the moves. */
  gentle: boolean;
  energy: StageEnergy;
  helpLabel: string;
  onClose: () => void;
  openUrgent: () => void;
  goTo: GoTo;
}) {
  const s = MINUTE_STRINGS[lang];
  const calm = energy === "calm";

  /* The cards of the last minute on this topic are left out of this one. */
  const deal = useCallback(
    (t: TopicId): TensionCard[] => {
      const last = [...haven.state.minutes].reverse().find((r) => r.topic === t);
      return dealCards(t, (Date.now() ^ (haven.state.minutes.length * 2654435761)) >>> 0, last ? [...last.mine, ...last.notMine] : []);
    },
    [haven.state.minutes],
  );

  const [topic, setTopic] = useState<TopicId | null>(startTopic);
  const [hand, setHand] = useState<TensionCard[]>(() => (startTopic ? deal(startTopic) : []));
  const [step, setStep] = useState<Step>(startTopic ? "sort" : "topic");
  const [i, setI] = useState(0);
  const [mine, setMine] = useState<string[]>([]);
  const [notMine, setNotMine] = useState<string[]>([]);
  const [moveId, setMoveId] = useState<string | null>(null);
  const [cue, setCue] = useState<CueId | null>(null);
  const [note, setNote] = useState("");
  /* Where this minute sits in what is kept, for "Make it smaller". */
  const [kept, setKept] = useState<number | null>(null);

  const wrap = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const begin = (t: TopicId) => {
    setTopic(t);
    setHand(deal(t));
    setI(0);
    setMine([]);
    setNotMine([]);
    setMoveId(null);
    setCue(null);
    setNote("");
    setKept(null);
    setStep("sort");
  };

  const card = step === "sort" ? hand[i] : undefined;

  const commit = useCallback(
    (pile: "mine" | "not") => {
      const c = hand[i];
      if (!c) return;
      if (pile === "mine") setMine((m) => [...m, c.id]);
      else setNotMine((m) => [...m, c.id]);
      if (i + 1 >= hand.length) setStep("move");
      else setI(i + 1);
      busy.current = false;
    },
    [hand, i],
  );

  /** Up to the sky or down to the sun. `thrown` means the card is already
      there, carried by the finger that threw it. */
  const decide = useCallback(
    (pile: "mine" | "not", thrown = false) => {
      if (busy.current || step !== "sort") return;
      busy.current = true;
      const el = wrap.current;
      if (thrown) {
        /* A throw has no click, so the sound and the tick a tap would get
           from Feedback are given here. */
        sfx("select");
        tick("select");
        commit(pile);
        return;
      }
      if (!el || !motionOk()) {
        commit(pile);
        return;
      }
      const far = window.innerHeight * 0.55;
      gsap.to(el, { y: pile === "mine" ? far : -far, rotation: pile === "mine" ? 5 : -5, scale: 0.7, duration: calm ? 0.42 : 0.28, ease: "power2.in", onComplete: () => commit(pile) });
    },
    [step, commit, calm],
  );

  /* The card under a finger. Thrown past a third of the way, it carries on
     to the sky or the sun; let go short of that, it springs back. */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = wrap.current;
        if (!el || step !== "sort") return;
        const far = window.innerHeight * 0.55;
        const reach = Math.min(110, window.innerHeight * 0.14);
        gsap.fromTo(el.firstElementChild, { scale: 0.86, y: 16 }, { scale: 1, y: 0, duration: calm ? 0.55 : 0.4, ease: calm ? "power2.out" : "back.out(1.7)" });
        const [drag] = Draggable.create(el, {
          type: "y",
          inertia: true,
          maxDuration: 0.45,
          minDuration: 0.18,
          onDrag() {
            gsap.set(el, { rotation: gsap.utils.clamp(-7, 7, this.y / 26) });
            el.dataset.toward = this.y < -reach ? "sky" : this.y > reach ? "sun" : "";
          },
          snap: { y: (end: number) => (end < -reach ? -far : end > reach ? far : 0) },
          onThrowComplete() {
            if (Math.abs(this.y) >= far - 2) decide(this.y < 0 ? "not" : "mine", true);
            else {
              el.dataset.toward = "";
              gsap.to(el, { rotation: 0, duration: 0.3, ease: "power2.out" });
            }
          },
        });
        return () => drag.kill();
      });
      return () => mm.revert();
    },
    { dependencies: [step, i, topic, decide, calm] },
  );

  /* Arrow keys: up to the sky, down to the sun. */
  useEffect(() => {
    if (step !== "sort") return;
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector(".urgent, .dialog-backdrop")) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        decide("not");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        decide("mine");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [step, decide]);

  /* A new step starts at its heading, for a keyboard and a screen reader. */
  useEffect(() => {
    if (step === "sort" && i === 0) return;
    body.current?.querySelector<HTMLElement>("[data-focus]")?.focus({ preventScroll: true });
  }, [step, i]);

  const finish = (id: string | null, when: CueId | null) => {
    if (!topic) return;
    setKept(haven.state.minutes.length);
    haven.addMinute({ topic, mine, notMine, move: id && when ? { id, cue: when, status: "open" } : null });
    setMoveId(id);
    setCue(when);
    setStep("done");
    sfx("complete");
    tick("success");
  };

  const options = step === "move" || step === "when" ? movesFor(mine, gentle) : [];
  const move = moveId ? MOVES[moveId] : null;
  const smaller = moveId ? smallerMove(moveId) : null;
  const when = cue ? CUES.find((c) => c.id === cue) : null;
  const n = step === "sort" ? i : step === "move" ? HAND : step === "when" ? HAND + 1 : step === "done" ? MARKS : 0;

  const go = (where: NonNullable<(typeof MOVES)[string]["go"]>) => {
    onClose();
    if (where === "breathe") goTo("watch", "breathe");
    else if (where === "lines") goTo("reach", "lines");
    else goTo("hope", "box");
  };

  return (
    <Stage
      label={s.title}
      energy={energy}
      backLabel={s.back}
      helpLabel={helpLabel}
      progress={step === "topic" ? undefined : { n, total: MARKS, label: s.step(Math.min(n + 1, MARKS), MARKS) }}
      onClose={onClose}
      openUrgent={openUrgent}
    >
      <div className="minute" data-step={step} ref={body}>
        {step === "topic" && (
          <div className="minute-pick">
            <h2 className="stage-title" tabIndex={-1} data-focus>
              {s.ask}
            </h2>
            <p className="stage-sub">{s.askSub}</p>
            <div className="tension-grid">
              {TOPIC_ORDER.map((id) => (
                <button key={id} type="button" className="tension" data-topic={id} data-answer="select" onClick={() => begin(id)}>
                  {say(TOPICS[id].label, lang)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "sort" && card && topic && (
          <div className="sort">
            <p className="sort-ask" id="sort-ask">
              {s.sortTitle}
            </p>
            <button type="button" className="sort-zone sort-sky" data-answer="select" onClick={() => decide("not")} aria-describedby="sort-card">
              <span className="sort-stars" aria-hidden="true">
                {notMine.map((id) => (
                  <Star key={id} />
                ))}
              </span>
              <strong>
                <span aria-hidden="true">↑ </span>
                {s.up}
              </strong>
              <small>{s.upSub}</small>
            </button>

            {/* The live region is the table, which stays; the card on it is
                replaced each time, and a replaced node announces nothing. */}
            <div className="sort-table" aria-live="polite">
              <div className="sort-pile">
                {/* The cards still to come, fanned under the one in hand. */}
                <span className="sort-deck" data-left={hand.length - i - 1} aria-hidden="true">
                  <i />
                  <i />
                </span>
                <div className="sort-card-wrap" ref={wrap} key={card.id}>
                  <div className="sort-card">
                    <span className="sort-kicker">
                      <span>{say(TOPICS[topic].label, lang)}</span>
                      <span>{s.of(i + 1, hand.length)}</span>
                    </span>
                    <p id="sort-card">{say(card.text, lang)}</p>
                  </div>
                </div>
              </div>
            </div>

            <button type="button" className="sort-zone sort-sun" data-answer="select" onClick={() => decide("mine")} aria-describedby="sort-card">
              <span className="sort-rise" aria-hidden="true" style={{ ["--up" as string]: mine.length }}>
                <BloomSun size={84} />
              </span>
              <strong>
                <span aria-hidden="true">↓ </span>
                {s.down}
              </strong>
              <small>{s.downSub}</small>
            </button>

            <p className="sort-hint">
              {s.noRight} <span className="sort-how">{s.hint}</span>
            </p>
            {/* One block to tap, not a small link inside a sentence: this is
                the line for someone who is not safe at home, and it has to
                be easy to hit. */}
            {TOPICS[topic].unsafe && (
              <button
                type="button"
                className="sort-unsafe"
                onClick={() => {
                  onClose();
                  goTo("reach");
                }}
              >
                {say(TOPICS[topic].unsafe!, lang)} <u>{s.unsafeGo}</u>
              </button>
            )}
          </div>
        )}

        {step === "move" && (
          <div className="minute-move">
            <h2 className="stage-title" tabIndex={-1} data-focus>
              {mine.length ? s.moveTitle : s.noneTitle}
            </h2>
            <p className="stage-sub">{mine.length ? s.moveSub : s.noneSub}</p>
            <div className="move-list">
              {options.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="move-opt"
                  data-answer="select"
                  onClick={() => {
                    setMoveId(m.id);
                    setStep("when");
                  }}
                >
                  {say(m.text, lang)}
                </button>
              ))}
            </div>
            <button type="button" className="stage-link" onClick={() => finish(null, null)}>
              {s.skip}
            </button>
          </div>
        )}

        {step === "when" && move && (
          <div className="minute-move">
            <p className="move-picked">{say(move.text, lang)}</p>
            <h2 className="stage-title" tabIndex={-1} data-focus>
              {s.whenTitle}
            </h2>
            <div className="cue-list">
              {CUES.map((c) => (
                <button key={c.id} type="button" className="move-opt cue-opt" data-answer="select" onClick={() => finish(move.id, c.id)}>
                  {say(c.label, lang)}
                </button>
              ))}
            </div>
            <button type="button" className="stage-link" onClick={() => setStep("move")}>
              <span aria-hidden="true">← </span>
              {s.another}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="minute-done">
            <div className="done-sun" aria-hidden="true">
              <BloomSun size={148} />
            </div>
            <RiseText as="h2" className="stage-title done-title" text={s.doneTitle} calm={calm} />
            <p className="stage-sub" tabIndex={-1} data-focus>
              {s.doneSub(notMine.length, !!move)}
            </p>

            {move && when && (
              <div className="plan-card">
                <p className="plan-kicker">{s.myMove}</p>
                <p className="plan-when">{say(when.label, lang)}:</p>
                <p className="plan-what">{say(move.text, lang)}</p>
                {move.send && <Send text={say(move.send, lang)} label={s.send} copied={s.copied} onSent={() => haven.markStep("reach")} />}
                <div className="plan-row">
                  {move.go && (
                    <button type="button" className="stage-btn" onClick={() => go(move.go!)}>
                      {s.doNow}
                    </button>
                  )}
                  {smaller && (
                    <button
                      type="button"
                      className="stage-btn"
                      onClick={() => {
                        setMoveId(smaller.id);
                        if (kept !== null) haven.swapMove(kept, smaller.id);
                        setNote(s.smallerReply);
                      }}
                    >
                      {s.smaller}
                    </button>
                  )}
                </div>
                <p className="plan-note" role="status">
                  {note}
                </p>
              </div>
            )}

            {move && <p className="done-wait">{s.waiting}</p>}

            <button type="button" className="stage-cta" onClick={onClose}>
              {s.doneBtn}
            </button>
            <button type="button" className="stage-link" onClick={() => setStep("topic")}>
              {s.again}
            </button>
            <details className="stage-why">
              <summary>{s.whyLabel}</summary>
              <p>{s.why}</p>
            </details>
          </div>
        )}
      </div>
    </Stage>
  );
}

/** One thing set down in the sky. Comic ink, like Ooh. */
function Star() {
  return (
    <svg className="sort-star" width="26" height="26" viewBox="0 0 24 24" focusable="false">
      <path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2Z" fill="#FFE3A1" stroke="#2A1636" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
