"use client";

import { useState } from "react";
import type { Wellbeings } from "@/hooks/useWellbeings";
import type { Haven } from "@/hooks/useHaven";
import { crisisLines } from "@/lib/helplines";
import type { HelplineRegion } from "@/lib/types";
import { DAWN_STEPS, hopeTrend, type CareLevel } from "@/lib/care";
import { GETTING_THROUGH, RESPONSES, TINY_STEPS, VIDEOS, WORDS, type Video } from "@/lib/havenContent";
import { ronakLink } from "@/lib/bridge";
import { COMPANION_NAME } from "@/lib/site";
import { HelplineList } from "../HelplineList";
import { CheckIn } from "./CheckIn";
import { DawnSky } from "./DawnSky";
import { CalmIcon, HereIcon, PlayIcon } from "./icons";
import { SCENE_BG, SceneArt } from "./SceneArt";
import { dailyPick, formatDay, GoTo, partOfDay, useNow } from "./shared";

/** How long a check-in stands before the app asks again. */
const RECHECK_MS = 3 * 3_600_000;

export function HereTab({
  wb,
  haven,
  region,
  goTo,
  openUrgent,
  openVideo,
  onReplayIntro,
}: {
  wb: Wellbeings;
  haven: Haven;
  region: HelplineRegion;
  goTo: GoTo;
  openUrgent: () => void;
  openVideo: (v: Video) => void;
  onReplayIntro: () => void;
}) {
  const now = useNow();
  const [checkingAgain, setCheckingAgain] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [stepOffset, setStepOffset] = useState(0);
  const [wordOffset, setWordOffset] = useState(0);
  const [good, setGood] = useState("");
  const [goodSaved, setGoodSaved] = useState(false);
  const [tinyDone, setTinyDone] = useState(false);

  const { latest, level, returning } = haven;
  const name = wb.profile?.name?.trim();
  const recent = latest && now ? now.getTime() - Date.parse(latest.at) < RECHECK_MS : false;
  const showCheckIn = haven.ready && (!recent || checkingAgain) && !skipped;

  /* What the sky says. Before a check-in it is an invitation; after, it is
     the reply. A person coming back after a hard stretch is greeted as
     someone who was missed, which is the caring-contacts idea in one line. */
  let title = "This is a quiet place. Take your time.";
  let sub = "Nothing here is a test. Tap how you're arriving, or just look around.";
  if (returning && !recent) {
    title = "I'm glad you came back.";
    sub = "Last time was a hard one. How is it now?";
  } else if (recent && latest) {
    const r = latest.mood === 3 && level === "steady" ? GETTING_THROUGH : RESPONSES[level];
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

  const step = dailyPick(TINY_STEPS, "step", stepOffset, now);
  const word = dailyPick(WORDS, "word", wordOffset, now);
  const keepsakes = [
    ...haven.state.hope.filter((h) => h.kind !== "sounds").map((h) => ({ text: h.text, from: "From your hope box" })),
    ...haven.state.goodThings.flatMap((g) => g.items.map((t) => ({ text: t, from: `A good thing, ${formatDay(g.date + "T12:00:00")}` }))),
  ];
  const keepsake = keepsakes.length ? dailyPick(keepsakes, "keep", 0, now) : null;
  const low = recent && (level === "low" || level === "heavy" || level === "thoughts" || level === "urgent");
  const serious = level === "thoughts" || level === "urgent";
  const trend = hopeTrend(haven.state.arrivals);

  const tonight = now ? now.getHours() >= 17 || now.getHours() < 5 : true;

  /* A video for right now. On a heavy day it is one of the talks about
     being seen and mattering; on a steadier one, something for when there
     is a bit of room. The same pick all day, so it does not flicker. */
  const liftVideos = VIDEOS.filter((v) => v.group === "lift" && v.scene);
  const roomVideos = VIDEOS.filter((v) => v.group === "room" && v.scene);
  const video = dailyPick(recent && level === "steady" && latest && latest.mood >= 4 ? roomVideos : liftVideos, "video", 0, now);
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
          <span>
            {haven.stepsToday >= DAWN_STEPS
              ? "Full sunrise today"
              : haven.stepsToday === 0
                ? "Each small thing you do lifts the sun"
                : `${haven.stepsToday} small thing${haven.stepsToday === 1 ? "" : "s"} today`}
          </span>
        </div>
        <button type="button" className="opening-pill" onClick={onReplayIntro}>
          <span className="play-dot" aria-hidden="true">
            <PlayIcon width={11} height={11} />
          </span>
          Watch the opening
        </button>
      </DawnSky>

      <div className="here-cols">
        <div className="here-main">
          {showCheckIn && (
            <div style={{ order: 1 }}>
              <CheckIn
                onSubmit={submit}
                onSkip={() => setSkipped(true)}
                greeting={returning ? "How are you arriving today?" : undefined}
              />
            </div>
          )}

          {/* Thoughts reported, now or in the last three days. The plan and a
              line to call sit at the top and stay there. */}
          {serious && (
            <section className="panel panel-pink" aria-labelledby="stay-safe" style={{ order: 2 }}>
              <h2 id="stay-safe">Let&apos;s keep you safe {tonight ? "tonight" : "today"}</h2>
              <p className="panel-lede">
                Your safety plan is the list you made for exactly this. If you haven&apos;t made one yet, it takes
                about five minutes, and you can do it right now.
              </p>
              <div className="btn-row">
                <button type="button" className="btn btn-sun" onClick={() => goTo("plan", "use")}>
                  {haven.state.plan.updatedAt ? "Open my safety plan" : "Make my safety plan"}
                </button>
                <button type="button" className="btn btn-soft" onClick={() => goTo("reach")}>
                  Text someone
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
            <section className="panel panel-lilac" aria-labelledby="heavy-title" style={{ order: 3 }}>
              <h2 id="heavy-title">Worth telling someone</h2>
              <p className="panel-lede">
                {trend === "lower"
                  ? "The days ahead have been looking darker this week than last. "
                  : "You've told me the days ahead are hard to picture more than once lately. "}
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
            <section className="panel" aria-labelledby="keep-title" style={{ order: 4 }}>
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

          {/* The video for right now. Videos are the part of this app most
              people will actually reach for, so one is always one tap from
              the top, matched to how they arrived. */}
          <article className="scene scene-wide" style={{ order: 5, background: SCENE_BG[video.scene?.kind ?? "light"] }} aria-labelledby="now-video">
            {video.scene && <SceneArt kind={video.scene.kind} className="scene-art" />}
            <div className="scene-body">
              <p className="scene-kicker">A video for right now</p>
              <h2 id="now-video" className="scene-title">
                {video.scene?.headline ?? video.title}
              </h2>
              <p className="scene-by">
                {video.title} · {video.by}
              </p>
              <div className="btn-row">
                <button type="button" className="btn btn-sun scene-play" onClick={() => openVideo(video)} aria-label={`Watch: ${video.title}`}>
                  <span className="play-dot" aria-hidden="true">
                    <PlayIcon width={12} height={12} />
                  </span>
                  Watch
                </button>
                <button type="button" className="btn btn-quiet scene-more" onClick={() => goTo("watch")}>
                  More to watch
                </button>
              </div>
            </div>
          </article>

          {haven.state.arrivals.length >= 2 && (
            <div style={{ order: 11 }}>
              <Pattern haven={haven} />
            </div>
          )}

          {recent && !checkingAgain && (
            <button type="button" className="btn btn-quiet" onClick={() => setCheckingAgain(true)} style={{ alignSelf: "start", order: 13 }}>
              Check in again
            </button>
          )}
          {skipped && !recent && (
            <button type="button" className="btn btn-quiet" onClick={() => setSkipped(false)} style={{ alignSelf: "start", order: 13 }}>
              Tell me how you&apos;re arriving
            </button>
          )}
        </div>

        <div className="here-side">
          {haven.state.hopePath && (
            <section className="panel" aria-labelledby="path-here" style={{ order: 6 }}>
              <p className="eyebrow" id="path-here">
                Your hope path this week
              </p>
              <ol className="path-list">
                {[
                  { t: haven.state.hopePath.want, c: "var(--color-sun)" },
                  { t: haven.state.hopePath.way, c: "var(--color-pink)" },
                  { t: haven.state.hopePath.can, c: "var(--color-leaf)" },
                ]
                  .filter((x) => x.t)
                  .map((x, i) => (
                    <li key={i}>
                      <span className="path-dot" style={{ background: x.c }} aria-hidden="true">
                        {i + 1}
                      </span>
                      <span>{x.t}</span>
                    </li>
                  ))}
              </ol>
              <button type="button" className="btn btn-quiet" onClick={() => goTo("hope", "path")}>
                Change it
              </button>
            </section>
          )}

          {/* One small thing. Never in place of the crisis panel, only under it. */}
          <section className="panel panel-sun" aria-labelledby="tiny-title" style={{ order: 7 }}>
            <p className="eyebrow" id="tiny-title">
              One small thing
            </p>
            <p className="quote-line">{step}</p>
            <div className="btn-row" style={{ marginTop: 12 }}>
              {tinyDone ? (
                <span className="saved-note" role="status">
                  Done. The sky just got a little lighter.
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-sun"
                  onClick={() => {
                    haven.markStep("tiny");
                    setTinyDone(true);
                  }}
                >
                  I did it
                </button>
              )}
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setStepOffset((n) => n + 1);
                  setTinyDone(false);
                }}
              >
                Something else
              </button>
            </div>
          </section>

          <section className="panel" aria-labelledby="calm-now" style={{ order: 8 }}>
            <h2 id="calm-now">If you need a minute</h2>
            <div className="tools">
              <button type="button" className="tool-row" onClick={() => goTo("watch", "breathe")}>
                <span className="tool-glyph glyph-lilac" aria-hidden="true">
                  <CalmIcon />
                </span>
                <span>
                  <strong>Breathe with the sun</strong>
                  <small>One minute. In for four, out for six.</small>
                </span>
              </button>
              <button type="button" className="tool-row" onClick={() => goTo("watch", "ground")}>
                <span className="tool-glyph glyph-sun" aria-hidden="true">
                  <HereIcon />
                </span>
                <span>
                  <strong>Come back to the room</strong>
                  <small>Five things you can see, then four you can feel.</small>
                </span>
              </button>
              <button type="button" className="tool-row" onClick={() => goTo("watch")}>
                <span className="tool-glyph glyph-pink" aria-hidden="true">
                  <PlayIcon />
                </span>
                <span>
                  <strong>Watch something kind</strong>
                  <small>Talks and stories chosen for hard days.</small>
                </span>
              </button>
            </div>
          </section>

          {!serious && (haven.goodToday.length === 0 || goodSaved) && (
            <section className="panel panel-pink" aria-labelledby="good-title" style={{ order: 9 }}>
              <h2 id="good-title">One good thing today</h2>
              {goodSaved ? (
                <p className="saved-note" role="status" style={{ fontSize: 14 }}>
                  Kept. You&apos;ll find it in Hope, and it may come back to you on a harder day.
                </p>
              ) : (
                <>
                  <p className="panel-lede">However small. The chai was hot. Someone replied. The bus came on time.</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!good.trim()) return;
                      haven.addGoodThings([good]);
                      setGood("");
                      setGoodSaved(true);
                    }}
                    className="btn-row"
                    style={{ flexWrap: "nowrap" }}
                  >
                    <label htmlFor="good-one" className="sr-only">
                      One good thing today
                    </label>
                    <input
                      id="good-one"
                      className="input"
                      value={good}
                      onChange={(e) => setGood(e.target.value)}
                      placeholder="Something that went okay…"
                      maxLength={200}
                      autoComplete="off"
                    />
                    <button type="submit" className="btn btn-sun" style={{ flex: "none" }}>
                      Keep it
                    </button>
                  </form>
                </>
              )}
            </section>
          )}

          <section className="panel panel-lilac" aria-label="Words for right now" style={{ order: 10 }}>
            <p className="eyebrow">Words for right now</p>
            <p className="quote-line">{word}</p>
            <button type="button" className="btn btn-quiet" onClick={() => setWordOffset((n) => n + 1)}>
              Another
            </button>
          </section>

          <div style={{ order: 12 }}>
            <WellbeingCheckCard wb={wb} goTo={goTo} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Pattern({ haven }: { haven: Haven }) {
  const days = haven.pattern;
  return (
    <section className="panel" aria-labelledby="pattern-title">
      <h2 id="pattern-title">The last two weeks</h2>
      <p className="panel-lede">
        The lowest point of each day you checked in, for how the days ahead looked. Only you can see this.
      </p>
      <div className="pattern" role="img" aria-label={patternLabel(days)}>
        {days.map((d) => (
          <div key={d.date} className="pattern-day" data-v={d.hope ?? undefined} data-flag={d.thoughts} title={d.date} />
        ))}
      </div>
      <div className="pattern-legend" aria-hidden="true">
        <span>2 weeks ago</span>
        <span>Today</span>
      </div>
      <p className="why" style={{ marginTop: 10 }}>
        Taller is more hopeful. A pink dot marks a day you told me about thoughts of suicide. This is what you
        reported, not a diagnosis, and it can be shared only if you choose to.
      </p>
    </section>
  );
}

