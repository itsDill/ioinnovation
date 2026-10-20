/* Service Worker for IO Innovation Tools */

const STATIC_CACHE = "io-tools-static-v2026102021";
const RUNTIME_CACHE = "io-tools-runtime-v2026102021";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/tools/",
  "/tools/dividend-calculator.html",
  "/tools/compound-growth-calculator.html",
  "/tools/stock-return-calculator.html",
  "/tools/position-size-calculator.html",
  "/tools/dcf-valuation.html",
  "/tools/portfolio-allocation.html",
  "/tools/retirement-planner.html",
  "/tools/savings-goal-calculator.html",
  "/tools/inflation-calculator.html",
  "/blog/",
  "/about.html",
  "/contact.html",
  "/privacy.html",
  "/terms.html",
  "/css/site.css",
  "/css/holdings.css",
  "/css/home.css",
  "/css/blog-article.css?v=2026102001",
  "/css/contact.css?v=2026102001",
  "/css/portfolio-allocation.css?v=2026102003",
  "/css/dividend-calculator.css?v=2026102002",
  "/css/inflation-calculator.css?v=2026102002",
  "/css/compound-growth.css?v=2026102002",
  "/css/dcf-valuation.css?v=2026102002",
  "/css/position-size-calculator.css?v=2026102001",
  "/css/retirement-planner.css?v=2026102001",
  "/css/savings-goal-calculator.css?v=2026102001",
  "/css/stock-return-calculator.css?v=2026102002",
  "/js/shared-simple.js",
  "/js/theme-init.js",
  "/js/portfolio-allocation.js?v=2026102003",
  "/js/dividend-calculator.js?v=2026102002",
  "/js/inflation-calculator.js?v=2026102002",
  "/js/compound-growth.js?v=2026102002",
  "/js/dcf-valuation.js?v=2026102003",
  "/js/position-size-calculator.js?v=2026102001",
  "/js/retirement-planner.js?v=2026102001",
  "/js/savings-goal-calculator.js?v=2026102001",
  "/js/stock-return-calculator.js?v=2026102002",
  "/favicon.svg",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") {
    return;
  }

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const isHtml =
    req.destination === "document" ||
    req.url.endsWith(".html") ||
    req.url.endsWith("/");
  const isAsset = req.url.includes(".css") || req.url.includes(".js");

  if (isHtml || isAsset) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const cloned = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, cloned));
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(req)
        .then((res) => {
          const cloned = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, cloned));
          return res;
        })
        .catch(() => new Response("", { status: 404 }));
    }),
  );
});
