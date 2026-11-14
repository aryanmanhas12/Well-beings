"use client";

import { useState, type ReactNode } from "react";
import type { Wellbeings } from "@/hooks/useWellbeings";
import type { Haven } from "@/hooks/useHaven";
import { crisisLines } from "@/lib/helplines";
import type { HelplineRegion } from "@/lib/types";
import { DAWN_STEPS, energyFor, hopeTrend, minuteOffer, type CareLevel } from "@/lib/care";
import { HOME_STRINGS, homeLang } from "@/lib/homeWords";
import { MINUTE_STRINGS, TOPICS, TOPIC_ORDER, openMove, planLine, say, saysTension, smallerMove, type MinuteLang, type MinuteRecord, type TopicId } from "@/lib/minute";
import { REEL_DOOR, reelKey, reelPart } from "@/lib/reel-clock.mjs";
import { ronakLink } from "@/lib/bridge";
import { COMPANION_NAME } from "@/lib/site";
import { HelplineList } from "../HelplineList";
import { InstallPanel } from "../InstallApp";
import { useOpenListener } from "../ListenerProvider";
import { preloadRoom } from "../lazyParts";
import { CheckIn } from "./CheckIn";
import { DawnSky } from "./DawnSky";
import { CalmIcon, PlayIcon, ReachIcon, TopicIcon, WatchIcon } from "./icons";
import { dailyPick, formatDay, GoTo, partOfDay, useNow } from "./shared";

/** How long a check-in stands before the app asks again. */
const RECHECK_MS = 3 * 3_600_000;

/**
 * The phone's time zone, read once and only when it is needed.
 *
 * Making an Intl.DateTimeFormat is slow. The first build of this page made
 * one on every render to pick the wording of one question, and a load
 * profile on a phone slowed 4x showed this component alone taking 52 ms.
 * The helpline region already says "India" for almost everyone here; the
 * zone only matters for a phone in a neighbouring country ("intl").
 */
let zoneMemo: string | null = null;
function zone(): string {
  if (zoneMemo === null) {
    try {
      zoneMemo = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      zoneMemo = "";
    }
  }
  return zoneMemo;
}

/**
 * Home.
 *
 * One question at a time, in the order a person needs them. Until November
 * 2026 this page was ten cards of equal weight, and the owner said what
 * everyone who opened it must have felt: it was hard to find the way. Now
 * it is the sky, the two-tap check-in, and then one question, "What's the
 * tension right now?", whose eight answers each open One minute
 * (lib/minute.ts). Under that, today's five (the reel that ends) and four
 * doors. Everything a person keeps moved to Me; everyone they can talk to
 * is in Talk.
 *
 * What did not move: the plan and the numbers. After a report of thoughts
 * of suicide, or of not feeling safe, the first thing under the sky is
 * still the safety plan, a person and the lines, and on those days the
 * tension tiles and the reel are not shown at all (lib/care.ts,
 * minuteOffer). The four doors stay, because a few minutes of something
 * else is itself a step in a safety plan.
 *
 * The page is livelier on an okay day and quieter on a low one
 * (energyFor), which the tiles read from data-energy on <main>.
 */
