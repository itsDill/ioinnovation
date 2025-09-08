/* IO Innovation Fund - Advanced JavaScript Module */
/* Extended functionality for data visualization, charts, and interactive features */

(function (window, document) {
  "use strict";

  // Advanced functionality module
  const IOAdvanced = {
    // Chart and data visualization utilities
    charts: {
      // Create responsive charts for market data
      createMarketChart: function (elementId, data, options = {}) {
        const element = document.getElementById(elementId);
        if (!element) return null;

        const defaultOptions = {
          type: "line",
          responsive: true,
          maintainAspectRatio: false,
          theme: document.documentElement.getAttribute("data-theme") || "dark",
        };

        const chartOptions = { ...defaultOptions, ...options };

        // Simple chart implementation without external dependencies
        return this.renderSimpleChart(element, data, chartOptions);
      },

      renderSimpleChart: function (container, data, options) {
        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        svg.style.width = "100%";
        svg.style.height = "300px";
        svg.setAttribute("viewBox", "0 0 800 300");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        const isDark = options.theme === "dark";
        const strokeColor = isDark ? "#2be2b4" : "#1abc9c";
        const textColor = isDark ? "#ffffff" : "#1a1a1a";
        const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

        // Create grid
        for (let i = 0; i <= 10; i++) {
          const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          line.setAttribute("x1", i * 80);
          line.setAttribute("y1", 0);
          line.setAttribute("x2", i * 80);
          line.setAttribute("y2", 300);
          line.setAttribute("stroke", gridColor);
          line.setAttribute("stroke-width", 1);
          svg.appendChild(line);

          const hLine = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          hLine.setAttribute("x1", 0);
          hLine.setAttribute("y1", i * 30);
          hLine.setAttribute("x2", 800);
          hLine.setAttribute("y2", i * 30);
          hLine.setAttribute("stroke", gridColor);
          hLine.setAttribute("stroke-width", 1);
          svg.appendChild(hLine);
        }

        // Create data line
        if (data && data.length > 0) {
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          const maxValue = Math.max(...data.map((d) => d.value));
          const minValue = Math.min(...data.map((d) => d.value));
          const valueRange = maxValue - minValue || 1;

          let pathData = "";
          data.forEach((point, index) => {
            const x = (index / (data.length - 1)) * 800;
            const y = 300 - ((point.value - minValue) / valueRange) * 250 - 25;
            pathData += index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
          });

          path.setAttribute("d", pathData);
          path.setAttribute("stroke", strokeColor);
          path.setAttribute("stroke-width", 3);
          path.setAttribute("fill", "none");
          path.style.filter = "drop-shadow(0 2px 4px rgba(43, 226, 180, 0.3))";
          svg.appendChild(path);

          // Add data points
          data.forEach((point, index) => {
            const x = (index / (data.length - 1)) * 800;
            const y = 300 - ((point.value - minValue) / valueRange) * 250 - 25;

            const circle = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "circle"
            );
            circle.setAttribute("cx", x);
            circle.setAttribute("cy", y);
            circle.setAttribute("r", 4);
            circle.setAttribute("fill", strokeColor);
            circle.style.cursor = "pointer";

            // Tooltip on hover
            circle.addEventListener("mouseenter", (e) => {
              this.showTooltip(e, point.label || point.value);
            });

            circle.addEventListener("mouseleave", () => {
              this.hideTooltip();
            });

            svg.appendChild(circle);
          });
        }

        container.innerHTML = "";
        container.appendChild(svg);

        return {
          update: (newData) =>
            this.renderSimpleChart(container, newData, options),
          destroy: () => (container.innerHTML = ""),
        };
      },

      showTooltip: function (event, content) {
        const tooltip = document.createElement("div");
        tooltip.className = "chart-tooltip";
        tooltip.style.cssText = `
                    position: fixed;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-size: 0.875rem;
                    color: var(--text-primary);
                    z-index: 10000;
                    pointer-events: none;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 20px var(--shadow-color);
                `;
        tooltip.textContent = content;
        document.body.appendChild(tooltip);

        const rect = tooltip.getBoundingClientRect();
        tooltip.style.left = event.clientX - rect.width / 2 + "px";
        tooltip.style.top = event.clientY - rect.height - 10 + "px";

        this.currentTooltip = tooltip;
      },

      hideTooltip: function () {
        if (this.currentTooltip) {
          this.currentTooltip.remove();
          this.currentTooltip = null;
        }
      },
    },

    // Market data simulation and utilities
    markets: {
      // Simulate live market data
      generateMockData: function (symbol, days = 30) {
        const data = [];
        let basePrice = Math.random() * 1000 + 100;

        for (let i = 0; i < days; i++) {
          const change = (Math.random() - 0.5) * 20;
          basePrice += change;
          basePrice = Math.max(basePrice, 10); // Minimum price

          data.push({
            date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
            value: parseFloat(basePrice.toFixed(2)),
            label: `${symbol}: $${basePrice.toFixed(2)}`,
          });
        }

        return data;
      },

      // Format market data for display
      formatMarketValue: function (value, currency = "USD") {
        const formatter = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return formatter.format(value);
      },

      // Calculate percentage change
      calculateChange: function (current, previous) {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      },

      // Update market widgets
      updateMarketWidget: function (elementId, data) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const change = data.change || 0;
        const isPositive = change >= 0;

        element.innerHTML = `
                    <div class="market-widget">
                        <div class="market-symbol">${data.symbol}</div>
                        <div class="market-price">${this.formatMarketValue(
                          data.price
                        )}</div>
                        <div class="market-change ${
                          isPositive ? "positive" : "negative"
                        }">
                            <i class="fas fa-${
                              isPositive ? "arrow-up" : "arrow-down"
                            }"></i>
                            ${Math.abs(change).toFixed(2)}%
                        </div>
                    </div>
                `;

        // Add styles if not already added
        if (!document.querySelector("#market-widget-styles")) {
          const style = document.createElement("style");
          style.id = "market-widget-styles";
          style.textContent = `
                        .market-widget {
                            background: var(--bg-card);
                            border: 1px solid var(--border-color);
                            border-radius: 12px;
                            padding: 1rem;
                            text-align: center;
                            transition: all 0.3s ease;
                        }
                        .market-widget:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 8px 25px var(--shadow-color);
                        }
                        .market-symbol {
                            font-weight: 600;
                            color: var(--text-secondary);
                            font-size: 0.875rem;
                            margin-bottom: 0.5rem;
                        }
                        .market-price {
                            font-size: 1.5rem;
                            font-weight: 700;
                            color: var(--text-primary);
                            margin-bottom: 0.5rem;
                        }
                        .market-change {
                            font-size: 0.875rem;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.25rem;
                        }
                        .market-change.positive {
                            color: #10b981;
                        }
                        .market-change.negative {
                            color: #ef4444;
                        }
                    `;
          document.head.appendChild(style);
        }
      },
    },

    // Enhanced animations and effects
    animations: {
      // Typing effect for text
      typeWriter: function (elementId, text, speed = 50) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.innerHTML = "";
        let i = 0;

        function type() {
          if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
          }
        }

        type();
      },

      // Count up animation
      countUp: function (elementId, start, end, duration = 2000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startTime = performance.now();
        const startValue = parseFloat(start) || 0;
        const endValue = parseFloat(end) || 0;
        const difference = endValue - startValue;

        function updateCount(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const current = startValue + difference * easeOutQuart;

          element.textContent = Math.floor(current).toLocaleString();

          if (progress < 1) {
            requestAnimationFrame(updateCount);
          }
        }

        requestAnimationFrame(updateCount);
      },

      // Parallax scroll effect
      parallax: function (elementId, speed = 0.5) {
        const element = document.getElementById(elementId);
        if (!element) return;

        function updateParallax() {
          const scrolled = window.pageYOffset;
          const parallax = scrolled * speed;
          element.style.transform = `translateY(${parallax}px)`;
        }

        window.addEventListener("scroll", updateParallax, { passive: true });
        return () => window.removeEventListener("scroll", updateParallax);
      },

      // Fade in on scroll
      fadeInOnScroll: function (selector = ".fade-in") {
        const elements = document.querySelectorAll(selector);

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("animate-fadeIn");
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.1 }
        );

        elements.forEach((el) => {
          el.style.opacity = "0";
          observer.observe(el);
        });
      },
    },

    // Real-time updates and WebSocket handling
    realTime: {
      connections: new Map(),

      // Simulate real-time market updates
      startMarketUpdates: function (symbols, callback) {
        const updateInterval = setInterval(() => {
          symbols.forEach((symbol) => {
            const mockData = {
              symbol: symbol,
              price: 100 + Math.random() * 900,
              change: (Math.random() - 0.5) * 10,
              timestamp: new Date(),
            };
            callback(mockData);
          });
        }, 5000); // Update every 5 seconds

        this.connections.set("market-updates", updateInterval);
        return updateInterval;
      },

      stopMarketUpdates: function () {
        const interval = this.connections.get("market-updates");
        if (interval) {
          clearInterval(interval);
          this.connections.delete("market-updates");
        }
      },

      // WebSocket connection for real data (when available)
      connectWebSocket: function (url, handlers = {}) {
        if (!window.WebSocket) {
          console.warn("WebSocket not supported");
          return null;
        }

        const ws = new WebSocket(url);

        ws.onopen = function (event) {
          console.log("WebSocket connected");
          if (handlers.onOpen) handlers.onOpen(event);
        };

        ws.onmessage = function (event) {
          try {
            const data = JSON.parse(event.data);
            if (handlers.onMessage) handlers.onMessage(data);
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
          }
        };

        ws.onclose = function (event) {
          console.log("WebSocket disconnected");
          if (handlers.onClose) handlers.onClose(event);
        };

        ws.onerror = function (error) {
          console.error("WebSocket error:", error);
          if (handlers.onError) handlers.onError(error);
        };

        return ws;
      },
    },

    // Data persistence and local storage
    storage: {
      // Save data to localStorage with expiration
      set: function (key, value, expirationMinutes = 60) {
        const expirationTime =
          new Date().getTime() + expirationMinutes * 60 * 1000;
        const item = {
          value: value,
          expiration: expirationTime,
        };
        localStorage.setItem(key, JSON.stringify(item));
      },

      // Get data from localStorage
      get: function (key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;

        try {
          const item = JSON.parse(itemStr);
          if (new Date().getTime() > item.expiration) {
            localStorage.removeItem(key);
            return null;
          }
          return item.value;
        } catch (e) {
          localStorage.removeItem(key);
          return null;
        }
      },

      // Remove data from localStorage
      remove: function (key) {
        localStorage.removeItem(key);
      },

      // Clear expired items
      clearExpired: function () {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          this.get(key); // This will remove expired items
        });
      },
    },

    // API utilities
    api: {
      // Base API request function
      request: async function (url, options = {}) {
        const defaultOptions = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        };

        const requestOptions = { ...defaultOptions, ...options };

        try {
          const response = await fetch(url, requestOptions);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await response.json();
          } else {
            return await response.text();
          }
        } catch (error) {
          console.error("API request failed:", error);
          throw error;
        }
      },

      // GET request helper
      get: function (url, options = {}) {
        return this.request(url, { ...options, method: "GET" });
      },

      // POST request helper
      post: function (url, data, options = {}) {
        return this.request(url, {
          ...options,
          method: "POST",
          body: JSON.stringify(data),
        });
      },

      // PUT request helper
      put: function (url, data, options = {}) {
        return this.request(url, {
          ...options,
          method: "PUT",
          body: JSON.stringify(data),
        });
      },

      // DELETE request helper
      delete: function (url, options = {}) {
        return this.request(url, { ...options, method: "DELETE" });
      },
    },

    // Initialize all advanced features
    init: function () {
      console.log("🔧 IO Innovation Fund - Advanced features initialized");

      // Initialize animations
      this.animations.fadeInOnScroll();

      // Clear expired storage items
      this.storage.clearExpired();

      // Set up theme change listeners for charts
      const themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "data-theme"
          ) {
            // Re-render charts with new theme
            const event = new CustomEvent("themeChanged", {
              detail: {
                theme: document.documentElement.getAttribute("data-theme"),
              },
            });
            document.dispatchEvent(event);
          }
        });
      });

      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    },
  };

  // Export to global scope
  window.IOAdvanced = IOAdvanced;

  // Auto-initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => IOAdvanced.init());
  } else {
    IOAdvanced.init();
  }
})(window, document);
