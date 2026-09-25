import type { Metadata, Viewport } from "next";
import { Karla, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";
import { PAGE_BY_PATH, SITE_NAME, SITE_URL } from "@/lib/site";

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

/**
 * Site-wide metadata defaults. Per-page title, description, canonical and
 * social cards are set by each page from the one route table in lib/site.ts —
 * see lib/seo.ts. What stays here is only what is genuinely global.
 *
 * metadataBase is what makes a relative canonical resolve to the real public
 * address rather than to the deploy path, and it is why every page can
 * declare `alternates.canonical` as a plain path.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: PAGE_BY_PATH["/"].title,
    // Pages set their own full title; this only catches anything that sets a
    // bare segment, so a stray page can never end up untitled.
    template: `%s · ${SITE_NAME}`,
  },
  description: PAGE_BY_PATH["/"].description,
  applicationName: SITE_NAME,
  referrer: "strict-origin-when-cross-origin",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
  /* apple is its own 180px file, not the 192 reused. iOS composites a
     home-screen icon on an opaque background and applies its own corner
     radius, so it needs one square, opaque, un-rounded source at the size it
     actually asks for. Handing it the 192 with pre-rounded corners is what
     made the old icon land smaller and mis-shapen next to everything else on
     the home screen. See scripts/make-icons.mjs. */
  icons: {
    icon: [
      { url: `${basePath}/favicon.ico`, sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: `${basePath}/icon.svg`, type: "image/svg+xml" },
      { url: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: `${basePath}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }],
  },
};

/** themeColor is per-scheme so mobile browser chrome matches the page it
    frames instead of seaming against it in light mode. Zoom is left enabled
    deliberately — never `user-scalable=no`. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF6EA" },
    { media: "(prefers-color-scheme: dark)", color: "#1A0F0D" },
  ],
};

/**
 * Display preferences, applied before the first paint.
 *
 * There was a PrefsLoader component doing this from a `useEffect`, which by
 * definition runs *after* the browser has already painted — so the flash of
 * the wrong theme it existed to prevent still happened, and it read a
 * `wellbeings-prefs` key that nothing in the app writes any more. This runs
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
