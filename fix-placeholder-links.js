#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Define files to fix and their specific share URLs
const filesToFix = {
  "blog.html": {
    baseUrl: "https://ioinnovationfund.com/",
    shareTitle: "IO Innovation Fund Blog",
  },
  "blog/blog1.html": {
    baseUrl: "https://ioinnovationfund.com/blog/blog1.html",
    shareTitle:
      "A Beginner's Guide to Key Stock Market Indices in Southeast Asia",
  },
  "blog/blog2.html": {
    baseUrl: "https://ioinnovationfund.com/blog/blog2.html",
    shareTitle: "Understanding ASEAN Economic Trends",
  },
  "blog/blog3.html": {
    baseUrl: "https://ioinnovationfund.com/blog/blog3.html",
    shareTitle: "Southeast Asia Investment Analysis",
  },
  "blog/blog4.html": {
    baseUrl: "https://ioinnovationfund.com/blog/blog4.html",
    shareTitle: "Market Insights and Analysis",
  },
  "blog/blog5.html": {
    baseUrl: "https://ioinnovationfund.com/blog/blog5.html",
    shareTitle: "Investment Strategies for Southeast Asia",
  },
  "blog/blog6.html": {
    baseUrl: "https://ioinnovationfund.com/blog/blog6.html",
    shareTitle: "Financial Market Analysis",
  },
  "blog/blog7.html": {
    baseUrl: "https://ioinnovationfund.com/blog/blog7.html",
    shareTitle: "Southeast Asian Market Trends",
  },
  "markets.html": {
    baseUrl: "https://ioinnovationfund.com/markets.html",
    shareTitle: "Trading Signals and Market Analysis",
  },
};

function createShareUrl(platform, url, title) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "email":
      return `mailto:?subject=${encodedTitle}&body=Check%20out%20this%20article:%20${encodedUrl}`;
    default:
      return "#";
  }
}

function fixPlaceholderLinks(filePath, fileInfo) {
  try {
    let content = fs.readFileSync(filePath, "utf8");

    // Fix share buttons in share-buttons divs
    const shareButtonPatterns = [
      {
        search:
          /<a href="#" class="share-button"[^>]*title="Share on Twitter"[^>]*><i class="fab fa-twitter"><\/i><\/a>/g,
        replace: `<a href="${createShareUrl(
          "twitter",
          fileInfo.baseUrl,
          fileInfo.shareTitle
        )}" class="share-button" title="Share on Twitter" target="_blank" rel="noopener"><i class="fab fa-twitter"></i></a>`,
      },
      {
        search:
          /<a href="#" class="share-button"[^>]*title="Share on LinkedIn"[^>]*><i class="fab fa-linkedin-in"><\/i><\/a>/g,
        replace: `<a href="${createShareUrl(
          "linkedin",
          fileInfo.baseUrl,
          fileInfo.shareTitle
        )}" class="share-button" title="Share on LinkedIn" target="_blank" rel="noopener"><i class="fab fa-linkedin-in"></i></a>`,
      },
      {
        search:
          /<a href="#" class="share-button"[^>]*><i class="fab fa-twitter"><\/i><\/a>/g,
        replace: `<a href="${createShareUrl(
          "twitter",
          fileInfo.baseUrl,
          fileInfo.shareTitle
        )}" class="share-button" target="_blank" rel="noopener"><i class="fab fa-twitter"></i></a>`,
      },
      {
        search:
          /<a href="#" class="share-button"[^>]*><i class="fab fa-linkedin-in"><\/i><\/a>/g,
        replace: `<a href="${createShareUrl(
          "linkedin",
          fileInfo.baseUrl,
          fileInfo.shareTitle
        )}" class="share-button" target="_blank" rel="noopener"><i class="fab fa-linkedin-in"></i></a>`,
      },
      {
        search:
          /<a href="#" class="share-button"[^>]*><i class="fab fa-facebook-f"><\/i><\/a>/g,
        replace: `<a href="${createShareUrl(
          "facebook",
          fileInfo.baseUrl,
          fileInfo.shareTitle
        )}" class="share-button" target="_blank" rel="noopener"><i class="fab fa-facebook-f"></i></a>`,
      },
      {
        search:
          /<a href="#" class="share-button"[^>]*><i class="fas fa-link"><\/i><\/a>/g,
        replace: `<a href="${createShareUrl(
          "email",
          fileInfo.baseUrl,
          fileInfo.shareTitle
        )}" class="share-button"><i class="fas fa-envelope"></i></a>`,
      },
    ];

    // Apply all patterns
    shareButtonPatterns.forEach((pattern) => {
      content = content.replace(pattern.search, pattern.replace);
    });

    // Fix footer links in blog pages
    if (filePath.includes("blog/")) {
      content = content.replace(
        /<li><a href="#">([^<]+)<\/a><\/li>/g,
        '<li><a href="/contact.html">$1</a></li>'
      );

      // Fix specific navigation links
      content = content.replace(
        /href="#"([^>]*>Market Analysis)/g,
        'href="/markets.html"$1'
      );
      content = content.replace(
        /href="#"([^>]*>Investment Tools)/g,
        'href="/tools.html"$1'
      );
      content = content.replace(
        /href="#"([^>]*>Educational Content)/g,
        'href="/blog.html"$1'
      );
      content = content.replace(
        /href="#"([^>]*>Research Reports)/g,
        'href="/about.html"$1'
      );
      content = content.replace(
        /href="#"([^>]*>About Us)/g,
        'href="/about.html"$1'
      );
      content = content.replace(
        /href="#"([^>]*>Our Team)/g,
        'href="/about.html"$1'
      );
      content = content.replace(
        /href="#"([^>]*>Careers)/g,
        'href="/contact.html"$1'
      );
      content = content.replace(
        /href="#"([^>]*>Contact)/g,
        'href="/contact.html"$1'
      );
      content = content.replace(
        /href="#"([^>]*>Privacy Policy)/g,
        'href="/privacy.html"$1'
      );
      content = content.replace(
        /href="#"([^>]*>Terms of Service)/g,
        'href="/terms.html"$1'
      );
    }

    // Fix markets.html specific buttons
    if (filePath.includes("markets.html")) {
      content = content.replace(
        /<a href="#" style="[^"]*background: var\(--accent-primary\)[^"]*">/g,
        '<a href="/contact.html" style="display: inline-block; background: var(--accent-primary); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600;">'
      );
      content = content.replace(
        /<a href="#" style="[^"]*background: transparent[^"]*">/g,
        '<a href="/tools.html" style="display: inline-block; background: transparent; color: var(--accent-primary); padding: 0.8rem 1.5rem; border: 2px solid var(--accent-primary); border-radius: 8px; text-decoration: none; font-weight: 600;">'
      );
    }

    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Fixed placeholder links in ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Process all files
Object.entries(filesToFix).forEach(([fileName, fileInfo]) => {
  const filePath = path.join(__dirname, fileName);
  if (fs.existsSync(filePath)) {
    fixPlaceholderLinks(filePath, fileInfo);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log("\n🎉 Placeholder link fixing complete!");
