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

**The music** is generated on the phone (`lib/ambient-core.mjs`): a soft
piano over slow D major chords, bowl tones and a synthetic room, in three
versions that follow the phone's clock, at the owner's request (October
2026): morning (5 am to noon) brighter, with birdsong and a lake lapping;
day (noon to 6 pm) with slow sea waves and the odd bird; night (6 pm to
5 am) low and sparse, deep waves, sometimes a far-off owl. Everything is
synthesised: additive piano, filtered noise for water, sine whistles for
birds. `e2e/music.e2e.mjs` renders each version offline and holds it to
the same loudness as the drone it grew from (-36 to -24 dBFS RMS, peaks
under -12). The game sets the version from its own sky while it is open
(`setMusicMood`). It pauses for videos, the microphone and hidden tabs.
The speaker at the top turns it off, and that choice is remembered. The
tap sounds and Ooh's voice are separate (`lib/sfx.ts`): their own
low-latency player, fetched on the first tap, off with "Sounds" in
Settings. The game's splats and chimes are made on the spot through that
same player (`lib/game/sound.ts`), so the same switch turns them off.

**The game** is Scoops & Snowballs, at the owner's request (October 2026):
dogs against cats with ice cream and snowballs in a city like New York, by
day or by night, power-ups and two teammates each to find in the streets,
a bar each, and an ending where nobody is hurt or destroyed: whoever runs
out sits down laughing, the other walks over, and they hold hands under a
rainbow with butterflies, hearts and cupcakes. It lives at the bottom of
Watch (with a shortcut in Here's "If you need a minute"), because a few
silly minutes are a real step in a safety plan (distraction), and it is
its own lazy part. Rules in `lib/game/engine.ts` (no DOM, played to the
end in Node by `scripts/test-game.mjs`, which also fails on any word about
hurting anyone), drawing in `lib/game/render.ts` and `lib/game/art.ts`
(comic ink like Ooh), the screen in `components/game/ScoopsGame.tsx`,
tested in `e2e/game.e2e.mjs`. Rules for it: the crisis strip stays above
it and "Help now" is in its own bar, opening the urgent screen over it;
it keeps nothing (no scores, no streaks, no "come back tomorrow"); the
words stay gentle (splat, giggle, make up); it is rendered into the body
through a portal, because a room's slide-in transform otherwise traps a
fixed layer inside the room.
Version 2 (October 2026, at the owner's request: "make each path
unique", armies, better and more accurate bars, new effects). Every
avenue and street has a name, a look and a rule (`AVENUES`, `STREETS` in
the engine): Market Row has carts to hide behind and more treats,
Broadway charges the special faster, Lantern Avenue slows bubbles, the
breeze on Harbor Walk pushes throws south, Sprinkler Street washes a
splat off (+3), Rainbow Street makes a dash last, Bleecker has café
tables; a green sign names the street as you turn into it. New treats:
cream pies, water balloons (lobbed, they splash), a bubble wand, big
paws, and "Call the army", six pups or kittens in party hats who help for
twelve seconds and wave goodbye. The bars are exact: whole points out of
100, the number beside each bar is the rules' own, every splat floats
its number ("-5"), what was just lost shows as a pale chip that drains,
quarter marks, and a slim bar over each leader's head. The rules run in
fixed 1/60 s steps with the drawing interpolated between them; a phone
that falls behind catches up in 1/30 s steps and, after a second and a
half under 30 fps, draws the canvas at 1x (dynamic resolution). A grid
over the city's solids made the rules 2.7x cheaper (0.35 to 0.13 ms a
step in Node), and city tiles reuse evicted canvases. Measured at
390x844: 58 fps day and night (the same as v1 on this machine); slowed
4x in a container with no GPU, day 22, sunset 16 to 19, night 18 fps,
against v1's 19.6 and 15.0 on the same machine that day. The camera
keeps the player between the bars and the buttons (`setInsets`).

**The opening sunrise** is permanent, at the owner's request: it plays
every time Arun is opened, with a new line each time (`lib/introLines.ts`,
forty lines in rotation, tested in `scripts/test-intro-lines.mjs`), and
there is no switch to turn it off. It is never forced: Skip, Need help
now and Escape leave it at once. Opened means any page load (a reload
too) or coming back after two minutes or more away, because an installed
app on a phone is mostly resumed, not relaunched; but not coming back
from a helpline call or text, or from the camera for the hope box
(`lib/intro.ts`, decided before paint in `app/page.tsx`). With
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

   The routine is written down as the `arun-ship-check` skill and runs
   from the repo: `npm run verify`, then `npm run e2e` (fifteen browser
   suites in `e2e/` against the Pages build; a change in behaviour adds
   its check there), then `npm run publish:root` to put the export at the
   repository root, then push to main and watch the Pages run.

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
In October 2026 the owner asked for the effects in every skill to be
used; they are listed in `DESIGN.md` (Motion) and follow the same rule:
the edge light on a sun button runs once when it arrives, then only
under a mouse or the keyboard; the shooting star in Here's sky comes
only from a tap on the sky; sparkles only for something kept; the dock
and the tilt only for a mouse, never under reduced motion. Nothing loops
on its own to get attention, and none of it is on the crisis parts.

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
