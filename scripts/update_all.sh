#!/bin/bash
# Update all data for IO Innovate
# Can be run manually or via cron

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "IO Innovate - Data Update"
echo "$(date)"
echo "========================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Update news data
echo "Step 1: Updating news..."
python scrape_news.py --output ../data/news.json --limit 50

# Update other data files
echo ""
echo "Step 2: Updating other data files..."
python update_data.py

# Build Nasdaq series report when today's input file exists
echo ""
echo "Step 3: Building Nasdaq series report (if input exists)..."
TODAY_FILE="../data/nasdaq-series/daily/$(date +%F).json"
if [ -f "$TODAY_FILE" ]; then
    python build_nasdaq_prediction_report.py --date "$(date +%F)"
    TODAY_OUTCOME="../data/nasdaq-series/outcomes/$(date +%F).json"
    if [ -f "$TODAY_OUTCOME" ]; then
        python score_nasdaq_predictions.py --date "$(date +%F)"
    fi
else
    echo "No daily Nasdaq file found for today. Skipping report build."
fi

python build_nasdaq_dashboard_summary.py

echo ""
echo "========================================"
echo "All updates complete!"
echo "========================================"
