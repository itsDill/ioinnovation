#!/usr/bin/env python3
"""Generate a complete sitemap.xml for ioinnovationfund.com"""
import os
from datetime import date

BASE = "https://ioinnovationfund.com"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TODAY = date.today().isoformat()

# Page definitions: (path, changefreq, priority)
# Root-relative paths (no leading slash stored here)
PAGES = [
    # Homepage
    ("", "daily", "1.0"),
    # Main nav pages
    ("tools.html", "weekly", "0.95"),
    ("games.html", "weekly", "0.88"),
    ("guides.html", "weekly", "0.90"),
    ("hub.html", "daily", "0.90"),
    ("analytics.html", "weekly", "0.85"),
    ("about.html", "monthly", "0.60"),
    ("contact.html", "monthly", "0.50"),
    ("privacy.html", "yearly", "0.30"),
    ("terms.html", "yearly", "0.30"),
    ("disclaimer.html", "yearly", "0.30"),
    ("content-policy.html", "yearly", "0.30"),
    # Tool pages
    ("tools/13f-visualizer.html", "weekly", "0.85"),
    ("tools/10k-summary.html", "weekly", "0.85"),
    ("tools/pe-ratio-calculator.html", "monthly", "0.82"),
    ("tools/compound-interest-calculator.html", "monthly", "0.82"),
    ("tools/dividend-yield-calculator.html", "monthly", "0.82"),
    ("tools/market-cap-calculator.html", "monthly", "0.82"),
    # Game pages
    ("games/portfolio-builder.html", "weekly", "0.75"),
    ("games/trading-simulator.html", "weekly", "0.75"),
    ("games/investment-iq.html", "weekly", "0.75"),
    ("games/market-crash.html", "weekly", "0.75"),
    ("games/options-lab.html", "weekly", "0.75"),
    ("games/sector-rotation.html", "weekly", "0.75"),
    # Sector pages
    ("sectors/ai-infrastructure.html", "weekly", "0.78"),
    ("sectors/robotics.html", "weekly", "0.78"),
    ("sectors/space-economy.html", "weekly", "0.78"),
]

# Pre-existing blog posts (higher priority)
OLD_BLOG = [
    "blog/how-to-read-balance-sheet-guide.html",
    "blog/how-to-read-cash-flow-statement-guide.html",
    "blog/how-to-read-income-statement-guide.html",
    "blog/oil-prices-economy-2026-crisis-guide.html",
    "blog/understanding-13f-filings-guide.html",
]

# New blog posts
NEW_BLOG = [
    "hub/nasdaq-prediction-series-intro.html",
    "hub/nasdaq-prediction-dashboard.html",
    "blog/what-is-pe-ratio-guide.html",
    "blog/what-is-ebitda-guide.html",
    "blog/free-cash-flow-explained-guide.html",
    "blog/debt-to-equity-ratio-guide.html",
    "blog/return-on-equity-guide.html",
    "blog/dollar-cost-averaging-guide.html",
    "blog/compound-interest-investing-guide.html",
    "blog/market-cap-explained-guide.html",
    "blog/how-to-analyze-a-stock-guide.html",
    "blog/how-to-read-earnings-report-guide.html",
    "blog/how-to-read-sec-filings-guide.html",
    "blog/how-to-read-proxy-statement-guide.html",
    "blog/growth-vs-value-investing-guide.html",
    "blog/warren-buffett-investing-strategy-guide.html",
    "blog/technical-vs-fundamental-analysis-guide.html",
    "blog/how-to-use-13f-filings-guide.html",
    "blog/congressional-stock-trading-guide.html",
    "blog/dividend-aristocrats-investing-guide.html",
    "blog/hedge-fund-strategies-guide.html",
    "blog/stock-options-basics-guide.html",
    "blog/best-ai-stocks-2026-guide.html",
    "blog/nvidia-stock-analysis-2026-guide.html",
    "blog/robotics-stocks-2026-guide.html",
    "blog/space-economy-investing-guide.html",
    "blog/ai-infrastructure-investing-guide.html",
    "blog/how-to-build-dividend-portfolio-guide.html",
    "blog/portfolio-diversification-guide.html",
    "blog/etf-vs-individual-stocks-guide.html",
    "blog/rebalancing-portfolio-guide.html",
    "blog/recession-proof-portfolio-guide.html",
]

def url_entry(path, changefreq, priority, lastmod=TODAY):
    loc = f"{BASE}/{path}" if path else BASE + "/"
    return f"""  <url>
    <loc>{loc}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>"""

lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
         '']

lines.append('  <!-- Homepage & Main Pages -->')
for path, freq, pri in PAGES:
    lines.append(url_entry(path, freq, pri))
    lines.append('')

lines.append('  <!-- Original Blog Posts -->')
for path in OLD_BLOG:
    lines.append(url_entry(path, "monthly", "0.80"))
    lines.append('')

lines.append('  <!-- New Blog Posts -->')
for path in NEW_BLOG:
    lines.append(url_entry(path, "monthly", "0.78"))
    lines.append('')

lines.append('</urlset>')

out = os.path.join(ROOT, 'sitemap.xml')
with open(out, 'w') as f:
    f.write('\n'.join(lines))

total = len(PAGES) + len(OLD_BLOG) + len(NEW_BLOG)
print(f"Written {out} with {total} URLs")
