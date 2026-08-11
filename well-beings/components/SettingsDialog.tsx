import { PlanIntensity } from "@/lib/types";
import { Theme } from "@/lib/storage";
import { Lang, LANGS } from "@/lib/i18n";
import { WellBeings } from "@/hooks/useWellBeings";
import { useDialogBehaviour } from "./dialogs";

/**
 * Quick settings, reachable from the header on every screen.
 *
 * A version of this existed on the welcome-screen branch and was dropped in
 * the merge. It's restored here, but rewired: the original kept its own
 * copy of theme/contrast/scale in a separate `well-beings-prefs` key and
 * wrote it with its own save function, in parallel with the app's real
 * settings in `wellbeings-v1`. Two stores for one set of preferences means
 * whichever screen you changed them on last silently won — so this reads and
 * writes the canonical store through `wb`, and every control applies
 * immediately rather than behind a Save button.
 *
 * Display & privacy in Help still has the full set with explanations; this is
 * the fast path, which matters most on a phone where Help is several taps and
 * a scroll away.
 */

const THEMES: { value: Theme; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const SIZES: { value: number; label: string; preview: number }[] = [
  { value: 1, label: "A", preview: 13 },
  { value: 1.15, label: "A", preview: 15 },
  { value: 1.35, label: "A", preview: 17 },
];

const INTENSITIES: { value: PlanIntensity; label: string }[] = [
  { value: "gentle", label: "Gentle" },
  { value: "balanced", label: "Balanced" },
  { value: "driven", label: "Driven" },
];

export function SettingsDialog({ wb, onClose }: { wb: WellBeings; onClose: () => void }) {
  const ref = useDialogBehaviour(onClose);
  const s = wb.s;

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
        ref={ref}
        className="dialog anim-in"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 440,
          width: "100%",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          padding: 24,
          maxHeight: "calc(100dvh - 40px)",
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "var(--font-display-tracking)",
            fontSize: 24,
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Settings
        </div>

        <Row label={s.language}>
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
        </Row>

        <Row label="Theme">
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
        </Row>

        <Row label="Text size">
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
        </Row>

        {wb.profile && (
          <Row label="Plan intensity">
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
                </button>
              ))}
            </div>
          </Row>
        )}

        <Toggle
          label="High contrast"
          hint="Maximum separation between text and background."
          on={wb.settings.contrast}
          onChange={() => wb.setContrast(!wb.settings.contrast)}
        />
        <Toggle
          label="Calm mode"
          hint="Scores and streak numbers become words."
          on={wb.settings.calmMode}
          onChange={() => wb.setCalmMode(!wb.settings.calmMode)}
        />
        <Toggle
          label="Always show sources"
          hint="Off keeps citations one tap away instead of under every card."
          on={wb.settings.showCitations}
          onChange={() => wb.setShowCitations(!wb.settings.showCitations)}
        />

        <button className="btn btn-primary" onClick={onClose} style={{ width: "100%", marginTop: 18 }}>
          {s.helpClose}
        </button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <button
        className="switch"
        role="switch"
        aria-checked={on}
        aria-label={label}
        data-on={on}
        onClick={onChange}
        style={{ flex: "none" }}
      >
        <span className="switch-knob" />
      </button>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)", textWrap: "pretty" }}>{hint}</div>
      </div>
    </div>
  );
}
