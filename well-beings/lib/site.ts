/**
 * One source of truth for the public site: where it lives, which pages exist,
 * and what each one claims to be.
 *
 * Everything that needs the route list reads it from here — the header nav,
 * the footer, breadcrumbs, per-page metadata, the sitemap, robots.txt and
 * llms.txt. That matters more than it sounds: the usual way a sitemap starts
 * lying is that someone adds a page and updates four of the five places that
 * list pages. Here there is one place.
 *
 * On the canonical origin. The live site is a GitHub project page, so its
 * real address includes the repository name as a path prefix. That prefix is
 * fixed by the repository name and cannot be changed from inside the code,
 * which is also why the guide pages live at /guides/<topic> rather than
 * /wellbeings/<topic>: the deployed URL is already under /Well-beings, and a
 * second "wellbeings" segment would read as .../Well-beings/wellbeings/sleep.
 *
 * SITE_URL is deliberately hard-coded to the production address rather than
 * derived from NEXT_PUBLIC_BASE_PATH. A canonical tag has exactly one correct
 * value, and a local build that emitted canonicals pointing at localhost —
 * or at a bare path — would be worse than no canonical at all.
 */

export const SITE_ORIGIN = "https://aryanmanhas12.github.io";
export const SITE_PATH = "/Well-beings";
export const SITE_URL = `${SITE_ORIGIN}${SITE_PATH}`;

export const SITE_NAME = "Wellbeings";
export const SITE_TAGLINE = "Understand your everyday wellbeing, then change one thing that sticks";

/** The companion product. Wellbeings is the broad lifestyle picture; this is
    the dedicated mental-health screening experience. They are separate tools
    on purpose and share no data — see lib/bridge.ts for the whole contract. */
export const COMPANION_NAME = "Psych Screener";

export interface SitePage {
  /** Route path, always with a trailing slash to match next.config's
      trailingSlash: true. Used verbatim as the canonical path. */
  path: string;
  /** <title>. Unique across the site — there is a test for this. */
  title: string;
  /** <meta name="description">. Unique across the site. */
  description: string;
  /** Short label for navigation and breadcrumbs. */
  nav: string;
  /** Parent path, for breadcrumbs. Undefined means it hangs off the root. */
  parent?: string;
  /** Roughly how often the page's content changes, for the sitemap. */
  changeFrequency: "monthly" | "yearly";
  priority: number;
  /** Excluded from the nav but still indexable and in the sitemap. */
  hiddenInNav?: boolean;
}

