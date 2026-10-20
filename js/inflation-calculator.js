(() => {
  "use strict";

  const form = document.getElementById("inflationForm");
  if (!form) return;

  const ids = [
    "startingAmount",
    "startYear",
    "endYear",
    "inflationRate",
    "inflationCurrency",
  ];
  const fields = Object.fromEntries(
    ids.map((id) => [id, document.getElementById(id)]),
  );
  const error = document.getElementById("inflationError");
  const results = document.getElementById("inflationResults");
  const chart = document.getElementById("inflationChart");
  const currencySymbols = document.querySelectorAll(".inflation-currency");

  function formatMoney(value, currency) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
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

  function calculate() {
    const currency = fields.inflationCurrency.value;
    updateCurrencySymbols(currency);

    const startYear = Number(fields.startYear.value);
    const endYear = Number(fields.endYear.value);
    const yearsAreValid =
      Number.isInteger(startYear) &&
      Number.isInteger(endYear) &&
      endYear > startYear;
    const validFields = form.checkValidity();
    fields.startYear.setAttribute(
      "aria-invalid",
      String(!fields.startYear.validity.valid || !yearsAreValid),
    );
    fields.endYear.setAttribute(
      "aria-invalid",
      String(!fields.endYear.validity.valid || !yearsAreValid),
    );
    ["startingAmount", "inflationRate", "inflationCurrency"].forEach((id) => {
      fields[id].setAttribute(
        "aria-invalid",
        String(!fields[id].validity.valid),
      );
    });

    if (!validFields || !yearsAreValid) {
      results.hidden = true;
      error.hidden = false;
      error.textContent = validFields
        ? "The end year must be later than the start year."
        : "Check the highlighted inputs and their allowed ranges.";
      return;
    }

    error.hidden = true;
    results.hidden = false;
    const amount = Number(fields.startingAmount.value);
    const annualRate = Number(fields.inflationRate.value) / 100;
    const years = endYear - startYear;
    const rows = Array.from({ length: years + 1 }, (_, yearOffset) => {
      const factor = Math.pow(1 + annualRate, yearOffset);
      return {
        year: startYear + yearOffset,
        factor,
        equivalentAmount: amount * factor,
        purchasingPower: amount / factor,
      };
    });
    const finalRow = rows.at(-1);
    const cumulativeRate = (finalRow.factor - 1) * 100;

    document.getElementById("futureAmount").textContent = formatMoney(
      finalRow.equivalentAmount,
      currency,
    );
    document.getElementById("summaryEndYear").textContent = endYear;
    document.getElementById("cumulativeInflation").textContent =
      `${cumulativeRate.toFixed(1)}% cumulative change`;
    document.getElementById("summaryStartingAmount").textContent = formatMoney(
      amount,
      currency,
    );
    document.getElementById("additionalAmount").textContent = formatMoney(
      finalRow.equivalentAmount - amount,
      currency,
    );
    document.getElementById("purchasingPower").textContent = formatMoney(
      finalRow.purchasingPower,
      currency,
    );
    document.getElementById("inflationAssumptions").textContent =
      `Average annual rate ${annualRate * 100}% · ${years} years · Annual compounding · ${currency} display currency`;

    renderChart(rows, amount, currency, annualRate);
    renderTable(rows, amount, currency);
  }

  function renderChart(rows, amount, currency, annualRate) {
    const width = 720;
    const height = 280;
    const left = 84;
    const right = 18;
    const top = 20;
    const bottom = 42;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const values = rows.map((row) => row.equivalentAmount);
    const maxValue = Math.max(...values, amount * 1.05, 1);
    const minValue = Math.min(...values, amount * 0.95, 0);
    const range = Math.max(maxValue - minValue, 1);
    const points = rows.map((row, index) => ({
      x: left + (index / (rows.length - 1)) * plotWidth,
      y: top + ((maxValue - row.equivalentAmount) / range) * plotHeight,
    }));
    const path = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
      )
      .join(" ");
    const baseline = top + ((maxValue - minValue) / range) * plotHeight;
    const area = `${path} L${points.at(-1).x} ${baseline} L${points[0].x} ${baseline} Z`;
    const formatter = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    });
    const grid = Array.from({ length: 5 }, (_, index) => {
      const value = maxValue - (range * index) / 4;
      const y = top + (plotHeight * index) / 4;
      return `<line class="inflation-gridline" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="inflation-axis-label" x="${left - 10}" y="${y + 4}" text-anchor="end">${formatter.format(value)}</text>`;
    }).join("");
    const startYear = rows[0].year;
    const endYear = rows.at(-1).year;
    const yearLabels = [
      0,
      Math.ceil((rows.length - 1) / 4),
      Math.ceil((rows.length - 1) / 2),
      Math.ceil(((rows.length - 1) * 3) / 4),
      rows.length - 1,
    ]
      .filter((index, position, indices) => indices.indexOf(index) === position)
      .map((index) => {
        const x = left + (index / (rows.length - 1)) * plotWidth;
        return `<text class="inflation-axis-label" x="${x}" y="${height - 12}" text-anchor="middle">${rows[index].year}</text>`;
      })
      .join("");
    const lastPoint = points.at(-1);
    const endAmount = rows.at(-1).equivalentAmount;

    chart.innerHTML = `
      <title id="inflationChartTitle">Illustrative amount projection</title>
      <desc id="inflationChartDescription">${formatMoney(amount, currency)} in ${startYear} is equivalent to ${formatMoney(endAmount, currency)} in ${endYear} at an assumed annual rate of ${(annualRate * 100).toFixed(1)} percent.</desc>
      <defs><linearGradient id="inflationFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#d99a54" stop-opacity=".3"/><stop offset="100%" stop-color="#d99a54" stop-opacity=".02"/></linearGradient></defs>
      ${grid}
      <path class="inflation-chart-area" d="${area}"/>
      <path class="inflation-chart-line" d="${path}"/>
      <circle class="inflation-chart-dot" cx="${lastPoint.x}" cy="${lastPoint.y}" r="6"/>
      ${yearLabels}
    `;
  }

  function renderTable(rows, amount, currency) {
    const body = document.getElementById("inflationRows");
    body.replaceChildren();
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      const cumulativeChange = (row.factor - 1) * 100;
      const values = [
        String(row.year),
        formatMoney(row.equivalentAmount, currency),
        `${cumulativeChange.toFixed(1)}%`,
        formatMoney(row.purchasingPower, currency),
      ];
      values.forEach((value, index) => {
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