export function HereTab({
  wb,
  haven,
  region,
  goTo,
  openUrgent,
  openMinute,
  openReel,
  onReplayIntro,
  ooh,
}: {
  ooh?: ReactNode;
  wb: Wellbeings;
  haven: Haven;
  region: HelplineRegion;
  goTo: GoTo;
  openUrgent: () => void;
  openMinute: (topic: TopicId) => void;
  openReel: () => void;
  onReplayIntro: () => void;
}) {
  const now = useNow();
  const [checkingAgain, setCheckingAgain] = useState(false);
  const [skipped, setSkipped] = useState(false);
  /* What was said about the last move on this visit, kept so the reply
     stays on screen after the answer has closed the question. */
  const [answered, setAnswered] = useState<{ line: string; reply: string } | null>(null);
  const openListener = useOpenListener();

  const lang = homeLang(wb.settings.lang);
  const h = HOME_STRINGS[lang];
  const ms = MINUTE_STRINGS[lang];
  const door = REEL_DOOR[lang];

  const { latest, level, returning } = haven;
  const name = wb.profile?.name?.trim();
  const recent = latest && now ? now.getTime() - Date.parse(latest.at) < RECHECK_MS : false;
  const showCheckIn = haven.ready && (!recent || checkingAgain) && !skipped;

  /* What the sky says. Before a check-in it is an invitation; after, it is
     the reply. A person coming back after a hard stretch is greeted as
     someone who was missed, which is the caring-contacts idea in one line. */
  let title = h.quietTitle;
  let sub = h.quietSub;
  if (returning && !recent) {
    title = h.backTitle;
    sub = h.backSub;
  } else if (recent && latest) {
    const r = latest.mood === 3 && level === "steady" ? h.gettingThrough : h.replies[level];
    title = r.title;
    sub = r.body;
  }

  function submit(mood: 1 | 2 | 3 | 4 | 5, hope: 1 | 2 | 3 | 4 | 5, safety?: "no" | "thoughts" | "unsafe"): CareLevel {
    const lvl = haven.addArrival(mood, hope, safety);
    setCheckingAgain(false);
    if (lvl === "urgent") openUrgent();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return lvl;
  }

  const keepsakes = [
    ...haven.state.hope.filter((x) => x.kind !== "sounds").map((x) => ({ text: x.text, from: "From your hope box" })),
    ...haven.state.goodThings.flatMap((g) => g.items.map((t) => ({ text: t, from: `A good thing, ${formatDay(g.date + "T12:00:00")}` }))),
  ];
  const keepsake = keepsakes.length ? dailyPick(keepsakes, "keep", 0, now) : null;
  const low = recent && (level === "low" || level === "heavy" || level === "thoughts" || level === "urgent");
  const serious = level === "thoughts" || level === "urgent";
  const trend = hopeTrend(haven.state.arrivals);
  const tonight = now ? now.getHours() >= 17 || now.getHours() < 5 : true;

  const offer = minuteOffer(level);
  const follow = offer !== "held" && now ? openMove(haven.state.minutes, now) : null;
  const seen = !!now && haven.state.reelSeen === reelKey(now);
  /* "Tension" is the word across South Asia; elsewhere the same question
     is asked in the words people there use. Decided once the clock is
     known, like every daily pick, so the static page and the phone agree. */
  const where = haven.state.region;
  const ask = !now || saysTension(where, where === "intl" ? zone() : "") ? ms.ask : ms.askElsewhere;
  const [lead, glow] = splitTitle(title);

  return (
    <div className="haven-stack">
      <DawnSky dawn={haven.dawn} label={`Your sky today: ${haven.stepsToday} of ${DAWN_STEPS} steps toward sunrise`}>
        <p className="sky-kicker">
          {partOfDay(now)}
          {name ? `, ${name}` : ""}
        </p>
        <h1 className="sky-title">
          {lead}
          {glow && <span className="glow-text">{glow}</span>}
        </h1>
        <p className="sky-sub">{sub}</p>
        <div className="dawn-meter">
          <span className="dawn-dots" aria-hidden="true">
            {Array.from({ length: DAWN_STEPS }, (_, i) => (
              <i key={i} data-on={i < haven.stepsToday} />
            ))}
          </span>
          <span>{haven.stepsToday >= DAWN_STEPS ? h.dawnFull : haven.stepsToday === 0 ? h.dawnNone : h.dawnSome(haven.stepsToday)}</span>
        </div>
        <button type="button" className="opening-pill" onClick={onReplayIntro}>
          <span className="play-dot" aria-hidden="true">
            <PlayIcon width={11} height={11} />
          </span>
          {h.opening}
        </button>
      </DawnSky>

      {ooh}

      <div className="here-cols home" data-energy={energyFor(level)}>
        <div className="here-main">
        {showCheckIn && <CheckIn onSubmit={submit} onSkip={() => setSkipped(true)} greeting={returning ? h.arrivingBack : undefined} words={h} />}

        {/* Thoughts reported, now or in the last three days. The plan and a
            line to call sit at the top and stay there. */}
        {serious && (
          <section className="panel panel-pink" aria-labelledby="stay-safe">
            <h2 id="stay-safe">Let&apos;s keep you safe {tonight ? "tonight" : "today"}</h2>
            <p className="panel-lede">
              Your safety plan is the list you made for exactly this. If you haven&apos;t made one yet, it takes about
              five minutes, and you can do it right now.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn-sun" onClick={() => goTo("plan", "use")}>
                {haven.state.plan.updatedAt ? "Open my safety plan" : "Make my safety plan"}
              </button>
              <button type="button" className="btn btn-soft" onClick={() => goTo("reach")}>
                Text someone
              </button>
              <button type="button" className="btn btn-quiet" onClick={openListener}>
                Sit with me
              </button>
              {level === "urgent" && (
                <button type="button" className="btn btn-quiet" onClick={openUrgent}>
                  Call a line now
                </button>
              )}
            </div>
            <div style={{ marginTop: 14 }}>
              <HelplineList lines={crisisLines(region)} />
            </div>
          </section>
        )}

        {/* A stretch of heavy days: say it, and point at a person. */}
        {level === "heavy" && (
          <section className="panel panel-lilac" aria-labelledby="heavy-title">
            <h2 id="heavy-title">Worth telling someone</h2>
            <p className="panel-lede">
              {trend === "lower" ? "The days ahead have been looking darker this week than last. " : "You've told me the days ahead are hard to picture more than once lately. "}
              That&apos;s a lot to carry quietly. A friend, a counsellor or a doctor can help carry it.
            </p>
            <div className="btn-row">
              {haven.state.care?.nudge ? (
                <button type="button" className="btn btn-sun" onClick={() => goTo("reach", "care")}>
                  Let {haven.state.care.name} know how it&apos;s been
                </button>
              ) : (
                <button type="button" className="btn btn-sun" onClick={() => goTo("reach")}>
                  Reach out to someone
                </button>
              )}
              <a className="btn btn-soft" href={ronakLink()} target="_blank" rel="noopener noreferrer">
                Take a proper check in {COMPANION_NAME}
              </a>
            </div>
          </section>
        )}

        {/* Something they saved, on a low day. Personal beats general: in a
            pilot trial of just-in-time coping messages after a psychiatric
            stay, people preferred the personalised ones, and the effect on
            actually using a coping strategy was stronger for them (Bentley
            et al. 2025, Journal of Consulting and Clinical Psychology). */}
        {low && (haven.state.letter || keepsake) && (
          <section className="panel" aria-labelledby="keep-title">
            <h2 id="keep-title">Something you kept for today</h2>
            {haven.state.letter ? (
              <blockquote className="keepsake" style={{ whiteSpace: "pre-wrap" }}>
                <small>A note from you, written {formatDay(haven.state.letter.at)}</small>
                {haven.state.letter.text}
              </blockquote>
            ) : (
              keepsake && (
                <blockquote className="keepsake">
                  <small>{keepsake.from}</small>
                  {keepsake.text}
                </blockquote>
              )
            )}
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-soft" onClick={() => goTo("hope", "box")}>
                Open my hope box
              </button>
            </div>
          </section>
        )}

        {/* The move chosen last time, with one question. Asked for a week,
            never counted, and "Not yet" is a full answer (lib/minute.ts). */}
        {!showCheckIn && (answered ? <Answered line={answered.line} reply={answered.reply} kicker={ms.followKicker} /> : follow && <FollowUp haven={haven} lang={lang} index={follow.index} record={follow.record} onAnswer={setAnswered} />)}

        {/* One minute. After the check-in, so the answer to the direct
            question has already decided whether this is shown. */}
        {!showCheckIn && offer !== "held" && (
          <section className="tension-ask" aria-labelledby="tension-title">
            <div className="tension-head">
              <h2 id="tension-title">{ask}</h2>
              {wb.settings.lang !== "hi" && (
                <div className="lang-flip" role="group" aria-label={h.langLabel}>
                  <button type="button" aria-pressed={lang === "en"} onClick={() => wb.setLang("en")}>
                    English
                  </button>
                  <button type="button" aria-pressed={lang === "hinglish"} onClick={() => wb.setLang("hinglish")}>
                    Hinglish
                  </button>
                </div>
              )}
            </div>
            <p className="tension-sub">{ms.askSub}</p>
            <div className="tension-grid">
              {TOPIC_ORDER.map((id) => (
                <button key={id} type="button" className="tension" data-topic={id} data-answer="select" onPointerDown={() => preloadRoom("minute")} onFocus={() => preloadRoom("minute")} onClick={() => openMinute(id)}>
                  <TopicIcon id={id} width={24} height={24} />
                  <span>{say(TOPICS[id].label, lang)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Never on a day that brought up thoughts of suicide: that screen
            is for the plan and a person, not for an app-store moment. In
            the left column on a wide screen, where the tiles would
            otherwise leave half a window empty under them; last on a
            phone (order). */}
        {!serious && <InstallPanel style={{ order: 20 }} />}
        </div>

        <div className="here-side">
        {/* Today's five: the reel that ends. One for the morning, the day
            and the night; once seen, the door says so. */}
        {offer !== "held" && (
          <section className="reel-door" data-seen={seen} aria-labelledby="reel-title">
            <span className="reel-door-stack" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <div className="reel-door-words">
              <h2 id="reel-title">{door.door}</h2>
              <p>{seen && now ? `${door.doorSeen} ${door.next[reelPart(now)]}` : door.doorSub}</p>
            </div>
            <button type="button" className={seen ? "btn btn-soft" : "btn btn-sun"} onPointerDown={() => preloadRoom("reel")} onFocus={() => preloadRoom("reel")} onClick={openReel}>
              {seen ? door.again : door.doorOpen}
            </button>
          </section>
        )}

        <section className="doors" aria-labelledby="doors-title">
          <h2 id="doors-title" className="doors-title">
            {h.doors}
          </h2>
          <div className="door-grid">
            <button type="button" className="door" onClick={() => goTo("watch", "breathe")} onPointerDown={() => preloadRoom("watch")}>
              <span className="tool-glyph glyph-lilac" aria-hidden="true">
                <CalmIcon />
              </span>
              <strong>{h.breathe}</strong>
              <small>{h.breatheSub}</small>
            </button>
            <button type="button" className="door" onClick={() => goTo("watch")} onPointerDown={() => preloadRoom("watch")}>
              <span className="tool-glyph glyph-pink" aria-hidden="true">
                <WatchIcon />
              </span>
              <strong>{h.watch}</strong>
              <small>{h.watchSub}</small>
            </button>
            <button type="button" className="door" onClick={openListener}>
              <span className="tool-glyph glyph-leaf" aria-hidden="true">
                <ReachIcon />
              </span>
              <strong>{h.sit}</strong>
              <small>{h.sitSub}</small>
            </button>
            <button type="button" className="door" onClick={() => goTo("watch", "play")} onPointerDown={() => preloadRoom("watch")}>
              <span className="tool-glyph glyph-sun" aria-hidden="true">
                <PlayIcon />
              </span>
              <strong>{h.play}</strong>
              <small>{h.playSub}</small>
            </button>
          </div>
        </section>

        {recent && !checkingAgain && (
          <button type="button" className="btn btn-quiet" onClick={() => setCheckingAgain(true)} style={{ alignSelf: "start" }}>
            {h.again}
          </button>
        )}
        {skipped && !recent && (
          <button type="button" className="btn btn-quiet" onClick={() => setSkipped(false)} style={{ alignSelf: "start" }}>
            {h.tell}
          </button>
        )}
        </div>
      </div>
    </div>
  );
}

/** "Did it happen?" One question about the move chosen last time. */
function FollowUp({
  haven,
  lang,
  index,
  record,
  onAnswer,
}: {
  haven: Haven;
  lang: MinuteLang;
  index: number;
  record: MinuteRecord;
  onAnswer: (a: { line: string; reply: string } | null) => void;
}) {
  const ms = MINUTE_STRINGS[lang];
  const move = record.move;
  if (!move) return null;
  const line = planLine(move.id, move.cue, lang);
  if (!line) return null;
  const smaller = smallerMove(move.id);
  return (
    <section className="panel follow" aria-labelledby="follow-title">
      <p className="eyebrow">{ms.followKicker}</p>
      <p className="follow-plan">{line}</p>
      <h2 id="follow-title">{ms.followAsk}</h2>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-sun"
          data-answer="success"
          onClick={() => {
            haven.setMoveStatus(index, "done");
            onAnswer({ line, reply: ms.didReply });
          }}
        >
          {ms.did}
        </button>
        <button type="button" className="btn btn-soft" onClick={() => onAnswer({ line, reply: ms.notYetReply })}>
          {ms.notYet}
        </button>
        {smaller && (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              haven.swapMove(index, smaller.id);
              onAnswer({ line: planLine(smaller.id, move.cue, lang), reply: ms.smallerReply });
            }}
          >
            {ms.smaller}
          </button>
        )}
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            haven.setMoveStatus(index, "dropped");
            onAnswer(null);
          }}
        >
          {ms.drop}
        </button>
      </div>
    </section>
  );
}

function Answered({ line, reply, kicker }: { line: string; reply: string; kicker: string }) {
  return (
    <section className="panel follow" aria-label={kicker}>
      <p className="eyebrow">{kicker}</p>
      <p className="follow-plan">{line}</p>
      <p className="saved-note" role="status" style={{ fontSize: 15 }}>
        {reply}
      </p>
    </section>
  );
}

/**
 * Which part of the sky's headline is set in the sunrise gradient.
 *
 * Two sentences: the second glows ("This is a quiet place." / "Take your
 * time."). One sentence: its last two words do. Purely presentational; a
 * screen reader hears one continuous heading either way.
 */
function splitTitle(title: string): [string, string] {
  const i = title.indexOf(". ");
  if (i > 0 && i < title.length - 2) return [title.slice(0, i + 2), title.slice(i + 2)];
  const words = title.split(" ");
  if (words.length < 4) return [title, ""];
  return [words.slice(0, -2).join(" ") + " ", words.slice(-2).join(" ")];
}
