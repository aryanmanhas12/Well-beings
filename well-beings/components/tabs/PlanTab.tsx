import { buildInterventions, fmt } from "@/lib/scoring";
import { WellBeings } from "@/hooks/useWellBeings";

const WEEKLY_DEFS = [
  {
    id: "detach",
    title: "Detach ×3 evenings",
    desc: "Three evenings fully off study/work — no tabs open in the head. The channel that cuts exhaustion most.",
  },
  { id: "relax", title: "Relax ×2", desc: "Two deliberately calm sessions — music, bath, slow walk, nothing productive." },
  {
    id: "mastery",
    title: "One mastery hour",
    desc: "An hour on a skill that has nothing to do with your grades or job. Mastery refills engagement.",
  },
  {
    id: "control",
    title: "One self-directed half-day",
    desc: "A block where you choose everything. Control is its own recovery channel.",
  },
];

export function PlanTab({ wb }: { wb: WellBeings }) {
  const p = wb.profile!;
  const interventions = buildInterventions(p);
  const lightsOut = (p.wake - p.need + 24) % 24;
  const sleepWindow = fmt(lightsOut) + " – " + fmt(p.wake);
  const sleepWindowWhy =
    (p.need === 9 ? "Teen target: 8–10h. " : "Adult target: 7–9h. ") +
    "Held within ±30 min all 7 days — regularity beats duration for mental health risk.";
  const weekFocus = p.sleepBad
    ? "Stabilise the sleep window"
    : p.boHigh || p.boWatch
      ? "Rebuild recovery"
      : p.moodWatch || p.anxWatch
        ? "Movement + one worry boundary"
        : "Consistency over intensity";
  const weekFocusWhy = p.sleepBad
    ? "One lever, one week: same wake time daily. Everything else in the plan gets easier once this holds."
    : p.boHigh || p.boWatch
      ? "Your drain pattern says the tank refills slower than it empties. This week recovery is scheduled, not leftover."
      : p.moodWatch || p.anxWatch
        ? "Three movement sessions and a hard shutdown — the two highest-evidence moves for your flags."
        : "Nothing is broken. The win is repetition: same window, same blocks, same shutdown.";

  return (
    <div data-screen-label="Plan">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 30 }}>
        <div
          className="card"
          style={{
            flex: "1 1 300px",
            padding: 20,
            background: "linear-gradient(135deg,var(--color-section),var(--color-section-glow))",
            border: "none",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-accent-300)", marginBottom: 8 }}>
            Your sleep window
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 28 }}>{sleepWindow}</div>
          <div style={{ fontSize: 12.5, color: "var(--color-accent-200)", marginTop: 6, textWrap: "pretty" }}>{sleepWindowWhy}</div>
        </div>
        <div className="card" style={{ flex: "1 1 300px", padding: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-500)", marginBottom: 8 }}>
            This week&apos;s focus
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 19 }}>{weekFocus}</div>
          <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginTop: 6, textWrap: "pretty" }}>{weekFocusWhy}</div>
        </div>
      </div>

      <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 18, margin: "0 0 4px" }}>Your interventions</h3>
      <p style={{ color: "var(--color-neutral-500)", fontSize: 12.5, margin: "0 0 16px" }}>
        Chosen from your flags. Each one names its evidence — tap through to the paper in the Library.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14, marginBottom: 34 }}>
        {interventions.map((iv) => (
          <div key={iv.title} className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15 }}>{iv.title}</div>
              <span className="tag tag-outline" style={{ fontSize: 10, flex: "none" }}>
                {iv.tag}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", textWrap: "pretty" }}>{iv.why}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {iv.steps.map((st) => (
                <div key={st} style={{ display: "flex", gap: 8, fontSize: 12.5 }}>
                  <span style={{ color: "var(--color-accent-400)" }}>→</span>
                  <span>{st}</span>
                </div>
              ))}
            </div>
            {iv.tryBreath && (
              <button className="btn btn-secondary" onClick={wb.openBreath} style={{ alignSelf: "flex-start", fontSize: 12 }}>
                Try it now · 1 min
              </button>
            )}
            <div style={{ fontSize: 10.5, color: "var(--color-neutral-600)", marginTop: "auto" }}>{iv.src}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 18, margin: "0 0 4px" }}>Weekly recovery quota</h3>
      <p style={{ color: "var(--color-neutral-500)", fontSize: 12.5, margin: "0 0 16px" }}>
        Recovery isn&apos;t a reward for finishing — it&apos;s what keeps the engine running. Tick them off
        through the week.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>
        {WEEKLY_DEFS.map((w) => {
          const done = !!wb.weeklyDone[w.id];
          return (
            <button
              key={w.id}
              onClick={() => wb.toggleWeekly(w.id)}
              style={{
                textAlign: "left",
                background: done ? "var(--color-accent-900)" : "var(--color-surface)",
                border: done ? "1px solid var(--color-accent-700)" : "1px solid var(--color-divider)",
                borderRadius: "var(--radius-md)",
                padding: "14px 16px",
                cursor: "pointer",
                color: "var(--color-text)",
                font: "inherit",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontWeight: 500, fontSize: 13.5 }}>{w.title}</span>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    border: done ? "1px solid var(--color-accent)" : "1px solid var(--color-neutral-700)",
                    background: done ? "var(--color-accent-700)" : "transparent",
                    color: done ? "var(--color-accent-100)" : "transparent",
                  }}
                >
                  ✓
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)", textAlign: "left", textWrap: "pretty" }}>{w.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
