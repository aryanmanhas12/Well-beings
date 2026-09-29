# AGENTS.md — Arun (repository root)

The app lives in `well-beings/` (Next.js, statically exported to this
branch's root by `.github/workflows/deploy.yml`). Its real instructions are
in **`well-beings/AGENTS.md`**: read that first, every session.

## Skills (`.claude/skills/`, shared with the sister app Ronak)
1. Visual work: read the design source of truth first
   (`well-beings/DESIGN.md`, tokens copied from `app/globals.css`), then
   `design-taste-frontend` (brief, then the three dials); add
   `high-end-visual-design` for calm, premium polish.
2. Changing what exists: `redesign-existing-projects` (audit first).
3. From a picture or screenshot: `image-to-code`.
4. Motion and micro-interactions: `animated-ui-libraries` (Aceternity UI,
   Cult UI and Componentry install here through the shadcn CLI; see the
   skill for the rules they must follow in Arun).
5. Review: `web-design-guidelines` (fetch the live Vercel rules).
6. See it: `playwright-cli`.
7. Long output: `full-output-enforcement`.
8. Design tokens: `design-md`.
9. Before every commit: `arun-ship-check` (verify, `npm run e2e`, speed
   on a slowed phone, `npm run publish:root`, confirm the deploy).

Ooh is shared with Ronak: `well-beings/lib/ooh.mjs` is the original, and
Ronak keeps a byte-identical copy. Change it here, then copy it there.
