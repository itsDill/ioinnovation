// Theme Toggle Functionality
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const body = document.body;

// Load saved theme or default to dark
const savedTheme = localStorage.getItem("theme") || "dark";
body.setAttribute("data-theme", savedTheme);
updateThemeIcon(savedTheme);

// Add theme transition class after page load
window.addEventListener("load", () => {
  body.classList.add("theme-transition");
});

themeToggle?.addEventListener("click", () => {
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);

  // Add haptic feedback on supported devices
  if ("vibrate" in navigator) {
    navigator.vibrate(50);
  }
});

function updateThemeIcon(theme) {
  if (!themeIcon) return;
  themeIcon.className =
    theme === "light" ? "theme-icon fas fa-moon" : "theme-icon fas fa-sun";
}

// Mobile Menu Functionality with enhanced UX
const menuBtn = document.getElementById("menuBtn");
const mobileNav = document.getElementById("mobileNav");
const closeMenuBtn = document.getElementById("closeMenuBtn");

function openMobileMenu() {
  if (!mobileNav) return;

  mobileNav.classList.add("open");
  menuBtn?.classList.add("active");

  // Focus management for accessibility
  setTimeout(() => {
    const firstLink = mobileNav.querySelector("a:not(.close-menu-btn)");
    if (firstLink) firstLink.focus();
  }, 150);

  // Add haptic feedback on supported devices
  if ("vibrate" in navigator) {
    navigator.vibrate([25]);
  }

  // Announce to screen readers
  if (mobileNav.getAttribute("aria-expanded")) {
    mobileNav.setAttribute("aria-expanded", "true");
  }
  if (menuBtn?.getAttribute("aria-expanded")) {
    menuBtn.setAttribute("aria-expanded", "true");
  }
}

function closeMobileMenu() {
  if (!mobileNav) return;

  mobileNav.classList.remove("open");
  menuBtn?.classList.remove("active");

  menuBtn?.focus(); // Return focus to menu button

  // Announce to screen readers
  if (mobileNav.getAttribute("aria-expanded")) {
    mobileNav.setAttribute("aria-expanded", "false");
  }
  if (menuBtn?.getAttribute("aria-expanded")) {
    menuBtn.setAttribute("aria-expanded", "false");
  }
}

menuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (mobileNav?.classList.contains("open")) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
});

closeMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  closeMobileMenu();
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (
    mobileNav?.classList.contains("open") &&
    !mobileNav.contains(e.target) &&
    !menuBtn?.contains(e.target)
  ) {
    closeMobileMenu();
  }
});

// Close menu when clicking a navigation link
mobileNav?.querySelectorAll("a:not(.close-menu-btn)").forEach((link) => {
  link.addEventListener("click", () => {
    closeMobileMenu();
  });
});

// Handle escape key to close menu
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mobileNav?.classList.contains("open")) {
    closeMobileMenu();
  }
});

// Keyboard navigation within mobile menu
mobileNav?.addEventListener("keydown", (e) => {
  const focusableElements = mobileNav.querySelectorAll("a, button");
  const focusableArray = Array.from(focusableElements);
  const currentIndex = focusableArray.indexOf(document.activeElement);

  if (e.key === "ArrowDown") {
    e.preventDefault();
    const nextIndex = (currentIndex + 1) % focusableArray.length;
    focusableArray[nextIndex].focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const prevIndex =
      (currentIndex - 1 + focusableArray.length) % focusableArray.length;
    focusableArray[prevIndex].focus();
  }
});

// Enhanced Navigation - Active Link Management
function updateActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    link.classList.remove("active");
    const linkPath = link.getAttribute("href");

    // Handle different link formats
    if (
      linkPath === currentPath ||
      linkPath === currentPath.replace(/^\//, "") ||
      (currentPath === "/" && linkPath === "/index.html") ||
      (currentPath.includes("index.html") && linkPath === "/index.html")
    ) {
      link.classList.add("active");
    }
  });
}

// Initialize active link on page load
updateActiveNavLink();

