---
name: arun-ship-check
description: Use before every Arun commit or release, and whenever the user asks to ship, publish, deploy, "make it live" or "check everything" on Arun (aryanmanhas12/Well-beings, app in well-beings/). The routine that has kept Arun's live site right - start from the real main, verify, build for Pages, run every end-to-end suite, measure speed on a slowed phone, publish the export to the repo root, confirm the deploy - and the safety invariants to re-read against every diff.
---

# arun-ship-check: the routine before Arun ships

Arun is a safe place for people who may be struggling. A green build is not
the bar: the bar is that what reaches a phone is right. This repo publishes
a built export to the repository root, and editing source is not shipping
it (source and live site have disagreed here for five commits before). Run
every step; report which ran and what they showed, including failures.

## 1. Start from the real main
```bash
git fetch origin main && git log --oneline HEAD..origin/main
```
Merge anything new before you start and again before you push (other
sessions, and pull requests like the skill pack, land on main). Never
force-push main.

## 2. Verify (unit tests, types, lint, the Pages build, the site audit)
```bash
cd well-beings && npm ci && npm run verify
```
`verify` builds with `NEXT_PUBLIC_BASE_PATH=/Well-beings`, the path GitHub
Pages serves, so `out/` is ready for the next steps.

## 3. Every end-to-end suite, in a real browser
```bash
npm run e2e                 # all 16 suites; exits non-zero on any ✗
npm run e2e -- ooh feel     # just some
```
The suites live in `well-beings/e2e/` and drive the real export in
Chromium (`PW_CHROME` overrides the browser; in Claude's cloud container
the preinstalled one is found automatically). They cover: every flow
(axe 0 violations across 54 scans), layout at 320/390/1280 with no
sideways scroll, sky text contrast (worst pixel >= 6.8:1), the listener,
install, voice, Ooh (greeting, narrator bar, links to the next room on the
iPhone path), the opening sunrise and its music, the game (Scoops &
Snowballs: over the screen but under the crisis strip, touch and keys,
the ending, nothing kept), feedback and sounds, the
home tap, the logo, the music's loudness, the skills pass (undo,
guidelines, offline fallback, zero em dashes on every page), and One
minute with the reel (`minute`: the three tabs and the way to the plan
offline, a minute by tap, key and throw, "did it happen?" waiting for its
time, Hinglish, the reel ending and keeping no answer, both withheld
after thoughts of suicide, Lenis on reading pages only). The suites say
which room they want and `goRoom` in `e2e/lib.mjs` takes the real path
there. A change to
behaviour needs a check here in the same commit.

## 4. Speed, on a phone slowed 4x
For anything that moves, loads, or runs on scroll or tap, measure before
and after with the Chrome DevTools Protocol (`Emulation.setCPUThrottlingRate`
rate 4; `Performance.getMetrics` deltas; a `PerformanceObserver` for `event`
entries). Budgets that hold today: first tap under ~200ms, a room switch
under ~200ms, a full scroll of Here near 60fps with the worst frame under
~50ms, blocking time at load under ~400ms. Rules that paid for themselves:
only transform and opacity animate; no position reads in a scroll frame;
heavy work never inside a tap (build it when idle); filters sit on the
drawing inside a moving wrapper, never on the wrapper.

## 5. Look at it
Screenshot Home (before and after a check-in), Me, Talk, Watch, Hope and
Plan at 390x844 and 1280x800, dark and light, a minute on its stage
(sorting, the move, done) on an okay day and a low one, a card of the
reel, and the opening sunrise's waiting screen. Look at the whole
page, not just the part you changed (`E2E_SHOTS=/some/dir npm run e2e --
install logo listener` also writes screenshots).

## 6. Safety invariants (read each one against the diff)
- The crisis strip and "Help now" are on every screen and never covered;
  helpline numbers are `tel:` links; the urgent screen and phone-number
  taps are silent and still.
- Nothing implies anyone is watching, waiting or coming. Ooh says so too.
- Home, Me, the safety plan, Talk, the urgent screen, Help and Settings
  are never split into lazily loaded parts (they must work offline).
- One minute and the reel are not shown after a report of thoughts of
  suicide or of not feeling safe (`minuteOffer` in `lib/care.ts`). The
  minute never ends in "let it go", never has a card about being hurt,
  keeps only ids, and asks "did it happen?" only once the move's time has
  passed. The reel never advances by itself, stores no answer, and has no
  streak or count of days.
- Every Hinglish line has an English twin and guesses nobody's gender;
  every figure on a reel card is on the checked list in
  `scripts/test-minute.mjs`.
- No sunrise, and Ooh starts tucked away, after a check-in reporting
  thoughts of suicide or not feeling safe (three days).
- Storage keys (`wellbeings-*`, `arun-*`) and `ref=wellbeings` never change.
- No em dashes in anything a reader sees; no fabricated studies or numbers;
  crisis numbers checked against the operator's own site, dated in a comment.
- `lib/ooh.mjs` changed? Copy it byte for byte to Ronak's `ooh.mjs`.

## 7. Publish and confirm
```bash
# bump CACHE in well-beings/public/sw.js when a precached file changed
npm run publish:root        # copies out/ to the repo root per .pages-manifest
cd .. && git add -A && git commit && git push origin HEAD:main
```
Then watch the "pages build and deployment" run for that commit (GitHub
MCP: actions_list / list_workflow_runs). Only when it succeeds, say it is
live, and tell the person to reload once (the service worker serves the new
release on the next load).
