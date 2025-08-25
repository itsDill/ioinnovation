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

menuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  mobileNav?.classList.add("open");
  body.classList.add("menu-open");

  // Focus management for accessibility
  const firstLink = mobileNav.querySelector("a");
  if (firstLink) firstLink.focus();
});

closeMenuBtn?.addEventListener("click", () => {
  closeMobileMenu();
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (
    mobileNav?.classList.contains("open") &&
    !mobileNav.contains(e.target) &&
    !menuBtn.contains(e.target)
  ) {
    closeMobileMenu();
  }
});

// Close menu when clicking a link
mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    closeMobileMenu();
  });
});

function closeMobileMenu() {
  mobileNav?.classList.remove("open");
  body.classList.remove("menu-open");
  menuBtn?.focus(); // Return focus to menu button
}

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

// Enhanced scroll behavior
const header = document.querySelector(".header");
const themeToggleBtn = document.querySelector(".theme-toggle");
const mobileMenuBtn = document.querySelector(".mobile-menu-btn");

window.addEventListener(
  "scroll",
  () => {
    // Explicitly ensure header stays visible and positioned correctly
    if (header) {
      header.style.position = "fixed";
      header.style.top = "0";
      header.style.left = "0";
      header.style.right = "0";
      header.style.zIndex = "1000";
      header.style.transform = "none";
      header.style.visibility = "visible";
      header.style.opacity = "1";
    }

    // Ensure theme toggle and mobile menu stay properly positioned
    if (themeToggleBtn) {
      themeToggleBtn.style.zIndex = "999";
      themeToggleBtn.style.transform = "none";
      themeToggleBtn.style.visibility = "visible";
      themeToggleBtn.style.opacity = "1";
    }

    if (mobileMenuBtn) {
      mobileMenuBtn.style.zIndex = "999";
      mobileMenuBtn.style.transform = "none";
      mobileMenuBtn.style.visibility = "visible";
      mobileMenuBtn.style.opacity = "1";
    }
  },
  { passive: true }
);

// Keyboard navigation improvements
document.addEventListener("keydown", (e) => {
  // Handle escape key for mobile menu
  if (e.key === "Escape" && mobileNav?.classList.contains("open")) {
    closeMobileMenu();
  }

  // Handle enter key for theme toggle
  if (e.key === "Enter" && e.target === themeToggle) {
    themeToggle.click();
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
