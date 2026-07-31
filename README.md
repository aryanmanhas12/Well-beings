# Well-Beings

A privacy-first productivity and mental well-being app for teens and young adults — a 5-minute,
chat-style check-in built on the same short screeners clinicians use (PHQ-2→9, GAD-2→7, sleep,
burnout), which then generates a personalised daily system: a time-blocked schedule, evidence-cited
intervention cards, a habit stack, a weekly recovery quota and a burnout radar.

**Live app:** https://aryanmanhas12.github.io/Well-beings/
**About the author:** https://aryanmanhas12.github.io/Well-beings/me/ — Aryan Manhas, the
NeuroBioPsych vision, goals and ways to connect.
**Companion project:** [Psych Screener](https://aryanmanhas12.github.io/Psych/) — the wider,
shallower net (PHQ-9 / GAD-7 / PHQ-4 / AUDIT-C in six languages). Well-Beings is the
follow-through for someone who has a result and wants a routine built around it; the `/me`
page shares its design system so the two read as one body of work.

Everything runs in the browser. Answers, scores and check-ins live in `localStorage` — no account,
no server, no analytics, no third parties. Region-local crisis helplines are shown instantly if the
self-harm screener item flags, and are always one tap away under "Help now".

> Well-Beings is a self-guidance tool, not a medical device. Its screeners signal — they don't
> diagnose. If you're struggling, [findahelpline.com](https://findahelpline.com) lists verified,
> free, 24/7 support lines for 130+ countries.

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
