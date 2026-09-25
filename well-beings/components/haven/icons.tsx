import type { SVGProps } from "react";

/**
 * Tab icons for the safe place, drawn for it rather than pulled from a set.
 *
 * Each is one idea at 24px on a 1.7px stroke, with round joins so they sit
 * with the petals of the bloom-sun rather than against them. They are
 * decorative: every one is paired with a visible word, and the word is what
 * a screen reader reads.
 */
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: "false" as const,
};

/** Here: a sun on the horizon. */
export function HereIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M3 17h18" />
      <path d="M7.5 17a4.5 4.5 0 0 1 9 0" />
      <path d="M12 7.5v2M6.2 10.2l1.4 1.4M17.8 10.2l-1.4 1.4" />
      <path d="M6 20.5h12" opacity=".55" />
    </svg>
  );
}

/** Calm: a slow wave, like a breath drawn out. */
export function CalmIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M3 10c2.2-2.4 4.4-2.4 6.6 0s4.4 2.4 6.6 0 3.3-1.8 4.8-.6" />
      <path d="M3 15.5c2.2-2.4 4.4-2.4 6.6 0s4.4 2.4 6.6 0 3.3-1.8 4.8-.6" opacity=".6" />
    </svg>
  );
}

/** Watch: a screen with a play mark. */
export function WatchIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="4" />
      <path d="M10.5 9.5v5l4.5-2.5Z" fill="currentColor" />
    </svg>
  );
}

/** Hope: a small bloom. */
export function HopeIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="10" r="2.2" />
      <path d="M12 7.8C10.6 5.6 12 3.4 12 3.4s1.4 2.2 0 4.4Z" />
      <path d="M14.2 10c2.2-1.4 4.4 0 4.4 0s-2.2 1.4-4.4 0Z" />
      <path d="M9.8 10C7.6 11.4 5.4 10 5.4 10s2.2-1.4 4.4 0Z" />
      <path d="M12 12.2v8.3" />
      <path d="M12 17c1.6-2 3.8-2 3.8-2s-.6 2.6-3.8 2" />
    </svg>
  );
}

/** Plan: a path with a marker, the way through. */
export function PlanIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M5 20c0-4 3.5-4.5 7-5s7-1.5 7-5" />
      <circle cx="5" cy="20" r="1.2" />
      <path d="M19 8.8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3c0 2.2-3 5-3 5" />
    </svg>
  );
}

/** Reach out: two hands meeting. Kept as two simple arcs. */
export function ReachIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M4 14.5c2.4-.2 3.6-1.8 5.4-1.8h3.1a1.5 1.5 0 0 1 0 3H10" />
      <path d="M12.5 15.7h3.8l3.9-3a1.4 1.4 0 0 1 1.8 2.1l-4.4 4.2c-.7.6-1.5.9-2.4.9H9.5c-1 0-1.7.5-2.4 1" />
      <path d="M14.5 5.2c.9-1.2 3-1 3.2.8.2 1.6-2.1 3-3.2 3.8-1.1-.8-3.4-2.2-3.2-3.8.2-1.8 2.3-2 3.2-.8Z" />
    </svg>
  );
}

export function PlayIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M8 5.5v13l10.5-6.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PhoneIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M5 4.5h3.2l1.6 4-2 1.3a10.5 10.5 0 0 0 6.4 6.4l1.3-2 4 1.6V19a1.5 1.5 0 0 1-1.6 1.5C10.4 20 4 13.6 3.5 6.1A1.5 1.5 0 0 1 5 4.5Z" />
    </svg>
  );
}
