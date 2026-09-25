"use client";

import { useState } from "react";
import { crisisLines, helplineHref } from "@/lib/helplines";
import type { HelplineRegion } from "@/lib/types";
import type { PlanContact } from "@/lib/haven";
import { RESPONSES } from "@/lib/havenContent";
import { useDialogBehaviour } from "../dialogs";
import { BloomSun } from "./BloomSun";
import { Breathe } from "./Breathe";
import { PhoneIcon } from "./icons";

/**
 * Shown the moment someone says "Yes, and I don't feel safe".
 *
 * Everything else leaves the screen. What is left is, in order: a sentence
 * that says they are not alone, the lines to call (the number itself is the
 * button), the people they put in their own safety plan, and a way to
 * breathe while they decide. A crisis screen with eight options is a screen
 * nobody acts on, so this one has three kinds of thing and nothing more.
 *
 * It is never a trap. "I'm safe for now" closes it, Escape closes it, and
 * nothing is recorded about how long it was open or what was pressed.
 */
export function UrgentCare({
  region,
  helpers,
  onClose,
  onOpenPlan,
}: {
  region: HelplineRegion;
  helpers: PlanContact[];
  onClose: () => void;
  onOpenPlan: () => void;
}) {
  const ref = useDialogBehaviour(onClose);
  const [breathing, setBreathing] = useState(false);
  const copy = RESPONSES.urgent;
  const lines = crisisLines(region);

  return (
    <div className="urgent" role="dialog" aria-modal="true" aria-labelledby="urgent-title" ref={ref}>
      <div className="urgent-inner">
        <BloomSun size={44} />
        <h2 id="urgent-title">{copy.title}</h2>
        <p>{copy.body}</p>

        {lines.map((h) => {
          const href = helplineHref(h);
          /* The number is the biggest thing on the card, because it is the
             thing that gets dialled. Where a line has two numbers, the short
             one leads and the long one follows in the small print. */
          const [first, ...rest] = h.contact.split(" · ");
          const body = (
            <>
              <span style={{ minWidth: 0 }}>
                <span className="call-name">{h.name}</span>
                <span className="call-number">{first}</span>
                <small>{[...rest, h.who, h.hours].filter(Boolean).join(" · ")}</small>
              </span>
              <span className="call-icon" aria-hidden="true">
                <PhoneIcon width={22} height={22} />
              </span>
            </>
          );
          return href ? (
            <a
              key={h.name}
              className="call-btn"
              href={href}
              aria-label={`Call ${h.name}, ${first}`}
              {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {body}
            </a>
          ) : (
            <div key={h.name} className="call-btn">
              {body}
            </div>
          );
        })}

        {helpers.filter((c) => c.phone.trim()).length > 0 && (
          <>
            <p style={{ marginTop: 22, marginBottom: 0 }}>People from your own plan:</p>
            {helpers
              .filter((c) => c.phone.trim())
              .map((c) => (
                <a key={c.name + c.phone} className="call-btn call-btn-soft" href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}>
                  <span style={{ minWidth: 0 }}>
                    <span className="call-name">Call {c.name || "them"}</span>
                    <small>{c.phone}</small>
                  </span>
                  <span className="call-icon" aria-hidden="true">
                    <PhoneIcon width={22} height={22} />
                  </span>
                </a>
              ))}
          </>
        )}

        <p style={{ marginTop: 22 }}>
          If you&apos;re in danger right now, the emergency number is the fastest help there is. If you can, go
          to where other people are, or ask someone to come to you.
        </p>
        {/* Said plainly because the opposite assumption is dangerous: someone
            who believes the app has told somebody may wait for help that is
            not coming. */}
        <p>
          This app can&apos;t call anyone for you, and nobody has been alerted. You don&apos;t need the right
          words when you call. &ldquo;I&apos;m not safe right now&rdquo; is enough.
        </p>

        {breathing ? (
          <div style={{ marginTop: 10 }}>
            <Breathe rounds={6} />
          </div>
        ) : (
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button type="button" className="btn call-btn-soft" style={{ minHeight: 48, padding: "10px 16px" }} onClick={() => setBreathing(true)}>
              Breathe with me while I call
            </button>
            <button type="button" className="btn call-btn-soft" style={{ minHeight: 48, padding: "10px 16px" }} onClick={onOpenPlan}>
              Open my safety plan
            </button>
          </div>
        )}

        <button
          type="button"
          className="btn"
          onClick={onClose}
          style={{ marginTop: 26, color: "#FFD98A", minHeight: 44, paddingInline: 0 }}
        >
          I&apos;m safe for now, take me back
        </button>
      </div>
    </div>
  );
}