// Enhanced scroll behavior and header management
const header = document.querySelector(".header");
let lastScrollY = window.scrollY;
let ticking = false;

function updateHeader() {
  const currentScrollY = window.scrollY;

  if (header) {
    // Add/remove scrolled class for styling
    if (currentScrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  lastScrollY = currentScrollY;
  ticking = false;
}

function requestHeaderUpdate() {
  if (!ticking) {
    requestAnimationFrame(updateHeader);
    ticking = true;
  }
}

window.addEventListener("scroll", requestHeaderUpdate, { passive: true });

// Keyboard navigation improvements
document.addEventListener("keydown", (e) => {
  // Handle enter key for theme toggle
  if (e.key === "Enter" && e.target === themeToggle) {
    themeToggle.click();
  }

  // Handle enter key for mobile menu button
  if (e.key === "Enter" && e.target === menuBtn) {
    menuBtn.click();
  }
});

// Intersection Observer for animations
const observeElements = () => {
  const animatedElements = document.querySelectorAll(".animate-on-scroll");

  if (animatedElements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animated");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  animatedElements.forEach((el) => observer.observe(el));
};

// Initialize animations when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", observeElements);
} else {
  observeElements();
}

// Mobile menu initialization after DOM load
document.addEventListener("DOMContentLoaded", function () {
  // Re-initialize mobile menu functionality after DOM is loaded
  const menuBtn = document.getElementById("menuBtn");
  const mobileNav = document.getElementById("mobileNav");
  const closeMenuBtn = document.getElementById("closeMenuBtn");

  if (menuBtn && mobileNav) {
    console.log("Reinitializing mobile menu");

    menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Menu button clicked (DOM ready)");

      if (mobileNav.classList.contains("open")) {
        mobileNav.classList.remove("open");
        document.body.classList.remove("menu-open");
        menuBtn.classList.remove("active");
      } else {
        mobileNav.classList.add("open");
        document.body.classList.add("menu-open");
        menuBtn.classList.add("active");
      }
    });

    if (closeMenuBtn) {
      closeMenuBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Close button clicked (DOM ready)");
        mobileNav.classList.remove("open");
        document.body.classList.remove("menu-open");
        menuBtn.classList.remove("active");
      });
    }
  }
});

// Performance optimization - Debounced resize handler
let resizeTimer;
window.addEventListener(
  "resize",
  () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Handle responsive adjustments
      updateActiveNavLink();
    }, 250);
  },
  { passive: true }
);

// Error handling for failed resource loads
window.addEventListener(
  "error",
  (e) => {
    if (e.target.tagName === "IMG") {
      // Handle broken images
      e.target.style.display = "none";
      console.warn("Image failed to load:", e.target.src);
    }
  },
  true
);

// Preload critical pages for better performance
const preloadPages = [
  "/markets.html",
  "/blog.html",
  "/contact.html",
  "/tools.html",
];
preloadPages.forEach((page) => {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = page;
  document.head.appendChild(link);
});

// Enhanced page loading experience
window.addEventListener("beforeunload", () => {
  // Add loading class to body for smooth transitions
  document.body.style.opacity = "0.8";
});

// Page transition effects
document.addEventListener("DOMContentLoaded", () => {
  document.body.style.opacity = "1";
  document.body.style.transition = "opacity 0.3s ease";
});

// Enhanced link interactions
document.querySelectorAll('a[href^="/"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    // Add subtle loading indication for internal links
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      setTimeout(() => {
        document.body.style.opacity = "0.9";
      }, 100);
    }
  });
});

// Service Worker registration for PWA capabilities
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => console.log("SW registered"))
      .catch((registrationError) => console.log("SW registration failed"));
  });
}

// Performance monitoring
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === "navigation") {
      // Log navigation timing for optimization
      console.log(
        "Navigation completed in:",
        entry.loadEventEnd - entry.fetchStart,
        "ms"
      );
    }
  }
});

try {
  observer.observe({ entryTypes: ["navigation"] });
} catch (e) {
  // Fallback for browsers that don't support PerformanceObserver
}
