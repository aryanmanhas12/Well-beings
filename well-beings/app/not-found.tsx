import type { Metadata } from "next";
import Link from "next/link";
import { GUIDE_PAGES, NAV_PAGES, SITE_NAME } from "@/lib/site";
import { SiteFooter } from "@/components/site/SiteFooter";

/**
 * The 404.
 *
 * Deliberately not the framework default, which says "This page could not be
 * found" on a blank white page and names the framework in the process. This
 * one is branded, navigable, and says nothing about what is running
 * underneath — a stack trace, a framework name or a route pattern on an error
 * page is free reconnaissance and is never useful to the person reading it.
 *
 * noindex is set because a 404 body served at some arbitrary URL is exactly
 * the kind of page that ends up in an index if you let it. There is no search
 * on this site, so the useful fallback is the real route list rather than a
 * search box that would find nothing.
 */
export const metadata: Metadata = {
  title: `Page not found · ${SITE_NAME}`,
  description: "That page does not exist. Here is everything on the site instead.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="site-head">
        <div className="site-head-inner">
          <Link href="/" className="site-wordmark">
            {SITE_NAME}
          </Link>
          <nav aria-label="Main">
            <ul className="site-nav">
              {NAV_PAGES.map((p) => (
                <li key={p.path}>
                  <Link href={p.path}>{p.nav}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="site-main">
        <div className="prose">
          <h1>That page does not exist</h1>
          <p className="lede">
            The address you followed is not a page on this site. Nothing has gone wrong with your
            data, and the check-in is where you left it.
          </p>

          <h2>Where you probably meant to go</h2>
          <ul>
            <li>
              <Link href="/">The Wellbeings check</Link>: five minutes, entirely private, and it
              tells you which one thing is worth changing first.
            </li>
            <li>
              <Link href="/resources/">Support lines</Link>: free and open 24/7, if you need
              someone now.
            </li>
            <li>
              <Link href="/about/">About Wellbeings</Link>: what it measures and what it does not.
            </li>
            <li>
              <Link href="/privacy/">Privacy</Link>: where your answers live.
            </li>
            <li>
              <Link href="/terms/">Terms of use</Link>: what this tool is and is not.
            </li>
          </ul>

          <h2>All the guides</h2>
          <ul>
            {GUIDE_PAGES.map((p) => (
              <li key={p.path}>
                <Link href={p.path}>{p.nav}</Link>: {p.description}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
