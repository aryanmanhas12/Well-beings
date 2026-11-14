# Arun

_Formerly Wellbeings. Arun (अरुण) is the red glow of dawn. The logo is the sun rising out of a
window, drawn once in `well-beings/lib/mark-geometry.mjs` for the header, icons, favicon and
social card._

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

Three tabs, on a bottom tab bar on phones and a top bar on wider screens: what you can do right
now, what is yours, and who you can talk to.

| Tab | What is in it |
| --- | --- |
| **Home** | The dawn sky, the check-in ("How are you arriving?", "And the days ahead?"), a reply fitted to the answers, then one question: "What's the tension right now?" Eight answers each open **One minute**. Under it, **Today's five** and four doors: Breathe, Watch, Sit with me, Play. |
| **Me** | Everything you keep. For a hard moment: the Stanley–Brown safety plan (a calm-day editor and a "use it now" view where every number is a button), the hope box (people, things ahead, good moments, hard times survived, songs, photos, words) and a note written on a steadier day for a heavier one. For steadier days: a hope path, three good things, and the daily plan from the wellbeing check. Then what your minutes and your check-ins show, which only you can see. |
| **Talk** | Helplines for your region, words to borrow for messaging someone, an opt-in care-team contact, and the way to Ronak. |

**One minute.** Pick what the tension is about, sort three ready-made pieces of it into "in my
hands" or "not in my hands" (drag the card, tap, or use the arrow keys), and leave with one small
move and a time for it. Nothing to type. Next time, once the move's time has passed, Arun asks one
thing: did it happen? "Not yet" is a full answer. When nothing is in your hands, the moves are a
person, a free line, a breath or rest. The rules are in `well-beings/lib/minute.ts`, with the
studies behind the shape.

**Today's five.** A reel that ends: five full-screen cards (a line, one finding about the mind with
its source on the card, one question answered in a tap, one thing to do, one person), then it stops
and says so. One for the morning, the day and the night. It never moves by itself and keeps no
answer (`well-beings/lib/reel.ts`).

Both are written in English and in Hinglish (one tap on Home), are quieter on a low day, and are
not shown at all after a check-in that reports thoughts of suicide or not feeling safe: the plan,
the people and the numbers have the screen then.

**Watch**, behind its door on Home: talks and stories chosen for hard days (I See Something,
Leading with Lollipops, Fred Rogers and more), loaded from YouTube only after you agree, with
breathing, 5-4-3-2-1 grounding and the game underneath. An Instagram shelf for Aryan's own videos
is ready and appears once it has reels.

**Sit with me** opens a quiet listener from Home: replies written in
advance and chosen on the phone, helplines the moment something sounds dangerous, and nothing kept
when it closes. An optional AI mode exists behind a relay (`listener-relay/`) and is off unless the
site is built with `NEXT_PUBLIC_LISTENER_ENDPOINT`. Text boxes for good things and the note have a
microphone that asks before any browser speech service is used. **Today's line**, in Me, is edited
by hand each week in `well-beings/lib/daily-lines.ts`.

**The opening, every time.** Each time Arun is opened, a short sunrise plays. With music on it
waits on a night sky with Ooh asleep on the hill until you tap "Wake the sun"; the music swells in
with the sun and a bowl tone rings as each pair of petals opens. "Without music", "Skip" and "Need
help now" are there from the first frame, and it never plays after a check-in in the last three
days that reported thoughts of suicide or not feeling safe.

**Feedback you can see and feel.** A ripple of dawn light where you tap, sections gliding in with a
glow as you scroll, a sunrise line across the top for how far down you are, rooms sliding in, and a
light vibration on phones that allow it (Android for taps and scrolling, iPhone for taps). All of it
stops under reduced motion, and "Vibration" in Settings turns the ticks off.

**Ooh and the music.** Ooh, a small sunrise-coloured character shared with Ronak, narrates
each page in a comic speech bubble the first time you visit it, then says one line after that.
Further down, a narrator bar above the tab bar describes whatever you are looking at, section by
section, and at the bottom offers the next room (Home to Me, Me to Talk).
On heavy days Ooh stays quietly in the corner so the safety plan and helplines come first. Soft
music, made on the phone as it plays (no audio files), starts with your first tap; the speaker
at the top turns it off.

**Install it as an app.** A quiet card on Home (one tap puts it away for a month) and a row in
Settings install Arun to the home screen: one tap where the browser offers a prompt, and plain
steps for iPhone, for Brave, Edge and Firefox, and for Instagram's in-app browser, which cannot
install and has to hand over to Chrome or Safari first.

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
