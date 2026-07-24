import { PlanIntensity } from "@/lib/types";
import { WellBeings } from "@/hooks/useWellBeings";

const INTENSITIES: { value: PlanIntensity; label: string; desc: string }[] = [
  { value: "gentle", label: "Gentle", desc: "recovery-first" },
  { value: "balanced", label: "Balanced", desc: "the default" },
  { value: "driven", label: "Driven", desc: "maximum deep work" },
];

export function HelpTab({ wb }: { wb: WellBeings }) {
  const region = wb.region;

  return (
    <div data-screen-label="Help and privacy" style={{ maxWidth: 720 }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 22, margin: "0 0 4px" }}>
        Support, whenever you need it
      </h2>
      <p style={{ color: "var(--color-neutral-500)", fontSize: 13, margin: "0 0 20px", textWrap: "pretty" }}>
        If things feel heavy — or you just need someone to talk to — these services are free, confidential and
        open 24/7. You never need to be &quot;in crisis enough&quot; to call.
      </p>

      <div className="card" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-500)", marginBottom: 10 }}>
          {"Helplines — " + region.label}
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
              flexWrap: "wrap",
            }}
          >
            <span>{h.name}</span>
            <span style={{ fontWeight: 500, color: "var(--color-accent-300)" }}>{h.contact}</span>
          </div>
        ))}
        <div style={{ fontSize: 11.5, color: "var(--color-neutral-600)", marginTop: 10 }}>
          Anywhere else:{" "}
          <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">
            findahelpline.com
          </a>{" "}
          lists verified lines for 130+ countries. Immediate danger → your local emergency number.
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 8 }}>
          When to seek professional support
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", textWrap: "pretty" }}>
          If low mood or anxiety scores sit in the moderate+ range for two weeks, if sleep stays broken despite a
          steady window, or if you&apos;re using more and more effort to do less and less — that&apos;s the point
          where a GP, counsellor or school/uni mental-health service genuinely changes the curve. Taking your
          Results screen to that conversation is a strong start.
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 8 }}>Your system</div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginBottom: 8 }}>
            Plan intensity — reshapes your daily schedule: recovery-first, balanced, or maximum deep-work blocks.
          </div>
          <div className="seg" role="radiogroup" aria-label="Plan intensity">
            {INTENSITIES.map((it) => (
              <button
                key={it.value}
                className="seg-opt"
                role="radio"
                aria-checked={wb.settings.planIntensity === it.value}
                data-checked={wb.settings.planIntensity === it.value}
                onClick={() => wb.setPlanIntensity(it.value)}
              >
                {it.label}
                <span style={{ fontSize: 10.5, color: "var(--color-neutral-600)" }}>{it.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="switch"
            role="switch"
            aria-checked={wb.settings.calmMode}
            aria-label="Calm mode"
            data-on={wb.settings.calmMode}
            onClick={() => wb.setCalmMode(!wb.settings.calmMode)}
          >
            <span className="switch-knob" />
          </button>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Calm mode</div>
            <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)" }}>
              Low-stimulation mode: scores and streak numbers become words — for anxiety-sensitive users.
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 8 }}>Your data</div>
        <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginBottom: 14 }}>
          Everything — answers, scores, check-ins — lives in this browser&apos;s local storage. No account, no
          server, no analytics, no third parties. Deleting it is instant and irreversible.
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => {
            if (window.confirm("Delete all Well-Beings data from this browser? This cannot be undone.")) {
              wb.deleteData();
            }
          }}
          style={{ fontSize: 12.5 }}
        >
          Delete all my data
        </button>
      </div>
    </div>
  );
}
