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
npm run e2e                 # all 14 suites; exits non-zero on any ✗
npm run e2e -- ooh feel     # just some
```
The suites live in `well-beings/e2e/` and drive the real export in
Chromium (`PW_CHROME` overrides the browser; in Claude's cloud container
the preinstalled one is found automatically). They cover: every flow
(axe 0 violations across 54 scans), layout at 320/390/1280 with no
sideways scroll, sky text contrast (worst pixel >= 6.8:1), the listener,
install, voice, Ooh (greeting, narrator bar, links to the next room on the
iPhone path), the opening sunrise and its music, feedback and sounds, the
home tap, the logo, the music's loudness, and the skills pass (undo,
guidelines, offline fallback, zero em dashes on every page). A change to
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
Screenshot Here, Watch, Hope, Plan and Reach out at 390x844 and 1280x800,
dark and light, and the opening sunrise's waiting screen. Look at the whole
page, not just the part you changed (`E2E_SHOTS=/some/dir npm run e2e --
install logo listener` also writes screenshots).

## 6. Safety invariants (read each one against the diff)
- The crisis strip and "Help now" are on every screen and never covered;
  helpline numbers are `tel:` links; the urgent screen and phone-number
  taps are silent and still.
- Nothing implies anyone is watching, waiting or coming. Ooh says so too.
- Here, the safety plan, Reach out, the urgent screen, Help and Settings
  are never split into lazily loaded parts (they must work offline).
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
