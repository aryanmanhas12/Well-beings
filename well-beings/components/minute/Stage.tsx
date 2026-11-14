"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type StageEnergy = "bright" | "calm";

/**
 * The full-screen stage the minute and the reel play on.
 *
 * Built like the game's layer and for the same reasons: into the body
 * through a portal (a room slides in on a transform, which would trap a
 * fixed layer inside the room), below the crisis strip, which stays on
 * screen above it, and with "Help now" in its own bar, opening the urgent
 * screen over it. Escape and the back chip leave at once, and nothing is
 * kept from a minute left half way.
 *
 * The colours follow the day (lib/care.ts, energyFor): a full sunrise with
 * plum ink on an okay day, dusk with cream type on a low or heavy one.
 * Measured: ink #2A1636 on sun #FFC857 10.78:1, on peach #FF9F80 8.31:1,
 * on pink #FF7AB0 6.84:1, on paper #FFF5EC 15.42:1; cream #FFF4E8 on dusk
 * #1B0F33 16.65:1, on #26164A 14.94:1, on #5A2470 10.08:1.
 */
export function Stage({
  label,
  energy,
  backLabel,
  helpLabel,
  progress,
  onClose,
  openUrgent,
  children,
}: {
  label: string;
  energy: StageEnergy;
  backLabel: string;
  helpLabel: string;
  progress?: { n: number; total: number; label: string };
  onClose: () => void;
  openUrgent: () => void;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const measure = () => setTop(document.querySelector(".crisis-strip")?.getBoundingClientRect().bottom ?? 0);
    measure();
    window.addEventListener("resize", measure);
    /* The same lock as the game: only the root, so the sticky crisis strip
       stays where it is. */
    document.documentElement.classList.add("game-open");
    root.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      /* The urgent screen and the help dialog open over this and have
         their own Escape. */
      if (document.querySelector(".urgent, .dialog-backdrop")) return;
      if (e.key === "Escape") {
        close.current();
        return;
      }
      if (e.key !== "Tab" || !root.current) return;
      const items = [...root.current.querySelectorAll<HTMLElement>('button, [href], input, summary, [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const at = document.activeElement;
      if (e.shiftKey && (at === first || at === root.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && at === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", measure);
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("game-open");
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="stage" data-energy={energy} role="dialog" aria-modal="true" aria-label={label} ref={root} tabIndex={-1} style={{ top }}>
      <div className="stage-top">
        <button type="button" className="stage-chip" onClick={onClose}>
          <span aria-hidden="true">←</span> {backLabel}
        </button>
        {progress && (
          <div className="stage-progress" role="img" aria-label={progress.label}>
            {Array.from({ length: progress.total }, (_, i) => (
              <i key={i} data-on={i < progress.n} />
            ))}
          </div>
        )}
        <button type="button" className="stage-chip stage-help" onClick={openUrgent}>
          {helpLabel}
        </button>
      </div>
      <div className="stage-body">{children}</div>
    </div>,
    document.body,
  );
}
