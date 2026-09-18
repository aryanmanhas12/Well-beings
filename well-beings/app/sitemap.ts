import type { MetadataRoute } from "next";
import { PAGES, absoluteUrl } from "@/lib/site";

/**
 * The sitemap, generated from the route table rather than maintained by hand.
 *
 * It contains exactly the pages that exist, are public, return 200 and are
 * their own canonical. There are no assessment results in it, because results
 * are a state inside the client app rather than a URL — there is no
 * per-person address on this site for anything to leak into. There are no
 * redirects, no duplicates and no 404 body.
 *
 * `lastModified` is the build time. For a statically exported site that is
 * genuinely when the page last changed, since a page cannot change without a
 * rebuild and a redeploy.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map((p) => ({
    url: absoluteUrl(p.path),
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
