/**
 * The Well-Beings ↔ Psych Screener handoff.
 *
 * Psych Screener does the occasional deep clinical check across five
 * instruments (PHQ-9, GAD-7, WHO-5, AUDIT-C…); Well-Beings does the daily
 * pulse and the system built around it. Each points at the other when it's
 * the more useful tool for the moment — this file is the Well-Beings half
 * of a protocol Psych Screener already ships (see its index.html, "Well-
 * beings companion app").
 *
 * The contract is a URL parameter only, in both directions. No scores, no
 * answers, no identifiers cross between the two apps — each app promises
 * on its own privacy page that nothing it holds ever leaves the device,
 * and a richer handoff would quietly break that promise.
 *
 *   Outbound (Well-Beings -> Psych Screener):
 *     ?ref=wellbeings
 *     Psych Screener shows a welcome-back banner. Carries nothing about
 *     what triggered the redirect on this end.
 *
 *   Inbound (Psych Screener -> Well-Beings):
 *     ?ref=psych-screener&band=<0-3>
 *     band is the severity band just shown there — 0 minimal, 3 high —
 *     nothing finer-grained. Read once, then stripped from the address bar
 *     so a refresh or a shared link doesn't keep re-showing the banner.
 */

export const PSYCH_SCREENER_URL = "https://aryanmanhas12.github.io/Psych/";

export function psychScreenerLink(opts: { crisis?: boolean } = {}): string {
  const url = new URL(PSYCH_SCREENER_URL);
  url.searchParams.set("ref", "wellbeings");
  url.hash = opts.crisis ? "resources" : "guide";
  return url.toString();
}

export interface InboundHandoff {
  band: 0 | 1 | 2 | 3;
}

/** Reads the inbound handoff once and strips it from the URL immediately —
    same pattern Psych Screener uses on its side, so a page refresh never
    re-triggers the banner. Safe to call from a client-only effect; returns
    null during SSR and when there's nothing to read. */
export function readInboundHandoff(): InboundHandoff | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("ref") !== "psych-screener") return null;

  const raw = Number(params.get("band"));
  const band = (Number.isFinite(raw) ? Math.min(3, Math.max(0, Math.round(raw))) : 0) as 0 | 1 | 2 | 3;

  const url = new URL(window.location.href);
  url.searchParams.delete("ref");
  url.searchParams.delete("band");
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);

  return { band };
}
