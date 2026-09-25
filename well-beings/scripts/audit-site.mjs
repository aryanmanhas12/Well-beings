/**
 * Static audit of the exported site.
 *
 * Run after a build:  node scripts/audit-site.mjs [outDir]
 *
 * This exists because "SEO optimised" and "accessible" are claims, and a
 * claim about twelve pages that nobody re-checks is how three of them quietly
 * lose their canonical tag. Everything here is asserted against the real
 * emitted HTML in out/, not against the source that was supposed to produce
 * it. It exits non-zero on failure so it can be wired into CI.
 *
 * What it does not do: judge whether the writing is any good, or whether a
 * structured-data type is *appropriate*. Those need a person. It checks the
 * things that are mechanically checkable and that silently rot.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const OUT = resolve(process.argv[2] || "out");
const SITE = "https://aryanmanhas12.github.io/Well-beings";

const fails = [];
const warns = [];
const fail = (page, msg) => fails.push(`${page}: ${msg}`);
const warn = (page, msg) => warns.push(`${page}: ${msg}`);

/* ── collect pages ─────────────────────────────────────────────────────── */
function htmlFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "_next") continue;
      htmlFiles(p, acc);
    } else if (name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const pages = htmlFiles(OUT).map((file) => {
  const rel = "/" + relative(OUT, file).replace(/index\.html$/, "").replace(/\\/g, "/");
  return { file, route: rel === "/" ? "/" : rel, html: readFileSync(file, "utf8") };
});

const one = (html, re) => {
  const m = html.match(re);
  return m ? m[1] : null;
};
const all = (html, re) => [...html.matchAll(re)];

/* ── per-page checks ───────────────────────────────────────────────────── */
const titles = new Map();
const descs = new Map();
// 404.html is a copy of the not-found body; auditing it twice double-counts
// every title collision it would otherwise legitimately share.
const indexable = pages.filter((p) => !p.route.startsWith("/404") && p.route !== "/_not-found/");

for (const p of pages) {
  const isErrorPage = p.route.startsWith("/404") || p.route === "/_not-found/";

  const title = one(p.html, /<title>([^<]*)<\/title>/);
  const desc = one(p.html, /<meta name="description" content="([^"]*)"/);
  const canonical = one(p.html, /<link rel="canonical" href="([^"]*)"/);
  const h1s = all(p.html, /<h1[^>]*>([\s\S]*?)<\/h1>/g);

  if (!title) fail(p.route, "no <title>");
  if (!desc) fail(p.route, "no meta description");
  if (h1s.length !== 1) fail(p.route, `expected exactly 1 <h1>, found ${h1s.length}`);

  if (!isErrorPage) {
    if (!canonical) fail(p.route, "no canonical link");
    else if (canonical !== SITE + (p.route === "/" ? "/" : p.route))
      fail(p.route, `canonical does not point at itself: ${canonical}`);

    // Uniqueness, the thing that silently breaks when a page is copied.
    if (title && titles.has(title)) fail(p.route, `duplicate <title> with ${titles.get(title)}`);
    if (title) titles.set(title, p.route);
    if (desc && descs.has(desc)) fail(p.route, `duplicate description with ${descs.get(desc)}`);
    if (desc) descs.set(desc, p.route);

    for (const prop of ["og:title", "og:description", "og:url", "og:image", "og:type"]) {
      if (!p.html.includes(`property="${prop}"`)) fail(p.route, `missing ${prop}`);
    }
    if (!p.html.includes('name="twitter:card"')) fail(p.route, "missing twitter:card");
  } else if (!/noindex/.test(p.html)) {
    fail(p.route, "error page is not noindex");
  }

  /* Heading order: never skip a level going down. A jump from h1 to h3 is
     the single most common real-world screen-reader navigation defect. */
  const levels = all(p.html, /<h([1-6])[^>]*>/g).map((m) => Number(m[1]));
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1)
      fail(p.route, `heading level jumps h${levels[i - 1]} → h${levels[i]}`);
  }

  /* Images need alt. An empty alt is correct for decorative images, so the
     check is for the attribute's presence, not its contents. */
  for (const m of all(p.html, /<img\b[^>]*>/g)) {
    if (!/\balt=/.test(m[0])) fail(p.route, `<img> without alt: ${m[0].slice(0, 80)}`);
  }

  /* Structured data has to parse, and must not claim types this site cannot
     support. */
  for (const m of all(p.html, /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch (e) {
      fail(p.route, `JSON-LD does not parse: ${e.message}`);
      continue;
    }
    const nodes = parsed["@graph"] || [parsed];
    const banned = ["MedicalWebPage", "MedicalEntity", "Physician", "MedicalOrganization", "AggregateRating", "Review"];
    for (const n of nodes) {
      if (banned.includes(n["@type"]))
        fail(p.route, `JSON-LD asserts unsupported type "${n["@type"]}"`);
    }
    // An FAQPage must have its questions visibly on the page.
    const faq = nodes.find((n) => n["@type"] === "FAQPage");
    if (faq) {
      for (const q of faq.mainEntity || []) {
        const needle = q.name.replace(/[?']/g, "").slice(0, 28);
        const text = p.html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "").replace(/[?']/g, "");
        if (!text.includes(needle)) fail(p.route, `FAQ question not visible on page: "${q.name}"`);
      }
    }
  }

  /* Brand spelling. Only in visible text and metadata — code identifiers and
     the deploy path legitimately keep the old form. The companion product is
     Ronak; "Psych Screener" was this repo's own misnaming of it and must not
     come back into visible copy. */
  const visible = p.html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ");
  for (const bad of ["Well-Beings", "Well Beings", "WellBeing ", "Wellbeingss"]) {
    if (visible.includes(bad)) fail(p.route, `wrong brand spelling in visible text: "${bad}"`);
  }
  /* The product is Arun now. The old name is allowed once, on the About
     page, where it explains the rename; anywhere else it is a leftover. */
  if (p.route !== "/about/" && /\bWellbeings\b/.test(visible)) fail(p.route, 'old brand name "Wellbeings" in visible text');
  for (const bad of ["Psych Screener", "PsychScreener"]) {
    if (visible.includes(bad)) fail(p.route, `companion named "${bad}"; it is Ronak`);
  }

  /* Retired crisis numbers. KIRAN was merged into Tele-MANAS in February
     2024 and its number phased out; a crisis surface listing it offers a
     line that no longer answers. Any retired line goes in this list. */
  for (const bad of ["KIRAN", "1800-599-0019", "18005990019"]) {
    if (p.html.includes(bad)) fail(p.route, `lists a retired helpline: "${bad}"`);
  }

  /* Claims this site has already had to retract. Both apps are served from
     one origin, so their storage is shared at the browser level; saying
     otherwise was false. And the app monitors no one, so nothing may
     suggest it alerts anybody. */
  for (const bad of ["neither can read the other", "Neither app can read", "we will alert", "we'll alert", "will be notified"]) {
    if (visible.toLowerCase().includes(bad.toLowerCase())) fail(p.route, `makes a retracted or false claim: "${bad}"`);
  }

  /* Nothing should leak the framework on a page a stranger might land on. */
  if (isErrorPage && /next\.js/i.test(visible)) fail(p.route, "error page names the framework");
}

/* ── cross-page checks ─────────────────────────────────────────────────── */
const routes = new Set(indexable.map((p) => p.route));

for (const p of indexable) {
  for (const m of all(p.html, /href="(\/[^"#?]*)"/g)) {
    let href = m[1];
    if (href.startsWith("/Well-beings")) href = href.slice("/Well-beings".length) || "/";
    if (href.startsWith("/_next/") || /\.(png|ico|svg|webmanifest|txt|xml|js|css)$/.test(href)) continue;
    if (href.startsWith("/me")) continue; // hand-authored page outside this build
    if (!routes.has(href.endsWith("/") ? href : href + "/") && !routes.has(href))
      fail(p.route, `internal link 404s: ${m[1]}`);
  }
}

/* ── sitemap / robots / llms ───────────────────────────────────────────── */
const sitemapPath = join(OUT, "sitemap.xml");
if (!existsSync(sitemapPath)) fail("sitemap.xml", "missing");
else {
  const xml = readFileSync(sitemapPath, "utf8");
  const locs = all(xml, /<loc>([^<]+)<\/loc>/g).map((m) => m[1]);
  if (new Set(locs).size !== locs.length) fail("sitemap.xml", "contains duplicate URLs");
  for (const loc of locs) {
    const route = loc.replace(SITE, "") || "/";
    if (!routes.has(route)) fail("sitemap.xml", `lists a URL that is not a built page: ${loc}`);
  }
  for (const r of routes) {
    if (!locs.includes(SITE + (r === "/" ? "/" : r))) warn("sitemap.xml", `built page not listed: ${r}`);
  }
}

for (const [f, required] of [
  ["robots.txt", ["Sitemap:", "Allow: /"]],
  ["llms.txt", ["# Arun", "Ronak"]],
  ["og.png", []],
  ["404.html", []],
]) {
  const p = join(OUT, f);
  if (!existsSync(p)) fail(f, "missing from the export");
  else if (required.length) {
    const body = readFileSync(p, "utf8");
    for (const need of required) if (!body.includes(need)) fail(f, `does not contain "${need}"`);
  }
}

const robots = existsSync(join(OUT, "robots.txt")) ? readFileSync(join(OUT, "robots.txt"), "utf8") : "";
for (const r of routes) {
  if (new RegExp(`Disallow: ${r}\\s*$`, "m").test(robots)) fail("robots.txt", `blocks a public page: ${r}`);
}

/* ── report ────────────────────────────────────────────────────────────── */
console.log(`Audited ${pages.length} pages in ${OUT}\n`);
if (warns.length) {
  console.log(`${warns.length} warning(s):`);
  for (const w of warns) console.log("  ~ " + w);
  console.log();
}
if (fails.length) {
  console.log(`${fails.length} FAILURE(S):`);
  for (const f of fails) console.log("  ✗ " + f);
  process.exit(1);
}
console.log("✓ all checks passed");
