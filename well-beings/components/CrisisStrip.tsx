"use client";

import { useEffect, useState } from "react";
import { crisisLines, DEFAULT_REGION, HELPLINES, helplineHref } from "@/lib/helplines";
import type { HelplineEntry, HelplineRegion, Region } from "@/lib/types";

/**
 * "Need to talk now?" with two numbers, pinned to the top of every screen.
 *
 * Ronak pins the same kind of strip, and the reasoning carries over: the
 * Help button is one tap away, but a number already on screen is zero taps
 * away, and it is the one thing on the page that must never need finding.
 *
 * It shows the region's first crisis line and its emergency number. The
 * app passes its region in; the static pages (guides, privacy) have no app
 * state, so they read the saved region after mount and show India's lines
 * until then, the same default the rest of the app uses.
 */
function pick(region: HelplineRegion): HelplineEntry[] {
  const lines = crisisLines(region);
  const emergency = region.lines.find((l) => l.name === "Emergency" && l.tel);
  const first = lines.find((l) => l !== emergency && helplineHref(l));
  return [first, emergency].filter((l): l is HelplineEntry => !!l);
}

/** The number someone dials, not the whole contact line. */
function shortContact(h: HelplineEntry): string {
  const first = h.contact.split(" · ")[0];
  return first.replace(/^Call or text /, "");
}

function shortName(h: HelplineEntry): string {
  if (h.name === "Emergency") return "Emergency";
  return h.name.length <= 18 ? h.name : "";
}

export function CrisisStrip({ region }: { region?: HelplineRegion }) {
  const [stored, setStored] = useState<Region | null>(null);

  useEffect(() => {
    if (region) return;
    try {
      const r = JSON.parse(localStorage.getItem("wellbeings-safe-v1") || "null")?.region as Region | undefined;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (r && HELPLINES[r]) setStored(r);
    } catch {
      // Storage blocked: the default region's lines are still correct to show.
    }
  }, [region]);

  const r = region ?? HELPLINES[stored ?? DEFAULT_REGION];
  const lines = pick(r);
  if (!lines.length) return null;

  return (
    <div className="crisis-strip" role="region" aria-label="Crisis lines">
      <span className="crisis-dot" aria-hidden="true" />
      <span className="crisis-lead">Need to talk now?</span>
      {lines.map((h, i) => (
        <span key={h.name} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          {i > 0 && (
            <span className="crisis-sep" aria-hidden="true">
              ·
            </span>
          )}
          <a href={helplineHref(h)} {...(helplineHref(h)?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {h.tel ? [shortName(h), shortContact(h)].filter(Boolean).join(" ") : h.name}
          </a>
        </span>
      ))}
    </div>
  );
}
