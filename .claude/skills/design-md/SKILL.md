---
name: design-md
description: Use when starting any visual work on Ronak or Arun, when the user mentions DESIGN.md, Awesome DESIGN.md, Google Stitch or a "design system file", or when a change adds a colour, font, radius, shadow or motion token. Explains how to read and keep DESIGN.md (the design source of truth an agent reads) in sync with the CSS, and how to borrow from the VoltAgent Awesome DESIGN.md library.
---

# DESIGN.md: the design source of truth

`DESIGN.md` (a Google Stitch convention) is a plain markdown file at the repo
root that tells any AI agent how the product looks: YAML front matter with
tokens (colors, typography, spacing, radius, motion), then prose for
components and do/don't rules. `AGENTS.md` says how to build; `DESIGN.md`
says how it should look.

## Every time you do visual work
1. Read `DESIGN.md` first. It wins over your defaults and over any skill's
   generic taste rules when they disagree.
2. Use only its tokens. If the design genuinely needs a new token, add it to
   `DESIGN.md` AND to the CSS custom properties in the same commit.
3. After the change, check the file still matches reality:
   `grep -oE -- "--[a-z-]+:#[0-9A-Fa-f]{6}" site.css | sort -u` against the
   colors block. Drift is a bug.

## Borrowing from Awesome DESIGN.md
github.com/VoltAgent/awesome-design-md (MIT) is a library of ~70 DESIGN.md
files analysed from real products (Linear, Notion, Claude, Airbnb...). It is a
reference shelf, not a skill and not something to install wholesale:
- Fetch one: `curl -s https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/<site>/DESIGN.md`
- Use it to learn how a mature system specifies a thing (elevation scale,
  focus rings, empty states), then express the idea in Ronak's own tokens.
- Never paste another brand's palette or type into Ronak or Arun: both share
  the bloom-sun identity (plum ink, dawn cream, pink/violet/gold light) and
  Ooh; that is the point.

## Ronak and Arun
They are sister apps with one shared character (Ooh, `ooh.mjs`) and one
brand family. Keep their DESIGN.md files consistent where they overlap
(Ooh's colours, the bloom palette, the lowercase Karla 700 wordmark) and
different where the products differ (Ronak: night to dawn, screening;
Arun: the daily-life picture).
