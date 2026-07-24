import { HelplineRegion } from "@/lib/types";

export function HelpDialog({ region, onClose }: { region: HelplineRegion; onClose: () => void }) {
  return (
    <div
      className="dialog-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,11,20,.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Help, right now"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 440,
          width: "100%",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          padding: 24,
        }}
      >
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 17, marginBottom: 4 }}>
          Help, right now
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginBottom: 14 }}>
          Free, confidential, 24/7 — for any level of &quot;not okay&quot;.
        </div>
        {region.lines.map((h) => (
          <div
            key={h.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "9px 0",
              borderTop: "1px solid var(--color-divider)",
              fontSize: 13.5,
            }}
          >
            <span>{h.name}</span>
            <span style={{ fontWeight: 500, color: "var(--color-accent-300)", whiteSpace: "nowrap" }}>{h.contact}</span>
          </div>
        ))}
        <div style={{ fontSize: 11.5, color: "var(--color-neutral-600)", margin: "10px 0 16px" }}>
          Elsewhere:{" "}
          <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">
            findahelpline.com
          </a>{" "}
          · Immediate danger → local emergency number.
        </div>
        <button className="btn btn-primary" onClick={onClose} style={{ width: "100%" }}>
          Close
        </button>
      </div>
    </div>
  );
}

export function BreathDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="dialog-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,11,20,.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Cyclic sighing"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 400,
          width: "100%",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          padding: 28,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 17, marginBottom: 2 }}>
          Cyclic sighing
        </div>
        <div style={{ fontSize: 12, color: "var(--color-neutral-500)", marginBottom: 22 }}>
          Follow the ring · ~6 breaths is enough to shift state
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 170, marginBottom: 20 }}>
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: "50%",
              border: "2px solid var(--color-accent-500)",
              boxShadow:
                "0 0 40px color-mix(in srgb, var(--color-accent) 25%, transparent), inset 0 0 30px color-mix(in srgb, var(--color-accent) 15%, transparent)",
              animation: "breatheRing 10s ease-in-out infinite",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--color-neutral-300)",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 20,
          }}
        >
          <div>
            <span style={{ color: "var(--color-accent-300)", fontWeight: 500 }}>1.</span> Inhale through the nose…
          </div>
          <div>
            <span style={{ color: "var(--color-accent-300)", fontWeight: 500 }}>2.</span> …then a second, shorter
            sip of air on top
          </div>
          <div>
            <span style={{ color: "var(--color-accent-300)", fontWeight: 500 }}>3.</span> Long, slow exhale through
            the mouth (the ring shrinking)
          </div>
        </div>
        <button className="btn btn-primary" onClick={onClose} style={{ width: "100%" }}>
          Done
        </button>
      </div>
    </div>
  );
}
