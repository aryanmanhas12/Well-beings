import type { SceneKind } from "@/lib/havenContent";

/**
 * Wordless pictures for the featured videos, one idea each, drawn in the
 * dawn palette. Ronak's scenes picture the turn each check-in hopes for (a
 * spark, a sunrise, a bud opening); these picture what each talk is about,
 * so the card says something before anyone reads it.
 *
 *   light    a beam finding a bud: someone sees something in you
 *   ripple   rings spreading from one small drop: a small act travels
 *   window   one lit window on a dark hill: the people who loved you
 *   circles  two circles of light overlapping: a good life is people
 *
 * All decorative (aria-hidden); the card's heading carries the meaning.
 * Gradient ids are suffixed per kind so two scenes on one page never
 * share a <defs> id, which in SVG silently makes one borrow the other's.
 */
export function SceneArt({ kind, className }: { kind: SceneKind; className?: string }) {
  const id = `sa-${kind}`;
  return (
    <svg className={className} viewBox="0 0 360 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-halo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFC857" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFC857" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE3A1" stopOpacity="0.8" />
          <stop offset="1" stopColor="#FFE3A1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="30" r="1.6" fill="#FFF4DE" />
      <circle cx="300" cy="24" r="2" fill="#FFF4DE" opacity="0.8" />
      <circle cx="326" cy="70" r="1.5" fill="#FFF4DE" opacity="0.7" />
      <circle cx="30" cy="84" r="1.4" fill="#FFF4DE" opacity="0.6" />

      {kind === "light" && (
        <g>
          <path d="M171 0 L189 0 L262 170 L98 170 Z" fill={`url(#${id}-beam)`} />
          <circle cx="180" cy="128" r="50" fill={`url(#${id}-halo)`} />
          <path d="M180 170 C 180 150, 179 138, 180 124" stroke="#62D6A5" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M180 148 C 168 144, 161 135, 162 126 C 172 128, 179 137, 180 148 Z" fill="#62D6A5" />
          <path d="M180 124 C 170 111, 172 97, 180 88 C 188 97, 190 111, 180 124 Z" fill="#FF7AB0" />
          <path d="M180 124 C 175 113, 177 102, 182 95 C 186 106, 186 115, 180 124 Z" fill="#FFB3D1" />
        </g>
      )}

      {kind === "ripple" && (
        <g fill="none" strokeLinecap="round">
          <circle cx="180" cy="120" r="54" fill={`url(#${id}-halo)`} />
          <ellipse cx="180" cy="124" rx="120" ry="34" stroke="#B794FF" strokeWidth="2" opacity="0.35" />
          <ellipse cx="180" cy="124" rx="84" ry="24" stroke="#FF7AB0" strokeWidth="2.5" opacity="0.55" />
          <ellipse cx="180" cy="124" rx="48" ry="14" stroke="#FF9F80" strokeWidth="3" opacity="0.8" />
          <ellipse cx="180" cy="124" rx="16" ry="5" stroke="#FFC857" strokeWidth="3" />
          <circle cx="180" cy="84" r="7" fill="#FFC857" stroke="none" />
          <path d="M180 92 L180 112" stroke="#FFE3A1" strokeWidth="2" strokeDasharray="2 5" />
        </g>
      )}

      {kind === "window" && (
        <g>
          <path d="M0 150 C 80 120, 200 118, 360 140 L 360 170 L 0 170 Z" fill="#170A2B" />
          <circle cx="182" cy="112" r="56" fill={`url(#${id}-halo)`} />
          <path d="M148 150 L148 110 L182 84 L216 110 L216 150 Z" fill="#241046" />
          <rect x="170" y="112" width="24" height="22" rx="3" fill="#FFC857" />
          <path d="M182 112 L182 134 M170 123 L194 123" stroke="#E0A93E" strokeWidth="2" />
          <path d="M194 134 L250 170 L114 170 L170 134 Z" fill="#FFC857" opacity="0.14" />
        </g>
      )}

      {kind === "circles" && (
        <g>
          <circle cx="180" cy="104" r="70" fill={`url(#${id}-halo)`} />
          <circle cx="156" cy="104" r="42" fill="#FF7AB0" opacity="0.55" />
          <circle cx="204" cy="104" r="42" fill="#62D6A5" opacity="0.55" />
          <circle cx="180" cy="104" r="10" fill="#FFE3A1" />
        </g>
      )}
    </svg>
  );
}

/** A background for each scene, all within the night-to-dawn range. The
    words sit in the lower half, so the bottom stops were measured, not the
    top: cream text is at least 6.45:1 on every one of them, and the
    pale-gold kicker (#FFE3A1) at least 5.59:1. The first draft ended "light" at #A8436F
    and a gold kicker on it came in at 4.20:1. */
export const SCENE_BG: Record<SceneKind, string> = {
  light: "linear-gradient(165deg, #26124F 0%, #5A2470 58%, #8E3868 100%)",
  ripple: "linear-gradient(165deg, #1D1142 0%, #3B1D63 55%, #8A3F6A 100%)",
  window: "linear-gradient(165deg, #150B2E 0%, #2A1650 60%, #5A2470 100%)",
  circles: "linear-gradient(165deg, #1B1040 0%, #26315A 55%, #285E57 100%)",
};
