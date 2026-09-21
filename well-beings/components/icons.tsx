import { CSSProperties } from "react";

interface IconProps {
  size?: number;
  style?: CSSProperties;
}

/**
 * The wordmark's glyph, and the same mark as the app icon: four bars,
 * descending, the first one picked out.
 *
 * It used to be a heart with an ECG trace through it — the stock icon of
 * every health app, and a medical signifier on a product that is explicitly
 * not medical. This is the shape of what the app actually produces: your
 * areas, sorted, with one named as the place to start.
 *
 * Drawn with currentColor for the three quiet bars so it inherits whatever
 * the header text is, and the accent token for the first one, so the mark
 * stays legible in both themes and in high contrast without a second asset.
 */
export function LogoIcon({ size = 18, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden="true">
      <rect x="3" y="4" width="18" height="3.6" rx="1" fill="var(--color-accent)" />
      <rect x="3" y="9.4" width="13.3" height="3.6" rx="1" fill="currentColor" opacity="0.75" />
      <rect x="3" y="14.8" width="9" height="3.6" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="3" y="20.2" width="5.2" height="3.6" rx="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function ShieldIcon({ size = 13, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ size = 11, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function CheckIcon({ size = 11, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M5 13l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GearIcon({ size = 15, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function InfoIcon({ size = 16, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v5M12 16v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
