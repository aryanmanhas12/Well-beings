# Well-Beings

A privacy-first productivity and mental-wellbeing web app, implemented in Next.js from the Claude Design handoff in `../project/Well-Beings.dc.html`.

- **Check-in chat** — adaptive, evidence-based screeners (PHQ-2→9, GAD-2→7, sleep composite, burnout) in a chat interface; deeper questions only when something flags.
- **Crisis safety** — region-local helplines surface instantly on the self-harm item, on the results screen, and behind the always-visible "Help now" button.
- **Results read-out** — scored domains with bands, sources, and a "seek support" nudge when scores warrant it.
- **Personalised system** — time-blocked daily schedule, evidence-cited intervention cards, habit stack with miss-forgiving streaks, weekly recovery quota, burnout radar fed by daily check-ins, and a 16-study evidence library.
- **Settings** — plan intensity (gentle / balanced / driven) and calm mode (numbers become words), both on the Help & privacy tab.
- **Privacy** — entirely client-side. All state lives in `localStorage` (`wellbeings-v1`); no server, no accounts, no third parties. One-tap delete.

## Run

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production build
npm run lint
```

## Structure

- `app/` — Next.js App Router entry; `globals.css` carries the Nocturne design-system tokens and component classes.
- `lib/` — pure logic: chat flow, scoring, schedule/intervention builders, helplines, evidence data, localStorage persistence.
- `hooks/useWellBeings.ts` — all app state: chat engine, screens/tabs, check-ins, habits, settings.
- `components/` — screens (Welcome, Chat, Results, App shell + 5 tabs) and dialogs (help, breathing).

Not a medical device — screeners signal, they don't diagnose. Helpline numbers current as of mid-2026; re-verify before any real release.
