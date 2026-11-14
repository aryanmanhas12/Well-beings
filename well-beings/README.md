# Arun (app)

The Next.js app behind https://aryanmanhas12.github.io/Well-beings/. See the repository
[README](../README.md) for what it is; this file is for working on it.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run verify     # care, Ooh, game and minute tests, types, lint, production build, static audit
npm run e2e        # sixteen browser suites against the build (see e2e/run.mjs)
npm run test:care  # just the rules that decide what the safe place shows
```

`npm run icons` and `npm run og` regenerate the app icons and the social card. Both need
`playwright-core` and a Chromium binary, which are not dependencies; install them ad hoc
(`npm i --no-save playwright-core`). `og` also needs a build first, because it takes Karla from
the export.

## Where things are

| Path | What it holds |
| --- | --- |
| `lib/care.ts` | The care levels, the direct question, the 14-day pattern, the care-team summary, and what a level changes about the minute, the reel and how lively the page is. No imports, no React, tested with Node alone. |
| `lib/minute.ts` | One minute: the eight tensions, their cards and moves in English and Hinglish, the deal, "did it happen?", and what the minutes show. Tested by `scripts/test-minute.mjs`. |
| `lib/reel.ts`, `lib/reel-clock.mjs` | Today's five: the cards, which five, and the door's words. |
| `lib/homeWords.ts` | What Home says (the check-in and the sky's replies) in English and Hinglish. |
| `lib/haven.ts` | Safe-place storage (`wellbeings-safe-v1`, `wellbeings-photos-v1`), region guess, photo downscaling. |
| `lib/havenContent.ts` | Every line the safe place says, the verified video list, and the evidence behind each tool. |
| `hooks/useHaven.ts` | Safe-place state and the dawn. |
| `components/haven/` | The shell and its three tabs (Home, Me, Talk), the rooms behind them, the check-in, the urgent screen, the intro, the sky and the bloom-sun. |
| `components/minute/` | The stage for One minute and the reel, with GSAP for the cards. Its own lazy part. |
| `hooks/useWellbeings.ts` | The wellbeing check, its results and the daily plan (`wellbeings-v1`). |
| `app/globals.css` | Tokens (night-to-dawn palette, every pair contrast-measured) and all styles. |
| `docs/CARE-INTEGRATION.md` | The consent rules and data contract for any future professional integration. |
| `scripts/` | Static audit, care tests, icon and social-card generators. |

## Rules worth knowing before changing anything

- Never rename a storage key. A rename is a silent delete of someone's hope box.
- Never change the `ref=wellbeings` / `ref=psych-screener&band=` URL parameters; Ronak reads them.
- Nothing may be sent off the device except by the person's own action. See the integration doc.
- House style is in `AGENTS.md`.

Not a medical device, not a crisis service, not monitored.
