/* Offline-first service worker.
   The point: someone on a patchy connection — a district town, a train, a
   campus dead spot — should still be able to open their plan and reach the
   helpline numbers. Everything this app serves is static and every score
   lives in localStorage, so the whole thing works with the network gone.

   Bump CACHE on any release that changes a precached file. A stale name
   means an installed copy serves the version it first saw, forever. */
const CACHE = "wellbeings-v20";

/* Resolved against the SW's own scope, so this works identically at the
   root in development and under /Well-beings/ on GitHub Pages. */
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  /* The support page is precached deliberately and is the reason this list
     is not just the app shell. Everything else here degrades gracefully
     without a connection; a crisis line you cannot reach because you are in
     a dead spot does not. It is a static page with no scripts of its own, so
     it costs almost nothing to hold. */
  "./resources/",
];

/* The pages that must open offline with everything they run on. */
const WHOLE = ["./", "./resources/"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      // Individually, so one 404 can't fail the whole install.
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))).then(() => c))
      .then((c) => Promise.allSettled(WHOLE.map((page) => cacheAssetsOf(c, page))))
      .then(() => self.skipWaiting())
  );
});

/* The scripts, styles and fonts a precached page names, cached with it.
   A page's HTML alone does not open it offline. In November 2026 the
   support page, opened offline on a phone that had never opened it, came
   out of this cache without the scripts it names: React stopped at the
   first missing one and Next replaced the page, helplines and all, with
   its own "This page couldn't load", in 6 of 8 tries (3 of 8 on the
   release before). Home had the same gap: after a first visit none of its
   scripts were here (14 of 14 missing), because they load before this
   worker takes over, so offline it drew but answered no tap until a
   second visit online. The names are hashed per build, so they are read
   from the cached page. noModule scripts are for browsers too old to run
   this worker. */
async function cacheAssetsOf(cache, page) {
  const res = await cache.match(page);
  if (!res) return;
  const html = await res.text();
  const urls = new Set();
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi) || []) {
    if (/\bnomodule\b/i.test(tag)) continue;
    const m = tag.match(/\b(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/);
    if (m) urls.add(m[1]);
  }
  await Promise.allSettled([...urls].map((u) => cache.match(u).then((hit) => hit || cache.add(u))));
}

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch third parties

  // Navigations: network first, so a shipped update is seen immediately;
  // fall back to the cached shell when offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => {
            if (hit) return hit;
            /* Offline and never visited. Anything under the support path
               falls back to the support page rather than the app shell,
               because a cached list of helplines is the single most useful
               thing this cache holds. */
            const wantsSupport = new URL(req.url).pathname.includes("/resources");
            return caches.match(wantsSupport ? "./resources/" : "./index.html");
          })
        )
    );
    return;
  }

  // Next's build output is content-hashed, so a hit is always correct.
  if (url.pathname.includes("/_next/static/")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // Everything else: serve cache immediately, refresh in the background.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
