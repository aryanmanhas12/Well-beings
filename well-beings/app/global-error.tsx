"use client";

import { CrisisStrip } from "@/components/CrisisStrip";
import { fontVariables } from "./fonts";
import "./globals.css";

/**
 * What a crash looks like: the crisis lines first, then one card.
 *
 * Without this file Next answers an uncaught error with its own screen
 * ("This page couldn't load", Reload, Back), and that screen replaces the
 * whole document, crisis strip included. In November 2026 it did exactly
 * that to the support page, offline, in 6 of 8 tries (public/sw.js now
 * caches what that page needs). This is for whatever breaks next.
 *
 * It renders the strip itself, so its numbers are the strip's, never a
 * copy, and it says only what is true: an error on screen does not touch
 * what is saved on the phone, and a call needs no internet. It replaces
 * the root layout, so it brings its own <html>, fonts and styles.
 *
 * "Try again" reloads the page. Next's unstable_retry was tried first and
 * did nothing useful here: after a script failed to load, the retry asked
 * for the same failed script and the crash screen stayed. A reload goes
 * back through the offline cache, which holds all Home and the support
 * page name (e2e/flows.e2e.mjs, section 10).
 */
export default function GlobalError() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <title>Arun</title>
        <CrisisStrip />
        <main className="crash" id="main">
          <div className="panel">
            <h1>Something on this page stopped working</h1>
            <p className="panel-lede">It isn&apos;t something you did. What you saved is still on this phone, and the numbers at the top still work.</p>
            <div className="btn-row">
              <button type="button" className="btn btn-sun" onClick={() => window.location.reload()}>
                Try again
              </button>
              <a className="btn btn-soft" href={`${base}/resources/`}>
                All support lines
              </a>
              <a className="btn btn-quiet" href={`${base}/`}>
                Back to Home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
