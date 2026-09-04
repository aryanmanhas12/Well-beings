import type { Metadata, Viewport } from "next";
import { Karla, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/* Karla carries the whole app — copy, headings, buttons and the big display
   figures alike, separated by weight rather than by family. Loaded as the
   variable font (no `weight` array) because 400, 500 and 600 are all in use
   and one variable file is smaller than three static cuts of the same face.

   There was briefly a second face here, Fraunces, for the display slot. It
   was too much: its WONK axis cants the letterforms on purpose, and a
   statement card is not the place for type that draws attention to itself.
   One family, three weights, no second download. */
const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

/* The Devanagari companion. Karla carries no Devanagari glyphs, so Hindi
   would otherwise fall back to whatever the OS supplies. Noto Sans
   Devanagari covers copy and display both, at the same three weights, which
   keeps Hindi and English on the same typographic rules. preload:false — it
   is dead weight for the English default and only fetches once Hindi is
   selected. */

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-devanagari",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Well-Beings — a system for your energy, not just your to-do list",
  description:
    "A privacy-first, evidence-based check-in for sleep, mood and burnout that builds you a personalised daily system.",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: "Well-Beings", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: `${basePath}/icon-192.png`,
  },
};

/** themeColor is per-scheme so mobile browser chrome matches the page it
    frames instead of seaming against it in light mode. Zoom is left enabled
    deliberately — never `user-scalable=no`. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF4E9" },
    { media: "(prefers-color-scheme: dark)", color: "#17120E" },
  ],
};

/**
 * Display preferences, applied before the first paint.
 *
 * There was a PrefsLoader component doing this from a `useEffect`, which by
 * definition runs *after* the browser has already painted — so the flash of
 * the wrong theme it existed to prevent still happened, and it read a
 * `well-beings-prefs` key that nothing in the app writes any more. This runs
 * synchronously in <head>, before <body> exists, from the one store the app
 * actually uses. Worst case it throws (storage blocked) and the try/catch
 * leaves the OS default in place.
 *
 * Kept as a string so it ships verbatim; `suppressHydrationWarning` on <html>
 * is required because this mutates the element before React hydrates it.
 */
const PREFS_BOOTSTRAP = `
(function(){try{
  var s=(JSON.parse(localStorage.getItem("wellbeings-v1")||"{}")||{}).settings||{};
  var r=document.documentElement;
  if(s.theme&&s.theme!=="auto")r.setAttribute("data-theme",s.theme);
  if(s.contrast)r.setAttribute("data-contrast","high");
  if(s.scale&&s.scale!==1)r.style.setProperty("--scale",String(s.scale));
  if(s.lang){r.setAttribute("data-lang",s.lang);r.setAttribute("lang",s.lang);}
}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={[karla.variable, notoDevanagari.variable].join(" ")}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_BOOTSTRAP }} />
      </head>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
