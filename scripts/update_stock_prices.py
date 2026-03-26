#!/usr/bin/env python3
"""
Stock Price Updater for IO Innovation Homepage
Fetches current stock prices using yfinance and updates homepage-picks.json

Usage:
    python update_stock_prices.py

Requirements:
    pip install yfinance
"""

import json
import os
from datetime import datetime
from pathlib import Path

try:
    import yfinance as yf
except ImportError:
    print("Please install yfinance: pip install yfinance")
    exit(1)


# Configuration
DATA_DIR = Path(__file__).parent.parent / "data"
PICKS_FILE = DATA_DIR / "homepage-picks.json"

# Stocks to track
STOCKS = [
    {"symbol": "AAPL", "name": "Apple Inc.", "signal": "BUY"},
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "signal": "HOLD"},
    {"symbol": "MSFT", "name": "Microsoft Corporation", "signal": "BUY"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "signal": "BUY"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "signal": "BUY"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "signal": "HOLD"},
]


def fetch_stock_prices():
    """Fetch current prices for all tracked stocks."""
    symbols = [s["symbol"] for s in STOCKS]
    print(f"Fetching prices for: {', '.join(symbols)}")
    
    picks = []

    # Download all at once (more efficient, less rate limiting)
    latest_prices = {}
    try:
        data = yf.download(symbols, period="5d", progress=False, auto_adjust=True)
        if data.empty:
            print("Warning: yfinance returned empty data (market may be closed)")
        else:
            close = data['Close']
            # yfinance >= 0.2 returns a DataFrame with ticker columns for multi-symbol downloads
            if hasattr(close, 'columns'):
                latest_prices = close.dropna(how='all').iloc[-1].to_dict()
            else:
                # Single-symbol fallback (Series)
                latest_prices = {symbols[0]: close.dropna().iloc[-1]}
    except Exception as e:
        print(f"Batch download failed: {e}")

    for stock_info in STOCKS:
        symbol = stock_info["symbol"]
        try:
            current_price = latest_prices.get(symbol, None)

            if current_price is not None and float(current_price) > 0:
                # Default potential gain
                potential_gain = 12.0  # Conservative default
                
                picks.append({
                    "symbol": symbol,
                    "name": stock_info["name"],
                    "signal": stock_info["signal"],
                    "currentPrice": round(float(current_price), 2),
                    "potentialGain": potential_gain
                })
                print(f"  {symbol}: ${current_price:.2f}")
            else:
                print(f"  {symbol}: No price data available")
                
        except Exception as e:
            print(f"  {symbol}: Error - {e}")
    
    return picks


def update_picks_file(picks):
    """Update the homepage-picks.json file."""
    data = {
        "lastUpdated": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "picks": picks
    }
    
    # Filter out stocks with price 0 (failed fetches) if we have valid data
    valid_picks = [p for p in picks if p["currentPrice"] > 0]
    if valid_picks:
        data["picks"] = valid_picks
    
    with open(PICKS_FILE, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"\nUpdated {PICKS_FILE}")
    print(f"Last updated: {data['lastUpdated']}")


def main():
    print("=" * 50)
    print("Stock Price Updater for IO Innovation")
    print("=" * 50)
    
    picks = fetch_stock_prices()
    update_picks_file(picks)
    
    print("\nDone!")


if __name__ == "__main__":
    main()
