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
a face with actual character and a reason. This app runs Karla, everywhere,
with hierarchy built from weight and size rather than a second family.
Generous line-height.

There is a limit on the other side of this, and this app hit it. The display
slot briefly held Fraunces with its SOFT and WONK axes turned up; WONK cants
and distorts the letterforms on purpose, and at 40px on a card the page
stopped reading as warm and started reading as costumed. Warmth is the
palette's job. Type that draws attention to itself is its own kind of
default — the reaction to the generic one, and just as legible as a choice
someone made to look interesting. Normal letterforms, warm colour.

**Layout.** A hero followed by three equal feature cards is the shape of a
template. Bands that each carry one idea, in the order a person actually needs
them, beat a grid of equivalent tiles. The welcome screen is the worked
example: the claim, then the evidence, then how the thing behaves. A plain
three-up row of principles at the foot of that is fine — what is not fine is
three boxes with icons being the whole argument.

Watch what a rearrangement leaves behind. Moving the research figures out of
the right rail was correct and immediately left two thirds of a desktop
window empty, which needed a second pass to fix. Check the full-page
screenshot, not just the part you changed.

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
