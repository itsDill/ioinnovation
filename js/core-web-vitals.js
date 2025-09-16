// Core Web Vitals Optimization Script for IO Innovation Fund
// Optimizes LCP, FID, CLS, and other performance metrics for better SEO

(function () {
  "use strict";

  // Core Web Vitals tracking and optimization
  const WebVitalsOptimizer = {
    // Largest Contentful Paint (LCP) optimization
    optimizeLCP: function () {
      // Preload critical images
      const criticalImages = document.querySelectorAll(
        'img[data-critical="true"]'
      );
      criticalImages.forEach((img) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = img.src || img.dataset.src;
        document.head.appendChild(link);
      });

      // Lazy load non-critical images with intersection observer
      const lazyImages = document.querySelectorAll('img[data-lazy="true"]');
      if ("IntersectionObserver" in window) {
        const imageObserver = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove("lazy");
                observer.unobserve(img);
              }
            });
          },
          {
            rootMargin: "50px 0px",
          }
        );

        lazyImages.forEach((img) => imageObserver.observe(img));
      }

      // Optimize font loading
      this.optimizeFonts();
    },

    // First Input Delay (FID) optimization
    optimizeFID: function () {
      // Break up long tasks
      const longTasks = [];

      // Use scheduler API if available
      if ("scheduler" in window && "postTask" in scheduler) {
        // Defer non-critical JavaScript
        scheduler.postTask(
          () => {
            this.initializeNonCriticalFeatures();
          },
          { priority: "background" }
        );
      } else {
        // Fallback to setTimeout
        setTimeout(() => {
          this.initializeNonCriticalFeatures();
        }, 100);
      }

      // Add passive event listeners
      const passiveEvents = ["scroll", "touchstart", "touchmove", "wheel"];
      passiveEvents.forEach((event) => {
        document.addEventListener(event, () => {}, { passive: true });
      });
    },

    // Cumulative Layout Shift (CLS) optimization
    optimizeCLS: function () {
      // Reserve space for ads
      const adContainers = document.querySelectorAll(
        ".ad-container, .adsbygoogle"
      );
      adContainers.forEach((container) => {
        if (!container.style.minHeight) {
          // Set minimum height to prevent layout shift
          const isMobile = window.innerWidth <= 768;
          container.style.minHeight = isMobile ? "280px" : "250px";
          container.style.display = "block";
        }
      });

      // Reserve space for images without dimensions
      const images = document.querySelectorAll(
        "img:not([width]):not([height])"
      );
      images.forEach((img) => {
        // Set aspect ratio to prevent layout shift
        img.style.aspectRatio = "16/9"; // Default aspect ratio
        img.style.width = "100%";
        img.style.height = "auto";
      });

      // Handle dynamic content insertion
      this.observeLayoutShifts();
    },

    // Font optimization
    optimizeFonts: function () {
      // Preload critical fonts
      const fontPreloads = [
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      ];

      fontPreloads.forEach((fontUrl) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "style";
        link.href = fontUrl;
        link.onload = function () {
          this.rel = "stylesheet";
        };
        document.head.appendChild(link);
      });

      // Font display optimization
      const fontFaces = document.querySelectorAll("@font-face");
      fontFaces.forEach((fontFace) => {
        if (fontFace.style) {
          fontFace.style.fontDisplay = "swap";
        }
      });
    },

    // Initialize non-critical features
    initializeNonCriticalFeatures: function () {
      // Theme toggle functionality
      this.initializeThemeToggle();

      // Mobile menu functionality
      this.initializeMobileMenu();

      // Analytics enhancements
      this.enhanceAnalytics();
    },

    // Theme toggle initialization
    initializeThemeToggle: function () {
      const themeToggle = document.getElementById("themeToggle");
      const themeIcon = document.getElementById("themeIcon");

      if (themeToggle && themeIcon) {
        themeToggle.addEventListener("click", function () {
          const currentTheme =
            document.documentElement.getAttribute("data-theme");
          const newTheme = currentTheme === "dark" ? "light" : "dark";

          document.documentElement.setAttribute("data-theme", newTheme);
          document.body.setAttribute("data-theme", newTheme);
          localStorage.setItem("theme", newTheme);

          // Update icon
          themeIcon.className =
            newTheme === "dark"
              ? "theme-icon fas fa-sun"
              : "theme-icon fas fa-moon";

          // Track theme change
          if (typeof gtag !== "undefined") {
            gtag("event", "theme_change", {
              theme: newTheme,
              event_category: "UI",
            });
          }
        });
      }
    },

    // Mobile menu initialization
    initializeMobileMenu: function () {
      const menuBtn = document.getElementById("menuBtn");
      const mobileNav = document.getElementById("mobileNav");
      const mobileOverlay = document.getElementById("mobileOverlay");

      if (menuBtn && mobileNav) {
        menuBtn.addEventListener("click", function () {
          const isOpen = mobileNav.classList.contains("active");

          if (isOpen) {
            mobileNav.classList.remove("active");
            menuBtn.classList.remove("active");
            if (mobileOverlay) mobileOverlay.classList.remove("active");
            document.body.style.overflow = "";
          } else {
            mobileNav.classList.add("active");
            menuBtn.classList.add("active");
            if (mobileOverlay) mobileOverlay.classList.add("active");
            document.body.style.overflow = "hidden";
          }
        });
      }
    },

    // Layout shift observation
    observeLayoutShifts: function () {
      if ("LayoutShift" in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Log significant layout shifts
            if (entry.value > 0.1) {
              console.warn("Significant layout shift detected:", entry);

              // Track in analytics
              if (typeof gtag !== "undefined") {
                gtag("event", "layout_shift", {
                  value: entry.value,
                  event_category: "Performance",
                });
              }
            }
          }
        });

        observer.observe({ type: "layout-shift", buffered: true });
      }
    },

    // Enhanced analytics
    enhanceAnalytics: function () {
      // Track page engagement
      let startTime = Date.now();
      let maxScroll = 0;

      // Scroll depth tracking
      window.addEventListener(
        "scroll",
        () => {
          const scrollPercent = Math.round(
            (window.scrollY /
              (document.body.scrollHeight - window.innerHeight)) *
              100
          );
          maxScroll = Math.max(maxScroll, scrollPercent);
        },
        { passive: true }
      );

      // Send engagement data on page unload
      window.addEventListener("beforeunload", () => {
        const engagementTime = Date.now() - startTime;

        if (typeof gtag !== "undefined") {
          gtag("event", "page_engagement", {
            engagement_time_msec: engagementTime,
            scroll_depth: maxScroll,
            event_category: "Engagement",
          });
        }
      });
    },

    // Resource hints optimization
    optimizeResourceHints: function () {
      // Add DNS prefetch for external domains
      const externalDomains = [
        "fonts.googleapis.com",
        "fonts.gstatic.com",
        "www.google-analytics.com",
        "www.googletagmanager.com",
        "pagead2.googlesyndication.com",
      ];

      externalDomains.forEach((domain) => {
        const link = document.createElement("link");
        link.rel = "dns-prefetch";
        link.href = `//${domain}`;
        document.head.appendChild(link);
      });
    },

    // Critical CSS inlining
    inlineCriticalCSS: function () {
      const criticalCSS = `
        /* Critical above-the-fold styles */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .header {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 1000;
          background: var(--bg-primary);
        }
        
        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
        }
      `;

      const style = document.createElement("style");
      style.textContent = criticalCSS;
      document.head.insertBefore(style, document.head.firstChild);
    },

    // Performance monitoring
    monitorPerformance: function () {
      // Web Vitals measurement
      if ("web-vitals" in window) {
        // This would require importing the web-vitals library
        // For now, we'll use basic performance API
      }

      // Basic performance monitoring
      window.addEventListener("load", () => {
        setTimeout(() => {
          const perfData = performance.timing;
          const metrics = {
            loadTime: perfData.loadEventEnd - perfData.navigationStart,
            domReady:
              perfData.domContentLoadedEventEnd - perfData.navigationStart,
            firstByte: perfData.responseStart - perfData.navigationStart,
          };

          // Log performance metrics
          console.log("Performance Metrics:", metrics);

          // Track in analytics
          if (typeof gtag !== "undefined") {
            gtag("event", "performance_metrics", {
              load_time: metrics.loadTime,
              dom_ready: metrics.domReady,
              first_byte: metrics.firstByte,
              event_category: "Performance",
            });
          }
        }, 1000);
      });
    },
  };

  // Service Worker registration for caching
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }
  }

  // Initialize optimizations
  document.addEventListener("DOMContentLoaded", () => {
    WebVitalsOptimizer.optimizeLCP();
    WebVitalsOptimizer.optimizeFID();
    WebVitalsOptimizer.optimizeCLS();
    WebVitalsOptimizer.optimizeResourceHints();
    WebVitalsOptimizer.monitorPerformance();

    // Register service worker
    registerServiceWorker();
  });

  // Export for manual use
  window.WebVitalsOptimizer = WebVitalsOptimizer;
})();
