// Simple Service Worker for IO Innovation Fund - FORCE CACHE CLEAR
const CACHE_NAME = "io-innovation-fund-v2025090802"; // New version to force cache clear
const urlsToCache = [
  "/",
  "/index.html",
  "/css/shared-clean.css", // Updated to use clean CSS
  "/js/shared-simple.js", // Updated to use simple JS
  "/js/theme-init.js",
  "/favicon.svg",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Force network first for HTML files to ensure fresh content
  if (event.request.url.includes(".html") || event.request.url.endsWith("/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
    );
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
