(() => {
  "use strict";

  const form = document.getElementById("growthForm");
  if (!form) return;

  const ids = [
    "startingBalance",
    "contribution",
    "contributionFrequency",
    "contributionTiming",
    "annualReturn",
    "years",
    "inflation",
    "currency",
  ];
  const fields = Object.fromEntries(
    ids.map((id) => [id, document.getElementById(id)]),
  );
  const error = document.getElementById("inputError");
  const chart = document.getElementById("growthChart");
  const tableBody = document.getElementById("annualBreakdown");
  const currencySymbols = document.querySelectorAll(".currency-symbol");
  const numberFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  });

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
    currencySymbols.forEach((element) => {
      element.textContent = symbol;
    });
  }

  function calculateProjection() {
    const startingBalance = Number(fields.startingBalance.value);
    const contribution = Number(fields.contribution.value);
    const contributionEveryMonths = Number(fields.contributionFrequency.value);
    const annualReturn = Number(fields.annualReturn.value) / 100;
    const years = Number(fields.years.value);
    const inflation = Number(fields.inflation.value) / 100;
    const currency = fields.currency.value;
    const isBeginning = fields.contributionTiming.value === "beginning";

    updateCurrencySymbols(currency);
    if (!form.checkValidity()) {
      error.hidden = false;
      error.textContent =
        "Check the highlighted inputs and their allowed ranges.";
      ids.forEach((id) => {
        fields[id].setAttribute(
          "aria-invalid",
          String(!fields[id].validity.valid),
        );
      });
      return;
    }
    error.hidden = true;
    ids.forEach((id) => fields[id].removeAttribute("aria-invalid"));

    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
    const yearly = [
      {
        year: 0,
        contributed: startingBalance,
        balance: startingBalance,
        growth: 0,
      },
    ];
    let balance = startingBalance;
    let totalContributions = 0;
    const totalMonths = years * 12;

    for (let month = 1; month <= totalMonths; month += 1) {
      const isContributionMonth = isBeginning
        ? (month - 1) % contributionEveryMonths === 0
        : month % contributionEveryMonths === 0;
      if (isContributionMonth && isBeginning) {
        balance += contribution;
        totalContributions += contribution;
      }

      balance *= 1 + monthlyReturn;

      if (isContributionMonth && !isBeginning) {
        balance += contribution;
        totalContributions += contribution;
      }

      if (month % 12 === 0) {
        yearly.push({
          year: month / 12,
          contributed: startingBalance + totalContributions,
          balance,
          growth: balance - startingBalance - totalContributions,
        });
      }
    }

    const finalValue = yearly.at(-1)?.balance ?? startingBalance;
    const totalInvested = startingBalance + totalContributions;
    const realValue = finalValue / Math.pow(1 + inflation, years);

    document.getElementById("summaryYears").textContent = years;
    document.getElementById("endingBalance").textContent = formatMoney(
      finalValue,
      currency,
    );
    document.getElementById("realBalance").textContent = formatMoney(
      realValue,
      currency,
    );
    document.getElementById("totalContributions").textContent = formatMoney(
      totalInvested,
      currency,
    );
    document.getElementById("investmentGrowth").textContent = formatMoney(
      finalValue - totalInvested,
      currency,
    );
    document.getElementById("realValueBadge").textContent =
      `In today’s ${currency}`;
    document.getElementById("projectionAssumptions").textContent =
      `Effective annual return ${(annualReturn * 100).toFixed(1)}% · Monthly compounding · Contributions at ${isBeginning ? "period beginning" : "period end"}`;

    renderChart(yearly, currency, years);
    renderTable(yearly, currency);
  }

  function renderChart(yearly, currency, years) {
    const width = 720;
    const height = 280;
    const left = 72;
    const right = 16;
    const top = 20;
    const bottom = 40;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const maxValue = Math.max(1, ...yearly.map((row) => row.balance));
    const minValue = Math.min(0, ...yearly.map((row) => row.balance));
    const range = Math.max(1, maxValue - minValue);
    const pointFor = (row) => ({
      x: left + (row.year / years) * plotWidth,
      y: top + ((maxValue - row.balance) / range) * plotHeight,
    });
    const points = yearly.map(pointFor);
    const path = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
      )
      .join(" ");
    const baseline = top + ((maxValue - minValue) / range) * plotHeight;
    const area = `${path} L${points.at(-1)?.x ?? left} ${baseline} L${points[0]?.x ?? left} ${baseline} Z`;
    const steps = 4;
    const grid = Array.from({ length: steps + 1 }, (_, index) => {
      const value = maxValue - (range * index) / steps;
      const y = top + (plotHeight * index) / steps;
      return `<line class="chart-gridline" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="chart-axis-label" x="${left - 10}" y="${y + 4}" text-anchor="end">${numberFormatter.format(value)}</text>`;
    }).join("");
    const yearMarks = [
      0,
      Math.ceil(years / 4),
      Math.ceil(years / 2),
      Math.ceil((years * 3) / 4),
      years,
    ]
      .filter(
        (year, index, values) => year > 0 && values.indexOf(year) === index,
      )
      .map((year) => {
        const x = left + (year / years) * plotWidth;
        return `<text class="chart-axis-label" x="${x}" y="${height - 12}" text-anchor="middle">Year ${year}</text>`;
      })
      .join("");
    const lastPoint = points.at(-1) || { x: left, y: baseline };
    const finalValue = yearly.at(-1)?.balance ?? 0;

    chart.innerHTML = `
      <title id="growthChartTitle">Illustrative balance projection</title>
      <desc id="growthChartDescription">Projected balance grows from ${formatMoney(yearly[0]?.contributed || 0, currency)} to ${formatMoney(finalValue, currency)} over ${years} years based on the entered assumptions.</desc>
      <defs><linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#59b58f" stop-opacity=".32"/><stop offset="100%" stop-color="#59b58f" stop-opacity=".02"/></linearGradient></defs>
      ${grid}
      <path class="chart-area" d="${area}"/>
      <path class="chart-line" d="${path}"/>
      <circle class="chart-dot" cx="${lastPoint.x}" cy="${lastPoint.y}" r="6"/>
      ${yearMarks}
    `;
  }

  function renderTable(yearly, currency) {
    tableBody.replaceChildren();
    yearly.forEach((row) => {
      const tr = document.createElement("tr");
      [
        `Year ${row.year}`,
        formatMoney(row.contributed, currency),
        formatMoney(row.balance, currency),
        formatMoney(row.growth, currency),
      ].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        tr.appendChild(cell);
      });
      tableBody.appendChild(tr);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateProjection();
  });
  form.addEventListener("input", calculateProjection);
  form.addEventListener("change", calculateProjection);
  form.addEventListener("reset", () =>
    window.setTimeout(calculateProjection, 0),
  );

  calculateProjection();
})();
