import { useEffect, useRef } from "react";
import { HelplineRegion } from "@/lib/types";
import { GLOBAL_LINKS } from "@/lib/helplines";
import { Lang, t } from "@/lib/i18n";
import { HelplineList } from "./HelplineList";

/**
 * Escape closes, focus moves into the dialog on open and returns to whatever
 * opened it on close, and background scrolling is locked. Someone reaching the
 * crisis dialog may be doing it by keyboard, in a hurry — it has to behave.
 */
export function useDialogBehaviour(onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button, [href]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      // Keep Tab inside the dialog while it's open.
      const items = ref.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [onClose]);

  return ref;
}

export function HelpDialog({
  region,
  lang = "en",
  onClose,
}: {
  region: HelplineRegion;
  lang?: Lang;
  onClose: () => void;
}) {
  const ref = useDialogBehaviour(onClose);
  const s = t(lang);
  const links = [...region.links, ...GLOBAL_LINKS];
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
        aria-label="Help, right now"
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
            marginBottom: 4,
          }}
        >
          {s.helpTitle}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-neutral-400)", marginBottom: 6 }}>{s.helpSub}</div>
        <div style={{ fontSize: 11, color: "var(--color-neutral-600)", marginBottom: 8 }}>{region.label}</div>

        <HelplineList lines={region.lines} />

        <div style={{ fontSize: 11.5, color: "var(--color-neutral-600)", margin: "12px 0 6px" }}>
          {s.emergencyNote}
        </div>

        {links.length > 0 && (
          <details style={{ margin: "6px 0 14px" }}>
            <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--color-accent-400)" }}>
              {s.moreResources}
            </summary>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
              {links.map((l) => (
                <div key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5 }}>
                    {l.name} ↗
                  </a>
                  <div style={{ fontSize: 11.5, color: "var(--color-neutral-500)", textWrap: "pretty" }}>{l.note}</div>
                </div>
              ))}
            </div>
          </details>
        )}

        <button className="btn btn-primary" onClick={onClose} style={{ width: "100%" }}>
          {s.helpClose}
        </button>
      </div>
    </div>
  );
}

export function BreathDialog({ onClose }: { onClose: () => void }) {
  const ref = useDialogBehaviour(onClose);
  return (
    <div
      className="dialog-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,11,20,.72)",
        backdropFilter: "blur(6px)",
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
        aria-label="Cyclic sighing"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 400,
          width: "100%",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          padding: 28,
          textAlign: "center",
          maxHeight: "calc(100dvh - 40px)",
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 17, marginBottom: 2 }}>
          Cyclic sighing
        </div>
        <div style={{ fontSize: 12, color: "var(--color-neutral-500)", marginBottom: 22 }}>
          Follow the ring · ~6 breaths is enough to shift state
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 170, marginBottom: 20 }}>
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: "50%",
              border: "2px solid var(--color-accent-500)",
              boxShadow:
                "0 0 40px color-mix(in srgb, var(--color-accent) 25%, transparent), inset 0 0 30px color-mix(in srgb, var(--color-accent) 15%, transparent)",
              animation: "breatheRing 10s ease-in-out infinite",
            }}
            className="breathe-ring"
            aria-hidden="true"
          />
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--color-neutral-300)",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 20,
          }}
        >
          <div>
            <span style={{ color: "var(--color-accent-300)", fontWeight: 500 }}>1.</span> Inhale through the nose…
          </div>
          <div>
            <span style={{ color: "var(--color-accent-300)", fontWeight: 500 }}>2.</span> …then a second, shorter
            sip of air on top
          </div>
          <div>
            <span style={{ color: "var(--color-accent-300)", fontWeight: 500 }}>3.</span> Long, slow exhale through
            the mouth (the ring shrinking)
          </div>
        </div>
        <button className="btn btn-primary" onClick={onClose} style={{ width: "100%" }}>
          Done
        </button>
      </div>
    </div>
  );
}
