// Enhanced Google Ads Configuration for IO Innovation Fund
// Optimized for financial services and Southeast Asia investment content

(function () {
  "use strict";

  // Configuration object for Google Ads
  const GoogleAdsConfig = {
    pubId: "ca-pub-2456627863532019",
    conversionId: null, // To be set when conversion tracking is enabled

    // Ad unit configurations
    adUnits: {
      // Responsive display ads for content pages
      content: {
        format: "autorelaxed",
        slot: "1234567890", // Replace with actual slot ID
        responsive: true,
      },

      // Article inline ads for blog posts
      article: {
        format: "fluid",
        slot: "2345678901", // Replace with actual slot ID
        layout: "in-article",
      },

      // Sidebar ads for desktop
      sidebar: {
        format: "rectangle",
        slot: "3456789012", // Replace with actual slot ID
        size: [
          [300, 250],
          [336, 280],
        ],
      },

      // Mobile banner ads
      mobile: {
        format: "rectangle",
        slot: "4567890123", // Replace with actual slot ID
        size: [320, 100],
      },
    },
  };

  // Enhanced AdSense initialization
  function initializeGoogleAds() {
    // Check if AdSense script is loaded
    if (typeof adsbygoogle === "undefined") {
      console.warn("Google AdSense script not loaded");
      return;
    }

    // Add conversion tracking if enabled
    if (GoogleAdsConfig.conversionId) {
      gtag("config", GoogleAdsConfig.conversionId);
    }

    // Initialize ads with error handling
    try {
      (adsbygoogle = window.adsbygoogle || []).push({
        google_ad_client: GoogleAdsConfig.pubId,
        enable_page_level_ads: true,
        overlays: { bottom: true },
      });
    } catch (error) {
      console.error("Error initializing Google Ads:", error);
    }
  }

  // Create responsive ad units dynamically
  function createAdUnit(containerId, adType = "content") {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Ad container ${containerId} not found`);
      return;
    }

    const config = GoogleAdsConfig.adUnits[adType];
    if (!config) {
      console.warn(`Ad configuration for ${adType} not found`);
      return;
    }

    // Create ad element
    const adElement = document.createElement("ins");
    adElement.className = "adsbygoogle";
    adElement.style.display = "block";
    adElement.setAttribute("data-ad-client", GoogleAdsConfig.pubId);
    adElement.setAttribute("data-ad-slot", config.slot);

    if (config.format) {
      adElement.setAttribute("data-ad-format", config.format);
    }

    if (config.layout) {
      adElement.setAttribute("data-ad-layout", config.layout);
    }

    if (config.size && Array.isArray(config.size)) {
      if (config.size.length === 2 && typeof config.size[0] === "number") {
        // Single size format [width, height]
        adElement.style.width = config.size[0] + "px";
        adElement.style.height = config.size[1] + "px";
      } else {
        // Multiple sizes format [[width1, height1], [width2, height2]]
        adElement.setAttribute("data-ad-format", "rectangle");
      }
    }

    // Add responsive behavior
    if (config.responsive) {
      adElement.setAttribute("data-full-width-responsive", "true");
    }

    // Insert ad into container
    container.appendChild(adElement);

    // Push to AdSense queue
    try {
      (adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("Error pushing ad to queue:", error);
    }
  }

  // Auto-insert ads in blog content
  function autoInsertBlogAds() {
    const article = document.querySelector(
      "article, .blog-content, .article-body"
    );
    if (!article) return;

    const paragraphs = article.querySelectorAll("p");
    const totalParagraphs = paragraphs.length;

    if (totalParagraphs < 4) return; // Don't add ads to very short content

    // Insert ad after approximately 30% of content
    const firstAdPosition = Math.floor(totalParagraphs * 0.3);
    if (paragraphs[firstAdPosition]) {
      const adContainer = document.createElement("div");
      adContainer.className = "ad-container auto-inserted";
      adContainer.id = "auto-ad-1";
      adContainer.style.cssText =
        "margin: 2rem 0; text-align: center; padding: 1rem;";

      paragraphs[firstAdPosition].parentNode.insertBefore(
        adContainer,
        paragraphs[firstAdPosition].nextSibling
      );

      // Add label for transparency
      const label = document.createElement("div");
      label.textContent = "Advertisement";
      label.style.cssText =
        "font-size: 0.8rem; color: #666; margin-bottom: 0.5rem; text-transform: uppercase;";
      adContainer.appendChild(label);

      createAdUnit("auto-ad-1", "article");
    }

    // Insert ad after approximately 70% of content if long enough
    if (totalParagraphs > 8) {
      const secondAdPosition = Math.floor(totalParagraphs * 0.7);
      if (paragraphs[secondAdPosition]) {
        const adContainer = document.createElement("div");
        adContainer.className = "ad-container auto-inserted";
        adContainer.id = "auto-ad-2";
        adContainer.style.cssText =
          "margin: 2rem 0; text-align: center; padding: 1rem;";

        paragraphs[secondAdPosition].parentNode.insertBefore(
          adContainer,
          paragraphs[secondAdPosition].nextSibling
        );

        const label = document.createElement("div");
        label.textContent = "Advertisement";
        label.style.cssText =
          "font-size: 0.8rem; color: #666; margin-bottom: 0.5rem; text-transform: uppercase;";
        adContainer.appendChild(label);

        createAdUnit("auto-ad-2", "article");
      }
    }
  }

  // Track ad performance
  function trackAdPerformance() {
    // Track ad viewability
    const adContainers = document.querySelectorAll(".adsbygoogle");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Track ad impression
            if (typeof gtag !== "undefined") {
              gtag("event", "ad_impression", {
                custom_parameter: "adsense_view",
              });
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    adContainers.forEach((ad) => {
      if (ad.getAttribute("data-ad-slot")) {
        observer.observe(ad);
      }
    });
  }

  // Privacy compliance for ads
  function handlePrivacyCompliance() {
    // Check for consent management
    const hasConsent = localStorage.getItem("ads_consent") === "true";

    if (!hasConsent) {
      // Show privacy notice for first-time visitors
      const notice = document.createElement("div");
      notice.id = "privacy-notice";
      notice.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--bg-card);
        border-top: 2px solid var(--accent-primary);
        padding: 1rem;
        text-align: center;
        z-index: 10000;
        font-size: 0.9rem;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
      `;

      notice.innerHTML = `
        <p style="margin: 0 0 1rem 0; color: var(--text-primary);">
          We use cookies and ads to provide the best experience and support our free content.
          <a href="/privacy.html" style="color: var(--accent-primary);">Learn more about our privacy policy</a>
        </p>
        <button onclick="acceptPrivacy()" style="background: var(--accent-primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">Accept</button>
        <button onclick="declinePrivacy()" style="background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Decline</button>
      `;

      document.body.appendChild(notice);

      // Add global functions for privacy actions
      window.acceptPrivacy = function () {
        localStorage.setItem("ads_consent", "true");
        document.getElementById("privacy-notice").remove();
        // Reinitialize ads with consent
        initializeGoogleAds();
      };

      window.declinePrivacy = function () {
        localStorage.setItem("ads_consent", "false");
        document.getElementById("privacy-notice").remove();
        // Disable personalized ads
        if (typeof gtag !== "undefined") {
          gtag("consent", "update", {
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
          });
        }
      };
    }
  }

  // Mobile-specific ad optimizations
  function optimizeForMobile() {
    if (window.innerWidth <= 768) {
      // Hide sidebar ads on mobile
      const sidebarAds = document.querySelectorAll(".sidebar-ad");
      sidebarAds.forEach((ad) => {
        ad.style.display = "none";
      });

      // Ensure mobile ads are properly sized
      const mobileAds = document.querySelectorAll(".mobile-ad");
      mobileAds.forEach((ad) => {
        ad.style.maxWidth = "100%";
        ad.style.overflow = "hidden";
      });
    }
  }

  // Initialize everything when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    // Initialize Google Ads
    initializeGoogleAds();

    // Handle privacy compliance
    handlePrivacyCompliance();

    // Auto-insert ads in blog content
    autoInsertBlogAds();

    // Optimize for mobile
    optimizeForMobile();

    // Track ad performance
    setTimeout(trackAdPerformance, 2000);

    // Handle window resize for responsive ads
    window.addEventListener("resize", optimizeForMobile);
  });

  // Export functions for manual use
  window.GoogleAdsEnhanced = {
    createAdUnit,
    autoInsertBlogAds,
    trackAdPerformance,
    config: GoogleAdsConfig,
  };
})();
