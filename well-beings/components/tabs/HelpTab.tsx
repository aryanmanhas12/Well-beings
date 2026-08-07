import { PlanIntensity } from "@/lib/types";
import { Theme } from "@/lib/storage";
import { WellBeings } from "@/hooks/useWellBeings";
import { psychScreenerLink } from "@/lib/bridge";
import { GLOBAL_LINKS } from "@/lib/helplines";
import { Lang, LANGS } from "@/lib/i18n";
import { HelplineList } from "../HelplineList";

const THEMES: { value: Theme; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/* 1.15 and 1.35 mirror the screener's scale, so someone who set a size
   there isn't surprised by a different jump here. */
const SIZES: { value: number; label: string; preview: number }[] = [
  { value: 1, label: "A", preview: 13 },
  { value: 1.15, label: "A", preview: 15 },
  { value: 1.35, label: "A", preview: 17 },
];

const INTENSITIES: { value: PlanIntensity; label: string; desc: string }[] = [
  { value: "gentle", label: "Gentle", desc: "recovery-first" },
  { value: "balanced", label: "Balanced", desc: "the default" },
  { value: "driven", label: "Driven", desc: "maximum deep work" },
];

export function HelpTab({ wb, onReplayTour }: { wb: WellBeings; onReplayTour: () => void }) {
  const region = wb.region;
  const s = wb.s;
  const links = [...region.links, ...GLOBAL_LINKS];

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
        <HelplineList lines={region.lines} />
        <div style={{ fontSize: 11.5, color: "var(--color-neutral-600)", marginTop: 10 }}>{s.emergencyNote}</div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 4 }}>
          {s.moreResources}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-neutral-500)", marginBottom: 12, textWrap: "pretty" }}>
          Directories and services worth a look when you want to read rather than ring — including the ones that
          cover countries this app doesn&apos;t list.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {links.map((l) => (
            <div key={l.url} style={{ paddingTop: 9, borderTop: "1px solid var(--color-divider)" }}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                {l.name} ↗
              </a>
              <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)", textWrap: "pretty" }}>{l.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" data-tour="companion-screener" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 8 }}>
          Companion screener
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginBottom: 12, textWrap: "pretty" }}>
          Well-Beings is the day-to-day journal. The{" "}
          <a href={psychScreenerLink()} target="_blank" rel="noopener noreferrer">
            Psych Screener
          </a>{" "}
          is its companion app — the full clinical picture in six languages, with your score history kept over
          time and a guided conversation if you&apos;re not sure where to start. Free, private, on-device, same
          as this one. Go back and forth between them whenever it&apos;s useful.
        </div>
        <a
          href={psychScreenerLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ fontSize: 12.5 }}
        >
          Open Psych Screener →
        </a>
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

      <div className="card" data-tour="display-settings" style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 15, marginBottom: 4 }}>Display</div>
        <div style={{ fontSize: 12, color: "var(--color-neutral-500)", marginBottom: 14, textWrap: "pretty" }}>
          These stick to this device and apply everywhere in the app.
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginBottom: 8 }}>{s.language}</div>
          <div className="seg" role="radiogroup" aria-label={s.language}>
            {LANGS.map((l) => (
              <button
                key={l.value}
                className="seg-opt"
                role="radio"
                aria-checked={wb.settings.lang === l.value}
                data-checked={wb.settings.lang === l.value}
                onClick={() => wb.setLang(l.value as Lang)}
              >
                {l.native}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)", marginTop: 8, textWrap: "pretty" }}>
            {s.checkinEnglishOnly}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginBottom: 8 }}>Theme</div>
          <div className="seg" role="radiogroup" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t.value}
                className="seg-opt"
                role="radio"
                aria-checked={wb.settings.theme === t.value}
                data-checked={wb.settings.theme === t.value}
                onClick={() => wb.setTheme(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginBottom: 8 }}>Text size</div>
          <div className="seg" role="radiogroup" aria-label="Text size">
            {SIZES.map((sz) => (
              <button
                key={sz.value}
                className="seg-opt"
                role="radio"
                aria-checked={wb.settings.scale === sz.value}
                data-checked={wb.settings.scale === sz.value}
                onClick={() => wb.setScale(sz.value)}
                style={{ fontSize: sz.preview }}
              >
                {sz.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button
            className="switch"
            role="switch"
            aria-checked={wb.settings.contrast}
            aria-label="High contrast"
            data-on={wb.settings.contrast}
            onClick={() => wb.setContrast(!wb.settings.contrast)}
          >
            <span className="switch-knob" />
          </button>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>High contrast</div>
            <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)" }}>
              Maximum separation between text and background, with solid borders.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="switch"
            role="switch"
            aria-checked={wb.settings.showCitations}
            aria-label="Always show sources"
            data-on={wb.settings.showCitations}
            onClick={() => wb.setShowCitations(!wb.settings.showCitations)}
          >
            <span className="switch-knob" />
          </button>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Always show sources</div>
            <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)", textWrap: "pretty" }}>
              Off by default: a citation under every card turns into noise people stop reading. Sources are always
              one tap away, and the Evidence tab keeps all of them in full.
            </div>
          </div>
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
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-divider)" }}>
          <button className="btn btn-secondary" onClick={onReplayTour} style={{ fontSize: 12.5 }}>
            Show me around →
          </button>
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
