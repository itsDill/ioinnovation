/* IO Innovation - AdSense Layout and Safety Initializer */

(function () {
  "use strict";

  if (window.__ioAdsInitLoaded) {
    return;
  }
  window.__ioAdsInitLoaded = true;

  const AD_CLIENT =
    window.__IO_ADSENSE_CLIENT ||
    document.documentElement.getAttribute("data-ads-client") ||
    "ca-pub-2456627863532019";

  const SLOT_CONFIG = {
    inArticle: window.__IO_ADS_SLOT_INARTICLE || "2345678901",
    sticky: window.__IO_ADS_SLOT_STICKY || "3456789012",
  };

  function init() {
    ensureAdSenseScript();
    ensureGlobalSchema();
    ensureContextSchema();
    ensureConsentBanner();
    safeInitAds();

    // Retry after load in case the AdSense script arrives late.
    window.addEventListener("load", safeInitAds, { once: true });
  }

  function ensureAdSenseScript() {
    const existing = document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    );

    if (existing) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      encodeURIComponent(AD_CLIENT);
    document.head.appendChild(script);
  }

  function createAdWrapper(className, labelText) {
    const wrapper = document.createElement("aside");
    wrapper.className = className;
    wrapper.setAttribute("aria-label", "Advertisement");

    const label = document.createElement("p");
    label.className = "ad-slot-label";
    label.textContent = labelText;

    wrapper.appendChild(label);
    return wrapper;
  }

  function createAdIns(config) {
    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.setAttribute("data-ad-client", AD_CLIENT);
    ins.setAttribute("data-ad-slot", config.slot);

    if (config.format) {
      ins.setAttribute("data-ad-format", config.format);
    }

    if (config.layout) {
      ins.setAttribute("data-ad-layout", config.layout);
    }

    if (config.fullWidth) {
      ins.setAttribute("data-full-width-responsive", config.fullWidth);
    }

    return ins;
  }

  function safeInitAds() {
    const ads = document.querySelectorAll(
      "ins.adsbygoogle:not([data-ads-initialized])",
    );

    if (!ads.length || !Array.isArray(window.adsbygoogle)) {
      return;
    }

    ads.forEach((ad) => {
      try {
        window.adsbygoogle.push({});
        ad.setAttribute("data-ads-initialized", "true");
      } catch (error) {
        // Keep quiet and let a later retry attempt initialize the unit.
      }
    });
  }

  function ensureGlobalSchema() {
    if (hasSchemaType("Organization")) {
      return;
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "IO Innovation",
      url: "https://ioinnovationfund.com",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: "https://ioinnovationfund.com/contact.html",
      },
    };

    appendSchema(schema);
  }

  function ensureContextSchema() {
    const path = window.location.pathname;

    if (isBlogArticlePath(path) && !hasSchemaType("Article")) {
      const title =
        (document.querySelector("main h1") &&
          document.querySelector("main h1").textContent.trim()) ||
        document.title;
      const description =
        document.querySelector('meta[name="description"]')?.content || "";

      appendSchema({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        publisher: {
          "@type": "Organization",
          name: "IO Innovation",
        },
      });
    }

    if (isToolsPath(path) && !hasSchemaType("FinancialProduct")) {
      appendSchema({
        "@context": "https://schema.org",
        "@type": "FinancialProduct",
        name: "IO Innovation Filings Holdings Explorer",
        provider: {
          "@type": "Organization",
          name: "IO Innovation",
        },
        url: "https://ioinnovationfund.com/holdings/",
      });
    }
  }

  function hasSchemaType(type) {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    const typePattern = new RegExp('"@type"\\s*:\\s*"' + type + '"', "i");

    return Array.from(scripts).some((script) =>
      typePattern.test(script.textContent),
    );
  }

  function appendSchema(schemaObject) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schemaObject);
    document.head.appendChild(script);
  }

  function ensureConsentBanner() {
    const consentKey = "io-consent-v1";
    if (
      localStorage.getItem(consentKey) ||
      document.querySelector(".consent-banner")
    ) {
      return;
    }

    const banner = document.createElement("div");
    banner.className = "consent-banner";
    banner.innerHTML =
      "<p>We use cookies and ad personalization technologies to improve site performance and ad relevance.</p>" +
      '<a href="/privacy.html">Privacy policy</a>' +
      '<button type="button" class="consent-accept">Accept</button>';

    const button = banner.querySelector(".consent-accept");
    button.addEventListener("click", function () {
      localStorage.setItem(consentKey, "accepted");
      banner.remove();
    });

    document.body.appendChild(banner);
  }

  function isBlogArticlePath(path) {
    if (!path.startsWith("/blog/")) {
      return false;
    }

    return path !== "/blog/" && path !== "/blog/index.html";
  }

  function isToolsPath(path) {
    return path === "/holdings/" || path === "/holdings/index.html";
  }

  function findArticleContainer() {
    const main = document.querySelector("main#main-content, main");

    if (!main) {
      return null;
    }

    const existingArticle = main.querySelector("article");
    if (existingArticle) {
      return existingArticle;
    }

    if (isBlogArticlePath(window.location.pathname)) {
      const runtimeArticle = document.createElement("article");
      runtimeArticle.className = "page-article-runtime";

      Array.from(main.children).forEach((child) => {
        if (child.tagName !== "SCRIPT") {
          runtimeArticle.appendChild(child);
        }
      });

      main.appendChild(runtimeArticle);
      return runtimeArticle;
    }

    return main;
  }

  function insertAfter(node, reference) {
    reference.parentNode.insertBefore(node, reference.nextSibling);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
