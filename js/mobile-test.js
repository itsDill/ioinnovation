/* Mobile Theme Testing and Debugging */
/* Add this temporarily to test mobile theme functionality */

(function () {
  "use strict";

  console.log("🧪 Mobile Theme Testing Module Loaded");

  // Mobile detection
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  console.log("📱 Device Info:", {
    isMobile,
    isTouch,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      ratio: window.devicePixelRatio,
    },
  });

  if (isMobile) {
    // Theme testing functions
    window.mobileThemeTest = {
      // Test theme toggle
      testThemeToggle: function () {
        const themeToggle = document.getElementById("themeToggle");
        if (themeToggle) {
          console.log("🧪 Testing theme toggle...");
          themeToggle.click();
          setTimeout(() => {
            themeToggle.click();
            console.log("✅ Theme toggle test completed");
          }, 1000);
        }
      },

      // Test theme persistence
      testThemePersistence: function () {
        console.log("🧪 Testing theme persistence...");
        const originalTheme = localStorage.getItem("theme");
        localStorage.setItem("theme", "light");
        location.reload();
        // Note: This will reload the page
      },

      // Test CSS variables
      testCSSVariables: function () {
        console.log("🧪 Testing CSS variables...");
        const styles = getComputedStyle(document.documentElement);
        const variables = [
          "--bg-primary",
          "--text-primary",
          "--accent-primary",
          "--border-color",
        ];

        variables.forEach((variable) => {
          const value = styles.getPropertyValue(variable);
          console.log(`${variable}: ${value}`);
        });
      },

      // Test mobile optimizations
      testMobileOptimizations: function () {
        console.log("🧪 Testing mobile optimizations...");

        // Test viewport height fix
        const vh = getComputedStyle(document.documentElement).getPropertyValue(
          "--vh"
        );
        console.log("Viewport height fix:", vh);

        // Test hardware acceleration
        const body = getComputedStyle(document.body);
        console.log("Hardware acceleration:", {
          transform: body.transform,
          backfaceVisibility: body.backfaceVisibility,
        });

        // Test touch events
        let touchEvents = [];
        const testElement = document.createElement("div");
        testElement.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          width: 50px;
          height: 50px;
          background: rgba(43, 226, 180, 0.3);
          border: 2px solid var(--accent-primary);
          border-radius: 50%;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: var(--text-primary);
        `;
        testElement.textContent = "🧪";
        testElement.title = "Mobile Test Element";

        ["touchstart", "touchend", "click"].forEach((event) => {
          testElement.addEventListener(event, () => {
            touchEvents.push(event);
            console.log(`Touch event: ${event}`);
          });
        });

        document.body.appendChild(testElement);

        setTimeout(() => {
          console.log("Touch events captured:", touchEvents);
          testElement.remove();
        }, 5000);
      },

      // Performance diagnostics
      diagnostics: function () {
        console.log("🔍 Mobile Performance Diagnostics:");

        // Memory usage (if available)
        if (performance.memory) {
          console.log("Memory:", {
            used:
              Math.round(performance.memory.usedJSHeapSize / 1048576) + "MB",
            total:
              Math.round(performance.memory.totalJSHeapSize / 1048576) + "MB",
            limit:
              Math.round(performance.memory.jsHeapSizeLimit / 1048576) + "MB",
          });
        }

        // Connection info (if available)
        if (navigator.connection) {
          console.log("Connection:", {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
          });
        }

        // Battery info (if available)
        if (navigator.getBattery) {
          navigator.getBattery().then((battery) => {
            console.log("Battery:", {
              level: Math.round(battery.level * 100) + "%",
              charging: battery.charging,
            });
          });
        }

        // Device info
        console.log("Device:", {
          cores: navigator.hardwareConcurrency,
          memory: navigator.deviceMemory + "GB" || "unknown",
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
        });
      },
    };

    // Auto-run diagnostics
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        window.mobileThemeTest.diagnostics();
        window.mobileThemeTest.testCSSVariables();
      }, 1000);
    });

    // Add debugging UI
    const debugInfo = document.createElement("div");
    debugInfo.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px;
      font-size: 11px;
      color: var(--text-secondary);
      max-width: 200px;
      z-index: 9999;
      backdrop-filter: blur(10px);
      opacity: 0.8;
    `;

    debugInfo.innerHTML = `
      <strong>📱 Mobile Debug</strong><br>
      Theme: <span id="debug-theme">${
        localStorage.getItem("theme") || "auto"
      }</span><br>
      Size: ${window.innerWidth}x${window.innerHeight}<br>
      DPR: ${window.devicePixelRatio}<br>
      <button onclick="window.mobileThemeTest.testThemeToggle()" style="font-size: 10px; margin-top: 5px;">Test Theme</button>
    `;

    document.addEventListener("DOMContentLoaded", () => {
      document.body.appendChild(debugInfo);

      // Update theme display
      document.addEventListener("themeChanged", (e) => {
        const debugTheme = document.getElementById("debug-theme");
        if (debugTheme) {
          debugTheme.textContent = e.detail.theme;
        }
      });
    });

    // Remove debug info in production
    setTimeout(() => {
      if (debugInfo.parentNode) {
        debugInfo.style.opacity = "0.3";
        setTimeout(() => {
          if (debugInfo.parentNode) {
            debugInfo.remove();
          }
        }, 10000);
      }
    }, 30000);
  }

  console.log("🧪 Mobile Theme Testing Ready");
})();
