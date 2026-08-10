"use client";

import { useEffect, useState } from "react";

/* The tour used to be reachable only from Help & privacy, six taps into an
   app you'd have to finish a five-minute check-in to reach. Someone who
   lands on a phone and can't tell what this is has already left by then.

   So it comes to them: a sheet that rises on its own, once per device, a
   beat after the page settles. Not a modal — the page behind it stays
   readable and scrollable, and "Not now" is a real button of the same
   weight as the one that starts it. It's an offer that's hard to miss,
   not a gate. */
export function TourInvite({
  onStart,
  onDismiss,
  delay = 1100,
}: {
  onStart: () => void;
  onDismiss: () => void;
  /** Long enough that it reads as an offer arriving, not a popup ambush,
      and that the entrance animations underneath have finished first. */
  delay?: number;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!shown) return null;

  return (
    <div className="tour-invite" role="region" aria-label="Guided tour offer">
      <div className="tour-invite-card">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span className="tour-invite-dot" aria-hidden="true" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 500,
                fontSize: 15,
                marginBottom: 3,
              }}
            >
              First time here?
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: "var(--color-neutral-400)",
                textWrap: "pretty",
              }}
            >
              Six quick cards — what this is, what it does with your answers, and where your data
              goes. About forty seconds.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="btn btn-secondary" onClick={onDismiss} style={{ flex: 1, fontSize: 13 }}>
            Not now
          </button>
          {/* No autofocus: this arrives on a timer, and yanking focus out of
              whatever someone was already reading is worse than the extra tab. */}
          <button className="btn btn-primary" onClick={onStart} style={{ flex: 1.4, fontSize: 13 }}>
            Show me around
          </button>
        </div>
      </div>
    </div>
  );
}
