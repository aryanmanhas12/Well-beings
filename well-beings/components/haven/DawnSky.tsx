import type { CSSProperties, ReactNode } from "react";
import { BloomSun } from "./BloomSun";

/**
 * The sky at the top of the safe place.
 *
 * It starts every day as night and gets lighter with each small thing the
 * person does for themselves: checking in, breathing, writing one good
 * thing. Five of those is a full sunrise. Nothing is ever taken away; a
 * skipped day is simply a new night, not a broken streak.
 *
 * All of the colour comes from one number, --dawn, registered with
 * @property in globals.css so the browser can interpolate it. Changing it
 * transitions the whole sky at once without React re-rendering anything
 * but a style attribute.
 *
 * The stars are placed by hand rather than at random: random positions
 * differ between the server render and the client, and a sky that
 * rearranges itself on load is the opposite of calm. The star layer is
 * masked to fade out on the left, where the words are; an early version
 * put a star on the dot of an "i" and it read as a typo.
 */
const STARS: [number, number, number, number][] = [
  [62, 10, 1.5, 0], [70, 26, 2, 1.2], [77, 8, 1.5, 2.4], [84, 20, 2, 0.6],
  [91, 9, 1.5, 3.1], [96, 30, 1.5, 1.8], [88, 40, 2, 2.2], [74, 44, 1.5, 0.3],
  [81, 55, 1.5, 1.5], [93, 60, 2, 2.8], [66, 58, 1.5, 0.9], [58, 34, 1.5, 2.6],
];

export function DawnSky({
  dawn,
  children,
  label,
}: {
  /** 0 = night, 1 = full sunrise. */
  dawn: number;
  children?: ReactNode;
  /** Spoken description of the sky, for screen readers. */
  label: string;
}) {
  return (
    <section className="sky" style={{ "--dawn": dawn } as CSSProperties} aria-label={label}>
      <div className="sky-stars" aria-hidden="true">
        {STARS.map(([x, y, r, d], i) => (
          <span key={i} style={{ left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, animationDelay: `${d}s` }} />
        ))}
      </div>
      <div className="sky-glow" aria-hidden="true" />
      <div className="sky-sun" aria-hidden="true">
        <BloomSun size={148} />
      </div>
      <Hills />
      <div className="sky-content">{children}</div>
    </section>
  );
}

export function Hills({ className = "sky-hills" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="hill-back" d="M0 52 C 60 30, 110 34, 170 48 S 290 26, 400 40 L 400 90 L 0 90 Z" />
      <path className="hill-front" d="M0 70 C 70 52, 140 58, 210 66 S 330 54, 400 62 L 400 90 L 0 90 Z" />
    </svg>
  );
}
