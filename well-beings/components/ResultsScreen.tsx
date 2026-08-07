import { CSSProperties, useState } from "react";
import { InfoIcon } from "./icons";
import { Profile, HelplineRegion } from "@/lib/types";
import { psychScreenerLink } from "@/lib/bridge";
import { crisisLines } from "@/lib/helplines";
import { Lang, t } from "@/lib/i18n";
import { HelplineList } from "./HelplineList";

interface ResultCard {
  domain: string;
  band: string;
  tagStyle: CSSProperties;
  score: string;
  outOf: string;
  pct: string;
  text: string;
  src: string;
}

function bandTag(level: number, calm: boolean): CSSProperties {
  const base: CSSProperties = { fontSize: 10, display: calm ? "none" : undefined };
  if (level === 2) return { ...base, background: "var(--color-accent-800)", color: "var(--color-accent-200)" };
  if (level === 1) return { ...base, background: "var(--color-neutral-800)", color: "var(--color-neutral-300)" };
  return { ...base, background: "transparent", border: "1px solid var(--color-divider)", color: "var(--color-neutral-400)" };
}

export function buildResultCards(p: Profile, calm: boolean): ResultCard[] {
  const mk = (
    domain: string,
    score: number,
    outOf: string,
    max: number,
    band: string,
    level: number,
    text: string,
    src: string
  ): ResultCard => ({
    domain,
    band,
    tagStyle: bandTag(level, calm),
    score: calm ? band : String(score),
    outOf: calm ? "" : outOf,
    pct: Math.min(100, Math.round((score / max) * 100)) + "%",
    text,
    src,
  });

  const phqBand: [string, number] = !p.phqExpanded
    ? [p.phqScore >= 2 ? "Watch" : "Clear", p.phqScore >= 2 ? 1 : 0]
    : p.phqScore >= 15
      ? ["High", 2]
      : p.phqScore >= 10
        ? ["Moderate", 2]
        : p.phqScore >= 5
          ? ["Mild", 1]
          : ["Minimal", 0];
  const gadBand: [string, number] = !p.gadExpanded
    ? [p.gadScore >= 2 ? "Watch" : "Clear", p.gadScore >= 2 ? 1 : 0]
    : p.gadScore >= 15
      ? ["High", 2]
      : p.gadScore >= 10
        ? ["Moderate", 2]
        : p.gadScore >= 5
          ? ["Mild", 1]
          : ["Minimal", 0];
  const slBand: [string, number] = p.sleepBad ? ["Disrupted", 2] : p.sleepWatch ? ["Wobbly", 1] : ["Solid", 0];
  const boBand: [string, number] = p.boHigh ? ["Elevated", 2] : p.boWatch ? ["Watch", 1] : ["Low", 0];
  const auBand: [string, number] = p.auditFlag ? ["Worth a look", 2] : p.auditWatch ? ["Watch", 1] : ["Low", 0];

  return [
    mk(
      "Mood",
      p.phqScore,
      p.phqExpanded ? "/ 27 · PHQ-9" : "/ 6 · PHQ-2",
      p.phqExpanded ? 27 : 6,
      phqBand[0],
      phqBand[1],
      p.phqExpanded
        ? p.phqScore >= 10
          ? "In the range where extra support genuinely helps — your plan leans on movement, sleep and structure."
          : "Some signal; your plan leans on the strongest mood levers: movement and sleep."
        : p.phqScore >= 2
          ? "Low signal, worth watching — the daily check-in will track it."
          : "No flag. The short screener was enough — no need for the long form.",
      p.phqExpanded ? "PHQ-9 · Kroenke et al." : "PHQ-2 · cutoff ≥2 (youth-calibrated)"
    ),
    mk(
      "Anxiety",
      p.gadScore,
      p.gadExpanded ? "/ 21 · GAD-7" : "/ 6 · GAD-2",
      p.gadExpanded ? 21 : 6,
      gadBand[0],
      gadBand[1],
      p.gadExpanded
        ? p.gadScore >= 10
          ? "Worry is taking real energy. Breathing tools + a worry-boundary go into your plan."
          : "Mild but present — quick state-shifters and structure will help."
        : p.gadScore >= 2
          ? "Low signal, worth watching."
          : "No flag — short screener was enough.",
      p.gadExpanded ? "GAD-7 · Spitzer et al." : "GAD-2 · cutoff ≥2"
    ),
    mk(
      "Sleep",
      p.sleepScore,
      "/ 10 · composite",
      10,
      slBand[0],
      slBand[1],
      p.sleepBad
        ? "Your biggest lever. Irregular window + " +
          (p.sleepHours <= 6.5 ? "short hours" : "poor restoration") +
          " — the plan starts here."
        : p.sleepWatch
          ? "Mostly fine; the weekend drift is the thing to fix first."
          : "Solid foundation — protect the window you already have.",
      "Duration + regularity + quality"
    ),
    mk(
      "Burnout risk",
      p.boScore,
      "/ 12 · exhaustion-detachment",
      12,
      boBand[0],
      boBand[1],
      p.boHigh
        ? "Drained + cynical + can’t switch off: the classic pattern. Recovery becomes non-negotiable, scheduled like classes."
        : p.boWatch
          ? "Early signs. Cheap to fix now — the radar will watch your trend."
          : "Low risk. Keep the recovery channels topped up.",
      "Adapted OLBI/MBI signals"
    ),
    mk(
      "Drinking",
      p.auditScore,
      "/ 12 · AUDIT-C",
      12,
      auBand[0],
      auBand[1],
      p.auditFlag
        ? "Worth a straight conversation with a GP or counsellor — no judgement, just a number worth a second look."
        : p.auditWatch
          ? "Nothing alarming, just worth keeping an eye on."
          : "No flag on this one.",
      "AUDIT-C · WHO, single youth-calibrated cutoff"
    ),
  ];
}

