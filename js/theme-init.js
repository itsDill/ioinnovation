/* Enhanced Theme Initialization - Mobile Optimized */
/* Prevents flash of wrong theme and ensures mobile compatibility */

(function () {
  "use strict";

  // Check if we're on mobile
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Get saved theme or default to light
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const theme = savedTheme || "light"; // Default to light theme

  console.log("Theme init - applying theme:", theme, "| Mobile:", isMobile);

  // Apply theme immediately to prevent flash
  function applyTheme(currentTheme) {
    // Set on both html and body for maximum compatibility
    document.documentElement.setAttribute("data-theme", currentTheme);
    document.documentElement.className = currentTheme + "-theme";

    // Additional mobile-specific theme application
    if (isMobile) {
      // Force hardware acceleration for smoother theme transitions
      document.documentElement.style.transform = "translateZ(0)";
      document.documentElement.style.webkitTransform = "translateZ(0)";
    }
  }

  // Apply theme immediately
  applyTheme(theme);

  // Enhanced DOM ready handler for mobile
  function onDOMReady() {
    console.log("DOM loaded - ensuring theme consistency for mobile");

    // Ensure body has the correct theme
    document.body.setAttribute("data-theme", theme);
    document.body.className =
      (document.body.className || "") + " " + theme + "-theme";

    // Mobile-specific theme fixes
    if (isMobile) {
      // Force style recalculation with improved method
      requestAnimationFrame(() => {
        document.body.style.visibility = "hidden";
        document.body.offsetHeight; // Force reflow
        document.body.style.visibility = "visible";

        // Reset transform after theme application
        setTimeout(() => {
          document.documentElement.style.transform = "";
          document.documentElement.style.webkitTransform = "";
        }, 50);
      });

      // Add mobile-specific CSS variables
      const root = document.documentElement;
      root.style.setProperty("--mobile-vh", `${window.innerHeight * 0.01}px`);

      // Update on resize/orientation change
      const updateMobileVH = () => {
        root.style.setProperty("--mobile-vh", `${window.innerHeight * 0.01}px`);
      };

      window.addEventListener("resize", updateMobileVH);
      window.addEventListener("orientationchange", () => {
        setTimeout(updateMobileVH, 100);
      });
    }
  }

  // Handle DOM ready state
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onDOMReady);
  } else {
    onDOMReady();
  }

  // Listen for system theme changes
  prefersDark.addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      const newTheme = e.matches ? "dark" : "light";
      applyTheme(newTheme);
      console.log("System theme changed to:", newTheme);
    }
  });

  // Export theme application function for use by other scripts
  window.applyThemeInit = applyTheme;
})();
