/* Service Worker for IO Innovation Fund */
/* Improved caching strategy for mobile performance */

const CACHE_NAME = "io-innovation-v2025091501";
const STATIC_CACHE = "static-v2025091501";
const DYNAMIC_CACHE = "dynamic-v2025091501";
const IMAGES_CACHE = "images-v2025091501";

// Files to cache immediately
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/contact.html",
  "/privacy.html",
  "/terms.html",
  "/css/shared-clean.css",
  "/js/shared-simple.js",
  "/js/theme-init.js",
  "/js/core-web-vitals.js",
  "/js/seo-enhancements.js",
  "/js/google-ads-enhanced.js",
  "/favicon.svg",
  "/favicon.ico",
  "/manifest.json",
  "/apple-touch-icon.png",
];

// Files to cache dynamically
const DYNAMIC_ASSETS = [
  "/tools.html",
  "/markets.html",
  "/blog.html",
  "/js/mobile.js",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("📦 Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("📦 Static assets cached successfully");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("📦 Error caching static assets:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("🔄 Service Worker activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        const deletePromises = cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== CACHE_NAME
            );
          })
          .map((cacheName) => {
            console.log("🗑️ Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          });

        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log("🔄 Service Worker activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith("http")) {
    return;
  }

  // Skip external requests (Google Analytics, fonts, etc.)
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return a fallback for external resources if offline
        return new Response("", { status: 200, statusText: "OK" });
      })
    );
    return;
  }

  // HTML files - Network first, then cache
  if (request.destination === "document" || request.url.endsWith(".html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches
              .open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((response) => {
            return response || caches.match("/index.html");
          });
        })
    );
    return;
  }

  // CSS, JS, images - Cache first, then network
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.url.includes(".css") ||
    request.url.includes(".js")
  ) {
    event.respondWith(
      caches
        .match(request)
        .then((response) => {
          if (response) {
            // Return cached version
            return response;
          }

          // Fetch from network and cache
          return fetch(request).then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches
                .open(STATIC_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }
            return response;
          });
        })
        .catch(() => {
          // Return a fallback for critical resources
          if (request.url.includes(".css")) {
            return new Response(
              `
              /* Fallback CSS */
              body { font-family: Arial, sans-serif; margin: 0; padding: 1rem; }
              .container { max-width: 1200px; margin: 0 auto; }
            `,
              {
                headers: { "Content-Type": "text/css" },
                status: 200,
              }
            );
          }

          if (request.url.includes(".js")) {
            return new Response(
              `
              console.log('Fallback JS loaded');
            `,
              {
                headers: { "Content-Type": "application/javascript" },
                status: 200,
              }
            );
          }

          return new Response("", { status: 404 });
        })
    );
    return;
  }

  // Default: try network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches
            .open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background sync for mobile optimization
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("🔄 Background sync triggered");
    event.waitUntil(
      // Preload critical resources
      caches
        .open(STATIC_CACHE)
        .then((cache) => {
          return cache.addAll(DYNAMIC_ASSETS);
        })
        .catch((error) => {
          console.error("🔄 Background sync error:", error);
        })
    );
  }
});

// Push notification handling (if needed in future)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1,
      },
      actions: [
        {
          action: "explore",
          title: "View",
          icon: "/favicon.svg",
        },
        {
          action: "close",
          title: "Close",
          icon: "/favicon.svg",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Message handling for cache management
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
    );
  }

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

console.log("📱 Service Worker loaded successfully");