/** Which instrument produced a score — folded away unless asked for, or
    unless the citations preference says always. */
function InstrumentNote({ src, always, label }: { src: string; always: boolean; label: string }) {
  const [open, setOpen] = useState(false);
  if (always || open) {
    return <div style={{ fontSize: 10.5, color: "var(--color-neutral-600)", marginTop: "auto" }}>{src}</div>;
  }
  return (
    <button
      onClick={() => setOpen(true)}
      style={{
        all: "unset",
        cursor: "pointer",
        marginTop: "auto",
        fontSize: 10.5,
        color: "var(--color-neutral-600)",
        textDecoration: "underline",
        textUnderlineOffset: 2,
      }}
    >
      {label}
    </button>
  );
}

export function ResultsScreen({
  profile,
  crisis,
  calm,
  region,
  lang = "en",
  showCitations = false,
  onBuildSystem,
  onOpenHelp,
}: {
  profile: Profile;
  crisis: boolean;
  calm: boolean;
  region: HelplineRegion;
  lang?: Lang;
  showCitations?: boolean;
  onBuildSystem: () => void;
  onOpenHelp: () => void;
}) {
  const cards = buildResultCards(profile, calm);
  const s = t(lang);
  const seekHelp = !calm && (profile.moodFlag || profile.anxFlag || crisis);
  const suggestFullScreener =
    crisis || profile.moodFlag || profile.anxFlag || profile.sleepBad || profile.boHigh || profile.auditFlag;

  return (
    <main
      data-screen-label="Results"
      style={{ flex: 1, maxWidth: 1060, width: "100%", margin: "0 auto", padding: "44px 24px 60px", boxSizing: "border-box" }}
    >
      <div className="tag tag-accent" style={{ marginBottom: 14 }}>
        {s.resultsKicker}
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          letterSpacing: "var(--font-display-tracking)",
          fontSize: "clamp(28px,4vw,40px)",
          lineHeight: 1.08,
          margin: "0 0 8px",
        }}
      >
        {profile.name ? s.resultsTitleNamed(profile.name) : s.resultsTitle}
      </h1>
      <p style={{ color: "var(--color-neutral-400)", maxWidth: 600, margin: "0 0 28px", textWrap: "pretty" }}>
        {s.resultsLead}
      </p>

      {crisis && (
        <div
          style={{
            background: "linear-gradient(135deg,var(--color-section),var(--color-section-glow))",
            border: "1px solid var(--color-accent-500)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 22px",
            marginBottom: 26,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "var(--font-display-tracking)",
              fontSize: 24,
              lineHeight: 1.1,
              marginBottom: 6,
            }}
          >
            Before anything else — real support
          </div>
          <div style={{ fontSize: 13, color: "var(--color-accent-200)", marginBottom: 4, maxWidth: 640, textWrap: "pretty" }}>
            You mentioned thoughts of self-harm. An app is the wrong tool for that moment — a person is the
            right one. These lines are free, confidential and open 24/7:
          </div>
          <div style={{ maxWidth: 560 }}>
            <HelplineList lines={crisisLines(region)} tone="accent" />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--color-accent-300)", marginTop: 8 }}>{s.emergencyNote}</div>
        </div>
      )}

      {suggestFullScreener && (
        <div
          className="card"
          style={{
            padding: "18px 20px",
            marginBottom: 26,
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 14.5, marginBottom: 4 }}>
              This looks like more than a quick check-in
            </div>
            <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", textWrap: "pretty" }}>
              The Psych Screener is Well-Beings&apos; companion app — the full PHQ-9/GAD-7/AUDIT-C picture, in six
              languages, with score history over time and a guided conversation if you&apos;re not sure where to
              start. It&apos;s free, private, and runs entirely on-device, same as this one.
            </div>
          </div>
          <a
            href={psychScreenerLink({ crisis })}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ fontSize: 13, whiteSpace: "nowrap", flex: "none" }}
          >
            Take the full screener →
          </a>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))",
          gap: 14,
          marginBottom: 30,
        }}
      >
        {cards.map((r) => (
          <div key={r.domain} className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8, minHeight: 150 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-500)" }}>
                {r.domain}
              </span>
              <span className="tag" style={r.tagStyle}>
                {r.band}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 30 }}>{r.score}</span>
              <span style={{ fontSize: 12, color: "var(--color-neutral-500)" }}>{r.outOf}</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: "var(--color-neutral-900)", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--color-accent-500)", width: r.pct }} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", textWrap: "pretty" }}>{r.text}</div>
            <InstrumentNote src={r.src} always={showCitations} label={s.whichScreener} />
          </div>
        ))}
      </div>

      {seekHelp && (
        <div className="card" style={{ padding: "16px 18px", marginBottom: 26, display: "flex", flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
          <InfoIcon style={{ color: "var(--color-accent-400)", flex: "none", marginTop: 2 }} />
          <div style={{ fontSize: 13, color: "var(--color-neutral-300)", textWrap: "pretty" }}>
            Some scores are in a range where talking to a professional genuinely helps — screeners at this level
            are exactly what clinicians use to start that conversation. Your plan below still applies; it works
            alongside support, not instead of it.{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onOpenHelp();
              }}
            >
              See support options →
            </a>
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={onBuildSystem} style={{ fontSize: 14.5, padding: "11px 24px" }}>
        {s.buildSystem}
      </button>
    </main>
  );
}
