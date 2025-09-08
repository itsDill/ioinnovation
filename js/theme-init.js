/* Theme persistence inline script - Add to HTML head */
/* This prevents flash of wrong theme by applying saved theme immediately */

(function () {
  "use strict";

  // Get saved theme or use system preference
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const theme = savedTheme || (prefersDark.matches ? "dark" : "light");

  console.log("Theme init - applying theme:", theme);

  // Apply theme immediately to prevent flash - mobile compatible
  document.documentElement.setAttribute("data-theme", theme);

  // For mobile browsers, also set a class for additional targeting
  document.documentElement.className = theme + "-theme";

  // Ensure body has the correct theme attribute too when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM loaded - ensuring theme consistency");
    document.body.setAttribute("data-theme", theme);
    document.body.className =
      (document.body.className || "") + " " + theme + "-theme";

    // Force style recalculation on mobile
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      setTimeout(() => {
        document.body.style.visibility = "hidden";
        document.body.offsetHeight; // Force reflow
        document.body.style.visibility = "visible";
      }, 10);
    }
  });
})();
