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
  mobileNav?.classList.add("open");
  body.classList.add("menu-open");
  menuBtn?.classList.add("active");

  // Focus management for accessibility
  setTimeout(() => {
    const firstLink = mobileNav.querySelector("a:not(.close-menu-btn)");
    if (firstLink) firstLink.focus();
  }, 100);

  // Add haptic feedback on supported devices
  if ("vibrate" in navigator) {
    navigator.vibrate(25);
  }
}

function closeMobileMenu() {
  mobileNav?.classList.remove("open");
  body.classList.remove("menu-open");
  menuBtn?.classList.remove("active");
  menuBtn?.focus(); // Return focus to menu button
}

menuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  openMobileMenu();
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
const preloadPages = ["/markets.html", "/blog.html", "/contact.html"];
preloadPages.forEach((page) => {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = page;
  document.head.appendChild(link);
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
