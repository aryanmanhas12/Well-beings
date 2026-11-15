import { Fredoka, Karla, Noto_Sans_Devanagari } from "next/font/google";

/* One place for the faces, because two files set them on <html>: the root
   layout, and the crash screen (app/global-error.tsx), which replaces the
   layout when something breaks and has to bring its own. Each call here is
   one hosted font, so defining them twice would ship them twice. */

/* Karla carries everything read slowly: copy, buttons, the guides. It is
   loaded as the variable font (no `weight` array) because 400, 500 and 600
   are all in use and one variable file is smaller than three static cuts.

   There was briefly a different display face, Fraunces. It was too much:
   its WONK axis cants the letterforms on purpose, and a statement card is
   not the place for type that draws attention to itself. */
export const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

/* The display face, added in v2 to sit beside Ronak's redesign. Ronak sets
   its headlines in Baloo 2, a heavy rounded face; Arun uses Fredoka,
   rounder and lighter, so the two read as family without reading as one
   product. It is only for things said out loud: the sky, headings, the
   numbers on the crisis screen. Latin only; Hindi headings fall back to
   Noto Sans Devanagari through the data-lang rules in globals.css. */
export const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

/* The Devanagari companion. Karla carries no Devanagari glyphs, so Hindi
   would otherwise fall back to whatever the OS supplies. Noto Sans
   Devanagari covers copy and display both, at the same three weights, which
   keeps Hindi and English on the same typographic rules. preload:false: it
   is dead weight for the English default and only fetches once Hindi is
   selected. */
export const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-devanagari",
  display: "swap",
  preload: false,
});

/** The three font variables, for the class on <html>. */
export const fontVariables = [karla.variable, fredoka.variable, notoDevanagari.variable].join(" ");
