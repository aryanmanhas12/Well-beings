import { useState } from "react";
import { EFFECT_SCALE, EVIDENCE } from "@/lib/evidence";
import { EvidenceStrength } from "@/lib/types";

const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  large: "Large effect",
  moderate: "Moderate effect",
  small: "Small but real",
  mixed: "Evidence is mixed",
};

/** Mixed findings get the flattest hue — we never dress up a weak result. */
const STRENGTH_COLOR: Record<EvidenceStrength, string> = {
  large: "var(--color-accent-300)",
  moderate: "var(--color-accent-400)",
  small: "var(--color-neutral-400)",
  mixed: "var(--color-neutral-300)",
};

function EffectScaleNote() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" data-tour="effect-scale" style={{ padding: 16, marginBottom: 20 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          fontWeight: 500,
          color: "var(--color-accent-300)",
        }}
      >
        <span aria-hidden="true" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
          ▸
        </span>
        What do “d = 0.65” and “SMD −0.82” actually mean?
      </button>
      {open && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12.5, color: "var(--color-neutral-400)", margin: "0 0 12px", textWrap: "pretty" }}>
            {EFFECT_SCALE.intro}
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {EFFECT_SCALE.rows.map((r) => (
              <div
                key={r.band}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "4px 12px",
                  padding: "9px 12px",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-divider)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <span style={{ fontSize: 11.5, color: "var(--color-neutral-500)", whiteSpace: "nowrap" }}>{r.band}</span>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--color-accent-300)" }}>{r.word}</span>
                <span />
                <span style={{ fontSize: 12, color: "var(--color-neutral-400)", textWrap: "pretty" }}>{r.plain}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: "var(--color-neutral-500)", margin: "12px 0 0", textWrap: "pretty" }}>
            {EFFECT_SCALE.note}
          </p>
        </div>
      )}
    </div>
  );
}

export function LibraryTab() {
  return (
    <div data-screen-label="Evidence library">
      <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 22, margin: "0 0 4px" }}>
        Why each practice is here
      </h2>
      <p style={{ color: "var(--color-neutral-500)", fontSize: 13, margin: "0 0 18px", maxWidth: 620, textWrap: "pretty" }}>
        Every recommendation in Well-Beings traces to peer-reviewed research — mostly meta-analyses and large
        cohorts, sourced via PubMed &amp; Consensus. Each card leads with the one number worth remembering, in plain
        words. Where the evidence is young or mixed, the card says so.
      </p>

      <EffectScaleNote />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 14 }}>
        {EVIDENCE.map((ev) => (
          <div key={ev.cite} className="card card-interactive" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className="tag tag-accent" style={{ fontSize: 10 }}>
                {ev.tag}
              </span>
              <span className="tag tag-neutral" style={{ fontSize: 10 }}>
                {STRENGTH_LABEL[ev.strength]}
              </span>
            </div>

            {/* The headline figure: one number, then what it means in words. */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 30,
                  lineHeight: 1.05,
                  fontWeight: 500,
                  color: STRENGTH_COLOR[ev.strength],
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {ev.figure}
              </div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: ".05em",
                  textTransform: "uppercase",
                  color: "var(--color-neutral-500)",
                  marginTop: 5,
                  textWrap: "pretty",
                }}
              >
                {ev.caption}
              </div>
            </div>

            <div style={{ fontSize: 13.5, textWrap: "pretty" }}>{ev.finding}</div>

            {ev.technical && (
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--color-neutral-500)",
                  borderLeft: "2px solid var(--color-divider)",
                  paddingLeft: 9,
                  textWrap: "pretty",
                }}
              >
                In the paper: {ev.technical}
              </div>
            )}

            <div style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>In Well-Beings: {ev.use}</div>
            <div style={{ fontSize: 11, color: "var(--color-neutral-600)", marginTop: "auto" }}>{ev.design}</div>
            <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5 }}>
              {ev.cite} ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
