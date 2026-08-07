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

/** themeColor matches --color-bg so mobile browser chrome doesn't seam
    against the page. Zoom is left enabled deliberately. */
export const viewport: Viewport = {
  themeColor: "#161826",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={[inter.variable, anton.variable, teko.variable, notoDevanagari.variable].join(" ")}
      style={{ colorScheme: "dark" }}
    >
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
