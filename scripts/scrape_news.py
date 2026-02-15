#!/usr/bin/env python3
"""
Financial News Scraper for IO Innovate
Scrapes news from multiple financial sources via RSS feeds and APIs.

Usage:
    python scrape_news.py
    python scrape_news.py --output ../data/news.json
    python scrape_news.py --categories politics,markets

Requirements:
    pip install feedparser requests beautifulsoup4 python-dateutil

Sources:
    - Reuters (Business, Markets, Politics)
    - Bloomberg (via RSS)
    - CNBC
    - Yahoo Finance
    - Financial Times
    - MarketWatch
    - Seeking Alpha
    - CoinDesk (Crypto)
"""

import json
import re
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import argparse

try:
    import feedparser
except ImportError:
    print("Please install feedparser: pip install feedparser")
    exit(1)

try:
    import requests
except ImportError:
    print("Please install requests: pip install requests")
    exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Please install beautifulsoup4: pip install beautifulsoup4")
    exit(1)

try:
    from dateutil import parser as date_parser
except ImportError:
    print("Please install python-dateutil: pip install python-dateutil")
    exit(1)


# Category definitions with keywords for classification
CATEGORIES = {
    "politics": {
        "name": "Politics & Policy",
        "icon": "fa-landmark",
        "color": "#8b5cf6",
        "keywords": [
            "congress", "senate", "house", "legislation", "bill", "law",
            "federal", "government", "policy", "regulation", "sec", "ftc",
            "treasury", "white house", "president", "election", "vote",
            "democrat", "republican", "bipartisan", "tax", "tariff"
        ]
    },
    "markets": {
        "name": "Markets & Trading",
        "icon": "fa-chart-line",
        "color": "#3b82f6",
        "keywords": [
            "stock", "market", "s&p", "dow", "nasdaq", "trading", "investor",
            "wall street", "rally", "sell-off", "bull", "bear", "volatility",
            "equity", "shares", "ipo", "spac", "merger", "acquisition"
        ]
    },
    "industrials": {
        "name": "Industrials",
        "icon": "fa-industry",
        "color": "#f59e0b",
        "keywords": [
            "manufacturing", "factory", "industrial", "aerospace", "defense",
            "construction", "infrastructure", "transportation", "logistics",
            "automotive", "ev", "electric vehicle", "boeing", "caterpillar",
            "3m", "honeywell", "ge", "general electric"
        ]
    },
    "commodities": {
        "name": "Commodities",
        "icon": "fa-gem",
        "color": "#10b981",
        "keywords": [
            "oil", "gold", "silver", "copper", "crude", "brent", "wti",
            "commodity", "precious metal", "natural gas", "wheat", "corn",
            "agriculture", "mining", "opec", "futures"
        ]
    },
    "dividends": {
        "name": "Dividends & Income",
        "icon": "fa-coins",
        "color": "#ec4899",
        "keywords": [
            "dividend", "yield", "payout", "income", "reit", "aristocrat",
            "quarterly", "ex-dividend", "dividend growth", "passive income",
            "distribution"
        ]
    },
    "crypto": {
        "name": "Crypto & Digital",
        "icon": "fa-bitcoin-sign",
        "color": "#f97316",
        "keywords": [
            "bitcoin", "ethereum", "crypto", "blockchain", "defi", "nft",
            "altcoin", "binance", "coinbase", "wallet", "mining", "btc",
            "eth", "stablecoin", "web3"
        ]
    },
    "economy": {
        "name": "Economy",
        "icon": "fa-globe",
        "color": "#06b6d4",
        "keywords": [
            "gdp", "inflation", "unemployment", "jobs", "employment", "fed",
            "federal reserve", "interest rate", "cpi", "pce", "recession",
            "growth", "economic", "consumer", "spending", "retail sales"
        ]
    },
    "tech": {
        "name": "Technology",
        "icon": "fa-microchip",
        "color": "#6366f1",
        "keywords": [
            "tech", "technology", "ai", "artificial intelligence", "cloud",
            "software", "apple", "google", "microsoft", "amazon", "meta",
            "nvidia", "semiconductor", "chip", "data center", "saas"
        ]
    }
}

