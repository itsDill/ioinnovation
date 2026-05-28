#!/usr/bin/env python3
"""Build a consensus Nasdaq prediction report from daily AI and news inputs."""

from __future__ import annotations

import argparse
import json
import math
import statistics
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DAILY_DIR = ROOT / "data" / "nasdaq-series" / "daily"
DEFAULT_REPORT_DIR = ROOT / "data" / "nasdaq-series" / "reports"


@dataclass
class ConsensusStats:
    entry_low: float
    entry_high: float
    stop: float
    target1: float
    target2: float
    avg_confidence: float
    dispersion_pct: float


@dataclass
class RiskPolicy:
    max_risk_pct: float
    min_reward_to_risk: float
    max_dispersion_pct: float
    max_vix: float
    max_bearish_news_score: float
    min_confidence: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Nasdaq daily consensus report")
    parser.add_argument(
        "--date",
        default=date.today().isoformat(),
        help="Report date in YYYY-MM-DD format (default: today)",
    )
    parser.add_argument(
        "--input",
        dest="input_file",
        default="",
        help="Optional path to input JSON. Default: data/nasdaq-series/daily/<date>.json",
    )
    parser.add_argument(
        "--output",
        dest="output_file",
        default="",
        help="Optional output path. Default: data/nasdaq-series/reports/<date>-report.json",
    )
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def to_float(value: Any, name: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid numeric field '{name}': {value}") from exc


def load_policy(market_ctx: dict[str, Any]) -> RiskPolicy:
    user_policy = market_ctx.get("riskPolicy", {}) if isinstance(market_ctx, dict) else {}
    return RiskPolicy(
        max_risk_pct=to_float(user_policy.get("maxRiskPct", 0.75), "riskPolicy.maxRiskPct"),
        min_reward_to_risk=to_float(
            user_policy.get("minRewardToRisk", 1.8), "riskPolicy.minRewardToRisk"
        ),
        max_dispersion_pct=to_float(
            user_policy.get("maxDispersionPct", 1.25), "riskPolicy.maxDispersionPct"
        ),
        max_vix=to_float(user_policy.get("maxVix", 22.0), "riskPolicy.maxVix"),
        max_bearish_news_score=to_float(
            user_policy.get("maxBearishNewsScore", -0.40),
            "riskPolicy.maxBearishNewsScore",
        ),
        min_confidence=to_float(user_policy.get("minConfidence", 60.0), "riskPolicy.minConfidence"),
    )


def calculate_consensus(ai_calls: list[dict[str, Any]], prior_close: float) -> ConsensusStats:
    if not ai_calls:
        raise ValueError("aiCalls must contain at least one model output")

    entry_lows = [to_float(x.get("entry", {}).get("low"), "entry.low") for x in ai_calls]
    entry_highs = [to_float(x.get("entry", {}).get("high"), "entry.high") for x in ai_calls]
    stops = [to_float(x.get("exit", {}).get("stop"), "exit.stop") for x in ai_calls]
    target1s = [to_float(x.get("exit", {}).get("target1"), "exit.target1") for x in ai_calls]
    target2s = [to_float(x.get("exit", {}).get("target2"), "exit.target2") for x in ai_calls]
    confidences = [to_float(x.get("confidence", 0), "confidence") for x in ai_calls]

    entry_midpoints = [
        (low + high) / 2 for low, high in zip(entry_lows, entry_highs, strict=True)
    ]
    midpoint_stdev = statistics.pstdev(entry_midpoints) if len(entry_midpoints) > 1 else 0.0
    baseline = prior_close if prior_close > 0 else max(statistics.mean(entry_midpoints), 1.0)
    dispersion_pct = (midpoint_stdev / baseline) * 100

    return ConsensusStats(
        entry_low=statistics.median(entry_lows),
        entry_high=statistics.median(entry_highs),
        stop=statistics.median(stops),
        target1=statistics.median(target1s),
        target2=statistics.median(target2s),
        avg_confidence=statistics.mean(confidences),
        dispersion_pct=dispersion_pct,
    )


def score_news(news_items: list[dict[str, Any]]) -> tuple[float, list[str]]:
    sentiment_map = {"bullish": 1.0, "neutral": 0.0, "bearish": -1.0}
    impact_map = {"low": 1.0, "medium": 1.5, "high": 2.0}

    weighted_sum = 0.0
    total_weight = 0.0
    cautions: list[str] = []

    for item in news_items:
        sentiment = str(item.get("sentiment", "neutral")).lower()
        impact = str(item.get("impact", "medium")).lower()
        if sentiment not in sentiment_map:
            sentiment = "neutral"
        if impact not in impact_map:
            impact = "medium"

        weight = impact_map[impact]
        weighted_sum += sentiment_map[sentiment] * weight
        total_weight += weight

        if sentiment == "bearish" and impact == "high":
            cautions.append(f"High-impact bearish headline: {item.get('headline', 'Unknown headline')}")

    if total_weight == 0:
        return 0.0, cautions
    return weighted_sum / total_weight, cautions


def build_risk_flags(stats: ConsensusStats, news_score: float, vix: float) -> list[str]:
    flags: list[str] = []

    if stats.dispersion_pct >= 1.2:
        flags.append("AI model disagreement is elevated (high dispersion across entry zones).")

    if news_score <= -0.35:
        flags.append("News flow is materially bearish; tighten risk and expect headline volatility.")

    if vix >= 24:
        flags.append("VIX is elevated; consider smaller size and wider stop logic.")

    if stats.stop >= stats.entry_low:
        flags.append("Stop is not below entry low; re-check model outputs for consistency.")

    return flags


def to_execution_plan(
    stats: ConsensusStats,
    market_ctx: dict[str, Any],
    policy: RiskPolicy,
) -> dict[str, Any]:
    account_size = to_float(market_ctx.get("accountSize", 100000), "marketContext.accountSize")
    entry_mid = (stats.entry_low + stats.entry_high) / 2
    per_share_risk = entry_mid - stats.stop
    reward_to_t1 = stats.target1 - entry_mid

    plan: dict[str, Any] = {
        "entryMid": round(entry_mid, 2),
        "perShareRisk": round(per_share_risk, 2),
        "rewardToTarget1": round(reward_to_t1, 2),
        "rewardToRiskTarget1": 0.0,
        "maxAccountRiskPct": policy.max_risk_pct,
        "accountSize": round(account_size, 2),
        "maxDollarRisk": 0.0,
        "suggestedPositionShares": 0,
    }

    if per_share_risk <= 0:
        return plan

    rr = reward_to_t1 / per_share_risk
    max_dollar_risk = account_size * (policy.max_risk_pct / 100)
    suggested_shares = math.floor(max_dollar_risk / per_share_risk)

    plan["rewardToRiskTarget1"] = round(rr, 2)
    plan["maxDollarRisk"] = round(max_dollar_risk, 2)
    plan["suggestedPositionShares"] = max(suggested_shares, 0)
    return plan


def evaluate_policy(
    stats: ConsensusStats,
    news_score: float,
    vix: float,
    policy: RiskPolicy,
    execution_plan: dict[str, Any],
) -> dict[str, Any]:
    no_trade_reasons: list[str] = []

    if stats.stop >= stats.entry_low:
        no_trade_reasons.append("Invalid structure: stop is not below entry zone.")

    if stats.dispersion_pct > policy.max_dispersion_pct:
        no_trade_reasons.append(
            f"AI dispersion {stats.dispersion_pct:.2f}% exceeds max {policy.max_dispersion_pct:.2f}%"
        )

    if vix > policy.max_vix:
        no_trade_reasons.append(f"VIX {vix:.2f} exceeds max {policy.max_vix:.2f}")

    if news_score < policy.max_bearish_news_score:
        no_trade_reasons.append(
            f"News sentiment {news_score:.2f} is below threshold {policy.max_bearish_news_score:.2f}"
        )

    if stats.avg_confidence < policy.min_confidence:
        no_trade_reasons.append(
            f"Average confidence {stats.avg_confidence:.1f} is below minimum {policy.min_confidence:.1f}"
        )

    rr = to_float(execution_plan.get("rewardToRiskTarget1", 0), "executionPlan.rewardToRiskTarget1")
    if rr < policy.min_reward_to_risk:
        no_trade_reasons.append(
            f"Reward/risk {rr:.2f} is below minimum {policy.min_reward_to_risk:.2f}"
        )

    allowed = len(no_trade_reasons) == 0
    return {
        "allowed": allowed,
        "action": "Trade Candidate" if allowed else "No Trade",
        "noTradeReasons": no_trade_reasons,
    }


def summarize_thesis(ai_calls: list[dict[str, Any]]) -> list[str]:
    lines: list[str] = []
    for call in ai_calls:
        model = call.get("model", "Unknown model")
        thesis = str(call.get("thesis", "")).strip()
        if thesis:
            lines.append(f"{model}: {thesis}")
    return lines


def recommendation_label(stats: ConsensusStats, news_score: float) -> str:
    if stats.avg_confidence >= 70 and news_score >= 0.15 and stats.dispersion_pct < 1.0:
        return "Constructive"
    if news_score <= -0.35 or stats.dispersion_pct >= 1.6:
        return "Defensive"
    return "Neutral"


def build_report(payload: dict[str, Any]) -> dict[str, Any]:
    market_ctx = payload.get("marketContext", {})
    prior_close = to_float(market_ctx.get("priorClose", 0), "marketContext.priorClose")
    vix = to_float(market_ctx.get("vix", 0), "marketContext.vix")
    policy = load_policy(market_ctx)

    ai_calls = payload.get("aiCalls", [])
    news = payload.get("news", [])

    stats = calculate_consensus(ai_calls, prior_close)
    news_score, headline_cautions = score_news(news)
    risk_flags = build_risk_flags(stats, news_score, vix)
    risk_flags.extend(headline_cautions)
    execution_plan = to_execution_plan(stats, market_ctx, policy)
    policy_check = evaluate_policy(stats, news_score, vix, policy, execution_plan)
    if not policy_check["allowed"]:
        risk_flags.extend(policy_check["noTradeReasons"])

    return {
        "date": payload.get("date"),
        "instrument": payload.get("instrument", "QQQ"),
        "timeframe": payload.get("timeframe", "1D"),
        "consensus": {
            "entry": {
                "low": round(stats.entry_low, 2),
                "high": round(stats.entry_high, 2),
            },
            "exit": {
                "stop": round(stats.stop, 2),
                "target1": round(stats.target1, 2),
                "target2": round(stats.target2, 2),
            },
            "avgConfidence": round(stats.avg_confidence, 1),
            "dispersionPct": round(stats.dispersion_pct, 2),
        },
        "scores": {
            "newsSentimentScore": round(news_score, 2),
            "recommendation": recommendation_label(stats, news_score),
        },
        "policy": {
            "maxRiskPct": policy.max_risk_pct,
            "minRewardToRisk": policy.min_reward_to_risk,
            "maxDispersionPct": policy.max_dispersion_pct,
            "maxVix": policy.max_vix,
            "maxBearishNewsScore": policy.max_bearish_news_score,
            "minConfidence": policy.min_confidence,
        },
        "executionPlan": execution_plan,
        "tradeDecision": policy_check,
        "riskFlags": risk_flags,
        "thesisDigest": summarize_thesis(ai_calls),
        "inputs": {
            "aiModelCount": len(ai_calls),
            "newsCount": len(news),
            "chartScreenshot": payload.get("chartScreenshot", ""),
            "marketContext": market_ctx,
        },
    }


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def main() -> int:
    args = parse_args()

    input_path = Path(args.input_file) if args.input_file else DEFAULT_DAILY_DIR / f"{args.date}.json"
    output_path = Path(args.output_file) if args.output_file else DEFAULT_REPORT_DIR / f"{args.date}-report.json"

    if not input_path.exists():
        print(f"Input file not found: {input_path}")
        print("Create a daily file from data/nasdaq-series/daily/template.json first.")
        return 1

    try:
        payload = load_json(input_path)
        report = build_report(payload)
        write_json(output_path, report)
    except Exception as exc:
        print(f"Failed to build report: {exc}")
        return 1

    print(f"Built Nasdaq report: {output_path}")
    print(json.dumps(report["consensus"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
