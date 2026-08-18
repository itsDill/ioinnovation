/* Service Worker for IO Innovation Filings */

const STATIC_CACHE = "io-filings-static-v2026081801";
const RUNTIME_CACHE = "io-filings-runtime-v2026081801";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/holdings/",
  "/filers/",
  "/blog/",
  "/about.html",
  "/contact.html",
  "/privacy.html",
  "/terms.html",
  "/css/site.css",
  "/css/holdings.css",
  "/js/shared-simple.js",
  "/js/theme-init.js",
  "/js/holdings.js",
  "/favicon.svg",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
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
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
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

  const isHtml = req.destination === "document" || req.url.endsWith(".html") || req.url.endsWith("/");
  const isAsset = req.url.includes(".css") || req.url.includes(".js");

  if (isHtml || isAsset) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const cloned = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, cloned));
          return res;
        })
        .catch(() => caches.match(req))
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
    })
  );
});