function patternLabel(days: Haven["pattern"]): string {
  const logged = days.filter((d) => d.hope !== null);
  if (!logged.length) return "No check-ins in the last two weeks.";
  const low = logged.filter((d) => (d.hope ?? 5) <= 2).length;
  return `${logged.length} days with a check-in in the last two weeks. On ${low} of them the days ahead were hard to picture or worse.`;
}

/** The original wellbeing check, still here, framed for a steadier day. */
function WellbeingCheckCard({ wb, goTo }: { wb: Wellbeings; goTo: GoTo }) {
  if (wb.resumable) {
    return (
      <section className="panel" aria-labelledby="resume-title">
        <h2 id="resume-title">Your wellbeing check is half done</h2>
        <p className="panel-lede">
          {wb.resumable.answered} answers are saved on this phone. Pick it up where you left off, whenever you like.
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn-soft" onClick={wb.resumeChat}>
            Pick up where I left off
          </button>
          <button type="button" className="btn btn-quiet" onClick={wb.discardDraft}>
            Start fresh instead
          </button>
        </div>
      </section>
    );
  }
  if (wb.profile) {
    return (
      <section className="panel" aria-labelledby="daily-title">
        <h2 id="daily-title">Your daily plan</h2>
        <p className="panel-lede">Sleep, movement and the habits you chose, built from your wellbeing check.</p>
        <button type="button" className="btn btn-soft" onClick={() => goTo("plan", "daily")}>
          Open my daily plan
        </button>
      </section>
    );
  }
  return (
    <section className="panel" aria-labelledby="check-title">
      <h2 id="check-title">When you have a bit more room</h2>
      <p className="panel-lede">
        A private look at sleep, movement, food, stress and routine, with two or three changes worth trying. It
        doesn&apos;t diagnose anything.
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn-soft" onClick={() => wb.startChat("quick")}>
          Quick check, about 3 min
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => wb.startChat("detailed")}>
          Detailed, about 5 min
        </button>
      </div>
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
