import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt.
 *
 * Everything public is crawlable, which is the right default here: there is
 * no private area to protect because there is no server and no per-user URL.
 * The only disallowed path is Next's build-output directory, which contains
 * hashed JavaScript and CSS chunks — not secret, just noise that no crawler
 * benefits from indexing as pages.
 *
 * Nothing under /guides, /resources, /about or /privacy is blocked. Quietly
 * disallowing the content you want found is the most common way a robots.txt
 * causes harm, so it is worth being explicit that this one does not.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/_next/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
