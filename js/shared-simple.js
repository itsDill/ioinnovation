// Simple Theme Toggle
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

// Simple Mobile Menu
const menuBtn = document.getElementById("menuBtn");
const mobileNav = document.getElementById("mobileNav");
const closeMenuBtn = document.getElementById("closeMenuBtn");

function openMobileMenu() {
  if (!mobileNav) return;
  mobileNav.classList.add("open");
  menuBtn?.classList.add("active");
}

function closeMobileMenu() {
  if (!mobileNav) return;
  mobileNav.classList.remove("open");
  menuBtn?.classList.remove("active");
}

// Event listeners
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
