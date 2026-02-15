#!/bin/bash
# Update news data for IO Innovate

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Run the scraper
echo "Running news scraper..."
python scrape_news.py --output ../data/news.json --limit 50

echo ""
echo "News data updated successfully!"
echo "View at: http://localhost:8000/news.html"
