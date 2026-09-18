import Link from "next/link";
import { NAV_PAGES, PAGE_BY_PATH, SITE_NAME, breadcrumbsFor } from "@/lib/site";
import { Breadcrumbs } from "./Breadcrumbs";
import { SiteFooter } from "./SiteFooter";

/**
 * The frame every content page sits in.
 *
 * Deliberately a server component with no "use client" anywhere in its tree.
 * The check-in at "/" is a genuine application and earns its JavaScript; a
 * page explaining why a regular wake time matters does not, and shipping the
 * app bundle to it would make the slowest pages on the site the ones a search
 * engine is most likely to sample. Navigation is plain links, the theme comes
 * from CSS media queries plus the pre-paint script in the root layout, and
 * nothing here needs to hydrate.
 *
 * Landmarks are explicit rather than implied: a skip link, then <header>,
 * <nav aria-label>, <main id="main">, <footer>. Screen-reader users get the
 * same three-jump navigation on every page.
 */
export function PageShell({
  path,
  children,
}: {
  /** Route this page is rendered at, used for breadcrumbs and to mark the
      current item in the nav. Must exist in the lib/site.ts table. */
  path: string;
  children: React.ReactNode;
}) {
  const page = PAGE_BY_PATH[path];
  const trail = breadcrumbsFor(path);

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
              {NAV_PAGES.map((p) => {
                // A guide page marks its parent ("Guides") as current too, so
                // the nav never looks like nothing is selected.
                const current = p.path === path || page?.parent === p.path;
                return (
                  <li key={p.path}>
                    <Link href={p.path} aria-current={current ? "page" : undefined}>
                      {p.nav}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      {trail.length > 1 && <Breadcrumbs trail={trail} />}

      <main id="main" className="site-main">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
