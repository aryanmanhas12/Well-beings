"use client";

import { useState } from "react";
import type { Wellbeings } from "@/hooks/useWellbeings";
import type { Haven } from "@/hooks/useHaven";
import { planIsWritten } from "@/lib/haven";
import { WORDS } from "@/lib/havenContent";
import { lineFor } from "@/lib/daily-lines";
import { MINUTE_STRINGS, minuteLang, noticing, say } from "@/lib/minute";
import { HopeIcon, PlanIcon, ReachIcon, WatchIcon, HereIcon, CalmIcon } from "./icons";
import { dailyPick, formatDay, GoTo, useNow } from "./shared";

/**
 * Me: everything a person keeps here, and what it shows.
 *
 * One of the three tabs since November 2026. Before that the same things
 * were spread across Here, Hope and Plan, and the safety plan shared a tab
 * with a daily habit plan. Now there is one place for "mine": first what
 * is for a hard moment (the safety plan, the hope box, the note), then
 * what grows on steadier days, then what the check-ins and the minutes
 * show. Each row opens the room it always opened.
 *
 * Never split off (components/lazyParts.tsx): this is the way to the
 * safety plan, and it must open without a network.
 *
 * Nothing on this page is a score. "What your minutes show" is made of
 * the person's own taps, says so, and stays quiet until there are three
 * minutes to read (lib/minute.ts, noticing).
 */
export function MeTab({ wb, haven, goTo }: { wb: Wellbeings; haven: Haven; goTo: GoTo }) {
  const now = useNow();
  const [wordOffset, setWordOffset] = useState(0);
  const lang = minuteLang(wb.settings.lang);
  const ms = MINUTE_STRINGS[lang];
  const { state } = haven;
  const written = planIsWritten(state.plan);
  const box = state.hope.length + haven.photos.length;
  const good = state.goodThings.reduce((n, g) => n + g.items.length, 0);
  const notice = now ? noticing(state.minutes, now) : null;
  const today = now ? lineFor(now) : null;
  const word = wordOffset === 0 && today ? today.line : dailyPick(WORDS, "word", wordOffset, now);

  return (
    <div className="haven-stack me">
      <h1 className="room-title">Me</h1>
      <p className="panel-lede room-lede">What you keep here, and what it shows. All of it stays on this phone.</p>

      <section className="panel" aria-labelledby="me-hard">
        <h2 id="me-hard">For a hard moment</h2>
        <div className="tools">
          <Row
            onClick={() => goTo("plan", written ? "use" : "edit")}
            glyph="glyph-sun"
            icon={<PlanIcon />}
            title="My safety plan"
            sub={written ? `Your steps, in order, with every number a button.${state.plan.updatedAt ? ` Updated ${formatDay(state.plan.updatedAt)}.` : ""}` : "About five minutes. Best made on a calmer day."}
          />
          <Row
            onClick={() => goTo("hope", "box")}
            glyph="glyph-pink"
            icon={<HopeIcon />}
            title="My hope box"
            sub={box ? `${box} thing${box === 1 ? "" : "s"} kept: people, plans, photos, words.` : "People, plans, photos and words to reach for."}
          />
          <Row
            onClick={() => goTo("hope", "note")}
            glyph="glyph-lilac"
            icon={<ReachIcon />}
            title="A note to me"
            sub={state.letter ? `Written ${formatDay(state.letter.at)}, for a heavier day.` : "Written on a steadier day, for a heavier one."}
          />
        </div>
      </section>

      <section className="panel" aria-labelledby="me-grow">
        <h2 id="me-grow">On steadier days</h2>
        <div className="tools">
          <Row
            onClick={() => goTo("hope", "path")}
            glyph="glyph-leaf"
            icon={<HereIcon />}
            title="My hope path"
            sub={state.hopePath?.want ? state.hopePath.want : "One thing you want, one way to it, one reason you can."}
          />
          <Row onClick={() => goTo("hope", "good")} glyph="glyph-pink" icon={<CalmIcon />} title="Good things" sub={good ? `${good} kept so far. Add today's.` : "One a day, however small. They come back on harder days."} />
          {wb.profile ? (
            <Row onClick={() => goTo("plan", "daily")} glyph="glyph-sun" icon={<WatchIcon />} title="My daily plan" sub="Sleep, movement and the habits you chose." />
          ) : wb.resumable ? (
            <Row onClick={wb.resumeChat} glyph="glyph-sun" icon={<WatchIcon />} title="My wellbeing check" sub={`Half done. ${wb.resumable.answered} answers are saved on this phone.`} />
          ) : (
            <Row onClick={() => wb.startChat("quick")} glyph="glyph-sun" icon={<WatchIcon />} title="A wellbeing check" sub="About 3 minutes on sleep, food, movement and stress. It doesn't diagnose anything." />
          )}
        </div>
        {!wb.profile && !wb.resumable && (
          <button type="button" className="btn btn-quiet" onClick={() => wb.startChat("detailed")} style={{ marginTop: 8 }}>
            Or the detailed check, about 5 min
          </button>
        )}
        {wb.resumable && (
          <button type="button" className="btn btn-quiet" onClick={wb.discardDraft} style={{ marginTop: 8 }}>
            Start the check fresh instead
          </button>
        )}
      </section>

      <section className="panel panel-sun" aria-labelledby="notice-title">
        <h2 id="notice-title">{ms.noticeTitle}</h2>
        {notice ? (
          <ul className="notice-list">
            {notice.lines.map((l, i) => (
              <li key={i}>{say(l, lang)}</li>
            ))}
          </ul>
        ) : (
          <p className="panel-lede">{ms.noticeEmpty}</p>
        )}
        <p className="why" style={{ marginTop: 10 }}>
          {ms.noticeOnly}
        </p>
        <button type="button" className="btn btn-soft" onClick={() => goTo("here")} style={{ marginTop: 10 }}>
          {ms.start}
        </button>
      </section>

      {state.arrivals.length >= 2 && <Pattern haven={haven} />}

      <section className="panel panel-lilac" aria-label="Words for right now">
        <p className="eyebrow">{wordOffset === 0 && today ? "Today's line" : "Words for right now"}</p>
        <p className="quote-line">{word}</p>
        <button type="button" className="btn btn-quiet" onClick={() => setWordOffset((n) => n + 1)}>
          Another
        </button>
      </section>
    </div>
  );
}

function Row({ onClick, glyph, icon, title, sub }: { onClick: () => void; glyph: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <button type="button" className="tool-row" onClick={onClick}>
      <span className={`tool-glyph ${glyph}`} aria-hidden="true">
        {icon}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{sub}</small>
      </span>
    </button>
  );
}

function Pattern({ haven }: { haven: Haven }) {
  const days = haven.pattern;
  return (
    <section className="panel" aria-labelledby="pattern-title">
      <h2 id="pattern-title">The last two weeks</h2>
      <p className="panel-lede">The lowest point of each day you checked in, for how the days ahead looked. Only you can see this.</p>
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
        Taller is more hopeful. A pink dot marks a day you told me about thoughts of suicide. This is what you reported, not a diagnosis, and it can be shared only if you choose to.
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
