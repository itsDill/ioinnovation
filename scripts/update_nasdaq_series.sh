#!/bin/bash
# Build daily Nasdaq prediction report from AI and news inputs.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RUN_DATE="${1:-$(date +%F)}"

if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi

echo "Building Nasdaq series report for ${RUN_DATE}"
python build_nasdaq_prediction_report.py --date "${RUN_DATE}"

OUTCOME_FILE="../data/nasdaq-series/outcomes/${RUN_DATE}.json"
if [ -f "$OUTCOME_FILE" ]; then
  echo "Scoring report using session outcome..."
  python score_nasdaq_predictions.py --date "${RUN_DATE}"
else
  echo "No outcome file found for ${RUN_DATE}. Skipping score step."
fi

echo "Refreshing dashboard summary..."
python build_nasdaq_dashboard_summary.py

echo "Done. Output saved to ../data/nasdaq-series/reports/${RUN_DATE}-report.json"
