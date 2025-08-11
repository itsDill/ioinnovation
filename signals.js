// --- Signal Data Management ---
export const marketDataStore = {
  nasdaq: {
    title: "NASDAQ-100 Signals",
    price: "15,840.25",
    change: "+1.2%",
    accuracy: "87%",
    signals: [
      {
        type: "buy",
        strength: 4,
        entry: "15,800",
        target: "15,950",
        stop: "15,750",
        time: "10 min ago",
      },
      {
        type: "sell",
        strength: 2,
        entry: "15,900",
        target: "15,700",
        stop: "16,000",
        time: "30 min ago",
      },
      {
        type: "buy",
        strength: 3,
        entry: "15,820",
        target: "15,900",
        stop: "15,780",
        time: "1 hour ago",
      },
    ],
  },
  sp500: {
    title: "S&P 500 Signals",
    price: "4,200.50",
    change: "+0.8%",
    accuracy: "82%",
    signals: [
      {
        type: "buy",
        strength: 3,
        entry: "4,180",
        target: "4,250",
        stop: "4,150",
        time: "15 min ago",
      },
      {
        type: "sell",
        strength: 4,
        entry: "4,220",
        target: "4,180",
        stop: "4,250",
        time: "45 min ago",
      },
    ],
  },
  dax: {
    title: "DAX 30 Signals",
    price: "16,000.00",
    change: "-0.5%",
    accuracy: "79%",
    signals: [
      {
        type: "sell",
        strength: 2,
        entry: "16,050",
        target: "15,950",
        stop: "16,100",
        time: "5 min ago",
      },
    ],
  },
  oil: {
    title: "Crude Oil Signals",
    price: "$72.30",
    change: "+2.1%",
    accuracy: "75%",
    signals: [
      {
        type: "buy",
        strength: 5,
        entry: "$71.80",
        target: "$73.50",
        stop: "$71.00",
        time: "20 min ago",
      },
    ],
  },
  gold: {
    title: "Gold Signals",
    price: "$1,950.10",
    change: "-0.3%",
    accuracy: "80%",
    signals: [
      {
        type: "sell",
        strength: 3,
        entry: "$1,960",
        target: "$1,940",
        stop: "$1,970",
        time: "50 min ago",
      },
    ],
  },
  bitcoin: {
    title: "Bitcoin Signals",
    price: "$42,500.00",
    change: "+3.5%",
    accuracy: "90%",
    signals: [
      {
        type: "buy",
        strength: 4,
        entry: "$42,000",
        target: "$43,500",
        stop: "$41,500",
        time: "2 min ago",
      },
    ],
  },
};

// Get data for a market
export function getMarketData(market) {
  return marketDataStore[market];
}

// Add a signal to a market
export function addSignal(market, signal) {
  if (marketDataStore[market]) {
    marketDataStore[market].signals.unshift(signal);
  }
}

// Example usage for manual update:
// import { addSignal } from './signals.js';
// addSignal('nasdaq', {
//   type: "buy",
//   strength: 5,
//   entry: "15,900",
//   target: "16,000",
//   stop: "15,850",
//   time: "now"
// });
