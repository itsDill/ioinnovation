/* IO Innovation Fund - Mobile Optimizations */
/* Touch interactions and mobile-specific functionality */

(function (window, document) {
  "use strict";

  // Mobile-specific optimizations
  const MobileOptimizer = {
    // Touch gesture handlers
    touch: {
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      threshold: 50,

      init: function () {
        this.addSwipeListeners();
        this.addTouchRippleEffect();
        this.optimizeScrolling();
      },

      addSwipeListeners: function () {
        let startTime = 0;

        document.addEventListener(
          "touchstart",
          (e) => {
            const touch = e.touches[0];
            this.startX = touch.clientX;
            this.startY = touch.clientY;
            startTime = new Date().getTime();
          },
          { passive: true }
        );

        document.addEventListener(
          "touchend",
          (e) => {
            const touch = e.changedTouches[0];
            this.endX = touch.clientX;
            this.endY = touch.clientY;

            const endTime = new Date().getTime();
            const duration = endTime - startTime;

            // Only process quick swipes (under 300ms)
            if (duration < 300) {
              this.handleSwipe();
            }
          },
          { passive: true }
        );
      },

      handleSwipe: function () {
        const deltaX = this.endX - this.startX;
        const deltaY = this.endY - this.startY;

        // Check if horizontal swipe is dominant
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (Math.abs(deltaX) > this.threshold) {
            if (deltaX > 0) {
              this.onSwipeRight();
            } else {
              this.onSwipeLeft();
            }
          }
        }
        // Check for vertical swipe
        else if (Math.abs(deltaY) > this.threshold) {
          if (deltaY > 0) {
            this.onSwipeDown();
          } else {
            this.onSwipeUp();
          }
        }
      },

      onSwipeLeft: function () {
        // Close mobile menu if open
        const mobileNav = document.getElementById("mobileNav");
        if (mobileNav && mobileNav.classList.contains("open")) {
          const menuBtn = document.getElementById("menuBtn");
          if (menuBtn) menuBtn.click();
        }

        // Custom event for other components
        document.dispatchEvent(new CustomEvent("swipeLeft"));
      },

      onSwipeRight: function () {
        // Custom event for other components
        document.dispatchEvent(new CustomEvent("swipeRight"));
      },

      onSwipeUp: function () {
        // Hide address bar on mobile browsers
        if (window.innerHeight < window.outerHeight) {
          window.scrollTo(0, 1);
        }

        document.dispatchEvent(new CustomEvent("swipeUp"));
      },

      onSwipeDown: function () {
        document.dispatchEvent(new CustomEvent("swipeDown"));
      },

      addTouchRippleEffect: function () {
        // Add ripple effect to interactive elements
        const interactiveElements = document.querySelectorAll(
          "button, .btn, .card, .nav-links a"
        );

        interactiveElements.forEach((element) => {
          element.addEventListener("touchstart", this.createRipple, {
            passive: true,
          });
        });
      },

      createRipple: function (e) {
        const element = e.currentTarget;
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const touch = e.touches[0];
        const x = touch.clientX - rect.left - size / 2;
        const y = touch.clientY - rect.top - size / 2;

        const ripple = document.createElement("span");
        ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                    z-index: 1;
                `;

        // Ensure element has relative positioning
        if (getComputedStyle(element).position === "static") {
          element.style.position = "relative";
        }

        element.style.overflow = "hidden";
        element.appendChild(ripple);

        // Remove ripple after animation
        setTimeout(() => {
          if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
          }
        }, 600);
      },

      optimizeScrolling: function () {
        // Smooth scrolling for iOS Safari
        document.documentElement.style.webkitOverflowScrolling = "touch";

        // Prevent zoom on double tap for input elements
        const inputs = document.querySelectorAll("input, textarea, select");
        inputs.forEach((input) => {
          input.addEventListener("touchend", (e) => {
            e.preventDefault();
            input.focus();
          });
        });

        // Optimize scroll performance
        let isScrolling = false;
        window.addEventListener(
          "scroll",
          () => {
            if (!isScrolling) {
              requestAnimationFrame(() => {
                // Throttled scroll handler
                this.handleOptimizedScroll();
                isScrolling = false;
              });
              isScrolling = true;
            }
          },
          { passive: true }
        );
      },

      handleOptimizedScroll: function () {
        // Hide/show elements during scroll for better performance
        const scrollTop = window.pageYOffset;
        const themeToggle = document.querySelector(".theme-toggle");

        if (themeToggle) {
          if (scrollTop > 100) {
            themeToggle.style.opacity = "0.7";
          } else {
            themeToggle.style.opacity = "1";
          }
        }
      },
    },

    // Viewport and orientation handling
    viewport: {
      init: function () {
        this.handleOrientationChange();
        this.setViewportHeight();
        this.addViewportListeners();
      },

      handleOrientationChange: function () {
        window.addEventListener("orientationchange", () => {
          // Delay to allow for orientation change completion
          setTimeout(() => {
            this.setViewportHeight();
            this.redistributeElements();
          }, 500);
        });
      },

      setViewportHeight: function () {
        // Fix for mobile viewport height issues
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);

        // Update CSS custom property
        document.documentElement.style.setProperty(
          "--real-viewport-height",
          `${window.innerHeight}px`
        );
      },

      addViewportListeners: function () {
        window.addEventListener(
          "resize",
          this.debounce(() => {
            this.setViewportHeight();
            this.redistributeElements();
          }, 250)
        );
      },

      redistributeElements: function () {
        // Adjust layouts for orientation changes
        const grids = document.querySelectorAll(
          ".grid, .stats-grid, .services-grid, .posts-grid"
        );
        grids.forEach((grid) => {
          const isLandscape = window.innerWidth > window.innerHeight;
          const isMobile = window.innerWidth < 768;

          if (isMobile && isLandscape) {
            grid.style.gridTemplateColumns = "repeat(2, 1fr)";
          } else if (isMobile) {
            grid.style.gridTemplateColumns = "1fr";
          }
        });
      },

      debounce: function (func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      },
    },

    // Performance optimizations for mobile
    performance: {
      init: function () {
        this.lazyLoadImages();
        this.optimizeAnimations();
        this.reduceMotionSupport();
        this.batteryApiOptimization();
      },

      lazyLoadImages: function () {
        // Enhanced lazy loading for mobile
        if ("IntersectionObserver" in window) {
          const imageObserver = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  const img = entry.target;
                  this.loadImage(img);
                  imageObserver.unobserve(img);
                }
              });
            },
            {
              rootMargin: "50px 0px",
              threshold: 0.01,
            }
          );

          const lazyImages = document.querySelectorAll(
            'img[data-src], img[loading="lazy"]'
          );
          lazyImages.forEach((img) => imageObserver.observe(img));
        }
      },

      loadImage: function (img) {
        // Create a new image to preload
        const imageLoader = new Image();

        imageLoader.onload = () => {
          img.src = img.dataset.src || img.src;
          img.classList.add("loaded");

          // Fade in effect
          img.style.opacity = "0";
          img.style.transition = "opacity 0.3s ease";

          requestAnimationFrame(() => {
            img.style.opacity = "1";
          });
        };

        imageLoader.onerror = () => {
          img.classList.add("error");
        };

        imageLoader.src = img.dataset.src || img.src;
      },

      optimizeAnimations: function () {
        // Reduce animations on slower devices
        const isSlowDevice = this.isSlowDevice();

        if (isSlowDevice) {
          document.documentElement.classList.add("reduced-motion");

          // Override animation durations
          const style = document.createElement("style");
          style.textContent = `
                        .reduced-motion * {
                            animation-duration: 0.01ms !important;
                            animation-iteration-count: 1 !important;
                            transition-duration: 0.01ms !important;
                        }
                    `;
          document.head.appendChild(style);
        }
      },

      isSlowDevice: function () {
        // Detect slow devices
        const connection =
          navigator.connection ||
          navigator.mozConnection ||
          navigator.webkitConnection;

        if (connection) {
          // Slow connection types
          const slowConnections = ["slow-2g", "2g", "3g"];
          if (slowConnections.includes(connection.effectiveType)) {
            return true;
          }
        }

        // Check hardware concurrency (CPU cores)
        if (
          navigator.hardwareConcurrency &&
          navigator.hardwareConcurrency <= 2
        ) {
          return true;
        }

        // Check device memory (if available)
        if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
          return true;
        }

        return false;
      },

      reduceMotionSupport: function () {
        // Respect user's motion preferences
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        );

        if (prefersReducedMotion.matches) {
          document.documentElement.classList.add("prefers-reduced-motion");
        }

        prefersReducedMotion.addEventListener("change", (e) => {
          if (e.matches) {
            document.documentElement.classList.add("prefers-reduced-motion");
          } else {
            document.documentElement.classList.remove("prefers-reduced-motion");
          }
        });
      },

      batteryApiOptimization: function () {
        // Optimize based on battery status
        if ("getBattery" in navigator) {
          navigator.getBattery().then((battery) => {
            const optimizeForBattery = () => {
              if (battery.level < 0.2 || !battery.charging) {
                // Low battery mode
                document.documentElement.classList.add("low-battery");
                this.enableBatterySaving();
              } else {
                document.documentElement.classList.remove("low-battery");
                this.disableBatterySaving();
              }
            };

            // Initial check
            optimizeForBattery();

            // Listen for battery changes
            battery.addEventListener("levelchange", optimizeForBattery);
            battery.addEventListener("chargingchange", optimizeForBattery);
          });
        }
      },

      enableBatterySaving: function () {
        // Reduce visual effects for battery saving
        const style = document.createElement("style");
        style.id = "battery-saving-styles";
        style.textContent = `
                    .low-battery * {
                        animation: none !important;
                        transition: none !important;
                        box-shadow: none !important;
                        text-shadow: none !important;
                        filter: none !important;
                        backdrop-filter: none !important;
                    }
                `;
        document.head.appendChild(style);
      },

      disableBatterySaving: function () {
        const existingStyle = document.getElementById("battery-saving-styles");
        if (existingStyle) {
          existingStyle.remove();
        }
      },
    },

    // Mobile-specific UI enhancements
    ui: {
      init: function () {
        this.addMobileMenuEnhancements();
        this.optimizeFormElements();
        this.addPullToRefresh();
        this.enhanceTooltips();
      },

      addMobileMenuEnhancements: function () {
        const mobileNav = document.getElementById("mobileNav");
        if (!mobileNav) return;

        // Add keyboard navigation for mobile menu
        const navLinks = mobileNav.querySelectorAll("a");
        navLinks.forEach((link, index) => {
          link.addEventListener("keydown", (e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const nextLink = navLinks[index + 1];
              if (nextLink) nextLink.focus();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const prevLink = navLinks[index - 1];
              if (prevLink) prevLink.focus();
            }
          });
        });
      },

      optimizeFormElements: function () {
        // Optimize form elements for mobile
        const inputs = document.querySelectorAll("input, textarea, select");

        inputs.forEach((input) => {
          // Prevent zoom on focus for specific input types
          if (input.type === "email" || input.type === "tel") {
            input.style.fontSize = "16px"; // Prevents zoom on iOS
          }

          // Add better touch targets
          input.style.minHeight = "44px"; // Apple's recommended touch target size

          // Optimize virtual keyboard
          if (input.type === "email") {
            input.setAttribute("autocomplete", "email");
            input.setAttribute("inputmode", "email");
          } else if (input.type === "tel") {
            input.setAttribute("autocomplete", "tel");
            input.setAttribute("inputmode", "tel");
          } else if (input.type === "number") {
            input.setAttribute("inputmode", "numeric");
          }
        });
      },

      addPullToRefresh: function () {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        let pullThreshold = 100;

        const refreshIndicator = document.createElement("div");
        refreshIndicator.className = "pull-refresh-indicator";
        refreshIndicator.style.cssText = `
                    position: fixed;
                    top: -50px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 40px;
                    height: 40px;
                    background: var(--bg-card);
                    border: 2px solid var(--accent-primary);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    transition: top 0.3s ease;
                `;
        refreshIndicator.innerHTML = '<i class="fas fa-sync-alt"></i>';
        document.body.appendChild(refreshIndicator);

        document.addEventListener(
          "touchstart",
          (e) => {
            if (window.scrollY === 0) {
              startY = e.touches[0].clientY;
              isPulling = true;
            }
          },
          { passive: true }
        );

        document.addEventListener(
          "touchmove",
          (e) => {
            if (!isPulling) return;

            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;

            if (pullDistance > 0 && pullDistance < pullThreshold * 2) {
              const progress = Math.min(pullDistance / pullThreshold, 1);
              refreshIndicator.style.top = `${-50 + progress * 70}px`;
              refreshIndicator.style.transform = `translateX(-50%) rotate(${
                progress * 360
              }deg)`;
            }
          },
          { passive: true }
        );

        document.addEventListener("touchend", () => {
          if (!isPulling) return;

          const pullDistance = currentY - startY;

          if (pullDistance > pullThreshold) {
            // Trigger refresh
            refreshIndicator.style.top = "20px";
            refreshIndicator.querySelector("i").style.animation =
              "spin 1s linear infinite";

            // Simulate refresh delay
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            refreshIndicator.style.top = "-50px";
            refreshIndicator.style.transform = "translateX(-50%) rotate(0deg)";
          }

          isPulling = false;
        });
      },

      enhanceTooltips: function () {
        // Convert tooltips to mobile-friendly versions
        const tooltipElements = document.querySelectorAll("[title]");

        tooltipElements.forEach((element) => {
          const title = element.getAttribute("title");
          element.removeAttribute("title");

          element.addEventListener("touchstart", (e) => {
            e.preventDefault();
            this.showMobileTooltip(element, title);
          });
        });
      },

      showMobileTooltip: function (element, text) {
        // Remove existing tooltips
        const existingTooltips = document.querySelectorAll(".mobile-tooltip");
        existingTooltips.forEach((tooltip) => tooltip.remove());

        const tooltip = document.createElement("div");
        tooltip.className = "mobile-tooltip";
        tooltip.style.cssText = `
                    position: fixed;
                    background: var(--bg-card);
                    color: var(--text-primary);
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    z-index: 10000;
                    max-width: 200px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 20px var(--shadow-color);
                    backdrop-filter: blur(10px);
                `;
        tooltip.textContent = text;

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        // Position tooltip
        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.top - tooltipRect.height - 10;

        // Adjust if tooltip goes off-screen
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
          left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top < 10) {
          top = rect.bottom + 10;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;

        // Auto-hide after 3 seconds
        setTimeout(() => {
          if (tooltip.parentNode) {
            tooltip.remove();
          }
        }, 3000);
      },
    },

    // Initialize all mobile optimizations
    init: function () {
      // Only run on mobile devices
      if (this.isMobileDevice()) {
        console.log("📱 Mobile optimizations initialized");

        this.touch.init();
        this.viewport.init();
        this.performance.init();
        this.ui.init();

        // Add CSS for ripple animation
        const style = document.createElement("style");
        style.textContent = `
                    @keyframes ripple {
                        to {
                            transform: scale(4);
                            opacity: 0;
                        }
                    }
                `;
        document.head.appendChild(style);
      }
    },

    isMobileDevice: function () {
      return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
        window.innerWidth <= 768
      );
    },
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => MobileOptimizer.init());
  } else {
    MobileOptimizer.init();
  }

  // Export to global scope
  window.MobileOptimizer = MobileOptimizer;
})(window, document);
