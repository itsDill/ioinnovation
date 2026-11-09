/* Service Worker for IO Innovation Tools */

const STATIC_CACHE = "io-tools-static-v2026110602";
const RUNTIME_CACHE = "io-tools-runtime-v2026110602";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/physical-assets.html",
  "/physical/map.html",
  "/physical/asset-profile.html",
  "/physical/ports/Shanghai-port.html",
  "/physical/ports/Singapore-port.html",
  "/physical/ports/Ningbo-Zhoushan-port.html",
  "/financial-assets.html",
  "/financial/",
  "/financial/index.html",
  "/financial/holdings.html",
  "/financial/equities.html",
  "/financial/ownership.html",
  "/financial/valuation.html",
  "/financial/capital-allocation.html",
  "/financial/disclosures.html",
  "/market-intelligence.html",
  "/intelligence/",
  "/intelligence/index.html",
  "/intelligence/industry-trends.html",
  "/intelligence/infrastructure-pipelines.html",
  "/intelligence/investment-research.html",
  "/intelligence/commodity-systems.html",
  "/intelligence/companies-capital.html",
  "/intelligence/sources-method.html",
  "/tools/",
  "/tools/13f-comparison.html",
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
  "/blog/what-is-a-13f.html",
  "/about.html",
  "/contact.html",
  "/privacy.html",
  "/terms.html",
  "/css/site.css?v=2026110504",
  "/css/holdings.css",
  "/css/home.css?v=2026110504",
  "/css/fund.css?v=2026110504",
  "/css/financial-assets.css?v=2026110503",
  "/css/asset-atlas.css?v=2026110503",
  "/css/shanghai-port.css?v=2026110601",
  "/css/asset-profile.css?v=2026110601",
  "/css/market-intelligence.css?v=2026110503",
  "/css/13f-comparison.css?v=2026102601",
  "/css/blog-article.css?v=2026102001",
  "/css/blog-13f.css?v=2026102501",
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
  "/js/shared-simple.js?v=2026110503",
  "/js/financial-assets.js?v=2026110402",
  "/js/asset-atlas.js?v=2026110503",
  "/js/logistics-atlas.js?v=2026110506",
  "/js/shanghai-port.js?v=2026110601",
  "/js/asset-profile.js?v=2026110601",
  "/js/market-intelligence.js?v=2026110404",
  "/js/theme-init.js?v=2026110503",
  "/js/13f-comparison.js?v=2026102601",
  "/js/blog-13f.js?v=2026102501",
  "/data/holdings-latest.json",
  "/data/manual/filings.json",
  "/data/logistics/ports.json",
  "/data/logistics/industrial-projects.json",
  "/data/logistics/data-centres.json",
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
  const is13fData =
    url.pathname === "/data/holdings-latest.json" ||
    url.pathname === "/data/manual/filings.json";
  const isLogisticsData =
    url.pathname.startsWith("/data/logistics/") &&
    url.pathname.endsWith(".json");

  if (isHtml || isAsset || is13fData || isLogisticsData) {
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
