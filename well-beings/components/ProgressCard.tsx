import { readProgress, ProgressDirection } from "@/lib/progress";
import { WellBeings } from "@/hooks/useWellBeings";

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

export function ProgressCard({ wb }: { wb: WellBeings }) {
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

      <p style={{ fontSize: 10.5, color: "var(--color-neutral-600)", margin: "8px 0 0", textWrap: "pretty" }}>
        No points, badges or rewards here — in 79 app trials, the ones without gamification had lower dropout. Seeing a
        real trend is what helps people keep going.
      </p>
    </div>
  );
}
