/* The first thing a new person sees, and on a phone the only thing above
   the fold besides the headline. It has one job: make the app feel like a
   place rather than a form, in the two seconds before anyone reads a word.

   Deliberately not a mascot or an illustration of a person — the app opens
   by asking about sleep, mood and burnout, and a cheerful character sets
   exactly the wrong expectation for that. A slow orbit reads as calm and
   as "a system", which is what's actually being offered.

   Everything is CSS on inline SVG: no canvas, no library, no image
   request, and it inherits the accent token so it recolours with the
   theme and with high contrast for free. Under prefers-reduced-motion the
   global rule freezes the animations, and the composition is built to
   stand still without looking broken — the rings are already offset from
   each other at rest. */
export function WelcomeAura({ size = 220 }: { size?: number }) {
  return (
    <div
      className="aura"
      aria-hidden="true"
      style={{ width: size, height: size, maxWidth: "100%", flex: "none" }}
    >
      <svg viewBox="0 0 220 220" width="100%" height="100%" role="presentation" focusable="false">
        <defs>
          <radialGradient id="auraCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.55" />
            <stop offset="60%" stopColor="var(--color-accent)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="auraRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.9" />
            <stop offset="55%" stopColor="var(--color-accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Soft glow behind everything, breathing on the same 10s cadence
            as the breathing pacer elsewhere in the app. */}
        <circle className="aura-glow" cx="110" cy="110" r="86" fill="url(#auraCore)" />

        {/* Three orbits at different tilts and speeds. The offsets are what
            keep it legible when motion is switched off. */}
        <g className="aura-orbit aura-orbit-1">
          <ellipse cx="110" cy="110" rx="88" ry="34" fill="none" stroke="url(#auraRing)" strokeWidth="1.25" />
          <circle cx="198" cy="110" r="3.5" fill="var(--color-accent)" />
        </g>
        <g className="aura-orbit aura-orbit-2">
          <ellipse cx="110" cy="110" rx="70" ry="70" fill="none" stroke="var(--color-accent)" strokeOpacity="0.28" strokeWidth="1" />
          <circle cx="110" cy="40" r="2.5" fill="var(--color-accent)" fillOpacity="0.8" />
        </g>
        <g className="aura-orbit aura-orbit-3">
          <ellipse cx="110" cy="110" rx="34" ry="88" fill="none" stroke="url(#auraRing)" strokeWidth="1.25" />
          <circle cx="110" cy="22" r="3" fill="var(--color-accent)" />
        </g>

        {/* The centre: steady, unhurried, the only thing that doesn't move.
            Reads as "you", with the system moving around it. */}
        <circle className="aura-core" cx="110" cy="110" r="13" fill="var(--color-accent)" fillOpacity="0.92" />
        <circle cx="110" cy="110" r="21" fill="none" stroke="var(--color-accent)" strokeOpacity="0.35" strokeWidth="1" />
      </svg>
    </div>
  );
}
