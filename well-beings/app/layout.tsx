import type { Metadata, Viewport } from "next";
import { Fraunces, Karla, Noto_Sans_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/* Karla carries every word you read. Loaded as the variable font — no
   `weight` array — because the app uses 400 for copy, 500 for a few labels
   and 600 for headings and buttons, and one variable file is smaller than
   three static cuts of the same face. */
const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

/* Fraunces, the display voice: statement cards, screen titles, the brand,
   the big figures. `axes` pulls in SOFT and WONK alongside the weight axis;
   globals.css turns both up, and they are the whole reason this face looks
   drawn rather than picked. opsz comes along so the browser's own optical
   sizing has a range to work with between a 12px kicker and a 44px card. */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

/* Devanagari companions. Karla and Fraunces carry no Devanagari glyphs, so
   Hindi would fall back to whatever the OS supplies and lose the whole
   typographic voice. Tiro Devanagari Hindi is the serif that answers
   Fraunces; Noto Sans Devanagari carries body copy. Both are preload:false —
   they are dead weight for the English default, and only fetch once Hindi is
   selected. */
const tiroDevanagari = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-tiro-devanagari",
  display: "swap",
  preload: false,
});

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
      className={[karla.variable, fraunces.variable, tiroDevanagari.variable, notoDevanagari.variable].join(
        " ",
      )}
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
