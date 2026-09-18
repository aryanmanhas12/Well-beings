import {
  readProgress,
  readDimensionTrends,
  coincidenceNote,
  ProgressDirection,
  TrendKind,
} from "@/lib/progress";
import { Wellbeings } from "@/hooks/useWellbeings";

const TONE: Record<ProgressDirection, string> = {
  up: "var(--color-accent-300)",
  flat: "var(--color-neutral-400)",
  down: "var(--color-accent-400)",
  insufficient: "var(--color-neutral-500)",
};

/** 14-day trend, drawn as a filled area. Gaps are gaps: a day you didn't log
    is not drawn as a zero, because that would read as a bad day. */
function Sparkline({ series, color }: { series: (number | null)[]; color: string }) {
  const W = 260;
  const H = 44;
  const n = series.length;
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - ((v - 1) / 4) * (H - 6) - 3;

  const pts = series.map((v, i) => (v == null ? null : { x: x(i), y: y(v) })).filter(Boolean) as {
    x: number;
    y: number;
  }[];
  if (pts.length < 2) return null;

  const line = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label="Your daily check-in scores over the last 14 days"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id="progFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#progFill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.8" fill={color} />
    </svg>
  );
}

/* Direction is never carried by colour alone: each row prints an arrow AND
   a word. Someone who cannot distinguish the two accent tones, or who has
   calm mode on, still reads the same thing. */
const KIND_MARK: Record<TrendKind, { glyph: string; word: string; tone: string }> = {
  "trend-up": { glyph: "\u2191", word: "rising", tone: "var(--color-accent-300)" },
  "trend-down": { glyph: "\u2193", word: "declining", tone: "var(--color-accent-400)" },
  steady: { glyph: "\u2192", word: "steady", tone: "var(--color-neutral-400)" },
  "one-off": { glyph: "\u2022", word: "one-off dip", tone: "var(--color-neutral-500)" },
  repeated: { glyph: "\u223c", word: "up and down", tone: "var(--color-neutral-500)" },
  insufficient: { glyph: "\u00b7", word: "not enough data", tone: "var(--color-neutral-600)" },
};

/**
 * Per-dimension trends, under the combined one.
 *
 * The combined score answers "am I going up". It cannot answer "what moved",
 * and those come apart constantly: sleep sliding while mood holds is a
 * different situation from the reverse, and it wants different advice.
 *
 * Everything shown here has already been through the guards in lib/progress:
 * a minimum number of logged days, a wider noise floor than the combined
 * score uses, and an outlier test that demotes a single bad day from
 * "declining" to "one-off". A tool that calls three noisy points a trend
 * teaches people to stop believing it.
 */
function DimensionTrends({ checkins }: { checkins: Wellbeings["checkins"] }) {
  const trends = readDimensionTrends(checkins);
  if (trends.every((t) => t.kind === "insufficient")) return null;
  const note = coincidenceNote(trends);

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-divider)" }}>
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: ".07em",
          textTransform: "uppercase",
          color: "var(--color-neutral-600)",
          marginBottom: 8,
        }}
      >
        What moved
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {trends.map((t) => {
          const m = KIND_MARK[t.kind];
          return (
            <li key={t.key} style={{ fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <span aria-hidden="true" style={{ color: m.tone, width: 10, flex: "none" }}>
                  {m.glyph}
                </span>
                <span style={{ fontWeight: 600, minWidth: 54 }}>{t.label}</span>
                <span style={{ color: m.tone }}>{m.word}</span>
              </span>
              <span
                style={{
                  display: "block",
                  paddingLeft: 17,
                  color: "var(--color-neutral-500)",
                  fontSize: 11.5,
                  textWrap: "pretty",
                }}
              >
                {t.note}
              </span>
            </li>
          );
        })}
      </ul>
      {note && (
        <p style={{ fontSize: 11.5, color: "var(--color-neutral-400)", margin: "12px 0 0", textWrap: "pretty" }}>
          {note}
        </p>
      )}
    </div>
  );
}

export function ProgressCard({ wb }: { wb: Wellbeings }) {
  const p = readProgress(wb.checkins);
  const color = TONE[p.direction];
  const calm = wb.settings.calmMode;

  return (
    <div className="card" data-tour="trend" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 2 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15 }}>Your trend</span>
        {p.direction !== "insufficient" && !calm && p.delta != null && (
          <span style={{ fontSize: 11, color, fontVariantNumeric: "tabular-nums" }}>
            {(p.delta > 0 ? "+" : "") + p.delta.toFixed(1)} vs last week
          </span>
        )}
      </div>

      <div style={{ fontSize: 13, color: "var(--color-text)", marginBottom: 10, textWrap: "pretty" }}>{p.headline}</div>

      {p.direction !== "insufficient" && <Sparkline series={p.series} color={color} />}

      <p style={{ fontSize: 11.5, color: "var(--color-neutral-500)", margin: "10px 0 0", textWrap: "pretty" }}>
        {p.detail}
      </p>

      <DimensionTrends checkins={wb.checkins} />

      <p style={{ fontSize: 10.5, color: "var(--color-neutral-600)", margin: "8px 0 0", textWrap: "pretty" }}>
        No points, badges or rewards here. In 79 app trials, the ones without gamification had lower
        dropout, and seeing a real trend is what helps people keep going.
      </p>
    </div>
  );
}
