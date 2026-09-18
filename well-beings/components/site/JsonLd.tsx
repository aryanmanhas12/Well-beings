import { PAGE_BY_PATH, SITE_NAME, SITE_URL, absoluteUrl, breadcrumbsFor } from "@/lib/site";

/**
 * Structured data, generated from the same route table the page renders from.
 *
 * The rule this file follows, and the reason it is this short: a schema type
 * is only emitted when the visible page really is that thing. So there is a
 * WebPage on every page because every page is one; a BreadcrumbList only
 * where breadcrumbs are actually on screen; an Article only on the guides,
 * which are genuinely articles with a named author; and an FAQPage only on
 * /about, where the questions and answers are visibly rendered above it.
 *
 * What is deliberately absent matters as much. There is no Organization (this
 * is one person's project, not a registered body), no MedicalWebPage or
 * MedicalEntity (Wellbeings does not diagnose and claiming a medical schema
 * type would assert otherwise to every crawler that reads it), no
 * aggregateRating, no review, and no credential of any kind. Those are the
 * fields that get health sites into trouble, and every one of them would be
 * fabricated here.
 */

/** Real, and the same person the /me page has always credited. */
const AUTHOR = {
  "@type": "Person",
  name: "Aryan Manhas",
  url: `${SITE_URL}/me/`,
} as const;

/** The date this content set was first published, and last materially
    revised. Update it when a guide's substance changes, not when a typo is
    fixed — dateModified that tracks whitespace is noise. */
const PUBLISHED = "2026-09-18";

type Node = Record<string, unknown>;

function graphFor(path: string, opts: { faq?: { q: string; a: string }[] }): Node[] {
  const page = PAGE_BY_PATH[path];
  const url = absoluteUrl(path);
  const nodes: Node[] = [];

  const website: Node = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    description: PAGE_BY_PATH["/"].description,
    inLanguage: "en",
    publisher: AUTHOR,
  };
  nodes.push(website);

  const isGuide = page.parent === "/guides/";

  nodes.push({
    "@type": isGuide ? "Article" : "WebPage",
    "@id": `${url}#page`,
    url,
    name: page.title,
    headline: isGuide ? page.title : undefined,
    description: page.description,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    ...(isGuide
      ? { author: AUTHOR, publisher: AUTHOR, datePublished: PUBLISHED, dateModified: PUBLISHED }
      : {}),
  });

  const trail = breadcrumbsFor(path);
  if (trail.length > 1) {
    nodes.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumbs`,
      itemListElement: trail.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.nav,
        item: absoluteUrl(p.path),
      })),
    });
  }

  if (opts.faq?.length) {
    nodes.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: opts.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return nodes;
}

export function JsonLd({
  path,
  faq,
}: {
  path: string;
  /** Pass only when the same questions and answers are visible on the page. */
  faq?: { q: string; a: string }[];
}) {
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graphFor(path, { faq }) });
  return (
    <script
      type="application/ld+json"
      // Build-time constant assembled from the route table above. No user
      // input reaches this string, so there is nothing here to escape.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