# RSS Feed sources
RSS_FEEDS = {
    "cnbc_top": {
        "url": "https://www.cnbc.com/id/100003114/device/rss/rss.html",
        "source": "CNBC",
        "source_url": "https://cnbc.com"
    },
    "cnbc_investing": {
        "url": "https://www.cnbc.com/id/15839069/device/rss/rss.html",
        "source": "CNBC",
        "source_url": "https://cnbc.com"
    },
    "cnbc_economy": {
        "url": "https://www.cnbc.com/id/20910258/device/rss/rss.html",
        "source": "CNBC",
        "source_url": "https://cnbc.com"
    },
    "marketwatch": {
        "url": "https://feeds.marketwatch.com/marketwatch/topstories/",
        "source": "MarketWatch",
        "source_url": "https://marketwatch.com"
    },
    "marketwatch_markets": {
        "url": "https://feeds.marketwatch.com/marketwatch/marketpulse/",
        "source": "MarketWatch",
        "source_url": "https://marketwatch.com"
    },
    "yahoo_finance": {
        "url": "https://finance.yahoo.com/news/rssindex",
        "source": "Yahoo Finance",
        "source_url": "https://finance.yahoo.com"
    },
    "seeking_alpha": {
        "url": "https://seekingalpha.com/market_currents.xml",
        "source": "Seeking Alpha",
        "source_url": "https://seekingalpha.com"
    },
    "seeking_alpha_dividends": {
        "url": "https://seekingalpha.com/tag/dividend-investing.xml",
        "source": "Seeking Alpha",
        "source_url": "https://seekingalpha.com"
    },
    "coindesk": {
        "url": "https://www.coindesk.com/arc/outboundfeeds/rss/",
        "source": "CoinDesk",
        "source_url": "https://coindesk.com"
    },
    "ft_markets": {
        "url": "https://www.ft.com/markets?format=rss",
        "source": "Financial Times",
        "source_url": "https://ft.com"
    },
    "wsj_markets": {
        "url": "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
        "source": "Wall Street Journal",
        "source_url": "https://wsj.com"
    },
    "wsj_business": {
        "url": "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml",
        "source": "Wall Street Journal",
        "source_url": "https://wsj.com"
    },
    "bloomberg": {
        "url": "https://feeds.bloomberg.com/markets/news.rss",
        "source": "Bloomberg",
        "source_url": "https://bloomberg.com"
    },
    "investing_commodities": {
        "url": "https://www.investing.com/rss/news_14.rss",
        "source": "Investing.com",
        "source_url": "https://investing.com"
    },
    "nasdaq_dividends": {
        "url": "https://www.nasdaq.com/feed/rssoutbound?category=Dividends",
        "source": "Nasdaq",
        "source_url": "https://nasdaq.com"
    }
}

# User agent for requests
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"


def generate_article_id(title: str, source: str) -> str:
    """Generate a unique ID for an article."""
    content = f"{title}:{source}"
    return hashlib.md5(content.encode()).hexdigest()[:12]


def classify_article(title: str, summary: str) -> str:
    """Classify an article into a category based on keywords."""
    text = f"{title} {summary}".lower()
    
    scores = {}
    for cat_id, cat_info in CATEGORIES.items():
        score = sum(1 for kw in cat_info["keywords"] if kw in text)
        if score > 0:
            scores[cat_id] = score
    
    if scores:
        return max(scores, key=scores.get)
    
    # Default to markets if no match
    return "markets"


def is_trending(title: str) -> bool:
    """Determine if an article should be marked as trending."""
    trending_keywords = [
        "breaking", "just in", "alert", "flash", "surge", "plunge",
        "record", "all-time", "crash", "soar", "tumble"
    ]
    title_lower = title.lower()
    return any(kw in title_lower for kw in trending_keywords)


def clean_html(html: str) -> str:
    """Remove HTML tags and clean up text."""
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    return text[:500]  # Limit summary length


def parse_date(date_str: str) -> Optional[datetime]:
    """Parse various date formats to datetime."""
    if not date_str:
        return None
    try:
        return date_parser.parse(date_str)
    except:
        return None


