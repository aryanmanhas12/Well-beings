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

/** Me: a person with head and shoulders. */
export function MeIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.5 20.5c.6-4.2 3.6-6.4 7.5-6.4s6.9 2.2 7.5 6.4" />
    </svg>
  );
}

/** The eight tensions of One minute (lib/minute.ts), one small idea each. */
export function TopicIcon({ id, ...p }: SVGProps<SVGSVGElement> & { id: string }) {
  const d: Record<string, string[]> = {
    /* an open book */
    studies: ["M12 6.5c-2-1.4-4.6-1.8-7.5-1.5v13c2.9-.3 5.5.1 7.5 1.5 2-1.4 4.6-1.8 7.5-1.5V5c-2.9-.3-5.5.1-7.5 1.5Z", "M12 6.5v13"],
    /* a bag with a clasp */
    work: ["M4 8.5h16v10.5H4z", "M9 8.5V6.2h6v2.3", "M4 13h16", "M12 12v2"],
    /* a house */
    family: ["M4 11.5 12 5l8 6.5", "M6.5 10v9h11v-9", "M10.5 19v-5h3v5"],
    /* a heart */
    love: ["M12 19.5c-4.6-3-7.5-5.7-7.5-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7.5 2.3c0 3.5-2.9 6.2-7.5 9.2Z"],
    /* a pulse */
    health: ["M3 12.5h4l2-5 3.5 10 2.5-7 1.5 2H21"],
    /* a moon and one star */
    alone: ["M17.5 14.5A7 7 0 0 1 9.5 5a7 7 0 1 0 8 9.5Z", "M17 5.5v2.5M15.8 6.7h2.5"],
    /* a hand mirror */
    self: ["M12 13.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z", "M12 13.5V21", "M9.5 17.5h5"],
    /* a cloud */
    unsure: ["M7.5 18.5h9.5a3.5 3.5 0 0 0 .4-7 5.5 5.5 0 0 0-10.6-1.3A4.2 4.2 0 0 0 7.5 18.5Z"],
  };
  return (
    <svg {...base} {...p}>
      {(d[id] ?? d.unsure).map((path, i) => (
        <path key={i} d={path} />
      ))}
    </svg>
  );
}
