# Nasdaq Prediction Series Data

## Daily Workflow

1. Copy `daily/template.json` to `daily/YYYY-MM-DD.json`.
2. Paste 5 AI model outputs into `aiCalls`.
3. Add same-day Nasdaq/macroeconomic headlines under `news`.
4. Run `scripts/update_nasdaq_series.sh YYYY-MM-DD`.
5. Review generated file under `reports/YYYY-MM-DD-report.json`.
6. Add daily OHLC in `outcomes/YYYY-MM-DD.json` and rerun to generate score.
7. Open `/hub.html` to review KPIs.

## Notes

- Use `QQQ` as the tradable proxy for Nasdaq direction unless otherwise specified.
- `sentiment` must be one of: `bullish`, `neutral`, `bearish`.
- `impact` must be one of: `low`, `medium`, `high`.
- This process supports research and journaling, not financial advice.
- Outcome template path: `outcomes/template.json`.
