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

**The name.** The product is Arun (अरुण, the red glow of dawn), one word.
It was Wellbeings until September 2026. The rename is display-only: the
repository, the `/Well-beings` path, every `wellbeings-*` storage key, the
`ref=wellbeings` handoff and the `wellbeings.care-summary/1` schema keep the
old spelling, and must, because changing them loses saved data or breaks
Ronak.

**The logo** is the "Arun logo" canvas: the sun rising out of the top of a
square window, over flat bands of blue sky warming to dawn orange, sea and
deep-blue peaks and a rose ridge, beside a lowercase "arun" in Karla 700.
One file draws it everywhere (`lib/mark-geometry.mjs`: header, site pages,
listener, icons, favicon, social card), and detail steps down with size:
five rays, then three, then none and a bigger sun. The bloom-sun is the
app's illustration (the sun in the sky, the intro, breathing), not the
logo. Never draw either by hand a second time.
Ronak sets its name the same way (lowercase "ronak", Karla 700, -0.03em),
at the owner's request, so the two sister apps read as one family. The
wordmark in the header is the way home: from any room it goes to Here,
and on Here it glides back to the top.

**Ooh** is the companion character, shared with Ronak: a round sunrise-gold
creature with the bloom-sun's two petals sprouting from its head, drawn in
comic style by `lib/ooh.mjs` (plain JS, so Ronak imports the same file).
Eight moods. What Ooh says lives in `lib/oohScript.ts` and is tested in
`scripts/test-ooh.mjs`: short, no em dashes, never implies anyone is
watching, only gentle moods on heavy days, and on heavy days and worse Ooh
starts tucked in the corner so nothing pushes the safety plan down. Ooh
speaks in the page at the top; further down, a narrator bar above the tab
bar describes whichever part is being read, changing as the page moves,
and at the bottom offers the next room. Every section of every room has a
line; site pages narrate their headings (`pageHeadingLine`). The bar steps
aside while typing and comes back only 0.9 s later, and never appears or
changes under a finger that is down: coming back at once once put it
under a thumb tapping "Keep it". No bar on a heavy day. The bar's link to
the next room shows even while the greeting is on screen, because on a
tall iPad a short room fits whole and the bar never came. Only fields
that bring up a keyboard count as typing: the iPhone haptic switch is a
hidden checkbox, Safari focuses it on every tick, and when any <input>
counted, the bar vanished mid-tap and "Go to Hope" did nothing on iPhone
and iPad (lib/haptics.ts now hands focus straight back).
Ooh is alive as in Ronak: it breathes, blinks, nods as its words come
out, its sprout sways while it talks, and every few letters there is a
blip of a voice pitched to its mood. Breathing and nodding are transforms
on HTML wrappers, never animations inside the SVG.

**The music** is generated on the phone (`lib/ambient-core.mjs`): slow D
major pads, bowl tones, a synthetic room. It pauses for videos, the
microphone and hidden tabs. The speaker at the top turns it off, and that
choice is remembered. The tap sounds and Ooh's voice are separate
(`lib/sfx.ts`): their own low-latency player, fetched on the first tap,
off with "Sounds" in Settings.

**The opening sunrise** is permanent, at the owner's request: it plays
every time Arun is opened, and there is no switch to turn it off. Opened
means a new tab or launch, or coming back after 20 minutes or more away,
because an installed app on a phone is mostly resumed, not relaunched; a
reload does not replay it (`lib/intro.ts`, decided before paint in
`app/page.tsx`). With
music on it waits on a night sky for "Wake the sun", because browsers
allow sound only after a tap. The waiting sky says only what the owner
asked for: nothing you write leaves your phone, it is free, and a little
surprise is coming. It never describes the sunrise, which is the
surprise. The rise starts only once the audio is
confirmed running, so the swell and the petal bells (`SUNRISE_BELLS`) land
on the picture. Never after a check-in in the last three days that
reported thoughts of suicide or not feeling safe. "Need help now" and
"Skip" are there from the first frame.

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

**Motion is atmosphere, and feedback answers the person.** The sky, the
pulsing midnight glow, the rising sun and the opening sunrise are the
owner's brief and they stay; they are slow and never move anything
someone is trying to read or tap. Since September 2026 the owner also
asked for feedback that is visible and felt: a ripple where a finger
lands, sections gliding in with a dawn glow, a sunrise line for scroll
progress, rooms sliding in, Ooh leaning into a scroll, and a light
vibration (`components/Feedback.tsx`, `lib/haptics.ts`). Later that
month it became Ronak's feel, so the sister apps answer a touch the same
way: a ring of light where a finger lands, a sweep of light on a room
change, cards outlined in dawn light every time they arrive, interface
sounds (`lib/sfx.ts`, the same CC0 files as Ronak) and Ooh's little voice.
The rule for all of it: it only ever answers something the person just
did (a tap, a scroll), never fires on its own to get attention, and never
fades text (contrast holds mid-animation). Under `prefers-reduced-motion`
nothing moves but the lights stay, fading in place, because the owner
asked for them always to be there; fades are light, not motion, and none
repeats faster than once a second. The global reduced-motion rule exempts
them explicitly, as it does the breathing pacer. "Vibration" and "Sounds"
turn their parts off. A helpline link and the urgent screen are silent
and still, and Ooh does not talk over an open screen.

**Loaded in parts, never the safety parts.** The wellbeing check, its
results, the Watch and Hope rooms and the daily plan are their own files
(`components/lazyParts.tsx`), fetched when the phone is idle and on a
finger touching a tab. Here, the safety plan, Reach out, the urgent
screen, Help, Settings and the video sheet are never split off: they
hold the plan, the people and the numbers and must not wait on a network.
A part that cannot arrive offline says so and offers "Try again".

**Design source of truth.** `DESIGN.md` holds the tokens (copied from
`app/globals.css`; drift is a bug) and how Arun looks. The skills in
`/.claude/skills` (design taste, redesign audit, high-end visual design,
animated UI libraries, web interface guidelines, design-md, playwright)
apply, and where their generic rules disagree with this file or
`DESIGN.md`, these win: a safe place for people on hard days is not a
landing page. From the Web Interface Guidelines, now house rules: every
field has a name and an autocomplete setting, placeholders end with "…",
removing something from the hope box offers "Undo" for seven seconds,
headings balance, nothing pinned covers a focused field, brand names are
`translate="no"`, number ranges use a hyphen.

**Fast means measured.** Everything that moves is transform or opacity on
its own element; nothing animates `box-shadow`, a filter or layout. Put a
filter on the drawing inside a moving wrapper, never on the wrapper. Do
not read positions (`getBoundingClientRect`) in a scroll frame: Ooh reads
them once and does arithmetic on the scroll position (reading them per
frame forced a layout almost every frame while its words typed). Heavy
work never runs inside a tap: the music's synthetic room is built when
the phone is next idle (the first tap went from 656ms to 152ms on a phone
slowed 4x). Check a change with a 4x-throttled trace before calling it
smooth.

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
