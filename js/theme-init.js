/* Theme persistence inline script - Add to HTML head */
/* This prevents flash of wrong theme by applying saved theme immediately */

(function () {
  "use strict";

  // Get saved theme or use system preference
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const theme = savedTheme || (prefersDark.matches ? "dark" : "light");

  // Apply theme immediately to prevent flash
  document.documentElement.setAttribute("data-theme", theme);

  // Ensure body has the correct theme attribute too
  document.addEventListener("DOMContentLoaded", function () {
    document.body.setAttribute("data-theme", theme);
  });
})();
