(() => {
  "use strict";

  const form = document.getElementById("savingsForm");
  if (!form) return;

  const ids = [
    "targetAmount",
    "currentSavings",
    "years",
    "annualRate",
    "plannedMonthly",
    "depositTiming",
    "savingsCurrency",
  ];
  const fields = Object.fromEntries(
    ids.map((id) => [id, document.getElementById(id)]),
  );
  const error = document.getElementById("savingsError");
  const results = document.getElementById("savingsResults");
  const chart = document.getElementById("savingsChart");

  function formatMoney(value, currency) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function updateCurrencySymbols(currency) {
    const parts = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const symbol = parts
      .filter((part) => part.type === "currency")
      .map((part) => part.value)
      .join("");
    document.querySelectorAll(".savings-currency").forEach((element) => {
      element.textContent = symbol;
    });
  }

  function calculate() {
    const currency = fields.savingsCurrency.value;
    updateCurrencySymbols(currency);
    const valid = form.checkValidity();
    ids.forEach((id) => {
      fields[id].setAttribute(
        "aria-invalid",
        String(!fields[id].validity.valid),
      );
    });
    if (!valid) {
      results.hidden = true;
      error.hidden = false;
      error.textContent =
        "Check the highlighted inputs and their allowed ranges.";
      return;
    }

    error.hidden = true;
    results.hidden = false;
    const target = Number(fields.targetAmount.value);
    const current = Number(fields.currentSavings.value);
    const years = Number(fields.years.value);
    const months = years * 12;
    const annualRate = Number(fields.annualRate.value) / 100;
    const plannedMonthly = Number(fields.plannedMonthly.value);
    const beginning = fields.depositTiming.value === "beginning";
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    const growthFactor = Math.pow(1 + monthlyRate, months);
    const ordinaryAnnuityFactor =
      Math.abs(monthlyRate) < 1e-12 ? months : (growthFactor - 1) / monthlyRate;
    const annuityFactor =
      ordinaryAnnuityFactor * (beginning ? 1 + monthlyRate : 1);
    const requiredMonthly = Math.max(
      0,
      (target - current * growthFactor) / annuityFactor,
    );
    const requiredDeposits = requiredMonthly * months;
    const planRows = [
      {
        year: 0,
        requiredDeposits: 0,
        balance: current,
        target,
      },
    ];
    let planBalance = current;
    let totalPlannedDeposits = 0;

    for (let month = 1; month <= months; month += 1) {
      if (beginning) planBalance += plannedMonthly;
      planBalance *= 1 + monthlyRate;
      if (!beginning) planBalance += plannedMonthly;
      totalPlannedDeposits += plannedMonthly;

      if (month % 12 === 0) {
        planRows.push({
          year: month / 12,
          requiredDeposits: requiredMonthly * month,
          balance: planBalance,
          target,
        });
      }
    }

    const gap = planBalance - target;
    const requiredRateBalance =
      current * growthFactor + requiredMonthly * annuityFactor;
    const estimatedInterest = requiredRateBalance - current - requiredDeposits;
    const status = document.getElementById("goalStatus");
    const alreadyThere = current >= target;
    const meetsGoal = gap >= 0;

    document.getElementById("requiredMonthly").textContent = formatMoney(
      requiredMonthly,
      currency,
    );
    document.getElementById("projectedBalance").textContent = formatMoney(
      planBalance,
      currency,
    );
    document.getElementById("goalGap").textContent =
      `${gap >= 0 ? "+" : "−"}${formatMoney(Math.abs(gap), currency)}`;
    document.getElementById("requiredDeposits").textContent = formatMoney(
      requiredDeposits,
      currency,
    );
    document.getElementById("estimatedInterest").textContent = formatMoney(
      estimatedInterest,
      currency,
    );
    status.textContent = alreadyThere
      ? "Goal already reached"
      : meetsGoal
        ? "Plan reaches goal"
        : "Plan below goal";
    status.classList.toggle("is-on-track", alreadyThere || meetsGoal);
    status.classList.toggle("is-shortfall", !alreadyThere && !meetsGoal);
    document.getElementById("savingsAssumptions").textContent =
      `${years} years · ${annualRate * 100}% nominal annual rate · Monthly compounding · Deposits at ${beginning ? "beginning" : "end"} of month · ${currency} display only`;

    renderChart(planRows, currency, target, years);
    renderTable(planRows, currency);
  }

  function renderChart(rows, currency, target, years) {
    const width = 720;
    const height = 280;
    const left = 78;
    const right = 18;
    const top = 22;
    const bottom = 42;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const maxValue = Math.max(target, ...rows.map((row) => row.balance), 1);
    const pointFor = (value, index) => ({
      x: left + (index / years) * plotWidth,
      y: top + ((maxValue - value) / maxValue) * plotHeight,
    });
    const points = rows.map((row, index) => pointFor(row.balance, index));
    const path = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
      )
      .join(" ");
    const baseline = top + plotHeight;
    const area = `${path} L${points.at(-1).x} ${baseline} L${points[0].x} ${baseline} Z`;
    const numberFormat = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    });
    const grid = Array.from({ length: 5 }, (_, index) => {
      const value = maxValue * (1 - index / 4);
      const y = top + (plotHeight * index) / 4;
      return `<line class="savings-gridline" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="savings-axis-label" x="${left - 10}" y="${y + 4}" text-anchor="end">${numberFormat.format(value)}</text>`;
    }).join("");
    const yearMarks = [
      0,
      Math.ceil(years / 4),
      Math.ceil(years / 2),
      Math.ceil((years * 3) / 4),
      years,
    ]
      .filter((year, index, values) => values.indexOf(year) === index)
      .map((year) => {
        const x = left + (year / years) * plotWidth;
        return `<text class="savings-axis-label" x="${x}" y="${height - 12}" text-anchor="middle">Year ${year}</text>`;
      })
      .join("");
    const targetY = top + ((maxValue - target) / maxValue) * plotHeight;
    const finalBalance = rows.at(-1).balance;
    const finalPoint = points.at(-1);

    chart.innerHTML = `
      <title id="savingsChartTitle">Savings goal projection</title>
      <desc id="savingsChartDescription">With the planned monthly deposit, the balance is projected to grow from ${formatMoney(rows[0].balance, currency)} to ${formatMoney(finalBalance, currency)} over ${years} years. The target is ${formatMoney(target, currency)}.</desc>
      <defs><linearGradient id="savingsFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#8b68a4" stop-opacity=".3"/><stop offset="100%" stop-color="#8b68a4" stop-opacity=".02"/></linearGradient></defs>
      ${grid}
      <path class="savings-chart-area" d="${area}"/>
      <line class="savings-target-line" x1="${left}" y1="${targetY}" x2="${width - right}" y2="${targetY}"/>
      <text class="savings-target-label" x="${width - right}" y="${Math.max(top + 12, targetY - 7)}" text-anchor="end">Goal</text>
      <path class="savings-chart-line" d="${path}"/>
      <circle class="savings-chart-dot" cx="${finalPoint.x}" cy="${finalPoint.y}" r="6"/>
      ${yearMarks}
    `;
  }

  function renderTable(rows, currency) {
    const body = document.getElementById("savingsRows");
    body.replaceChildren();
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      [
        String(row.year),
        formatMoney(row.requiredDeposits, currency),
        formatMoney(row.balance, currency),
        formatMoney(row.target, currency),
      ].forEach((value, index) => {
        const cell = document.createElement(index === 0 ? "th" : "td");
        cell.textContent = value;
        if (index === 0) cell.scope = "row";
        tr.appendChild(cell);
      });
      body.appendChild(tr);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });
  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  form.addEventListener("reset", () => window.setTimeout(calculate, 0));

  calculate();
})();
