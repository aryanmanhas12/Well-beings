"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArunMark } from "./ArunMark";
import { VoiceButton } from "./VoiceButton";
import { HelplineList } from "./HelplineList";
import { useOpenListener } from "./ListenerProvider";
import { DayLine, lineFor } from "@/lib/daily-lines";
import { GoodThing, MAX_LENGTH, PANES, keepGoodThing, loadGoodThings, panesLit, removeGoodThing, thisWeek } from "@/lib/light";
import { mentionsCrisis } from "@/lib/journal";
import { crisisLines } from "@/lib/helplines";
import { ronakLink } from "@/lib/bridge";
import { COMPANION_NAME } from "@/lib/site";
import { HelplineRegion } from "@/lib/types";

/**
 * The front door: the dawn fanlight, today's line, one good thing, and a
 * quiet way to be listened to.
 *
 * This is what someone sees first now, instead of a questionnaire. The
 * check-in is still there, further down, for when they want it. The reason
 * is the brief: an app people open because it makes the day a little
 * lighter, not one that opens by asking how bad things are.
 *
 * The symbol at the top is the logo itself, with one live detail: the
 * middle ray is always lit, and each good thing kept this week lights one
 * more. It counts what was noticed, never the days that were missed.
 *
 * The day's line and the date are read after mount, never during render.
 * This page is a static export built on one day and read on another, so a
 * line chosen at build time would be yesterday's, and swapping it during
 * hydration would be a mismatch React refuses to patch.
 */
export function DailyLight({
  lang,
  region,
  compact = false,
}: {
  lang: string;
  region: HelplineRegion;
  /** The Today tab's version: a smaller window and an h2, not the page's h1. */
  compact?: boolean;
}) {
  const openListener = useOpenListener();
  const [day, setDay] = useState<DayLine | null>(null);
  const [dateLabel, setDateLabel] = useState("");
  const [things, setThings] = useState<GoodThing[]>([]);
  const [draft, setDraft] = useState("");
  const [justKept, setJustKept] = useState(false);
  const [crisis, setCrisis] = useState(false);

  useEffect(() => {
    const now = new Date();
    /* eslint-disable react-hooks/set-state-in-effect */
    setDay(lineFor(now));
    setDateLabel(
      new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" }).format(now),
    );
    setThings(loadGoodThings());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [lang]);

  const week = thisWeek(things);
  const lit = panesLit(things);

  function keep(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    /* Someone who answers "what went right today" with something frightening
       gets support, not a thank-you. The words are not saved as a good thing. */
    if (mentionsCrisis(text)) {
      setCrisis(true);
      return;
    }
    setThings(keepGoodThing(text));
    setDraft("");
    setJustKept(true);
  }

  const Heading = compact ? "h2" : "h1";
  const litLine =
    lit >= PANES
      ? "Every ray is lit this week."
      : `${lit + 1} of ${PANES + 1} rays lit this week. Each good thing you keep lights one more.`;

  return (
    <section className={`light-door${compact ? " light-door-compact" : ""}`} aria-labelledby="light-h">
      <div className="light-window">
        <ArunMark width={compact ? 150 : 240} fluid lit={lit} />
        <div className="light-frame">
          <p className="light-date">{dateLabel || " "}</p>
          <Heading id="light-h" className="light-hello">
            Good to see you.
          </Heading>
          <p className="light-line" aria-live="polite">
            {day?.line ?? " "}
          </p>

          <form className="light-form" onSubmit={keep}>
            <label htmlFor="good-thing" className="light-prompt">
              {day?.prompt ?? "What is one small thing that went right today?"}
            </label>
            <div className="light-input-row">
              <textarea
                id="good-thing"
                className="input light-input"
                rows={2}
                maxLength={MAX_LENGTH}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setJustKept(false);
                }}
                placeholder="Say it or type it. One line is plenty."
              />
              <VoiceButton appLang={lang} onText={(t) => setDraft((d) => (d.trim() ? `${d.trim()} ${t}` : t))} />
            </div>
            <button type="submit" className="btn btn-sun light-keep" disabled={!draft.trim()}>
              Keep it
            </button>
          </form>

          <p className="light-status" role="status">
            {justKept ? `Kept. ${litLine}` : week.length ? litLine : ""}
          </p>

          {crisis && (
            <div className="light-crisis card" role="alert">
              <p style={{ margin: 0, fontWeight: 600 }}>That sounds really heavy. You do not have to carry it alone.</p>
              <p style={{ margin: "6px 0 10px", color: "var(--color-neutral-400)" }}>
                These lines are free, private and answer at any hour. Talking to one of them, or to someone near you, is
                the right next step.
              </p>
              <HelplineList lines={crisisLines(region)} />
              <div className="light-crisis-actions">
                <button type="button" className="btn btn-primary" onClick={openListener}>
                  Sit with me for a minute
                </button>
                <a className="btn btn-secondary" href={ronakLink({ crisis: true })} target="_blank" rel="noopener noreferrer">
                  More support in {COMPANION_NAME}
                </a>
              </div>
            </div>
          )}

          {week.length > 0 && (
            <details className="light-week">
              <summary>This week&apos;s good things ({week.length})</summary>
              <ul>
                {week
                  .slice()
                  .reverse()
                  .map((g) => (
                    <li key={g.id}>
                      <span>{g.text}</span>
                      <button
                        type="button"
                        className="btn btn-ghost light-remove"
                        aria-label={`Remove: ${g.text}`}
                        onClick={() => setThings(removeGoodThing(g.id))}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </li>
                  ))}
              </ul>
            </details>
          )}

          <button type="button" className="btn light-sit" onClick={openListener}>
            Just sit with me for a minute
          </button>
          <p className="light-private">Private. It stays on this phone.</p>
        </div>
      </div>
    </section>
  );
}
