// Enhanced Theme Toggle
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const body = document.body;

// Load saved theme or default to dark
const savedTheme = localStorage.getItem("theme") || "dark";
body.setAttribute("data-theme", savedTheme);
updateThemeIcon(savedTheme);

themeToggle?.addEventListener("click", () => {
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
  if (!themeIcon) return;
  themeIcon.className = theme === "light" ? "fas fa-moon" : "fas fa-sun";
}

// Enhanced Mobile Menu System
class MobileMenu {
  constructor() {
    this.menuBtn = document.getElementById("menuBtn");
    this.mobileNav = document.getElementById("mobileNav");
    this.mobileOverlay = document.getElementById("mobileOverlay");
    this.isOpen = false;
    this.init();
  }

  init() {
    if (!this.menuBtn || !this.mobileNav) return;

    // Menu button click handler
    this.menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    // Overlay click handler
    this.mobileOverlay?.addEventListener("click", () => {
      this.close();
    });

    // Close menu when clicking navigation links
    this.mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        this.close();
      });
    });

    // Handle escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768 && this.isOpen) {
        this.close();
      }
    });

    // Prevent body scroll when menu is open
    this.preventBodyScroll();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.mobileNav.classList.add("open");
    this.mobileOverlay?.classList.add("active");
    this.menuBtn.classList.add("active");

    // Update ARIA attributes
    this.menuBtn.setAttribute("aria-expanded", "true");
    this.menuBtn.setAttribute("aria-label", "Close navigation menu");
    this.mobileNav.setAttribute("aria-expanded", "true");

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    // Focus first menu item for accessibility
    const firstMenuItem = this.mobileNav.querySelector("a");
    if (firstMenuItem) {
      setTimeout(() => firstMenuItem.focus(), 100);
    }
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.mobileNav.classList.remove("open");
    this.mobileOverlay?.classList.remove("active");
    this.menuBtn.classList.remove("active");

    // Update ARIA attributes
    this.menuBtn.setAttribute("aria-expanded", "false");
    this.menuBtn.setAttribute("aria-label", "Open navigation menu");
    this.mobileNav.setAttribute("aria-expanded", "false");

    // Restore body scroll
    document.body.style.overflow = "";

    // Return focus to menu button
    this.menuBtn.focus();
  }

  preventBodyScroll() {
    // Prevent scroll when touching the mobile menu
    let startY = 0;

    this.mobileNav.addEventListener(
      "touchstart",
      (e) => {
        startY = e.touches[0].clientY;
      },
      { passive: true }
    );

    this.mobileNav.addEventListener(
      "touchmove",
      (e) => {
        const currentY = e.touches[0].clientY;
        const element = e.target.closest(".nav-links");

        if (!element) return;

        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const height = element.clientHeight;
        const deltaY = currentY - startY;

        if (
          (scrollTop === 0 && deltaY > 0) ||
          (scrollTop + height >= scrollHeight && deltaY < 0)
        ) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }
}

// Navigation Active State Management
class NavigationManager {
  constructor() {
    this.currentPath = window.location.pathname;
    this.init();
  }

  init() {
    this.setActiveNavItem();
  }

  setActiveNavItem() {
    const navLinks = document.querySelectorAll(".nav-links a");

    navLinks.forEach((link) => {
      link.classList.remove("active");

      // Get the href without leading slash for comparison
      const linkPath = link.getAttribute("href");

      if (
        linkPath === this.currentPath ||
        (this.currentPath === "/" && linkPath === "/index.html") ||
        (this.currentPath === "/index.html" && linkPath === "/index.html")
      ) {
        link.classList.add("active");
      }
    });
  }
}

// Smooth Scrolling for Anchor Links
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));

      if (target) {
        const headerHeight = document.querySelector(".header").offsetHeight;
        const targetPosition = target.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });
}

// Performance Optimization
function initPerformanceOptimizations() {
  // Throttle scroll events
  let ticking = false;

  function updateOnScroll() {
    // Add any scroll-based functionality here
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateOnScroll);
      ticking = true;
    }
  }

  window.addEventListener("scroll", requestTick, { passive: true });
}

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Initialize mobile menu
  new MobileMenu();

  // Initialize navigation manager
  new NavigationManager();

  // Initialize smooth scrolling
  initSmoothScrolling();

  // Initialize performance optimizations
  initPerformanceOptimizations();

  // Add loading complete class for animations
  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 100);
});

// Handle page visibility changes for performance
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Pause any animations or expensive operations
  } else {
    // Resume animations or expensive operations
  }
});
