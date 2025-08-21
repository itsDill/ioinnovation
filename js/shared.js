// Theme Toggle Functionality
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
  themeIcon.className =
    theme === "light" ? "theme-icon fas fa-moon" : "theme-icon fas fa-sun";
}

// Mobile Menu Functionality
const menuBtn = document.getElementById("menuBtn");
const mobileNav = document.getElementById("mobileNav");
const closeMenuBtn = document.getElementById("closeMenuBtn");

menuBtn?.addEventListener("click", () => {
  mobileNav?.classList.add("open");
  body.classList.add("menu-open");
});

closeMenuBtn?.addEventListener("click", () => {
  mobileNav?.classList.remove("open");
  body.classList.remove("menu-open");
});

// Close menu when clicking a link
mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    body.classList.remove("menu-open");
  });
});
