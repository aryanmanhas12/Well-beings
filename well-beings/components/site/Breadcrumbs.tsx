import Link from "next/link";
import { SitePage } from "@/lib/site";

/**
 * Visible breadcrumbs. The matching BreadcrumbList structured data is emitted
 * by JsonLd on the same page and is built from the same trail, which is the
 * only way to keep the rule that structured data must describe what is
 * actually on screen.
 *
 * The last crumb is the current page: it is text, not a link, and carries
 * aria-current="page". Linking a breadcrumb to the page you are already on is
 * the most common way this pattern goes wrong for screen-reader users.
 */
export function Breadcrumbs({ trail }: { trail: SitePage[] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        {trail.map((p, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={p.path}>
              {last ? (
                <span aria-current="page">{p.nav}</span>
              ) : (
                <Link href={p.path}>{p.nav}</Link>
              )}
              {!last && (
                <span aria-hidden="true" className="crumbs-sep">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
