---
name: ronak-ship-check
description: Use before every Ronak commit or release, and whenever the user asks to ship, publish, deploy or "check everything" on Ronak (aryanmanhas12/Psych). The verification routine: take the next release number, run the mobile regression suite, hold layout shift at zero, measure the idle cost of any motion on a 4x-throttled phone, screenshot the widths that break, and re-check the safety invariants that never bend.
---

# ronak-ship-check: the routine before Ronak ships

Ronak is for people who may be struggling, on cheap phones, on patchy
connections. A green build is not the bar: the bar is that what reaches a
phone is right. Run every step; say which ran and what they showed.

## 1. Start from the real main
```bash
git fetch origin main && git status && git log --oneline -3 origin/main
```
Another session (Arun's) sometimes works on Ronak's shared brand. Rebase or
merge onto `origin/main` before you start and again before you push. Never
force-push `main`.

## 2. Take the next release number
`sw.js` holds `REL`; every page asks for its shared files as `?v=REL`.
A release that changes any shared file must bump both, in the same commit:
```bash
cur=$(grep -o 'const REL = "[0-9]*"' sw.js | grep -o '[0-9]*'); next=$((cur+1))
sed -i "s/const REL = \"$cur\"/const REL = \"$next\"/" sw.js
sed -i "s/?v=$cur/?v=$next/g" *.html
grep -c "v=$next" *.html     # every page, none missed
```
Add a one-line `/* vN: ... */` note beside `REL` saying what changed.

## 3. Run the mobile regression suite
```bash
python3 -m http.server 8099 &            # from the repo root
npm i --no-save playwright               # test tooling only; the site has no build
node test/mobile.js                      # PW_CHROME=/path overrides the browser
```
It must end with ALL CHECKS PASS. It covers reflow at 7 widths x 3 text
sizes, the opening, the crisis path, contrast in light/dark/high contrast,
all five screeners, degradation without i18n, offline, layout shift, every
page's crisis strip, and uncaught exceptions. CI ("mobile regression suite")
runs the same file on every push; a red CI means the push is not ready.

## 4. Layout shift stays at zero
The suite fails above CLS 0.1; aim for ~0. Anything that appears after
load (Ooh's line, a drawing, a font) must arrive into a box already its
size.

## 5. Idle cost of motion, on a 4x-throttled phone
Any new or changed animation: measure the main thread while the page sits
still. A new effect may add no more than ~15ms per 4s.
```js
// node idle.mjs  (playwright-core; run against the served repo)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Performance.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.addInitScript(() => { ['psych-seen-overture','psych-seen-tour','psych-seen-intro'].forEach(k => localStorage.setItem(k, '2')); sessionStorage.setItem('ronak-visit-opened', '1'); });
  await p.goto('http://127.0.0.1:8099/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const a = await m(); await p.waitForTimeout(4000); const z = await m();
  console.log('idle TaskDuration per 4s (ms):', Math.round((z.TaskDuration - a.TaskDuration) * 1000));
  await b.close();
})();
```
Measure before and after the change. Rules that paid for themselves here:
animate `transform`/`opacity` of HTML elements, never groups inside an
inline SVG; no permanent `transform-box` on SVG children inside an animated
layer; idle loops only while on screen; everything stops under
`prefers-reduced-motion` and `html.lite`.

## 6. Screenshot the widths that break
320, 360, 390 and 1280 wide, at default and 135% text size, the home view,
a screener question, a result, and one working paper. Look at the whole
page, not just the part you changed: nothing sideways-scrolls, nothing
covers the crisis strip, the first action on a screen is visible.

## 7. Safety invariants (read each one against the diff)
- The crisis strip (Tele-MANAS 14416, Vandrevala 9999-666-555, 112) is on
  every page and on top of everything, including the opening; numbers are
  `tel:` links.
- A self-harm item endorsed: the safety step interrupts, with no Ooh, no
  music, no sound and no effects. No music and no corner Ooh during
  questionnaire items.
- Ooh never implies anyone is watching, waiting or coming; gentle moods only
  on a risk result; English lines at most 120 characters; no em dashes.
- Six languages move together: a new or changed string lands in all six
  `i18n.<lang>.js` files. Clinical wording is not "improved" casually.
- No third-party request at runtime: fonts self-hosted, sounds local, music
  generated. Nothing leaves the device.
- `ooh.mjs` is byte-identical to Arun's `well-beings/lib/ooh.mjs`:
  `curl -s https://raw.githubusercontent.com/aryanmanhas12/Well-beings/main/well-beings/lib/ooh.mjs | cmp - ooh.mjs`

## 8. After the push
Watch the "mobile regression suite" run and the "pages build and
deployment" run for the pushed commit. Only when both are green, say it is
live, and tell the person to reload once (the service worker serves the
new release on the next load).
