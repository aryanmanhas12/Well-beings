import { InboundHandoff } from "@/lib/bridge";
import { Screen } from "@/hooks/useWellBeings";

const COPY: Record<0 | 1 | 2 | 3, { title: string; body: string }> = {
  0: { title: "Welcome back from the Psych Screener", body: "Nothing flagged there — a good moment to log how today actually feels." },
  1: { title: "Welcome back from the Psych Screener", body: "A little worth watching. Logging today here is a good next step." },
  2: {
    title: "Welcome back from the Psych Screener",
    body: "That screen showed something worth paying attention to. No pressure to do anything with it right now beyond today's check-in.",
  },
  3: {
    title: "Welcome back from the Psych Screener",
    body: "That result is worth taking seriously. Today's check-in still helps — and Help & privacy has real support one tap away, whenever you want it.",
  },
};

export function PsychHandoffBanner({
  handoff,
  screen,
  onStartChat,
  onGoToday,
  onOpenHelp,
  onDismiss,
}: {
  handoff: InboundHandoff;
  screen: Screen;
  onStartChat: () => void;
  onGoToday: () => void;
  onOpenHelp: () => void;
  onDismiss: () => void;
}) {
  const copy = COPY[handoff.band];
  const showCheckinCta = screen === "welcome" || screen === "app";

  return (
    <div
      className="anim-in"
      role="status"
      style={{
        maxWidth: 1060,
        width: "100%",
        margin: "14px auto 0",
        padding: "0 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="card"
        style={{
          padding: "14px 18px",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          borderColor: handoff.band >= 2 ? "var(--color-accent-500)" : "var(--color-divider)",
        }}
      >
        <div style={{ maxWidth: 620 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 13.5, marginBottom: 2 }}>{copy.title}</div>
          <div style={{ fontSize: 12, color: "var(--color-neutral-400)", textWrap: "pretty" }}>{copy.body}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: "none" }}>
          {handoff.band >= 2 && (
            <button className="btn btn-secondary" onClick={onOpenHelp} style={{ fontSize: 12 }}>
              Help now
            </button>
          )}
          {showCheckinCta && (
            <button
              className="btn btn-primary"
              onClick={screen === "welcome" ? onStartChat : onGoToday}
              style={{ fontSize: 12 }}
            >
              {screen === "welcome" ? "Start my check-in" : "Log today's check-in"}
            </button>
          )}
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            style={{ all: "unset", cursor: "pointer", fontSize: 16, color: "var(--color-neutral-500)", padding: "0 2px", lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
