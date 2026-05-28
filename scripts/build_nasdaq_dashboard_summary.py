#!/usr/bin/env python3
"""Aggregate Nasdaq reports and scores into one dashboard JSON payload."""

from __future__ import annotations

import json
import statistics
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "data" / "nasdaq-series" / "reports"
SCORE_DIR = ROOT / "data" / "nasdaq-series" / "scores"
OUT_PATH = ROOT / "data" / "nasdaq-series" / "dashboard-summary.json"


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def parse_date_from_report_name(name: str) -> str:
    return name.replace("-report.json", "")


def build_summary() -> dict[str, Any]:
    reports = []
    for report_path in sorted(REPORT_DIR.glob("*-report.json"), reverse=True):
        report = load_json(report_path)
        dt = parse_date_from_report_name(report_path.name)
        score_path = SCORE_DIR / f"{dt}-score.json"
        score = load_json(score_path) if score_path.exists() else None

        row = {
            "date": dt,
            "recommendation": report.get("scores", {}).get("recommendation", "Neutral"),
            "decision": report.get("tradeDecision", {}).get("action", "No Trade"),
            "entryLow": report.get("consensus", {}).get("entry", {}).get("low", 0),
            "entryHigh": report.get("consensus", {}).get("entry", {}).get("high", 0),
            "target1": report.get("consensus", {}).get("exit", {}).get("target1", 0),
            "stop": report.get("consensus", {}).get("exit", {}).get("stop", 0),
            "avgConfidence": report.get("consensus", {}).get("avgConfidence", 0),
            "dispersionPct": report.get("consensus", {}).get("dispersionPct", 0),
            "newsScore": report.get("scores", {}).get("newsSentimentScore", 0),
            "scoreR": score.get("score", {}).get("r") if score else None,
            "result": score.get("outcome", {}).get("result") if score else "pending",
        }
        reports.append(row)

    scored = [x for x in reports if isinstance(x.get("scoreR"), (int, float))]
    no_trade_days = [x for x in reports if x.get("decision") == "No Trade"]

    return {
        "generatedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "kpis": {
            "totalReports": len(reports),
            "scoredReports": len(scored),
            "totalR": round(sum(x["scoreR"] for x in scored), 3) if scored else 0,
            "avgR": round(statistics.mean(x["scoreR"] for x in scored), 3) if scored else 0,
            "hitRate": round(
                sum(1 for x in scored if x["scoreR"] > 0) / len(scored), 3
            )
            if scored
            else 0,
            "noTradeDays": len(no_trade_days),
        },
        "rows": reports,
    }


def main() -> int:
    payload = build_summary()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")

    print(f"Wrote dashboard summary: {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
