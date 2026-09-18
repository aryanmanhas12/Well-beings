# Wellbeings

A private, browser-only wellbeing check for sleep, movement, food and drink, stress, recovery,
mood, social connection, work or study load, screen use, routine and environment. It turns what
you report into two or three realistic changes, and it does not diagnose anything.

**Live app:** https://aryanmanhas12.github.io/Well-beings/
**About the author:** https://aryanmanhas12.github.io/Well-beings/me/ — Aryan Manhas, the
NeuroBioPsych vision, goals and ways to connect.
**Companion project:** [Ronak](https://aryanmanhas12.github.io/Psych/) — the dedicated
mental-health screening experience (PHQ-9 / GAD-7 / PHQ-4 / AUDIT-C in six languages).

Wellbeings and Ronak are deliberately separate products. Wellbeings is the broad
lifestyle picture and the daily system built from it; Ronak is the mental-health screen.
Wellbeings does not try to be the second one — when what someone describes looks like it needs a
proper mental-health screen, it says so and points there. The two apps share no data: moving
between them passes a single URL parameter naming the origin app and nothing else.

### The check-in

Two depths. **Quick** is about three minutes and covers the lifestyle picture. **Detailed** adds
hydration, evening screens, environment and sense of direction, plus the optional deeper
instruments. Answers save to `localStorage` on every tap, so a refresh resumes rather than losing
the form.

The read-out is a snapshot, not a score. There is no percentage, because no validated scale could
produce one from these questions. It separates four things that are usually run together:
observation (what you reported), interpretation (what that pattern may suggest, hedged),
recommendation (something to try, split across 24 hours / 7 days / longer), and medical concern
(the separate, clearly marked category for "a person, not an app, is the right next step").

### Public pages

`/` the check · `/guides/` six evidence-informed guides · `/resources/` helplines and directories ·
`/about/` what it is and is not · `/privacy/` exactly what is stored and where.

Everything runs in the browser. Answers, scores and check-ins live in `localStorage` — no account,
no server, no analytics, no third parties, no cookies. Region-local crisis helplines appear
instantly if the self-harm screener item flags, and are always one tap away.

> Wellbeings is a self-guidance tool, not a medical device. Its screeners signal — they don't
> diagnose. If you're struggling, [findahelpline.com](https://findahelpline.com) lists verified,
> free, 24/7 support lines for 130+ countries.

### Checks

`npm run verify` runs the typechecker, the linter, a production build and `scripts/audit-site.mjs`,
which asserts against the real export: unique titles and descriptions, self-referencing canonicals,
exactly one `<h1>` per page, no skipped heading levels, alt text on every image, valid JSON-LD that
never claims a medical schema type, no broken internal links, a sitemap that matches the built
pages, and correct brand spelling in visible copy.

## Repository layout

| Path | What it is |
| --- | --- |
| `well-beings/` | The app — Next.js 16 + TypeScript, statically exported |
| `project/` | The original Claude Design prototype this was built from |
| `chats/` | The design-session transcript (the intent behind the design) |
| `.github/workflows/deploy.yml` | Builds and publishes the app to GitHub Pages on every push to `main` |

## Develop

```bash
cd well-beings
npm install
npm run dev        # http://localhost:3000
```

## Build / deploy

Pushing to `main` triggers the GitHub Actions workflow, which builds a static export
(`NEXT_PUBLIC_BASE_PATH=/Well-beings npm run build` → `out/`) and deploys it to GitHub Pages.
First-time setup: if the workflow can't enable Pages itself, flip **Settings → Pages → Source**
to **GitHub Actions** once and re-run it.

## Evidence

Every practice in the app cites its meta-analysis, RCT or cohort study — 16 papers sourced via
Consensus/PubMed during the design session, browsable in the app's **Evidence** tab. Where the
evidence is young or mixed (e.g. breathwork), the app says so.
