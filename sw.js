/* Offline-first service worker.
   The point: someone on a patchy connection — a district town, a train, a
   campus dead spot — should still be able to open their plan and reach the
   helpline numbers. Everything this app serves is static and every score
   lives in localStorage, so the whole thing works with the network gone.

   Bump CACHE on any release that changes a precached file. A stale name
   means an installed copy serves the version it first saw, forever. */
const CACHE = "wellbeings-v7";

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

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      // Individually, so one 404 can't fail the whole install.
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

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
