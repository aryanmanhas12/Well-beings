import { dateKey } from "@/lib/scoring";
import { WellBeings } from "@/hooks/useWellBeings";

const WARN_SIGNS = [
  "Waking tired even after a full-length night",
  "Cynicism: \"what’s the point\" showing up about things you used to care about",
  "Working longer but producing less",
  "Can’t switch off — study/work thoughts colonise evenings",
  "Small tasks feel disproportionately heavy",
  "Withdrawing from people you normally like",
];

const RECOVERY_CARDS = [
  { name: "Detachment", what: "Mentally off the clock — not thinking about the work at all.", eg: "sport, gaming with friends, cooking" },
  { name: "Relaxation", what: "Low-effort calm; parasympathetic mode.", eg: "slow walk, music, long shower" },
  { name: "Mastery", what: "Getting better at something unrelated.", eg: "guitar, climbing, a language" },
  { name: "Control", what: "Time where you decide everything.", eg: "a self-planned Saturday morning" },
];

export function BurnoutTab({ wb }: { wb: WellBeings }) {
  const p = wb.profile!;
  const calm = wb.settings.calmMode;

  const days: (number | null)[] = [];
  for (let i = 13; i >= 0; i--) {
    const c = wb.checkins[dateKey(-i)];
    days.push(c && c.mood != null ? ((6 - c.mood) + (6 - (c.energy ?? 3)) + (6 - (c.sleep ?? 3))) / 3 : null);
  }
  const logged = days.filter((v): v is number => v != null);
  const base = (p.boScore / 12) * 4 + 1;
  const level = logged.length
    ? logged.slice(-7).reduce((a, b) => a + b, 0) / Math.min(logged.length, 7)
    : base;
  const pct = Math.round(((level - 1) / 4) * 100);
  const rBand: [string, string] =
    pct >= 60 ? ["High drain", "var(--color-accent-300)"] : pct >= 35 ? ["Warming up", "var(--color-accent-400)"] : ["Steady", "var(--color-neutral-400)"];
  const radarScore = calm ? (pct >= 60 ? "High" : pct >= 35 ? "Warm" : "OK") : pct + "%";
  const radarText = logged.length
    ? "Based on your last " +
      logged.length +
      " check-in" +
      (logged.length > 1 ? "s" : "") +
      (pct >= 60
        ? " — drain is outpacing recovery. Shrink one commitment this week and hit the recovery quota hard."
        : pct >= 35
          ? " — trending warm. Protect the shutdown ritual and the sleep window this week."
          : " — recovery is keeping pace. Keep the rhythm.")
    : "Seeded from your assessment (" + p.boScore + "/12). Log daily check-ins to make this live.";

  return (
    <div data-screen-label="Burnout radar" style={{ display: "flex", flexWrap: "wrap", gap: 26, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 400px", minWidth: 300 }}>
        <div className="card" style={{ padding: 22, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `conic-gradient(var(--color-accent-500) ${pct}%, var(--color-neutral-900) 0)`,
                boxShadow: "inset 0 0 0 6px var(--color-bg)",
                border: "1px solid var(--color-divider)",
                color: rBand[1],
              }}
            >
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 22 }}>{radarScore}</span>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 18, marginBottom: 3 }}>{rBand[0]}</div>
              <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", textWrap: "pretty" }}>{radarText}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 3, marginTop: 16, alignItems: "flex-end", height: 44 }}>
            {days.map((v, i) => (
              <div
                key={i}
                title={v == null ? "no log" : "drain " + v.toFixed(1) + "/5"}
                style={{
                  flex: 1,
                  borderRadius: "2px 2px 0 0",
                  height: (v == null ? 8 : 8 + ((v - 1) / 4) * 36) + "px",
                  background: v == null ? "var(--color-neutral-900)" : v >= 3.4 ? "var(--color-accent-400)" : "var(--color-accent-700)",
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--color-neutral-600)", marginTop: 6 }}>
            Last 14 days of check-ins · drain level per day. Log daily on the Today tab to sharpen this.
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 10 }}>Early-warning signs</div>
          {WARN_SIGNS.map((ws) => (
            <div
              key={ws}
              style={{ display: "flex", gap: 9, padding: "6px 0", borderTop: "1px solid var(--color-divider)", fontSize: 12.5, color: "var(--color-neutral-300)" }}
            >
              <span style={{ color: "var(--color-accent-400)", flex: "none" }}>◆</span>
              <span>{ws}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "var(--color-neutral-600)", marginTop: 10 }}>
            Two or more, most days, for two weeks → shrink commitments and raise recovery. That pattern predicts
            exhaustion in longitudinal studies.
          </div>
        </div>
      </div>

      <div style={{ flex: "1 1 380px", minWidth: 300 }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 16, margin: "0 0 4px" }}>The four recovery channels</h3>
        <p style={{ fontSize: 12.5, color: "var(--color-neutral-500)", margin: "0 0 14px", textWrap: "pretty" }}>
          A meta-analysis of 99,329 people found four distinct experiences that refill you. Cover all four across
          a week — they&apos;re not interchangeable.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
          {RECOVERY_CARDS.map((rc) => (
            <div key={rc.name} className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 500, fontSize: 13.5, marginBottom: 4, color: "var(--color-accent-300)" }}>{rc.name}</div>
              <div style={{ fontSize: 12, color: "var(--color-neutral-400)", marginBottom: 8, textWrap: "pretty" }}>{rc.what}</div>
              <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)" }}>e.g. {rc.eg}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
