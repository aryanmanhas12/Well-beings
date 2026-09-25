"use client";

import { useEffect, useState } from "react";
import { localDateKey } from "@/lib/care";

export type HavenTab = "here" | "watch" | "hope" | "plan" | "reach";

/** Where a button elsewhere in the app can send someone. */
export type GoTo = (tab: HavenTab, view?: string) => void;

/**
 * The time, but only after mount.
 *
 * "Good evening" rendered on the server is rendered at build time, in UTC,
 * for everyone. Rendering a neutral greeting first and the real one after
 * hydration is the only way to say the right thing without a mismatch.
 */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function partOfDay(d: Date | null): string {
  if (!d) return "Hello";
  const h = d.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Late night";
}

/**
 * The same pick all day, a different one tomorrow.
 *
 * Re-rolling a suggestion on every render makes the screen feel like a slot
 * machine; the same suggestion for a whole day, with an "another one"
 * button, feels like something that was chosen.
 */
export function dailyPick<T>(list: T[], salt: string, offset = 0, now: Date | null = null): T {
  /* Before mount there is no trustworthy "today" (the server's is the build
     machine's), so the first render is the same everywhere and the daily
     pick takes over once the clock is known. */
  if (!now) return list[offset % list.length];
  const key = localDateKey(now) + salt;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return list[(h + offset) % list.length];
}

export function formatDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** "Why is this here?" One tap away, never in the way. */
export function Why({ children }: { children: string }) {
  return (
    <details className="why">
      <summary>Why this helps</summary>
      <p>{children}</p>
    </details>
  );
}
