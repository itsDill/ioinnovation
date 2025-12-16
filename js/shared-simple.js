/* IO Innovation Fund - Shared JavaScript */
/* Mobile-optimized, performance-focused functionality */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  console.log("shared-simple.js DOMContentLoaded fired");

  // Initialize all functionality
  initializeTheme();
  initializeMobileMenu();
  initializeScrollAnimations();
  initializeIntersectionObserver();
  initializeFormValidation();
  initializeAccessibility();
  initializePerformanceOptimizations();

  // Theme Management - Enhanced for mobile
  function initializeTheme() {
    console.log("Initializing enhanced theme system...");

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    console.log("Theme elements found:", {
      themeToggle: !!themeToggle,
      themeIcon: !!themeIcon,
      isMobile: isMobile,
    });

    // Get saved theme or default to light
    let currentTheme = localStorage.getItem("theme") || "light";

    console.log("Current theme:", currentTheme);

    // Enhanced theme application function for mobile
    function setTheme(theme) {
      console.log("Setting theme to:", theme);

      // Apply to multiple targets for maximum compatibility
      const targets = [document.documentElement, document.body];

      targets.forEach((target) => {
        if (target) {
          target.setAttribute("data-theme", theme);
          target.className =
            target.className.replace(/\b(dark|light)-theme\b/g, "") +
            ` ${theme}-theme`;
        }
      });

      // Store theme preference
      localStorage.setItem("theme", theme);

      // Update icon with mobile-optimized approach
      if (themeIcon) {
        // Use requestAnimationFrame for smoother mobile performance
        requestAnimationFrame(() => {
          const iconClass = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
          themeIcon.className = `theme-icon ${iconClass}`;

          // Add visual feedback for mobile users
          if (isMobile) {
            themeIcon.style.transform = "scale(1.1)";
            setTimeout(() => {
              themeIcon.style.transform = "scale(1)";
            }, 150);
          }
        });

        console.log("Updated theme icon for:", theme);
      }

      // Mobile-specific theme application
      if (isMobile) {
        // Use transform3d to trigger hardware acceleration
        document.body.style.transform = "translate3d(0,0,0)";

        // Force repaint with optimized method
        requestAnimationFrame(() => {
          document.body.style.transform = "";

          // Additional mobile webkit optimization
          if (window.webkit) {
            document.body.style.webkitTransform = "translateZ(0)";
            setTimeout(() => {
              document.body.style.webkitTransform = "";
            }, 100);
          }
        });
      }

      // Dispatch custom event for other components
      document.dispatchEvent(
        new CustomEvent("themeChanged", {
          detail: { theme, isMobile },
        })
      );
    }

    // Initialize theme immediately
    setTheme(currentTheme);

    // Enhanced theme toggle with mobile optimizations
    if (themeToggle) {
      function toggleThemeHandler(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log("Theme toggle clicked! Current theme:", currentTheme);

        currentTheme = currentTheme === "dark" ? "light" : "dark";
        setTheme(currentTheme);

        // Enhanced mobile feedback
        if (isMobile) {
          // Haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }

          // Visual ripple effect
          const ripple = document.createElement("div");
          ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255,255,255,0.3);
            width: 60px;
            height: 60px;
            left: -12px;
            top: -12px;
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            z-index: 1;
          `;

          themeToggle.style.position = "relative";
          themeToggle.appendChild(ripple);

          setTimeout(() => {
            if (ripple.parentNode) {
              ripple.parentNode.removeChild(ripple);
            }
          }, 600);
        }

        console.log("Theme toggled to:", currentTheme);
      }

      // Remove any existing listeners first
      themeToggle.removeEventListener("click", toggleThemeHandler);

      // Add optimized event listeners
      themeToggle.addEventListener("click", toggleThemeHandler);

      // Enhanced touch support for mobile
      if (isMobile) {
        themeToggle.addEventListener(
          "touchend",
          function (e) {
            e.preventDefault();
            toggleThemeHandler(e);
          },
          { passive: false }
        );

        // Prevent double-tap zoom on theme toggle
        let lastTouchEnd = 0;
        themeToggle.addEventListener(
          "touchend",
          function (e) {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
              e.preventDefault();
            }
            lastTouchEnd = now;
          },
          false
        );
      }
    } else {
      console.error("Theme toggle button not found!");
    }

    // Listen for system theme changes
    prefersDark.addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        currentTheme = newTheme;
      }
    });

    // Mobile-specific optimizations
    if (isMobile) {
      // Listen for orientation changes to reapply theme
      window.addEventListener("orientationchange", () => {
        setTimeout(() => {
          setTheme(currentTheme);
        }, 100);
      });

      // Handle page visibility for mobile browsers
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          // Reapply theme when page becomes visible (fixes some mobile browser bugs)
          setTimeout(() => {
            setTheme(currentTheme);
          }, 50);
        }
      });
    }

    console.log("Enhanced theme system initialized successfully");
  }

  // Mobile Menu Management
  function initializeMobileMenu() {
    console.log("Initializing mobile menu...");

    const menuBtn = document.getElementById("menuBtn");
    const mobileNav = document.getElementById("mobileNav");
    const mobileOverlay = document.getElementById("mobileOverlay");
    const navLinks = document.querySelectorAll(".nav-links a");

    console.log("Mobile menu elements:", {
      menuBtn: !!menuBtn,
      mobileNav: !!mobileNav,
      mobileOverlay: !!mobileOverlay,
      navLinksCount: navLinks.length,
    });

    if (!menuBtn || !mobileNav) {
      console.error("Mobile menu elements not found!");
      return;
    }

    let isMenuOpen = false;

    function toggleMenu() {
      console.log("Toggle menu called, current state:", isMenuOpen);
      isMenuOpen = !isMenuOpen;

      // Update DOM classes
      menuBtn.classList.toggle("active", isMenuOpen);
      mobileNav.classList.toggle("open", isMenuOpen);
      document.body.classList.toggle("menu-open", isMenuOpen);

      if (mobileOverlay) {
        mobileOverlay.classList.toggle("active", isMenuOpen);
      }

      console.log("Menu state after toggle:", {
        isMenuOpen,
        menuBtnClasses: menuBtn.className,
        mobileNavClasses: mobileNav.className,
        bodyClasses: document.body.className,
      });

      // Update ARIA attributes
      menuBtn.setAttribute("aria-expanded", isMenuOpen);
      mobileNav.setAttribute("aria-expanded", isMenuOpen);

      // Focus management
      if (isMenuOpen) {
        // Focus first nav link when menu opens
        const firstLink = mobileNav.querySelector("a");
        if (firstLink) {
          setTimeout(() => firstLink.focus(), 100);
        }
      } else {
        // Return focus to menu button when menu closes
        menuBtn.focus();
      }
    }

    function closeMenu() {
      if (isMenuOpen) {
        toggleMenu();
      }
    }

    // Event listeners
    menuBtn.addEventListener("click", function (e) {
      console.log("Menu button clicked!");
      toggleMenu();
    });

    if (mobileOverlay) {
      mobileOverlay.addEventListener("click", closeMenu);
    }

    // Close menu when nav link is clicked
    navLinks.forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close menu on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        closeMenu();
      }
    });

    // Close menu on window resize if mobile menu becomes hidden
    window.addEventListener(
      "resize",
      debounce(() => {
        if (window.innerWidth > 768 && isMenuOpen) {
          closeMenu();
        }
      }, 250)
    );
  }

  // Scroll Animations
  function initializeScrollAnimations() {
    const animateElements = document.querySelectorAll(".scroll-animate");

    if (animateElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
            // Unobserve to prevent re-triggering
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    animateElements.forEach((el) => observer.observe(el));
  }

  // Advanced Intersection Observer for performance
  function initializeIntersectionObserver() {
    // Lazy load images
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    if (lazyImages.length > 0) {
      const imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;

              // Add fade-in effect
              img.style.opacity = "0";
              img.style.transition = "opacity 0.3s ease";

              img.onload = () => {
                img.style.opacity = "1";
              };

              // Set src if data-src exists
              if (img.dataset.src) {
                img.src = img.dataset.src;
              }

              imageObserver.unobserve(img);
            }
          });
        },
        {
          rootMargin: "50px",
        }
      );

      lazyImages.forEach((img) => imageObserver.observe(img));
    }

    // Animate counters when in view
    const counters = document.querySelectorAll("[data-target]");

    if (counters.length > 0) {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.5,
        }
      );

      counters.forEach((counter) => counterObserver.observe(counter));
    }
  }

  // Form Validation
  function initializeFormValidation() {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      const inputs = form.querySelectorAll("input, textarea, select");

      inputs.forEach((input) => {
        // Real-time validation
        input.addEventListener("blur", () => validateField(input));
        input.addEventListener(
          "input",
          debounce(() => {
            if (input.classList.contains("form-error")) {
              validateField(input);
            }
          }, 300)
        );
      });

      // Form submission
      form.addEventListener("submit", (e) => {
        let isValid = true;

        inputs.forEach((input) => {
          if (!validateField(input)) {
            isValid = false;
          }
        });

        if (!isValid) {
          e.preventDefault();

          // Focus first invalid field
          const firstError = form.querySelector(".form-error");
          if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      });
    });
  }

  // Accessibility Enhancements
  function initializeAccessibility() {
    // Skip link functionality
    const skipLink = document.querySelector(".skip-to-main");
    if (skipLink) {
      skipLink.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(skipLink.getAttribute("href"));
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    // Keyboard navigation for interactive elements
    const interactiveElements = document.querySelectorAll(
      "button, a, input, textarea, select"
    );

    interactiveElements.forEach((element) => {
      // Add focus indicators
      element.addEventListener("focus", function () {
        this.setAttribute("data-focused", "true");
      });

      element.addEventListener("blur", function () {
        this.removeAttribute("data-focused");
      });

      // Handle Enter key for buttons
      if (element.tagName === "BUTTON") {
        element.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            element.click();
          }
        });
      }
    });

    // Announce dynamic content changes
    const announcer = createLiveRegion();
    window.announceToScreenReader = (message) => {
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = "";
      }, 1000);
    };
  }

  // Performance Optimizations
  function initializePerformanceOptimizations() {
    // Optimize scroll events
    let isScrolling = false;

    window.addEventListener(
      "scroll",
      () => {
        if (!isScrolling) {
          requestAnimationFrame(() => {
            handleScroll();
            isScrolling = false;
          });
          isScrolling = true;
        }
      },
      { passive: true }
    );

    // Preload critical resources
    preloadCriticalResources();

    // Service Worker registration for caching
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }

    // Resource hints for better performance
    addResourceHints();
  }

  // Utility Functions
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const required = field.required;
    let isValid = true;
    let errorMessage = "";

    // Remove existing error state
    field.classList.remove("form-error", "form-success");
    removeErrorMessage(field);

    // Required field validation
    if (required && !value) {
      isValid = false;
      errorMessage = "This field is required";
    }

    // Email validation
    else if (type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = "Please enter a valid email address";
      }
    }

    // Phone validation
    else if (type === "tel" && value) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
        isValid = false;
        errorMessage = "Please enter a valid phone number";
      }
    }

    // Minimum length validation
    else if (field.minLength && value.length < field.minLength) {
      isValid = false;
      errorMessage = `Minimum ${field.minLength} characters required`;
    }

    // Apply validation state
    if (isValid) {
      field.classList.add("form-success");
    } else {
      field.classList.add("form-error");
      showErrorMessage(field, errorMessage);
    }

    return isValid;
  }

  function showErrorMessage(field, message) {
    const errorElement = document.createElement("div");
    errorElement.className = "error-message";
    errorElement.textContent = message;
    errorElement.setAttribute("role", "alert");

    field.parentNode.appendChild(errorElement);
  }

  function removeErrorMessage(field) {
    const existingError = field.parentNode.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }
  }

  function animateCounter(element) {
    const target = parseFloat(element.dataset.target);
    const suffix = element.textContent.includes("%")
      ? "%"
      : element.textContent.includes("$")
      ? ""
      : element.textContent.includes("K")
      ? "K+"
      : element.textContent.includes("T")
      ? "T"
      : "";
    const prefix = element.textContent.includes("$") ? "$" : "";

    const duration = 2000;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = target * easeOutCubic;

      let displayValue = current.toFixed(target < 10 ? 1 : 0);

      if (suffix === "%") displayValue += suffix;
      if (prefix === "$") displayValue = prefix + displayValue;
      if (suffix === "K+") displayValue = Math.floor(current) + suffix;
      if (suffix === "T") displayValue = current.toFixed(1) + suffix;

      element.textContent = displayValue;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }

    requestAnimationFrame(updateCounter);
  }

  function handleScroll() {
    const scrollTop = window.pageYOffset;
    const header = document.querySelector(".header");

    // Header scroll effect
    if (header) {
      if (scrollTop > 100) {
        header.style.background = "var(--bg-secondary)";
        header.style.backdropFilter = "blur(25px)";
      } else {
        header.style.background = "var(--bg-secondary)";
        header.style.backdropFilter = "blur(20px)";
      }
    }

    // Parallax effects for hero sections
    const heroElements = document.querySelectorAll(".hero");
    heroElements.forEach((hero) => {
      const rect = hero.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const speed = 0.5;
        const yPos = -(scrollTop * speed);
        hero.style.transform = `translate3d(0, ${yPos}px, 0)`;
      }
    });
  }

  function createLiveRegion() {
    const liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only";
    document.body.appendChild(liveRegion);
    return liveRegion;
  }

  function preloadCriticalResources() {
    const criticalImages = ["/assets/images/logo.png", "/favicon.svg"];

    criticalImages.forEach((src) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
    });
  }

  function addResourceHints() {
    const hints = [
      { rel: "dns-prefetch", href: "//fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "//fonts.gstatic.com" },
      { rel: "dns-prefetch", href: "//cdnjs.cloudflare.com" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: true,
      },
    ];

    hints.forEach((hint) => {
      const link = document.createElement("link");
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
      document.head.appendChild(link);
    });
  }

  // Global utility functions
  window.showNotification = function (message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;

    const icon =
      type === "success"
        ? "check-circle"
        : type === "error"
        ? "exclamation-triangle"
        : "info-circle";

    notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            </div>
        `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add("show"), 100);

    // Auto remove
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);

    // Announce to screen readers
    if (window.announceToScreenReader) {
      window.announceToScreenReader(message);
    }
  };

  // Smooth scroll utility
  window.smoothScrollTo = function (target, offset = 0) {
    const element =
      typeof target === "string" ? document.querySelector(target) : target;

    if (element) {
      const top =
        element.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: top,
        behavior: "smooth",
      });
    }
  };

  // Form submission helper
  window.handleFormSubmission = async function (form, endpoint, options = {}) {
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton ? submitButton.innerHTML : "";

    try {
      // Add loading state
      if (submitButton) {
        submitButton.classList.add("loading");
        submitButton.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitButton.disabled = true;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        ...options,
      });

      if (response.ok) {
        showNotification("Message sent successfully!", "success");
        form.reset();

        // Remove success classes
        form.querySelectorAll(".form-success").forEach((field) => {
          field.classList.remove("form-success");
        });
      } else {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      showNotification("Failed to send message. Please try again.", "error");
      console.error("Form submission error:", error);
    } finally {
      // Remove loading state
      if (submitButton) {
        submitButton.classList.remove("loading");
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
      }
    }
  };

  console.log("🚀 IO Innovation Fund - Shared functionality initialized");
});

// Handle page visibility changes for performance
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    // Pause non-essential animations when page is hidden
    document.querySelectorAll(".loading").forEach((el) => {
      el.style.animationPlayState = "paused";
    });
  } else {
    // Resume animations when page becomes visible
    document.querySelectorAll(".loading").forEach((el) => {
      el.style.animationPlayState = "running";
    });
  }
});

// Error handling for uncaught errors
window.addEventListener("error", function (e) {
  console.error("JavaScript error:", e.error);
  // Could send error reports to analytics service here
});

// Handle offline/online status
window.addEventListener("online", function () {
  if (window.showNotification) {
    showNotification("Connection restored", "success");
  }
});

window.addEventListener("offline", function () {
  if (window.showNotification) {
    showNotification("You are offline", "info");
  }
});
