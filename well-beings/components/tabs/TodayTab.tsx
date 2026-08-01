import { CheckIcon } from "../icons";
import { buildSchedule } from "@/lib/scoring";
import { WellBeings } from "@/hooks/useWellBeings";

export const HABIT_DEFS = [
  { id: "light", anchor: "After I wake up…", habit: "Daylight + a glass of water, before the phone" },
  { id: "walk", anchor: "After lunch…", habit: "10-minute walk outside" },
  { id: "ifthen", anchor: "After my last block…", habit: "Write tomorrow’s one-line if-then" },
  { id: "phone", anchor: "When wind-down starts…", habit: "Phone on charge, out of reach" },
];

const CHECKIN_ROWS: { field: "mood" | "energy" | "sleep"; label: string; hint: string }[] = [
  { field: "mood", label: "Mood", hint: "low → great" },
  { field: "energy", label: "Energy", hint: "empty → full" },
  { field: "sleep", label: "Last night’s sleep", hint: "rough → restful" },
];

export function TodayTab({ wb }: { wb: WellBeings }) {
  const p = wb.profile!;
  const calm = wb.settings.calmMode;
  const intensity = wb.settings.planIntensity;
  const schedule = buildSchedule(p, intensity);
  const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
  const today = wb.todayCheckin;
  const checkedInToday = today.mood != null && today.energy != null && today.sleep != null;
  const todayLine =
    (p.chrono === "owl" ? "Built for a late peak" : p.chrono === "morning" ? "Built around your morning peak" : "Built for a steady middle") +
    " · " +
    (intensity === "gentle" ? "gentle pace — recovery first" : intensity === "driven" ? "driven pace — watch the radar" : "balanced pace") +
    " · aim: " +
    (p.goal || "consistency");

  return (
    <div data-screen-label="Today" style={{ display: "flex", flexWrap: "wrap", gap: 26, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 440px", minWidth: 300 }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 24, margin: "0 0 2px" }}>
          {"Your " + day + (p.name ? ", " + p.name : "")}
        </h2>
        <div style={{ color: "var(--color-neutral-500)", fontSize: 12.5, marginBottom: 20 }}>{todayLine}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {schedule.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "9px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <span style={{ width: 66, flex: "none", fontSize: 12, color: "var(--color-accent-300)", fontWeight: 500, paddingTop: 2 }}>
                {s.t}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5 }}>{s.label}</div>
                {s.note && <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)" }}>{s.note}</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--color-neutral-600)", marginTop: 10 }}>
          Blocks flex around classes and shifts — the anchors that matter most are the wake time, the shutdown,
          and lights-out.
        </div>
      </div>

      <div style={{ flex: "0 1 340px", minWidth: 290, display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15 }}>Daily check-in</span>
            {checkedInToday && (
              <span className="tag tag-accent" style={{ fontSize: 10 }}>
                Logged today
              </span>
            )}
          </div>
          {CHECKIN_ROWS.map((row) => (
            <div key={row.field} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--color-neutral-500)", marginBottom: 5 }}>
                <span>{row.label}</span>
                <span>{row.hint}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((v) => {
                  const sel = today[row.field] === v;
                  return (
                    <button
                      key={v}
                      onClick={() => wb.logCheckin(row.field, v)}
                      style={{
                        flex: 1,
                        minWidth: 34,
                        minHeight: 30,
                        borderRadius: "var(--radius-sm)",
                        border: sel ? "1px solid var(--color-accent)" : "1px solid var(--color-divider)",
                        background: sel ? "var(--color-accent-900)" : "transparent",
                        color: sel ? "var(--color-accent-200)" : "var(--color-neutral-400)",
                        font: "500 12px var(--font-body)",
                        cursor: "pointer",
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10.5, color: "var(--color-neutral-600)" }}>
            Feeds your burnout radar. 10 seconds, stays on this device.
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 4 }}>Habit stack</div>
          <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)", marginBottom: 12 }}>
            Anchored to things you already do. Missing a day doesn&apos;t reset progress — the research says it
            doesn&apos;t matter.
          </div>
          {HABIT_DEFS.map((h) => {
            const done = wb.doneToday(h.id);
            const n = wb.streakFor(h.id);
            const streakLabel = calm ? (done ? "✓ today" : "") : n > 0 ? n + "-day streak" : "—";
            return (
              <div key={h.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderTop: "1px solid var(--color-divider)" }}>
                <button
                  className="habit-check"
                  data-done={done}
                  onClick={() => wb.toggleHabit(h.id)}
                  aria-pressed={done}
                  aria-label={(done ? "Un-tick" : "Tick") + " habit: " + h.habit}
                  style={{
                    width: 20,
                    height: 20,
                    flex: "none",
                    borderRadius: 6,
                    border: done ? "1px solid var(--color-accent)" : "1px solid var(--color-neutral-700)",
                    background: done ? "var(--color-accent-800)" : "transparent",
                    color: "var(--color-accent-200)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    marginTop: 3,
                  }}
                >
                  {done && <CheckIcon />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>{h.anchor}</div>
                  <div style={{ fontSize: 13 }}>{h.habit}</div>
                </div>
                <span
                  /* Re-keyed on the streak value so the count animates only
                     when it actually changes, not on every unrelated render. */
                  key={h.id + ":" + n}
                  className={done && n > 0 ? "streak-tick" : undefined}
                  style={{
                    fontSize: 11,
                    color: "var(--color-accent-300)",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {streakLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
