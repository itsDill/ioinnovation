// SEO Enhancement Script for IO Innovation Fund
// Implements advanced SEO features for better search engine optimization

(function () {
  "use strict";

  // 1. Automatic Table of Contents Generation for Long Articles
  function generateTableOfContents() {
    const headings = document.querySelectorAll("article h2, article h3");
    if (headings.length < 3) return; // Only generate TOC for articles with multiple headings

    const toc = document.createElement("div");
    toc.className = "table-of-contents";
    toc.innerHTML = "<h3>Table of Contents</h3><ul></ul>";

    const tocList = toc.querySelector("ul");

    headings.forEach((heading, index) => {
      // Create anchor IDs for better linking
      const id = heading.textContent
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, "-");
      heading.id = id;

      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${id}`;
      a.textContent = heading.textContent;
      a.className = heading.tagName.toLowerCase();
      li.appendChild(a);
      tocList.appendChild(li);
    });

    // Insert TOC after first paragraph
    const firstParagraph = document.querySelector("article p");
    if (firstParagraph) {
      firstParagraph.parentNode.insertBefore(toc, firstParagraph.nextSibling);
    }
  }

  // 2. Automatic Image Alt Text Enhancement
  function enhanceImageAltText() {
    const images = document.querySelectorAll("img:not([alt])");
    images.forEach((img) => {
      // Generate alt text based on filename or context
      const filename = img.src.split("/").pop().split(".")[0];
      const contextualText =
        img.closest("figure")?.querySelector("figcaption")?.textContent ||
        img.parentElement.textContent.substring(0, 100);

      img.alt =
        contextualText ||
        filename.replace(/[-_]/g, " ") ||
        "Image related to Southeast Asia investment";
    });
  }

  // 3. Reading Time Estimation for Content
  function addReadingTime() {
    const article = document.querySelector("article .article-body");
    if (!article) return;

    const wordCount = article.textContent.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/minute

    const readingTimeElement = document.createElement("div");
    readingTimeElement.className = "reading-time";
    readingTimeElement.innerHTML = `<i class="fas fa-clock"></i> ${readingTime} min read`;

    const existingMeta = document.querySelector(".article-meta");
    if (existingMeta && !existingMeta.querySelector(".reading-time")) {
      existingMeta.appendChild(readingTimeElement);
    }
  }

  // 4. Automatic Schema.org Breadcrumbs
  function enhanceBreadcrumbs() {
    const breadcrumbs = document.querySelector(".breadcrumbs");
    if (!breadcrumbs) return;

    const links = breadcrumbs.querySelectorAll("a");
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [],
    };

    links.forEach((link, index) => {
      breadcrumbData.itemListElement.push({
        "@type": "ListItem",
        position: index + 1,
        name: link.textContent.trim(),
        item: link.href,
      });
    });

    // Add current page
    const currentPageText = breadcrumbs.textContent.split(">").pop().trim();
    breadcrumbData.itemListElement.push({
      "@type": "ListItem",
      position: links.length + 1,
      name: currentPageText,
      item: window.location.href,
    });

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(breadcrumbData);
    document.head.appendChild(script);
  }

  // 5. Social Media Meta Tag Validation and Enhancement
  function validateSocialMeta() {
    const requiredOgTags = ["og:title", "og:description", "og:image", "og:url"];
    const requiredTwitterTags = [
      "twitter:card",
      "twitter:title",
      "twitter:description",
    ];

    const missingTags = [];

    requiredOgTags.forEach((tag) => {
      if (!document.querySelector(`meta[property="${tag}"]`)) {
        missingTags.push(tag);
      }
    });

    requiredTwitterTags.forEach((tag) => {
      if (!document.querySelector(`meta[name="${tag}"]`)) {
        missingTags.push(tag);
      }
    });

    if (missingTags.length > 0 && window.location.hostname === "localhost") {
      console.warn("Missing social media meta tags:", missingTags);
    }
  }

  // 6. Automatic Internal Linking Suggestions
  function enhanceInternalLinking() {
    const contentArea = document.querySelector("article, .blog-content");
    if (!contentArea) return;

    const linkOpportunities = {
      "SET Index": "/set-index-thailand.html",
      "Thailand stock market": "/set-index-thailand.html",
      "Singapore STI": "/markets.html",
      "Malaysia KLCI": "/markets.html",
      "investment tools": "/tools.html",
      "trading signals": "/markets.html",
      "Southeast Asia investment": "/about.html",
      "ASEAN markets": "/markets.html",
      "portfolio management": "/tools.html",
    };

    Object.entries(linkOpportunities).forEach(([keyword, url]) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const walker = document.createTreeWalker(
        contentArea,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        if (
          node.parentElement.tagName !== "A" &&
          regex.test(node.textContent)
        ) {
          textNodes.push(node);
        }
      }

      // Link first occurrence only to avoid over-optimization
      if (textNodes.length > 0) {
        const firstNode = textNodes[0];
        const newHtml = firstNode.textContent.replace(regex, (match) => {
          return `<a href="${url}" class="internal-link">${match}</a>`;
        });

        if (newHtml !== firstNode.textContent) {
          const span = document.createElement("span");
          span.innerHTML = newHtml;
          firstNode.parentNode.replaceChild(span, firstNode);
        }
      }
    });
  }

  // 7. Performance Monitoring for SEO
  function monitorPagePerformance() {
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const perfData = performance.timing;
          const loadTime = perfData.loadEventEnd - perfData.navigationStart;

          if (loadTime > 3000) {
            // If page load time > 3 seconds
            console.warn(
              `Page load time: ${loadTime}ms - Consider optimization for better SEO`
            );
          }

          // Check for render-blocking resources
          const resources = performance.getEntriesByType("resource");
          const renderBlockingCSS = resources.filter(
            (r) =>
              r.name.includes(".css") && r.renderBlockingStatus === "blocking"
          );

          if (renderBlockingCSS.length > 3) {
            console.warn(
              "Multiple render-blocking CSS files detected - consider optimization"
            );
          }
        }, 1000);
      });
    }
  }

  // 8. Automatic Meta Description Generation for Missing Pages
  function generateMissingMetaDescription() {
    const existingDescription = document.querySelector(
      'meta[name="description"]'
    );
    if (existingDescription && existingDescription.content.trim()) return;

    const h1 = document.querySelector("h1");
    const firstParagraph = document.querySelector("p");

    if (h1 && firstParagraph) {
      let description = firstParagraph.textContent.trim().substring(0, 155);
      if (description.length === 155) {
        description =
          description.substring(0, description.lastIndexOf(" ")) + "...";
      }

      const metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      metaDesc.content = description;
      document.head.appendChild(metaDesc);

      console.log("Auto-generated meta description:", description);
    }
  }

  // Initialize all SEO enhancements when DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    generateTableOfContents();
    enhanceImageAltText();
    addReadingTime();
    enhanceBreadcrumbs();
    validateSocialMeta();
    enhanceInternalLinking();
    monitorPagePerformance();
    generateMissingMetaDescription();
  });

  // Export functions for manual use if needed
  window.SEOEnhancements = {
    generateTableOfContents,
    enhanceImageAltText,
    addReadingTime,
    enhanceBreadcrumbs,
    validateSocialMeta,
    enhanceInternalLinking,
  };
})();
