"use client";

import { useEffect, useRef, useState } from "react";
import type { CareLevel, Safety, Score } from "@/lib/care";
import { shouldAskSafety } from "@/lib/care";
import { HOME_STRINGS, type HomeStrings } from "@/lib/homeWords";

/**
 * "How are you arriving?"
 *
 * Two taps, and a third only when it matters. People do not open a comfort
 * app to fill in a form, and the research on app use says most people will
 * give an app one or two visits at most (a median of 3.3% still using a
 * mental-health app after 30 days: Baumel et al. 2019, JMIR,
 * doi:10.2196/14567). So the check-in has to be over in seconds and every
 * visit has to be worth it on its own, not as a down payment on a streak.
 *
 * Mood and hope are asked separately because they come apart: someone can
 * feel "okay" today and see no way forward at all, and it is the second of
 * those that the app most needs to hear.
 */
type Step = "mood" | "hope" | "safety";

const SCORES: Score[] = [1, 2, 3, 4, 5];

export function CheckIn({
  onSubmit,
  onSkip,
  greeting,
  words: w = HOME_STRINGS.en,
}: {
  onSubmit: (mood: Score, hope: Score, safety?: Safety) => CareLevel;
  onSkip?: () => void;
  greeting?: string;
  /** English or Hinglish (lib/homeWords.ts). The three answers to the
      direct question mean the same in both. */
  words?: HomeStrings;
}) {
  const [step, setStep] = useState<Step>("mood");
  const [mood, setMood] = useState<Score | null>(null);
  const [hope, setHope] = useState<Score | null>(null);
  const headingRef = useRef<HTMLLegendElement | null>(null);

  /* Move focus to each new question so a screen-reader user hears it, and a
     keyboard user is not left on a button that no longer exists. Skipped on
     the first step so arriving on the page does not jump the scroll. */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  function pickMood(v: Score) {
    setMood(v);
    setStep("hope");
  }

  function pickHope(v: Score) {
    setHope(v);
    if (mood !== null && shouldAskSafety(mood, v)) setStep("safety");
    else if (mood !== null) onSubmit(mood, v);
  }

  function pickSafety(v: Safety) {
    if (mood !== null && hope !== null) onSubmit(mood, hope, v);
  }

  return (
    <div className="panel" aria-live="polite">
      {step === "mood" && (
        <fieldset className="choices checkin-step" key="mood">
          <legend className="checkin-q" ref={headingRef} tabIndex={-1}>
            {greeting ?? w.arriving}
          </legend>
          {SCORES.map((v) => (
            <button key={v} type="button" className="choice" aria-pressed={mood === v} onClick={() => pickMood(v)}>
              <span className="choice-dot" data-v={v} aria-hidden="true" />
              {w.mood[v]}
            </button>
          ))}
          {onSkip && (
            <button type="button" className="btn btn-quiet" onClick={onSkip} style={{ justifySelf: "start" }}>
              {w.notNow}
            </button>
          )}
        </fieldset>
      )}

      {step === "hope" && (
        <fieldset className="choices checkin-step" key="hope">
          <legend className="checkin-q" ref={headingRef} tabIndex={-1}>
            {w.days}
          </legend>
          {SCORES.map((v) => (
            <button key={v} type="button" className="choice" aria-pressed={hope === v} onClick={() => pickHope(v)}>
              <span className="choice-dot" data-v={v} aria-hidden="true" />
              {w.hope[v]}
            </button>
          ))}
          <button type="button" className="btn btn-quiet" onClick={() => setStep("mood")} style={{ justifySelf: "start" }}>
            {w.back}
          </button>
        </fieldset>
      )}

      {step === "safety" && (
        <fieldset className="choices checkin-step" key="safety">
          <legend className="checkin-q" ref={headingRef} tabIndex={-1}>
            {w.safetyQ}
          </legend>
          <button type="button" className="choice" onClick={() => pickSafety("no")}>
            {w.safetyNo}
          </button>
          <button type="button" className="choice" onClick={() => pickSafety("thoughts")}>
            {w.safetyThoughts}
          </button>
          <button type="button" className="choice" onClick={() => pickSafety("unsafe")}>
            {w.safetyUnsafe}
          </button>
          <p className="reassure">{w.safetyNote}</p>
          <button type="button" className="btn btn-quiet" onClick={() => setStep("hope")} style={{ justifySelf: "start" }}>
            {w.back}
          </button>
        </fieldset>
      )}
    </div>
  );
}
