import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, Teko } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

/* Anton — the condensed, heavy display face the statement cards are set in.
   Self-hosted from app/fonts rather than Google Fonts: it already shipped in
   this repo, and next/font/local rewrites the URL through basePath, which a
   hand-written @font-face in globals.css would not do on GitHub Pages. */
const anton = localFont({
  src: "./fonts/anton.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-anton",
  display: "swap",
});

/* Devanagari companions. Anton and Inter carry no Devanagari glyphs, so
   Hindi would fall back to whatever the OS supplies and lose the whole
   typographic voice. Teko is the condensed display match for Anton; Noto
   Sans Devanagari carries body copy. Both are preload:false — they are dead
   weight for the English default, and only fetch once Hindi is selected. */
const teko = Teko({
  subsets: ["devanagari", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-teko",
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
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0E131D" },
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
      className={[inter.variable, anton.variable, teko.variable, notoDevanagari.variable].join(" ")}
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
