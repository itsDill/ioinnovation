// IO Innovate - UX Enhancements
// Smooth interactions, scroll animations, and polish

(function () {
  "use strict";

  // ==================== SCROLL REVEAL ANIMATION ====================

  function initScrollReveal() {
    const reveals = document.querySelectorAll(
      ".tool-card, .category-card, .post-card, .feature-item"
    );

    if (!reveals.length) return;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-reveal", "revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    reveals.forEach((el) => {
      el.classList.add("scroll-reveal");
      revealObserver.observe(el);
    });
  }

  // ==================== NAVBAR SCROLL EFFECT ====================

  function initNavbarScroll() {
    const header = document.querySelector(".header");
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener(
      "scroll",
      () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }

        // Hide navbar on scroll down, show on scroll up
        if (currentScroll > lastScroll && currentScroll > 200) {
          header.style.transform = "translateY(-100%)";
        } else {
          header.style.transform = "translateY(0)";
        }

        lastScroll = currentScroll;
      },
      { passive: true }
    );
  }

  // ==================== SMOOTH SCROLL TO ANCHORS ====================

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (href === "#" || href === "#!") return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });
  }

  // ==================== READING PROGRESS BAR ====================

  function initReadingProgress() {
    // Only on blog/article pages
    if (!document.querySelector(".blog-post, .post-content")) return;

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    document.body.appendChild(progressBar);

    window.addEventListener(
      "scroll",
      () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const scrollPercent = scrollTop / (documentHeight - windowHeight);

        progressBar.style.transform = `scaleX(${scrollPercent})`;
      },
      { passive: true }
    );
  }

  // ==================== COUNTER ANIMATION ====================

  function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }

  function initCounters() {
    const statNumbers = document.querySelectorAll(".stat-number");
    if (!statNumbers.length) return;

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const text = entry.target.textContent;
            const number = parseInt(text.replace(/[^\d]/g, ""));
            if (number) {
              animateCounter(entry.target, number, 1500);
            }
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    statNumbers.forEach((stat) => counterObserver.observe(stat));
  }

  // ==================== CARD TILT EFFECT ====================

  function initCardTilt() {
    const cards = document.querySelectorAll(".tool-card, .category-card");

    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        card.style.transform = `
          translateY(-8px) 
          rotateX(${rotateX}deg) 
          rotateY(${rotateY}deg) 
          scale(1.02)
        `;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  // ==================== LAZY LOAD IMAGES ====================

  function initLazyLoad() {
    const images = document.querySelectorAll("img[data-src]");
    if (!images.length) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          img.classList.add("loaded");
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => {
      img.classList.add("lazy");
      imageObserver.observe(img);
    });
  }

  // ==================== ENHANCED BUTTON RIPPLE ====================

  function initButtonRipple() {
    document
      .querySelectorAll(".btn, .tool-action, .category-btn")
      .forEach((button) => {
        button.addEventListener("click", function (e) {
          const rect = this.getBoundingClientRect();
          const ripple = document.createElement("span");
          const size = Math.max(rect.width, rect.height);
          const x = e.clientX - rect.left - size / 2;
          const y = e.clientY - rect.top - size / 2;

          ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          transform: scale(0);
          animation: rippleEffect 0.6s ease-out;
          pointer-events: none;
        `;

          this.appendChild(ripple);
          setTimeout(() => ripple.remove(), 600);
        });
      });
  }

  // ==================== PARALLAX EFFECT ====================

  function initParallax() {
    const parallaxElements = document.querySelectorAll("[data-parallax]");
    if (!parallaxElements.length) return;

    window.addEventListener(
      "scroll",
      () => {
        const scrolled = window.pageYOffset;

        parallaxElements.forEach((el) => {
          const speed = el.dataset.parallax || 0.5;
          el.style.transform = `translateY(${scrolled * speed}px)`;
        });
      },
      { passive: true }
    );
  }

  // ==================== FORM VALIDATION FEEDBACK ====================

  function initFormEnhancements() {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      const inputs = form.querySelectorAll("input, textarea");

      inputs.forEach((input) => {
        // Real-time validation feedback
        input.addEventListener("blur", function () {
          if (this.checkValidity()) {
            this.classList.add("valid");
            this.classList.remove("invalid");
          } else {
            this.classList.add("invalid");
            this.classList.remove("valid");
          }
        });

        input.addEventListener("input", function () {
          this.classList.remove("invalid");
        });
      });
    });
  }

  // ==================== TOOLTIP INITIALIZATION ====================

  function initTooltips() {
    // Add tooltips dynamically
    document.querySelectorAll("[title]").forEach((el) => {
      if (!el.hasAttribute("data-tooltip")) {
        el.setAttribute("data-tooltip", el.getAttribute("title"));
        el.removeAttribute("title"); // Remove default tooltip
      }
    });
  }

  // ==================== COPY TO CLIPBOARD ====================

  function initCopyButtons() {
    document.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", async function () {
        const text = this.dataset.copy;
        try {
          await navigator.clipboard.writeText(text);

          const originalText = this.textContent;
          this.textContent = "Copied!";
          this.classList.add("copied");

          setTimeout(() => {
            this.textContent = originalText;
            this.classList.remove("copied");
          }, 2000);
        } catch (err) {
          console.error("Failed to copy:", err);
        }
      });
    });
  }

  // ==================== BACK TO TOP BUTTON ====================

  function initBackToTop() {
    const button = document.createElement("button");
    button.className = "back-to-top";
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.setAttribute("aria-label", "Back to top");
    document.body.appendChild(button);

    button.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--accent-primary);
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(43, 226, 180, 0.3);
      cursor: pointer;
      opacity: 0;
      transform: translateY(100px);
      transition: all 0.3s ease;
      z-index: 999;
    `;

    window.addEventListener(
      "scroll",
      () => {
        if (window.pageYOffset > 500) {
          button.style.opacity = "1";
          button.style.transform = "translateY(0)";
        } else {
          button.style.opacity = "0";
          button.style.transform = "translateY(100px)";
        }
      },
      { passive: true }
    );

    button.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // ==================== KEYBOARD NAVIGATION ====================

  function initKeyboardNav() {
    // ESC key to close modals/menus
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // Close mobile menu
        const nav = document.getElementById("mobileNav");
        const overlay = document.getElementById("mobileOverlay");
        if (nav && nav.classList.contains("active")) {
          nav.classList.remove("active");
          if (overlay) overlay.classList.remove("active");
        }
      }
    });
  }

  // ==================== PERFORMANCE MONITORING ====================

  function logPerformance() {
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType("navigation")[0];
          console.log(
            "Page Load Time:",
            perfData.loadEventEnd - perfData.fetchStart,
            "ms"
          );
        }, 0);
      });
    }
  }

  // ==================== INITIALIZE ALL FEATURES ====================

  function init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
      return;
    }

    // Initialize all features
    initScrollReveal();
    initNavbarScroll();
    initSmoothScroll();
    initReadingProgress();
    initCounters();
    initLazyLoad();
    initButtonRipple();
    initParallax();
    initFormEnhancements();
    initTooltips();
    initCopyButtons();
    initBackToTop();
    initKeyboardNav();

    // Optional: Only on desktop
    if (window.innerWidth > 1024) {
      initCardTilt();
    }

    // Development only
    if (window.location.hostname === "localhost") {
      logPerformance();
    }
  }

  // Start initialization
  init();
})();
