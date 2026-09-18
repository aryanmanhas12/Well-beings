import type { Metadata } from "next";
import { PAGE_BY_PATH, SITE_NAME, SITE_URL, absoluteUrl } from "./site";

/**
 * Per-page metadata, built from the one route table in lib/site.ts.
 *
 * Every public page gets a unique title and description, a self-referencing
 * canonical, and Open Graph and Twitter cards built from the same two
 * strings. Doing it from the table rather than by hand per page is what keeps
 * "unique title" true as pages are added — there is a test in
 * scripts/audit-site.mjs that fails the build's audit if two ever collide.
 *
 * One rule this file exists to enforce: nothing here ever sees a user's
 * answers. Social metadata is generated at build time from static route
 * copy, so there is no code path by which a wellbeing result could reach an
 * og:description, a page title, or a shared link. The assessment and results
 * screens are states inside the client app at "/", not routes, which means
 * they have no URL of their own to leak into and nothing to crawl.
 */

export const OG_IMAGE = {
  url: `${SITE_URL}/og.png`,
  width: 1200,
  height: 630,
  alt: "Wellbeings — a private wellbeing check that runs entirely in your browser",
};

export function metadataFor(path: string): Metadata {
  const page = PAGE_BY_PATH[path];
  if (!page) throw new Error(`metadataFor: no page registered for ${path}`);

  const url = absoluteUrl(path);

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: page.title,
      description: page.description,
      url,
      locale: "en_GB",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [OG_IMAGE.url],
    },
  };
}
