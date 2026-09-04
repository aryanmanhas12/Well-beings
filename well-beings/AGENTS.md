<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# House style: do not build the default

Everything below is a standing instruction from the owner of this repo, not a
suggestion. It exists because the first version of this app looked and read
like every other machine-made site, and that is a real cost for an app whose
whole proposition is "a person thought about this and the evidence is
checkable".

## The tells, and what to do instead

**Colour.** Never ship a violet or indigo accent on a blue-black page. That
combination is the single most recognisable signature of a generated
interface, and this app has already been through it once. Warm near-blacks,
creams, clays, honeys and muted earth tones instead. No pure `#000` and no
pure `#ffffff` anywhere — a hair of warmth in the extremes is most of what
separates a page that feels like a room from one that feels like a display.
Saturation stays low: warm *and* muted is earthy, warm alone is a warning
label.

**Type.** Inter is banned, and so is everything that arrives in the same
breath as Inter — DM Sans, Plus Jakarta Sans, Poppins, Outfit, Manrope. Pick
faces with actual character and a reason. This app runs Karla for reading and
Fraunces (SOFT and WONK axes turned up) for display, which is a real pairing
a person would choose, not the safe one. Generous line-height. If a face has
optional character axes, use them; that is the whole reason to pick it.

**Layout.** Three equal feature boxes in a row is the shape of a template.
Asymmetry, a real editorial hierarchy, and one idea that carries the page beat
a grid of equivalent tiles.

**Copy.** No em dashes — see `/root/.claude/plans/purring-seeking-quasar.md`
for the rewrite rules and the running list of files still to do. Prefer a full
stop to a dash and a short sentence to a hedged one. Never open with "In
today's fast-paced world", never write "seamlessly", "elevate", "unlock",
"empower", "delve", "robust", "leverage", "cutting-edge", "game-changing", or
"it's not just X, it's Y". Do not end a section with a rhetorical flourish
that restates what was already said. Say the specific thing: "7 hrs" and
"498,277 adults" carry more than "backed by science" ever will.

**Comments.** The comments in this codebase explain *why*, including the
things that were tried and failed and the measurements that settled an
argument. Match that. A comment restating what the line below it does is
worse than none.

## Two rules that make the difference

1. **Measure, do not eyeball.** Every colour pair here was run through a
   WCAG checker before it shipped, and two of them failed and were changed
   because of it — the caption token, which has to clear 4.5:1 on
   `--color-surface` and not just on `--color-bg`, and the ochre statement
   card, whose white type came in at 4.47:1. Those numbers are in the CSS
   comments. Keep adding them.

2. **Verify the artefact, not the source.** This repo publishes a built
   export to the branch root. Editing a file is not shipping it, and it has
   already been the case here that source and live site disagreed for five
   commits. Rebuild, load the real output, screenshot it, and check the thing
   you claim to have changed actually changed before saying it is done.
