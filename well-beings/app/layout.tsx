import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";
import { PrefsLoader } from "@/components/PrefsLoader";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lora",
  display: "swap",
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
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${lora.variable}`} style={{ colorScheme: "dark" }}>
      <head>
        {/* Inline script to apply preferences before first paint.
            Without this, accessibility users see flash of wrong theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p;try{p=JSON.parse(localStorage.getItem("well-beings-prefs")||"{}")}catch(e){return}var root=document.documentElement;if(p.theme&&p.theme!=="auto")root.setAttribute("data-theme",p.theme);if(p.contrast)root.setAttribute("data-contrast","high");if(p.scale&&p.scale!==1)root.style.setProperty("--scale",p.scale.toString())})();`,
          }}
        />
      </head>
      <body>
        <PrefsLoader />
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
