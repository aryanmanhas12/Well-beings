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

**Colour.** The palette is night to dawn, at the owner's explicit request:
a warm plum midnight (`#110921`, red in it, not blue), cream text, and the
colours of an actual sunrise as accents: sun yellow for anything you press,
dawn pink and lilac for the things that belong to the person (hope box,
people, good things), peach where the sky meets the horizon, and one leaf
green (`#62D6A5`) kept for things that grow. Light mode is
dawn paper (`#FFF5EC`) with plum ink and berry for links, because sun yellow
on paper is 1.49:1 and unreadable as text.

This is not the violet-on-blue-black look every generated interface has,
and keeping it that way is deliberate. That look is a cold blue-black with
one indigo accent doing everything. Here purple lives in the sky and the
petals, never on a button; the buttons are sun. If a change makes the page
read as "indigo gradient startup", it is wrong even if every token is from
this file. No pure `#000` and no pure `#ffffff` outside high-contrast mode.

**Type (v2).** Headlines, the sky and the numbers on the crisis screen are
set in Fredoka, a rounded display face, to sit beside Ronak's Baloo 2
without copying it. Everything read slowly stays in Karla. Fredoka never
sets anything longer than a heading.

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

## The safe place: extra rules

The home of the app is for people who may be in a very bad place. That
changes what "good design" means here.

**Motion is atmosphere, not decoration.** The sky, the pulsing midnight
glow, the rising sun and the first-visit sunrise are the owner's brief and
they stay. They are slow (seconds, not milliseconds), they never move
anything someone is trying to read or tap, and every one of them stops under
`prefers-reduced-motion`. Nothing bounces, nothing sparkles, and nothing
animates to get attention.

**Safe messaging is not optional.** Never describe a method, anywhere, in
copy, a video, a placeholder or a code comment. Stories are chosen for
hope and recovery, and a video goes in only when its ID and title have
been checked against a real listing. See `lib/havenContent.ts`.

**Never imply someone is watching.** The app has no server and nobody
monitors it. Any copy that could be read as "we'll be alerted" is a safety
bug, because someone may wait for help that is not coming. Sharing with a
care team is always the person's own action, shown in full first. The
rules are in `docs/CARE-INTEGRATION.md`, and any change to them changes the
privacy page and the terms in the same commit.

**Every visit has to be worth it on its own.** Most people use a
mental-health app a handful of times. So: a two-tap check-in, no streaks
that can be broken, no survey before comfort, and the most useful thing for
the answer just given at the top of the screen.

**Rules that decide what someone sees in a crisis live in `lib/care.ts`,**
as plain functions, with a test for each case in `scripts/test-care.mjs`.
Never inline a threshold in a component.

**Crisis numbers are checked, not remembered.** KIRAN (1800-599-0019)
shipped as a primary line here long after the government merged it into
Tele-MANAS in February 2024 and phased the number out. Before adding or keeping a number, check the operator's
own site, and put the date and source in a comment.
