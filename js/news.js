// News Page JavaScript

(function () {
  "use strict";

  // State
  let newsData = null;
  let activeCategory = "all";
  let searchQuery = "";

  // DOM Elements
  const categoryFilters = document.getElementById("categoryFilters");
  const trendingGrid = document.getElementById("trendingGrid");
  const newsGrid = document.getElementById("newsGrid");
  const newsCount = document.getElementById("newsCount");
  const emptyState = document.getElementById("emptyState");
  const lastUpdated = document.getElementById("lastUpdated");
  const newsSearch = document.getElementById("newsSearch");
  const categorySections = document.getElementById("categorySections");
  const trendingSection = document.getElementById("trendingSection");

  // Initialize
  async function init() {
    try {
      await loadNewsData();
      renderCategoryFilters();
      renderTrendingArticles();
      renderNewsGrid();
      renderCategorySections();
      setupEventListeners();
    } catch (error) {
      console.error("Error initializing news page:", error);
      showError();
    }
  }

  // Load news data
  async function loadNewsData() {
    const response = await fetch("/data/news.json");
    if (!response.ok) throw new Error("Failed to load news data");
    newsData = await response.json();

    // Update last updated time
    if (lastUpdated && newsData.lastUpdated) {
      const date = new Date(newsData.lastUpdated);
      lastUpdated.querySelector("span").textContent =
        `Last updated: ${formatRelativeTime(date)}`;
    }
  }

  // Format relative time
  function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Format article time
  function formatArticleTime(dateStr) {
    const date = new Date(dateStr);
    return formatRelativeTime(date);
  }

  // Render category filters
  function renderCategoryFilters() {
    if (!categoryFilters || !newsData) return;

    const categories = newsData.categories;
    const html = categories
      .map(
        (cat) => `
      <button class="category-chip" data-category="${cat.id}">
        <i class="fas ${cat.icon}"></i>
        ${cat.name}
      </button>
    `,
      )
      .join("");

    // Get the "All News" button and append categories after it
    const allButton = categoryFilters.querySelector('[data-category="all"]');
    if (allButton) {
      allButton.insertAdjacentHTML("afterend", html);
    }
  }

  // Get category by ID
  function getCategoryById(id) {
    return newsData?.categories.find((c) => c.id === id) || null;
  }

  // Render trending articles
  function renderTrendingArticles() {
    if (!trendingGrid || !newsData) return;

    const trending = newsData.articles.filter((a) => a.trending);

    if (trending.length === 0) {
      trendingSection.style.display = "none";
      return;
    }

    const html = trending
      .map((article) => {
        const category = getCategoryById(article.category);
        return `
        <article class="trending-card">
          <div class="trending-card-image" style="background: linear-gradient(135deg, ${category?.color || "var(--accent-primary)"}, ${adjustColor(category?.color || "#3b82f6", -20)})">
            <i class="fas ${category?.icon || "fa-newspaper"}"></i>
          </div>
          <div class="trending-card-content">
            <span class="trending-badge">
              <i class="fas fa-fire"></i> Trending
            </span>
            <span class="trending-card-category">
              <i class="fas ${category?.icon || "fa-tag"}"></i>
              ${category?.name || "General"}
            </span>
            <h3 class="trending-card-title">
              <a href="${article.sourceUrl}" target="_blank" rel="noopener">${article.title}</a>
            </h3>
            <div class="trending-card-meta">
              <span class="trending-card-source">${article.source}</span>
              <span>${formatArticleTime(article.publishedAt)}</span>
            </div>
          </div>
        </article>
      `;
      })
      .join("");

    trendingGrid.innerHTML = html;
  }

  // Render news grid
  function renderNewsGrid() {
    if (!newsGrid || !newsData) return;

    let articles = filterArticles();

    if (articles.length === 0) {
      newsGrid.innerHTML = "";
      emptyState.style.display = "block";
      newsCount.textContent = "0 articles";
      return;
    }

    emptyState.style.display = "none";
    newsCount.textContent = `${articles.length} article${articles.length !== 1 ? "s" : ""}`;

    const html = articles
      .map((article) => {
        const category = getCategoryById(article.category);
        return `
        <article class="news-card" data-category="${article.category}">
          <div class="news-card-image" style="background: linear-gradient(135deg, ${category?.color || "var(--bg-secondary)"}22, ${category?.color || "var(--bg-secondary)"}44)">
            <i class="fas ${category?.icon || "fa-newspaper"}"></i>
            <span class="news-card-category-badge" style="color: ${category?.color || "var(--text-primary)"}">
              <i class="fas ${category?.icon || "fa-tag"}"></i>
              ${category?.name || "General"}
            </span>
          </div>
          <div class="news-card-content">
            <h3 class="news-card-title">
              <a href="${article.sourceUrl}" target="_blank" rel="noopener">${article.title}</a>
            </h3>
            <p class="news-card-summary">${article.summary}</p>
            <div class="news-card-footer">
              <span class="news-card-source">
                <a href="${article.sourceUrl}" target="_blank" rel="noopener">${article.source}</a>
              </span>
              <span>${formatArticleTime(article.publishedAt)}</span>
            </div>
          </div>
        </article>
      `;
      })
      .join("");

    newsGrid.innerHTML = html;
  }

  // Filter articles
  function filterArticles() {
    if (!newsData) return [];

    return newsData.articles.filter((article) => {
      // Category filter
      if (activeCategory !== "all" && article.category !== activeCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = article.title.toLowerCase().includes(query);
        const matchSummary = article.summary.toLowerCase().includes(query);
        const matchSource = article.source.toLowerCase().includes(query);
        if (!matchTitle && !matchSummary && !matchSource) {
          return false;
        }
      }

      return true;
    });
  }

  // Render category sections
  function renderCategorySections() {
    if (!categorySections || !newsData) return;

    // Only show category sections when viewing "all"
    if (activeCategory !== "all") {
      categorySections.style.display = "none";
      return;
    }

    categorySections.style.display = "block";

    const html = newsData.categories
      .map((category) => {
        const categoryArticles = newsData.articles.filter(
          (a) => a.category === category.id,
        );

        if (categoryArticles.length === 0) return "";

        const articlesHtml = categoryArticles
          .slice(0, 4)
          .map(
            (article) => `
        <article class="category-article">
          <div class="category-article-icon" style="background: ${category.color}22">
            <i class="fas ${category.icon}" style="color: ${category.color}"></i>
          </div>
          <div class="category-article-content">
            <h4 class="category-article-title">
              <a href="${article.sourceUrl}" target="_blank" rel="noopener">${article.title}</a>
            </h4>
            <div class="category-article-meta">
              ${article.source} • ${formatArticleTime(article.publishedAt)}
            </div>
          </div>
        </article>
      `,
          )
          .join("");

        return `
        <section class="category-section">
          <div class="category-section-header">
            <h3 class="category-section-title">
              <i class="fas ${category.icon}" style="background: ${category.color}"></i>
              ${category.name}
            </h3>
            <span class="category-section-count">${categoryArticles.length} article${categoryArticles.length !== 1 ? "s" : ""}</span>
          </div>
          <div class="category-articles">
            ${articlesHtml}
          </div>
        </section>
      `;
      })
      .join("");

    categorySections.innerHTML = html;
  }

  // Setup event listeners
  function setupEventListeners() {
    // Category filter clicks
    if (categoryFilters) {
      categoryFilters.addEventListener("click", (e) => {
        const chip = e.target.closest(".category-chip");
        if (!chip) return;

        // Update active state
        categoryFilters
          .querySelectorAll(".category-chip")
          .forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");

        // Update filter
        activeCategory = chip.dataset.category;
        renderNewsGrid();
        renderCategorySections();

        // Show/hide trending based on category
        if (trendingSection) {
          trendingSection.style.display =
            activeCategory === "all" ? "block" : "none";
        }
      });
    }

    // Search input
    if (newsSearch) {
      let debounceTimeout;
      newsSearch.addEventListener("input", (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          searchQuery = e.target.value.trim();
          renderNewsGrid();
        }, 300);
      });
    }

    // Newsletter form
    const newsletterForm = document.getElementById("newsletterForm");
    if (newsletterForm) {
      newsletterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;
        alert(`Thank you! We'll notify ${email} when we have news updates.`);
        newsletterForm.reset();
      });
    }
  }

  // Adjust color brightness
  function adjustColor(hex, percent) {
    if (!hex) return "#6366f1";
    hex = hex.replace("#", "");
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  // Show error state
  function showError() {
    if (newsGrid) {
      newsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; color: #ef4444;"></i>
          <p>Unable to load news. Please try again later.</p>
        </div>
      `;
    }
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
