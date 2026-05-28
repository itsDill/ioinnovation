#!/usr/bin/env python3
"""Score Nasdaq daily prediction reports against realized session outcomes."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "data" / "nasdaq-series" / "reports"
OUTCOME_DIR = ROOT / "data" / "nasdaq-series" / "outcomes"
SCORE_DIR = ROOT / "data" / "nasdaq-series" / "scores"


@dataclass
class Session:
    open: float
    high: float
    low: float
    close: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Score Nasdaq reports")
    parser.add_argument("--date", default="", help="Score one date (YYYY-MM-DD)")
    parser.add_argument("--all", action="store_true", help="Score all available dates")
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")


def to_float(value: Any) -> float:
    return float(value)


def score_one(report: dict[str, Any], outcome: dict[str, Any]) -> dict[str, Any]:
    entry_low = to_float(report["consensus"]["entry"]["low"])
    entry_high = to_float(report["consensus"]["entry"]["high"])
    stop = to_float(report["consensus"]["exit"]["stop"])
    t1 = to_float(report["consensus"]["exit"]["target1"])
    t2 = to_float(report["consensus"]["exit"]["target2"])
    entry_mid = (entry_low + entry_high) / 2

    sess = Session(
        open=to_float(outcome["session"]["open"]),
        high=to_float(outcome["session"]["high"]),
        low=to_float(outcome["session"]["low"]),
        close=to_float(outcome["session"]["close"]),
    )

    entered = sess.low <= entry_high and sess.high >= entry_low
    hit_stop = entered and sess.low <= stop
    hit_t1 = entered and sess.high >= t1
    hit_t2 = entered and sess.high >= t2

    result = "no-entry"
    if entered:
        if hit_stop and (hit_t1 or hit_t2):
            result = "ambiguous"
        elif hit_t2:
            result = "target2"
        elif hit_t1:
            result = "target1"
        elif hit_stop:
            result = "stopped"
        else:
            result = "open"

    risk = max(entry_mid - stop, 0.0001)
    close_r = (sess.close - entry_mid) / risk if entered else 0.0

    score_map = {
        "target2": 2.0,
        "target1": 1.0,
        "open": close_r,
        "stopped": -1.0,
        "ambiguous": 0.0,
        "no-entry": 0.0,
    }
    r_score = score_map[result]

    return {
        "date": report.get("date"),
        "instrument": report.get("instrument", "QQQ"),
        "tradeDecision": report.get("tradeDecision", {}),
        "levels": {
            "entryLow": round(entry_low, 2),
            "entryHigh": round(entry_high, 2),
            "entryMid": round(entry_mid, 2),
            "stop": round(stop, 2),
            "target1": round(t1, 2),
            "target2": round(t2, 2),
        },
        "outcome": {
            "open": sess.open,
            "high": sess.high,
            "low": sess.low,
            "close": sess.close,
            "entered": entered,
            "hitStop": hit_stop,
            "hitTarget1": hit_t1,
            "hitTarget2": hit_t2,
            "result": result,
        },
        "score": {
            "r": round(float(r_score), 3),
            "closeR": round(float(close_r), 3),
        },
    }


def resolve_dates(args: argparse.Namespace) -> list[str]:
    if args.date:
        return [args.date]
    if args.all:
        dates = []
        for report_path in sorted(REPORT_DIR.glob("*-report.json")):
            dates.append(report_path.name.replace("-report.json", ""))
        return dates
    return []


def main() -> int:
    args = parse_args()
    dates = resolve_dates(args)

    if not dates:
        print("No dates selected. Use --date YYYY-MM-DD or --all")
        return 1

    written = 0
    for dt in dates:
        report_path = REPORT_DIR / f"{dt}-report.json"
        outcome_path = OUTCOME_DIR / f"{dt}.json"
        score_path = SCORE_DIR / f"{dt}-score.json"

        if not report_path.exists() or not outcome_path.exists():
            print(f"Skipping {dt}: missing report or outcome file")
            continue

        report = load_json(report_path)
        outcome = load_json(outcome_path)
        scored = score_one(report, outcome)
        write_json(score_path, scored)
        written += 1
        print(f"Scored {dt}: {score_path}")

    print(f"Completed. Wrote {written} score files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
