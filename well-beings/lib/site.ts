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
export const SITE_TAGLINE = "A quiet place for hard days, and a private look at everyday wellbeing";

/**
 * The companion product. Wellbeings is the broad lifestyle picture; Ronak is
 * the dedicated mental-health screening experience. They are separate tools on
 * purpose and share no data. See lib/bridge.ts for the whole contract.
 *
 * The name is "Ronak", taken from the product itself rather than assumed:
 * its repository titles the page "Ronak — Free, Private Mental Health
 * Screening" and its README opens "Ronak — Screen Early. Act Early." The app
 * was called Ronak here for a long time because it is served from a
 * path named /Psych/, which is the deploy location, not the brand.
 *
 * The URL parameters in lib/bridge.ts deliberately did NOT follow this
 * rename: Ronak ships code that reads `ref=wellbeings` and emits
 * `ref=psych-screener`, so those two strings are a wire format agreed between
 * two applications. Changing them to match the display name would silently
 * break the handoff in both directions.
 */
export const COMPANION_NAME = "Ronak";

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
    title: "Wellbeings · a quiet place for hard days",
    description:
      "A private safe place for hard days: check in with two taps, breathe with the sun, keep a hope box and a safety plan, and reach free helplines in one tap. Everything stays on your phone and nothing is sent anywhere.",
    changeFrequency: "monthly",
    priority: 1,
  },
  {
    path: "/guides/",
    nav: "Guides",
    title: "Wellbeing guides · sleep, movement, food, stress and habits",
    description:
      "Practical, evidence-informed guides to the parts of daily life that move wellbeing most: sleep timing, movement, eating and drinking, stress and recovery, habit formation, and student life.",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/guides/sleep/",
    nav: "Sleep",
    parent: "/guides/",
    title: "Sleep and wellbeing · why timing beats hours",
    description:
      "How sleep regularity, timing and light exposure shape mood and energy, why a consistent wake time matters more than a perfect eight hours, and what to change first when sleep is the weak link.",
    changeFrequency: "yearly",
    priority: 0.7,
  },
  {
    path: "/guides/activity/",
    nav: "Movement",
    parent: "/guides/",
    title: "Movement and wellbeing · the most reliable lever there is",
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
    title: "Stress and recovery · switching off is a skill",
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
    title: "Student wellbeing · coursework, sleep and the exam-term trap",
    description:
      "Wellbeing for school and university life: protecting sleep through exam periods, eating and moving on a timetable you do not control, and why treating output as the only measure backfires.",
    changeFrequency: "yearly",
    priority: 0.7,
  },
  {
    path: "/resources/",
    nav: "Support",
    title: "Support lines and directories · Wellbeings",
    description:
      "Free, confidential helplines and directories for India, the UK, the US, Canada, Australia, New Zealand and worldwide, plus guidance on when a conversation with a professional is worth having.",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/about/",
    nav: "About",
    title: "About Wellbeings · what it is and what it is not",
    description:
      "What the Wellbeings safe place does when things are hard, the published approaches behind its safety plan and hope box, what nobody sees, and how it differs from the screening in Ronak.",
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
    title: "Aryan Manhas · NeuroBioPsych",
    description:
      "Aryan Manhas builds free, private, evidence-based wellbeing and mental-health tools: Wellbeings and the Ronak. The NeuroBioPsych vision treats the neural, biological and psychosocial layers as one problem.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/terms/",
    nav: "Terms",
    hiddenInNav: true,
    title: "Terms of use · Wellbeings",
    description:
      "Wellbeings is free, has no account and stores nothing off your device. These terms cover what it is not: not a medical device, not a crisis service, not monitored, and not a substitute for professional advice.",
    changeFrequency: "yearly",
    priority: 0.4,
  },
  {
    path: "/privacy/",
    nav: "Privacy",
    title: "Privacy · where your Wellbeings answers live",
    description:
      "Wellbeings has no account, no server and no analytics, and nobody sees your check-ins. This page lists every key it stores, how care-team sharing and videos work, and how to delete it all.",
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
