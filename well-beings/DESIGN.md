---
name: Arun
description: A quiet place for hard days. Night to dawn, drawn warm, for people who may be struggling.
source_of_truth: app/globals.css (these values are copied from its custom properties; drift is a bug)
colors:
  dark:
    bg: "#110921"          # warm plum midnight, red in it, never blue-black
    surface: "#1B0F33"
    raised: "#26164A"
    text: "#FFF4E8"        # cream
    accent: "#FFC857"      # sun: anything you press
    accent-2: "#FF7AB0"    # dawn pink: what belongs to the person
    sun: "#FFC857"
    pink: "#FF7AB0"
    lilac: "#B794FF"
    peach: "#FF9F80"       # where the sky meets the horizon
    leaf: "#62D6A5"        # the one green, for things that grow
    ink: "#2A1636"         # comic ink: Ooh's outline, bubble text
    sun-text: "#FFD98A"
  light:
    bg: "#FFF5EC"          # dawn paper
    surface: "#FFFBF7"
    raised: "#FFFDFA"
    text: "#2A1B3D"        # plum ink, 14.76:1 on the page
    accent: "#9C2F6B"      # berry, 6.44:1 (sun yellow on paper is 1.49:1: fill only)
    accent-2: "#6A3FA0"    # plum, 7.20:1 on a card
typography:
  display: { family: Fredoka, weight: 600, tracking: "-0.02em", use: "headlines, the sky, crisis numbers; never longer than a heading" }
  body: { family: Karla, weight: "400 / 500 / 700", line-height: 1.62, use: "everything read slowly" }
  wordmark: { family: Karla, weight: 700, case: lowercase, tracking: "-0.03em", text: "arun" }
  banned: [Inter, DM Sans, Plus Jakarta Sans, Poppins, Outfit, Manrope, "Fraunces with WONK"]
radius: { sm: 4px, md: 8px, lg: 14px, xl: 28px }
spacing: { base: 2.8px, scale: [2.8, 5.6, 8.4, 11.2, 16.8, 22.4] }
shadow:
  sm: "0 0 0 1px #2E1F4E"
  md: "0 0 0 1px #463A60, 0 3px 10px rgba(6, 2, 16, 0.5)"
  lg: "0 0 0 1px #6F6388, 0 6px 20px rgba(6, 2, 16, 0.55)"
  comic: "4px 4px 0 #2A1636"   # Ooh's bubbles and buttons only
motion:
  ease-out: "cubic-bezier(0.2, 0.8, 0.2, 1)"
  ease-spring: "cubic-bezier(0.34, 1.56, 0.64, 1)"
  ease-settle: "cubic-bezier(0.22, 0.61, 0.36, 1)"
  tap-ring: 580ms
  room-in: 420-500ms, staggered 45ms
  glow: 1200ms
  sunrise: 3.2s
  properties: [transform, opacity]   # nothing else animates
contrast_floor: { body: "4.5:1 on surface, not just bg", sky_text: "6.94:1 worst measured pixel" }
---

# Arun: how it looks

`AGENTS.md` says how Arun is built and what it must never do. This file says
how it looks. Read both before visual work; where a generic design skill
disagrees with either, they win.

## The idea
A night sky that is on its way to dawn. The page is a warm plum midnight;
the colours of an actual sunrise are the accents. Purple lives in the sky
and the petals, never on a button: buttons are sun. If a change reads as
"indigo gradient startup", it is wrong even if every token is from here.

## Colour roles
- **Sun (#FFC857)**: anything you press. The one filled button on a screen
  is sun; "Help now" is the only filled button in the header.
- **Dawn pink and lilac**: things that belong to the person (hope box,
  people, good things, the letter).
- **Peach**: the horizon. **Leaf green**: things that grow, and nothing else.
- **Light mode** is dawn paper with plum ink and berry links; sun stays a
  fill there, never text.
- No pure #000 or #fff outside high-contrast mode.

## Type
Fredoka for headlines, the sky and the crisis numbers; Karla for
everything read slowly, with hierarchy from weight and size. Headings
break in balanced lines (`text-wrap: balance`); paragraphs never strand a
word (`text-wrap: pretty`). Numbers read digit by digit are tabular.

## Surfaces and shape
Cards are the surface colour on the night, with a hairline ring rather
than a grey border, and generous radii (14px cards, 28px panels and the
sky). Ooh and its bubbles are the one comic element: cream paper, a 3px
ink outline, a hard 4px offset shadow. A whisper of film grain lives on
the fixed atmosphere layer behind everything, never over text.

## The brand
The logo is the sun rising out of a square window beside a lowercase
"arun" (`lib/mark-geometry.mjs`, never redrawn by hand). The bloom-sun is
the illustration. Ooh (`lib/ooh.mjs`) is shared with Ronak, byte for byte.
Ronak writes its name the same way: lowercase Karla 700.

## Motion
Motion answers the person: a ring where a finger lands, a sweep of light
on a room change, the room's parts stepping in and its name wiped in by
the dawn, cards outlined in light as they arrive, a spotlight following a
mouse around a card's edge (never on a phone). Only transform and opacity
move; nothing fades text. Under reduced motion nothing moves, but the
lights stay, fading in place. The sky, its glow and the opening sunrise
are the slow atmosphere; they never move anything someone is reading.

## Do and don't
- Do measure every new colour pair and write the ratio in the CSS.
- Do check the full-page screenshot at 320, 390 and 1280 wide.
- Don't use a hero plus three equal cards; bands that each carry one idea.
- Don't add a second display face, a new accent, or a shadow that is not
  plum-tinted.
- Don't let anything cover the crisis strip, "Help now" or the first
  answer on a screen.

## Sister app
Ronak (aryanmanhas12/Psych) shares the bloom palette, Ooh and the
lowercase Karla wordmark, and differs where the products differ (Ronak:
screening, night to dawn in its opening film; Arun: the safe place and
daily life). Keep the overlap identical.
