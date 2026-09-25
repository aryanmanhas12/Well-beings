# Arun

_Formerly Wellbeings. Arun (अरुण) is the red glow of dawn._

A quiet place for hard days, and a private look at everyday wellbeing for the steadier ones. It
opens on a two-tap check-in, answers in a way that fits what you said, and keeps a safety plan, a
hope box, breathing, grounding and free helplines within one tap. Everything runs on your phone.
It does not diagnose anything, and nobody sees what you tell it.

**Live app:** https://aryanmanhas12.github.io/Well-beings/
**About the author:** https://aryanmanhas12.github.io/Well-beings/me/ (Aryan Manhas, the
NeuroBioPsych vision, goals and ways to connect).
**Companion project:** [Ronak](https://aryanmanhas12.github.io/Psych/), the dedicated
mental-health screening experience (PHQ-9 / GAD-7 / PHQ-4 / AUDIT-C in six languages).

Arun and Ronak are deliberately separate products. Moving between them passes a URL
parameter naming the origin app, and at most one coarse severity band, and nothing else. They are
served from the same origin, so a browser keeps their `localStorage` together; each app only ever
reads its own keys.

### The safe place

Five rooms, on a bottom tab bar on phones and a top bar on wider screens:

| Tab | What is in it |
| --- | --- |
| **Here** | The dawn sky, the check-in ("How are you arriving?", "And the days ahead?"), a reply fitted to the answers, one small thing to do, and something you saved yourself on a low day. |
| **Watch** | Talks and stories chosen for hard days (I See Something, Leading with Lollipops, Fred Rogers and more), loaded from YouTube only after you agree, with breathing and 5-4-3-2-1 grounding underneath for when you can't watch. An Instagram shelf for Aryan's own videos is ready and appears once it has reels. |
| **Hope** | Three good things, a hope box (people, things ahead, good moments, hard times survived, songs, photos) and a note written on a steadier day for a heavier one. |
| **Plan** | A Stanley–Brown safety plan, with a calm-day editor and a "use it now" view where every number is a button; plus the daily plan from the wellbeing check. |
| **Reach out** | Helplines for your region, words to borrow for messaging someone, an opt-in care-team contact, and the way to Ronak. |

**Just sit with me for a minute** opens a quiet listener from anywhere on Here: replies written in
advance and chosen on the phone, helplines the moment something sounds dangerous, and nothing kept
when it closes. An optional AI mode exists behind a relay (`listener-relay/`) and is off unless the
site is built with `NEXT_PUBLIC_LISTENER_ENDPOINT`. Text boxes for good things and the note have a
microphone that asks before any browser speech service is used. **Today's line** on Here is edited
by hand each week in `well-beings/lib/daily-lines.ts`.

The sky starts every day as night and rises a step with each small thing you do for yourself.
Nothing is ever taken away; a missed day is a new night, not a broken streak. The first visit
opens on a short sunrise, shown once.

### When things are hard

The rules live in `well-beings/lib/care.ts` and are tested in `well-beings/scripts/test-care.mjs`.
A heavy mood or very little hope brings a direct question about thoughts of suicide. "Yes, but
I'm safe" pins the safety plan and helplines to the top for three days. "I don't feel safe" clears
the screen for numbers to call. A run of heavy days brings a prompt to tell someone. **None of it
alerts anyone**: there is no server and nobody watching, and the crisis screen says so.

The care team is how professional follow-up can work without monitoring anyone. A person adds a
therapist, doctor or someone they trust, and the app writes a two-week summary of their own
check-ins for them to send, by share sheet, text, email or file. The file has a versioned schema
(`wellbeings.care-summary/1`), documented in
[`well-beings/docs/CARE-INTEGRATION.md`](well-beings/docs/CARE-INTEGRATION.md) for the planned
Ronak professional integration.

### The wellbeing check

For a day with more room: sleep, movement, food and drink, stress, recovery, mood, connection,
work or study load, screen use and routine, in a quick (about three minutes) or detailed (about
five) version. The read-out is a snapshot, not a score, and separates observation, interpretation,
recommendation and medical concern.

### Public pages

`/` the safe place · `/guides/` six evidence-informed guides · `/resources/` helplines and
directories · `/about/` what it is and is not · `/privacy/` every storage key and exactly what is
and is not sent · `/terms/` not a medical device, not a crisis service, not monitored.

> Arun is a self-guidance tool, not a medical device and not a crisis service. If you're
> struggling, [findahelpline.com](https://findahelpline.com) lists verified, free, 24/7 support
> lines for 130+ countries.

### Checks

`npm run verify` runs the care-logic tests, the typechecker, the linter, a production build and
`scripts/audit-site.mjs`, which asserts against the real export: unique titles and descriptions,
self-referencing canonicals, exactly one `<h1>` per page, no skipped heading levels, alt text on
every image, valid JSON-LD that never claims a medical schema type, no broken internal links, a
sitemap that matches the built pages, correct brand spelling, and no retired helpline numbers.

## Repository layout

| Path | What it is |
| --- | --- |
| `well-beings/` | The app: Next.js 16 + TypeScript, statically exported |
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
The built export is also committed at the repository root (listed in `.pages-manifest`) so the
site works when Pages is set to deploy from a branch.

## Evidence

Each tool cites the approach it is adapted from, with the effect size in plain words:
safety planning (Stanley et al. 2018, JAMA Psychiatry), the hope box (Bush et al. 2017,
Psychiatric Services), gratitude (Cregg & Cheavens 2021, small effect), stories of hope and
recovery (Niederkrotenthaler et al. 2022, Lancet Public Health), asking directly about suicide
(Dazzi et al. 2014, Psychological Medicine) and reaching out (Liu et al. 2022, JPSP). That is
evidence for the techniques, not for this app, which has not been trialled.