export const PAGES: SitePage[] = [
  {
    path: "/",
    nav: "Home",
    title: "Wellbeings — understand your everyday wellbeing",
    description:
      "A private, five-minute wellbeing check covering sleep, movement, food, stress, connection and routine. It runs entirely in your browser and turns what you report into two or three changes worth actually making.",
    changeFrequency: "monthly",
    priority: 1,
  },
  {
    path: "/guides/",
    nav: "Guides",
    title: "Wellbeing guides — sleep, movement, food, stress and habits",
    description:
      "Practical, evidence-informed guides to the parts of daily life that move wellbeing most: sleep timing, movement, eating and drinking, stress and recovery, habit formation, and student life.",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/guides/sleep/",
    nav: "Sleep",
    parent: "/guides/",
    title: "Sleep and wellbeing — why timing beats hours",
    description:
      "How sleep regularity, timing and light exposure shape mood and energy, why a consistent wake time matters more than a perfect eight hours, and what to change first when sleep is the weak link.",
    changeFrequency: "yearly",
    priority: 0.7,
  },
  {
    path: "/guides/activity/",
    nav: "Movement",
    parent: "/guides/",
    title: "Movement and wellbeing — the most reliable lever there is",
    description:
      "What the research on physical activity and mood actually supports, how much movement is enough, and how to make it happen on weeks when motivation is not available.",
    changeFrequency: "yearly",
    priority: 0.7,
  },
  {
    path: "/guides/nutrition/",
    nav: "Food and drink",
    parent: "/guides/",
    title: "Eating, drinking and steady energy through the day",
    description:
      "Practical guidance on meal regularity, hydration, caffeine timing and alcohol, focused on how each one shows up in energy, sleep and concentration rather than on weight or diet rules.",
    changeFrequency: "yearly",
    priority: 0.7,
  },
  {
    path: "/guides/stress/",
    nav: "Stress and recovery",
    parent: "/guides/",
    title: "Stress and recovery — switching off is a skill",
    description:
      "Why psychological detachment after work or study predicts exhaustion better than hours worked, which recovery activities actually restore energy, and how to build a shutdown that works.",
    changeFrequency: "yearly",
    priority: 0.7,
  },
  {
    path: "/guides/habits/",
    nav: "Habits",
    parent: "/guides/",
    title: "Building habits that survive a bad week",
    description:
      "How long habits really take to form, why missing a day does not reset anything, and the one planning technique with the strongest evidence behind it.",
    changeFrequency: "yearly",
    priority: 0.7,
  },
  {
    path: "/guides/student-wellbeing/",
    nav: "Student life",
    parent: "/guides/",
    title: "Student wellbeing — coursework, sleep and the exam-term trap",
    description:
      "Wellbeing for school and university life: protecting sleep through exam periods, eating and moving on a timetable you do not control, and why treating output as the only measure backfires.",
    changeFrequency: "yearly",
    priority: 0.7,
  },
  {
    path: "/resources/",
    nav: "Support",
    title: "Support lines and directories — Wellbeings",
    description:
      "Free, confidential helplines and directories for India, the UK, the US, Canada, Australia, New Zealand and worldwide, plus guidance on when a conversation with a professional is worth having.",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/about/",
    nav: "About",
    title: "About Wellbeings — what it is and what it is not",
    description:
      "What Wellbeings measures, how the wellbeing snapshot is put together, what its limits are, and how it differs from the dedicated mental-health screening in Psych Screener.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    /* Hand-authored HTML in public/me/, not a Next route — it predates the
       app and shares the companion project's design system on purpose. It is
       listed here so the sitemap and the audit both know it exists; its
       <title>, description, canonical and social tags live in that file. */
    path: "/me/",
    nav: "About the author",
    hiddenInNav: true,
    title: "Aryan Manhas — NeuroBioPsych",
    description:
      "Aryan Manhas builds free, private, evidence-based wellbeing and mental-health tools: Wellbeings and the Psych Screener. The NeuroBioPsych vision treats the neural, biological and psychosocial layers as one problem.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/privacy/",
    nav: "Privacy",
    title: "Privacy — where your Wellbeings answers live",
    description:
      "Wellbeings has no account, no server and no analytics. Everything you enter stays in your own browser storage. This page says exactly what is stored, where, and how to delete it.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
];

export const PAGE_BY_PATH: Record<string, SitePage> = Object.fromEntries(
  PAGES.map((p) => [p.path, p]),
);

/** Top-level nav: everything without a parent, minus the home entry the
    wordmark already covers. */
export const NAV_PAGES = PAGES.filter((p) => !p.parent && !p.hiddenInNav && p.path !== "/");

export const GUIDE_PAGES = PAGES.filter((p) => p.parent === "/guides/");

/** Home → … → this page. Home is always first; the page itself is always
    last and is the one entry rendered without a link. */
export function breadcrumbsFor(path: string): SitePage[] {
  const trail: SitePage[] = [];
  let cursor: SitePage | undefined = PAGE_BY_PATH[path];
  while (cursor) {
    trail.unshift(cursor);
    cursor = cursor.parent ? PAGE_BY_PATH[cursor.parent] : undefined;
  }
  const home = PAGE_BY_PATH["/"];
  if (trail[0]?.path !== "/") trail.unshift(home);
  return trail;
}

/** Absolute URL for a route. Everything public-facing uses this so a path is
    never half-qualified in one place and fully qualified in another. */
export function absoluteUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
