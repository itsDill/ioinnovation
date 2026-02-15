# IO Innovate Scripts

## News Scraper

Scrapes financial news from multiple sources and updates `data/news.json`.

### Sources

The scraper pulls from these financial news RSS feeds:

- **Reuters** - Business & Markets
- **CNBC** - Top News & Investing
- **MarketWatch** - Top Stories
- **Yahoo Finance** - News
- **Seeking Alpha** - Market Currents
- **CoinDesk** - Crypto News
- **Financial Times** - Markets
- **Wall Street Journal** - Markets
- **Bloomberg** - Markets

### Categories

Articles are automatically classified into:

| Category           | Keywords                                      |
| ------------------ | --------------------------------------------- |
| Politics & Policy  | congress, legislation, regulation, tax, etc.  |
| Markets & Trading  | stock, S&P, Dow, Nasdaq, trading, etc.        |
| Industrials        | manufacturing, aerospace, automotive, etc.    |
| Commodities        | oil, gold, silver, crude, natural gas, etc.   |
| Dividends & Income | dividend, yield, REIT, payout, etc.           |
| Crypto & Digital   | bitcoin, ethereum, blockchain, etc.           |
| Economy            | GDP, inflation, Fed, interest rate, etc.      |
| Technology         | AI, cloud, Apple, Google, semiconductor, etc. |

### Quick Start

```bash
# Make the script executable
chmod +x update_news.sh

# Run the updater
./update_news.sh
```

### Manual Usage

```bash
# Install dependencies
pip install -r requirements.txt

# Run with defaults (outputs to ../data/news.json)
python scrape_news.py

# Specify output file
python scrape_news.py --output ../data/news.json

# Filter by categories
python scrape_news.py --categories politics,markets,economy

# Limit number of articles
python scrape_news.py --limit 30

# Dry run (preview without saving)
python scrape_news.py --dry-run
```

### Automation

To keep news updated automatically, add a cron job:

```bash
# Edit crontab
crontab -e

# Add this line to update every hour
0 * * * * cd /path/to/ioinnovation/scripts && ./update_news.sh >> /var/log/news-scraper.log 2>&1

# Or update every 30 minutes
*/30 * * * * cd /path/to/ioinnovation/scripts && ./update_news.sh >> /var/log/news-scraper.log 2>&1
```

### Output Format

The scraper generates a JSON file with this structure:

```json
{
  "lastUpdated": "2026-02-16T12:00:00Z",
  "categories": [
    {
      "id": "politics",
      "name": "Politics & Policy",
      "icon": "fa-landmark",
      "color": "#8b5cf6"
    }
  ],
  "articles": [
    {
      "id": "abc123def456",
      "title": "Article Title",
      "summary": "Article summary...",
      "category": "politics",
      "source": "Reuters",
      "sourceUrl": "https://reuters.com/...",
      "publishedAt": "2026-02-16T10:30:00Z",
      "trending": true
    }
  ]
}
```

### Legal Notes

This scraper uses publicly available RSS feeds. Always:

- Respect `robots.txt` directives
- Follow each source's terms of service
- Attribute content to original sources
- Don't republish full article content
- Use responsibly with reasonable request rates

### Troubleshooting

**"No articles found"**

- Check your internet connection
- Some feeds may be temporarily unavailable
- Try with `--dry-run` to see raw output

**"Module not found"**

- Run `pip install -r requirements.txt`
- Make sure you're using Python 3.7+

**Articles not categorizing correctly**

- Review keywords in `CATEGORIES` dict
- Add relevant keywords for better classification