def fetch_rss_feed(feed_config: dict) -> list:
    """Fetch and parse an RSS feed."""
    articles = []
    
    try:
        headers = {"User-Agent": USER_AGENT}
        response = requests.get(feed_config["url"], headers=headers, timeout=10)
        response.raise_for_status()
        
        feed = feedparser.parse(response.content)
        
        for entry in feed.entries[:15]:  # Limit to 15 per feed
            title = entry.get("title", "").strip()
            if not title:
                continue
            
            # Get summary/description
            summary = entry.get("summary", "") or entry.get("description", "")
            summary = clean_html(summary)
            
            # Get link
            link = entry.get("link", feed_config["source_url"])
            
            # Parse date
            date_str = entry.get("published") or entry.get("updated")
            pub_date = parse_date(date_str)
            if not pub_date:
                pub_date = datetime.now(timezone.utc)
            
            # Classify
            category = classify_article(title, summary)
            
            article = {
                "id": generate_article_id(title, feed_config["source"]),
                "title": title,
                "summary": summary if summary else f"Read more at {feed_config['source']}",
                "category": category,
                "source": feed_config["source"],
                "sourceUrl": link,
                "publishedAt": pub_date.isoformat(),
                "trending": is_trending(title)
            }
            articles.append(article)
            
    except Exception as e:
        print(f"Error fetching {feed_config['source']}: {e}")
    
    return articles


def scrape_all_feeds(category_filter: Optional[list] = None) -> list:
    """Scrape all configured RSS feeds."""
    all_articles = []
    
    for feed_name, feed_config in RSS_FEEDS.items():
        print(f"Fetching {feed_config['source']} ({feed_name})...")
        articles = fetch_rss_feed(feed_config)
        all_articles.extend(articles)
        print(f"  Found {len(articles)} articles")
    
    # Remove duplicates based on title similarity
    seen_titles = set()
    unique_articles = []
    for article in all_articles:
        # Normalize title for comparison
        norm_title = re.sub(r'[^\w\s]', '', article["title"].lower())[:50]
        if norm_title not in seen_titles:
            seen_titles.add(norm_title)
            unique_articles.append(article)
    
    # Filter by category if specified
    if category_filter:
        unique_articles = [a for a in unique_articles if a["category"] in category_filter]
    
    # Sort by date (newest first)
    unique_articles.sort(key=lambda x: x["publishedAt"], reverse=True)
    
    # Ensure we have some trending articles
    trending_count = sum(1 for a in unique_articles if a["trending"])
    if trending_count < 4:
        for article in unique_articles[:8]:
            if not article["trending"]:
                article["trending"] = True
                trending_count += 1
                if trending_count >= 4:
                    break
    
    return unique_articles


def generate_news_json(articles: list) -> dict:
    """Generate the full news.json structure."""
    categories_list = [
        {
            "id": cat_id,
            "name": cat_info["name"],
            "icon": cat_info["icon"],
            "color": cat_info["color"]
        }
        for cat_id, cat_info in CATEGORIES.items()
    ]
    
    return {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "categories": categories_list,
        "articles": articles
    }


def main():
    parser = argparse.ArgumentParser(description="Scrape financial news from multiple sources")
    parser.add_argument(
        "--output", "-o",
        default="../data/news.json",
        help="Output file path (default: ../data/news.json)"
    )
    parser.add_argument(
        "--categories", "-c",
        help="Comma-separated list of categories to include (default: all)"
    )
    parser.add_argument(
        "--limit", "-l",
        type=int,
        default=50,
        help="Maximum number of articles to include (default: 50)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print results without saving to file"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Financial News Scraper for IO Innovate")
    print("=" * 60)
    print()
    
    # Parse category filter
    category_filter = None
    if args.categories:
        category_filter = [c.strip() for c in args.categories.split(",")]
        print(f"Filtering categories: {category_filter}")
    
    # Scrape feeds
    print("\nStarting news scrape...")
    articles = scrape_all_feeds(category_filter)
    
    # Limit articles
    articles = articles[:args.limit]
    
    print(f"\nTotal unique articles: {len(articles)}")
    
    # Count by category
    print("\nArticles by category:")
    category_counts = {}
    for article in articles:
        cat = article["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"  {CATEGORIES[cat]['name']}: {count}")
    
    # Generate output
    news_data = generate_news_json(articles)
    
    if args.dry_run:
        print("\n[DRY RUN] Would save to:", args.output)
        print("\nSample articles:")
        for article in articles[:3]:
            print(f"\n  - {article['title'][:60]}...")
            print(f"    Category: {article['category']}, Source: {article['source']}")
    else:
        # Save to file
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(news_data, f, indent=2, ensure_ascii=False)
        
        print(f"\nSaved to: {output_path.resolve()}")
    
    print("\nDone!")


if __name__ == "__main__":
    main()
