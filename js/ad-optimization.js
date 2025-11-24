// Enhanced AdSense Optimization Script
// Implements lazy loading, viewability tracking, and mobile sticky ads

(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    lazyLoadThreshold: 200, // Load ads 200px before they enter viewport
    viewabilityThreshold: 0.5, // Ad must be 50% visible
    viewabilityDuration: 1000, // Must be visible for 1 second
    stickyAdDelay: 5000, // Show sticky ad after 5 seconds
  };

  // Lazy Load Ads
  function initLazyLoadAds() {
    const adContainers = document.querySelectorAll(".ad-section");

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const adElement = entry.target.querySelector(".adsbygoogle");
              if (adElement && !adElement.dataset.adsbygoogleStatus) {
                try {
                  (adsbygoogle = window.adsbygoogle || []).push({});
                  entry.target.classList.add("ad-visible");
                } catch (error) {
                  console.error("Error loading ad:", error);
                }
              }
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: `${CONFIG.lazyLoadThreshold}px`,
        }
      );

      adContainers.forEach((container) => {
        observer.observe(container);
      });
    } else {
      // Fallback: load all ads immediately
      window.adsbygoogle = window.adsbygoogle || [];
      document.querySelectorAll(".adsbygoogle").forEach(() => {
        try {
          adsbygoogle.push({});
        } catch (error) {
          console.error("Error loading ad:", error);
        }
      });
    }
  }

  // Track Ad Viewability
  function trackAdViewability() {
    const adElements = document.querySelectorAll(".adsbygoogle");
    const viewabilityMap = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const adSlot = entry.target.dataset.adSlot;
          if (!adSlot) return;

          if (entry.intersectionRatio >= CONFIG.viewabilityThreshold) {
            // Ad is viewable - start timer
            if (!viewabilityMap.has(adSlot)) {
              const timer = setTimeout(() => {
                // Track viewability event
                if (typeof gtag !== "undefined") {
                  gtag("event", "ad_viewable", {
                    ad_slot: adSlot,
                    viewability_ratio: entry.intersectionRatio,
                  });
                }
                viewabilityMap.delete(adSlot);
              }, CONFIG.viewabilityDuration);
              viewabilityMap.set(adSlot, timer);
            }
          } else {
            // Ad not viewable - clear timer
            const timer = viewabilityMap.get(adSlot);
            if (timer) {
              clearTimeout(timer);
              viewabilityMap.delete(adSlot);
            }
          }
        });
      },
      {
        threshold: CONFIG.viewabilityThreshold,
      }
    );

    adElements.forEach((ad) => {
      if (ad.dataset.adSlot) {
        observer.observe(ad);
      }
    });
  }

  // Create Mobile Sticky Ad
  function createMobileStickyAd() {
    // Only show on mobile
    if (window.innerWidth > 768) return;

    // Wait before showing sticky ad
    setTimeout(() => {
      const stickyAd = document.createElement("div");
      stickyAd.className = "mobile-sticky-ad";
      stickyAd.id = "mobile-sticky-ad";

      // Close button
      const closeBtn = document.createElement("button");
      closeBtn.className = "sticky-ad-close";
      closeBtn.innerHTML = "×";
      closeBtn.setAttribute("aria-label", "Close ad");
      closeBtn.onclick = () => {
        stickyAd.style.display = "none";
        localStorage.setItem("sticky_ad_closed", "true");
        // Track close event
        if (typeof gtag !== "undefined") {
          gtag("event", "ad_close", {
            ad_type: "mobile_sticky",
          });
        }
      };

      // Ad unit
      const adContainer = document.createElement("div");
      adContainer.style.cssText =
        "max-width: 320px; margin: 0 auto; position: relative;";

      const adUnit = document.createElement("ins");
      adUnit.className = "adsbygoogle";
      adUnit.style.cssText = "display: block;";
      adUnit.setAttribute("data-ad-client", "ca-pub-2456627863532019");
      adUnit.setAttribute("data-ad-slot", "YOUR_ANCHOR_AD_SLOT");
      adUnit.setAttribute("data-ad-format", "rectangle");

      adContainer.appendChild(closeBtn);
      adContainer.appendChild(adUnit);
      stickyAd.appendChild(adContainer);

      document.body.appendChild(stickyAd);

      // Load ad
      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error("Error loading sticky ad:", error);
      }

      // Track impression
      if (typeof gtag !== "undefined") {
        gtag("event", "ad_show", {
          ad_type: "mobile_sticky",
        });
      }
    }, CONFIG.stickyAdDelay);
  }

  // Optimize Ad Refresh (for Auto Ads)
  function optimizeAdRefresh() {
    // Track page engagement time
    let engagementTime = 0;
    const engagementInterval = setInterval(() => {
      engagementTime += 1;

      // After 30 seconds of engagement, enable ad refresh
      if (engagementTime === 30) {
        if (typeof googletag !== "undefined" && googletag.pubads) {
          googletag.pubads().refresh();
        }
      }
    }, 1000);

    // Clear interval on page unload
    window.addEventListener("beforeunload", () => {
      clearInterval(engagementInterval);
    });
  }

  // Prevent Ad Blockers from Breaking Layout
  function handleAdBlockers() {
    // Check if ads are blocked
    setTimeout(() => {
      const adElements = document.querySelectorAll(".adsbygoogle");
      adElements.forEach((ad) => {
        if (ad.clientHeight === 0) {
          // Ad likely blocked - hide container
          const container = ad.closest(".ad-section");
          if (container) {
            container.style.display = "none";
          }
        }
      });
    }, 3000);
  }

  // Track Ad Performance Metrics
  function trackAdMetrics() {
    // Track page with ads
    if (typeof gtag !== "undefined") {
      const adCount = document.querySelectorAll(".adsbygoogle").length;
      gtag("event", "page_view_with_ads", {
        ad_count: adCount,
        page_path: window.location.pathname,
      });
    }

    // Track scroll depth (important for ad viewability)
    let maxScroll = 0;
    window.addEventListener("scroll", () => {
      const scrollPercent =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
        100;
      if (scrollPercent > maxScroll) {
        maxScroll = Math.floor(scrollPercent);

        // Track milestones
        if (
          maxScroll === 25 ||
          maxScroll === 50 ||
          maxScroll === 75 ||
          maxScroll === 100
        ) {
          if (typeof gtag !== "undefined") {
            gtag("event", "scroll_depth", {
              scroll_percentage: maxScroll,
            });
          }
        }
      }
    });
  }

  // Responsive Ad Size Adjustment
  function adjustAdSizes() {
    const adContainers = document.querySelectorAll(".ad-section");

    adContainers.forEach((container) => {
      const width = container.offsetWidth;
      const adElement = container.querySelector(".adsbygoogle");

      if (!adElement) return;

      // Adjust based on container width
      if (width < 400) {
        adElement.style.maxWidth = "320px";
      } else if (width < 768) {
        adElement.style.maxWidth = "468px";
      } else if (width < 1024) {
        adElement.style.maxWidth = "728px";
      } else {
        adElement.style.maxWidth = "970px";
      }
    });
  }

  // Initialize all optimizations
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
      return;
    }

    // Check if sticky ad was closed
    const stickyAdClosed = localStorage.getItem("sticky_ad_closed");

    // Initialize features
    initLazyLoadAds();
    trackAdViewability();
    if (!stickyAdClosed && window.innerWidth <= 768) {
      createMobileStickyAd();
    }
    optimizeAdRefresh();
    handleAdBlockers();
    trackAdMetrics();
    adjustAdSizes();

    // Adjust ad sizes on resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(adjustAdSizes, 250);
    });
  }

  // Start initialization
  init();

  // Export for manual use
  window.AdOptimization = {
    init,
    trackAdViewability,
    adjustAdSizes,
  };
})();
