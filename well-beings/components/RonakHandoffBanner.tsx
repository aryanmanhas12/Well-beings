import { InboundHandoff } from "@/lib/bridge";
import { COMPANION_NAME } from "@/lib/site";

/**
 * Shown once when someone arrives from Ronak's results, carrying only the
 * coarse band Ronak passed (see lib/bridge.ts). It speaks to that band and
 * nothing else; there is no score here and nothing is stored.
 */
const COPY: Record<0 | 1 | 2 | 3, { title: string; body: string }> = {
  0: { title: `Welcome over from ${COMPANION_NAME}`, body: "Nothing flagged there. This is a good place to keep a little of today." },
  1: { title: `Welcome over from ${COMPANION_NAME}`, body: "A little worth watching. Checking in here for a few days can show you how it moves." },
  2: {
    title: `Welcome over from ${COMPANION_NAME}`,
    body: "That screen showed something worth paying attention to. A safety plan and a few people to call are good things to have ready.",
  },
  3: {
    title: `Welcome over from ${COMPANION_NAME}`,
    body: "That result is worth taking seriously, and you don't have to act on it alone. Support is one tap away, whenever you want it.",
  },
};

export function RonakHandoffBanner({
  handoff,
  onCheckIn,
  onOpenHelp,
  onDismiss,
}: {
  handoff: InboundHandoff;
  onCheckIn: () => void;
  onOpenHelp: () => void;
  onDismiss: () => void;
}) {
  const copy = COPY[handoff.band];

  return (
    <div
      className="anim-in"
      role="status"
      style={{
        maxWidth: 700,
        width: "100%",
        margin: "14px auto 0",
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="panel panel-lilac"
        style={{
          padding: "14px 16px",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 2 }}>{copy.title}</div>
          <div style={{ fontSize: 13, color: "var(--color-neutral-500)", textWrap: "pretty" }}>{copy.body}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: "none" }}>
          {handoff.band >= 2 ? (
            <button className="btn btn-sun" onClick={onOpenHelp}>
              Talk to someone
            </button>
          ) : (
            <button className="btn btn-soft" onClick={onCheckIn}>
              Check in here
            </button>
          )}
          <button className="btn btn-quiet" onClick={onDismiss} aria-label="Dismiss this message">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
