import Link from "next/link";
import { GUIDE_PAGES, PAGE_BY_PATH, SITE_NAME } from "@/lib/site";

/**
 * The footer, and the site's main internal-linking surface.
 *
 * Every link here exists because someone reading one page plausibly wants the
 * page it points at: the guides cross-link to each other, everything can
 * reach support and privacy in one hop. That is the test for an internal
 * link, not whether it passes authority around.
 *
 * The disclaimer is repeated on every page rather than hidden on an About
 * page, because the line "this is not a medical device" is only useful at the
 * moment someone is reading a claim about their sleep.
 */
export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="site-foot-inner">
        <nav aria-label="Guides">
          <h2 className="site-foot-h">Guides</h2>
          <ul>
            {GUIDE_PAGES.map((p) => (
              <li key={p.path}>
                <Link href={p.path}>{p.nav}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="About this tool">
          <h2 className="site-foot-h">{SITE_NAME}</h2>
          <ul>
            <li>
              <Link href="/">Take the wellbeing check</Link>
            </li>
            <li>
              <Link href={PAGE_BY_PATH["/resources/"].path}>Support lines and directories</Link>
            </li>
            <li>
              <Link href={PAGE_BY_PATH["/about/"].path}>About and limitations</Link>
            </li>
            <li>
              <Link href={PAGE_BY_PATH["/privacy/"].path}>Privacy and your data</Link>
            </li>
            <li>
              <Link href={PAGE_BY_PATH["/terms/"].path}>Terms of use</Link>
            </li>
          </ul>
        </nav>
      </div>

      <p className="site-foot-note">
        {SITE_NAME} is a self-guidance tool, not a medical device, and nothing here is a diagnosis. If
        something is affecting your daily life, a GP or another qualified professional is the right next
        step. If you need to talk to someone now, the{" "}
        <Link href="/resources/">support lines</Link> are free and open 24/7.
      </p>
    </footer>
  );
}
