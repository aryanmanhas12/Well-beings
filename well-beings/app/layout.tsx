import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Well-Beings — a system for your energy, not just your to-do list",
  description:
    "A privacy-first, evidence-based check-in for sleep, mood and burnout that builds you a personalised daily system.",
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
    <html lang="en" className={inter.variable} style={{ colorScheme: "dark" }}>
      <body>{children}</body>
    </html>
  );
}
