"use client";

import { useEffect, useRef, useState } from "react";
import type { CareLevel, Safety, Score } from "@/lib/care";
import { shouldAskSafety } from "@/lib/care";
import { HOPE_OPTIONS, MOOD_OPTIONS } from "@/lib/havenContent";

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

export function CheckIn({
  onSubmit,
  onSkip,
  greeting,
}: {
  onSubmit: (mood: Score, hope: Score, safety?: Safety) => CareLevel;
  onSkip?: () => void;
  greeting?: string;
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
            {greeting ?? "How are you arriving?"}
          </legend>
          {MOOD_OPTIONS.map((o) => (
            <button key={o.v} type="button" className="choice" aria-pressed={mood === o.v} onClick={() => pickMood(o.v)}>
              <span className="choice-dot" data-v={o.v} aria-hidden="true" />
              {o.label}
            </button>
          ))}
          {onSkip && (
            <button type="button" className="btn btn-quiet" onClick={onSkip} style={{ justifySelf: "start" }}>
              Not right now
            </button>
          )}
        </fieldset>
      )}

      {step === "hope" && (
        <fieldset className="choices checkin-step" key="hope">
          <legend className="checkin-q" ref={headingRef} tabIndex={-1}>
            And the days ahead. How do they look from here?
          </legend>
          {HOPE_OPTIONS.map((o) => (
            <button key={o.v} type="button" className="choice" aria-pressed={hope === o.v} onClick={() => pickHope(o.v)}>
              <span className="choice-dot" data-v={o.v} aria-hidden="true" />
              {o.label}
            </button>
          ))}
          <button type="button" className="btn btn-quiet" onClick={() => setStep("mood")} style={{ justifySelf: "start" }}>
            Back
          </button>
        </fieldset>
      )}

      {step === "safety" && (
        <fieldset className="choices checkin-step" key="safety">
          <legend className="checkin-q" ref={headingRef} tabIndex={-1}>
            When things feel like this, some people have thoughts of ending their life. Has that been on your mind?
          </legend>
          <button type="button" className="choice" onClick={() => pickSafety("no")}>
            No
          </button>
          <button type="button" className="choice" onClick={() => pickSafety("thoughts")}>
            Yes, but I&apos;m safe right now
          </button>
          <button type="button" className="choice" onClick={() => pickSafety("unsafe")}>
            Yes, and I don&apos;t feel safe
          </button>
          <p className="reassure">
            Asking doesn&apos;t put the idea there; the research on this is consistent. Your answer stays on this
            phone and is only used to decide what to show you next.
          </p>
          <button type="button" className="btn btn-quiet" onClick={() => setStep("hope")} style={{ justifySelf: "start" }}>
            Back
          </button>
        </fieldset>
      )}
    </div>
  );
}
