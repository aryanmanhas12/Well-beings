---
name: animated-ui-libraries
description: Use when adding motion, micro-interactions or "wow" components (spotlight cards, moving borders, text reveals, 3D tilt, beams, sparkles, docks, marquees) to Ronak or Arun, or when the user mentions Aceternity UI, Cult UI, Componentry, shadcn registries or 21st.dev. Says how to install these React libraries in a React/Next.js app (Arun) and how to port an effect to Ronak's vanilla, compositor-only motion rules instead of importing React.
---

# Animated UI libraries: Aceternity UI, Cult UI, Componentry

Three copy-paste component libraries the owner wants used for motion and
micro-interactions. All three are React + Tailwind + Motion (Framer Motion)
and ship through the shadcn CLI. Which way you use them depends on the app.

| Library | Site | Source / licence | How it installs |
|---|---|---|---|
| Aceternity UI | ui.aceternity.com | free components (Pro set is paid) | add `"@aceternity": "https://ui.aceternity.com/registry/{name}.json"` to `components.json` registries, then `npx shadcn@latest add @aceternity/<name>` (e.g. `typewriter-effect`); CLI docs: ui.aceternity.com/docs/cli |
| Cult UI | cult-ui.com | github.com/nolly-studio/cult-ui, MIT | add `"@cult-ui": "https://cult-ui.com/r/{name}.json"` to `components.json` registries, then `npx shadcn@latest add @cult-ui/<name>` (their docs show `shadcn@beta`); docs: cult-ui.com/docs/installation |
| Componentry | componentry.dev | github.com/harshjdhv/componentry, MIT (image-trail and layered-stack need GSAP, own licence) | add `"@componentry": "https://componentry.fun/r/{name}.json"` to `components.json` registries, then `npx shadcn@latest add @componentry/<name>`; also usable over MCP (componentry.dev/docs/mcp) |

Manus (manus.im) appeared alongside these in the same video. It is not a
component library: it is an autonomous general agent (research, slides,
websites) that runs in its own cloud computer. Nothing to install here; use it
for outside research or throwaway prototypes, never as a source of truth for
clinical wording.

## Which app, which route

### Arun (Next.js 16 + TypeScript, `well-beings/`)
It can take these components directly. Before adding one:
1. Check it is not already covered by something in `components/`.
2. Install through the shadcn CLI so the source lands in the repo (it is then
   ours to edit, not a runtime dependency).
3. Strip anything that fights Arun's rules in its `AGENTS.md`: no motion that
   does not stop under `prefers-reduced-motion`, nothing that covers the
   first-screen actions, no autoplaying sound.
4. Run Arun's `npm run verify` and its end-to-end checks.

### Ronak (vanilla HTML/CSS/JS, no build step, GitHub Pages)
Do NOT add React, Tailwind or Motion to Ronak. Port the *effect*:
1. Read the component's source (its TSX shows exactly what moves).
2. Re-express it as CSS keyframes/transitions on `transform` and `opacity`
   of HTML elements, driven by a class or a CSS custom property.
3. Obey the rules that Ronak paid for in measurements (see `site.css`,
   `app.css`, `companion.js` comments):
   - Animate HTML layers, never groups inside an inline SVG. SVG-child
     animation and the individual `rotate:`/`scale:` properties run on the
     main thread; a CSS `transform` keyframe on an HTML element runs on the
     compositor. Measured: ~2.5s of main thread per 4s idle before, ~30ms after.
   - Never leave `transform-box`/`transform-origin` rules permanently on SVG
     children inside an animated layer (cost ~300ms/4s on a 4x-throttled phone).
   - Idle loops only run while on screen (IntersectionObserver `.live`).
   - Everything stops under `prefers-reduced-motion` and in `html.lite`
     (2GB-memory phones, Data Saver).
   - Pointer-driven effects (spotlight, tilt, magnetic) only for
     `(hover: hover) and (pointer: fine)`; phones get the tap ring instead.
   - No layout shift: reserve space; test/mobile.js fails the build at CLS 0.1.
   - Never on the self-harm safety step, never beside the questionnaire items.
4. Measure: 4x CPU throttle, idle main-thread TaskDuration over 4s (see the
   `ronak-ship-check` skill). A new effect may not add more than ~15ms/4s.

## Effect catalogue and where each belongs in Ronak

| Effect (library name) | What it is | Ronak use | Vanilla recipe |
|---|---|---|---|
| Card Spotlight / Glowing card (Aceternity), Direction-aware hover (Cult) | a soft light follows the pointer across a card | check-in cards, working-paper cards, desktop only | `pointermove` writes `--mx/--my` on the hovered card only (rAF-gated); a `::after` radial-gradient at those coords, opacity transition on hover |
| Moving Border (Aceternity), Shimmer/Glow button (Cult) | a light runs around a button edge | the one primary action on a screen (Begin, a check-in start) | an absolutely positioned `::before` with a conic-gradient, masked to a ring, rotating via `transform: rotate()` keyframes |
| Text Generate Effect (Aceternity), Text animate (Cult) | words fade/rise in one after another | a view's h1 as it opens | split into word spans once, stagger `animation-delay`, opacity + translateY only; skip under reduced motion |
| 3D Card Effect (Aceternity), Tilt (Componentry) | card tilts toward the pointer | working-paper cards (`.bcard`) on desktop | `transform: perspective() rotateX/Y` from pointer position on that card; reset on leave |
| Background Beams / Meteors / Shooting stars (Aceternity) | light streaks across a dark field | the hero night sky already has `.hs-shoot`; do not add more | — |
| Sparkles (Aceternity) | twinkling particles | only moments of genuine achievement; never on a score result | — |
| Magnetic Dock (Componentry) | icons scale toward the pointer | desktop nav only, if ever | — |
| Number Ticker (Cult/Magic UI) | numbers count up | `#statBand` already does this (`countUpWhenSeen`) | — |
| Infinite moving cards / marquee | endless horizontal scroll | not in Ronak: motion that never stops is wrong for this audience | — |

## Tone check before shipping any effect
Ronak is for people who may be struggling. An effect is right only if it makes
an action clearer or a moment calmer. If it only adds sparkle, leave it out.
Pair with `design-taste-frontend` (brief first, dials: DESIGN_VARIANCE 4,
MOTION_INTENSITY 5, VISUAL_DENSITY 3 for Ronak) and review with
`web-design-guidelines` afterwards.
