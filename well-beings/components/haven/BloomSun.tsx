import type { CSSProperties } from "react";

/**
 * The bloom-sun: a sun with petals instead of rays.
 *
 * It is the one image the whole app is built around, and it carries the
 * idea in a single shape: something coming up after a dark night, and
 * something that grows. Rays would read as weather; petals read as alive.
 *
 * It draws the sun rising in the sky, the first-visit intro and the
 * breathing sun. It is the app's illustration, not its logo: the logo is
 * the sun rising out of a window (components/ArunMark.tsx), from the Arun
 * logo canvas. Eight petals, alternating dawn pink and lilac, behind a sun
 * disc.
 *
 * `open` unfolds the petals from the centre, 0 to 1, for the intro. The
 * transform is on each petal's own group, so it animates on the compositor.
 */
export const PETALS = 8;

export function BloomSun({
  size = 28,
  open = 1,
  className,
  style,
  title,
}: {
  size?: number;
  open?: number;
  className?: string;
  style?: CSSProperties;
  /** When set, the mark is announced; otherwise it is decorative. */
  title?: string;
}) {
  const s = Math.max(0, Math.min(1, open));
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {Array.from({ length: PETALS }, (_, i) => (
        <g key={i} transform={`rotate(${i * (360 / PETALS)} 32 32)`}>
          <ellipse
            className="bloom-petal"
            cx="32"
            cy="15.5"
            rx="6.6"
            ry="11.5"
            fill={i % 2 ? "var(--bloom-b, #B794FF)" : "var(--bloom-a, #FF7AB0)"}
            style={{
              transformOrigin: "32px 32px",
              transform: `scale(${0.35 + 0.65 * s})`,
              ["--i" as string]: i,
            }}
          />
        </g>
      ))}
      <circle cx="32" cy="32" r="11.5" fill="var(--bloom-sun, #FFC857)" />
      <circle cx="32" cy="32" r="6.5" fill="var(--bloom-core, #FFE3A1)" opacity="0.85" />
    </svg>
  );
}
