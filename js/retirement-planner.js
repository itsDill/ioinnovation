(() => {
  "use strict";

  const form = document.getElementById("retirementForm");
  if (!form) return;

  const ids = [
    "currentAge",
    "retirementAge",
    "currentSavings",
    "monthlyContribution",
    "annualReturn",
    "inflationRate",
    "monthlyIncome",
    "withdrawalRate",
    "retirementCurrency",
  ];
  const fields = Object.fromEntries(
    ids.map((id) => [id, document.getElementById(id)]),
  );
  const error = document.getElementById("retirementError");
  const results = document.getElementById("retirementResults");
  const chart = document.getElementById("retirementChart");

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
    document.querySelectorAll(".retirement-currency").forEach((element) => {
      element.textContent = symbol;
    });
  }

  function calculate() {
    const currency = fields.retirementCurrency.value;
    updateCurrencySymbols(currency);
    const currentAge = Number(fields.currentAge.value);
    const retirementAge = Number(fields.retirementAge.value);
    const agesValid =
      Number.isInteger(currentAge) &&
      Number.isInteger(retirementAge) &&
      retirementAge > currentAge;
    const valid = form.checkValidity();
    ids.forEach((id) => {
      const fieldValid = fields[id].validity.valid;
      fields[id].setAttribute(
        "aria-invalid",
        String(
          !fieldValid ||
            ((id === "currentAge" || id === "retirementAge") && !agesValid),
        ),
      );
    });

    if (!valid || !agesValid) {
      results.hidden = true;
      error.hidden = false;
      error.textContent = valid
        ? "Retirement age must be a whole number greater than your current age."
        : "Check the highlighted inputs and their allowed ranges.";
      return;
    }

    error.hidden = true;
    results.hidden = false;
    const years = retirementAge - currentAge;
    const months = years * 12;
    const startingSavings = Number(fields.currentSavings.value);
    const monthlyContribution = Number(fields.monthlyContribution.value);
    const annualReturn = Number(fields.annualReturn.value) / 100;
    const inflation = Number(fields.inflationRate.value) / 100;
    const incomeToday = Number(fields.monthlyIncome.value);
    const withdrawalRate = Number(fields.withdrawalRate.value) / 100;
    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
    const inflationFactor = Math.pow(1 + inflation, years);
    const targetNestEgg = (incomeToday * 12 * inflationFactor) / withdrawalRate;
    const yearly = [
      {
        age: currentAge,
        contributions: 0,
        balance: startingSavings,
        target: (incomeToday * 12) / withdrawalRate,
      },
    ];
    let balance = startingSavings;
    let contributions = 0;

    for (let month = 1; month <= months; month += 1) {
      balance *= 1 + monthlyReturn;
      balance += monthlyContribution;
      contributions += monthlyContribution;
      if (month % 12 === 0) {
        const elapsedYears = month / 12;
        yearly.push({
          age: currentAge + elapsedYears,
          contributions,
          balance,
          target:
            (incomeToday * 12 * Math.pow(1 + inflation, elapsedYears)) /
            withdrawalRate,
        });
      }
    }

    const annuityFactor =
      Math.abs(monthlyReturn) < 1e-12
        ? months
        : (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn;
    const gap = balance - targetNestEgg;
    const futureStartingSavings =
      startingSavings * Math.pow(1 + monthlyReturn, months);
    const requiredMonthly =
      Math.max(0, targetNestEgg - futureStartingSavings) / annuityFactor;
    const realBalance = balance / inflationFactor;
    const totalContributions = monthlyContribution * months;

    document.getElementById("summaryRetirementAge").textContent =
      String(retirementAge);
    document.getElementById("projectedBalance").textContent = formatMoney(
      balance,
      currency,
    );
    document.getElementById("realBalance").textContent = formatMoney(
      realBalance,
      currency,
    );
    document.getElementById("targetNestEgg").textContent = formatMoney(
      targetNestEgg,
      currency,
    );
    document.getElementById("goalGap").textContent =
      `${gap >= 0 ? "+" : "−"}${formatMoney(Math.abs(gap), currency)}`;
    document.getElementById("neededContribution").textContent =
      formatMoney(requiredMonthly, currency) + "/mo";
    document.getElementById("totalContributions").textContent = formatMoney(
      totalContributions,
      currency,
    );
    const status = document.getElementById("goalStatus");
    status.textContent = gap >= 0 ? "At or above target" : "Below target";
    status.classList.toggle("is-on-track", gap >= 0);
    status.classList.toggle("is-shortfall", gap < 0);
    document.getElementById("retirementAssumptions").textContent =
      `${years} years to retirement · ${annualReturn * 100}% nominal return · ${inflation * 100}% inflation · ${(withdrawalRate * 100).toFixed(1)}% illustrative withdrawal rate · ${currency} display only`;

    renderChart(yearly, currency, currentAge, retirementAge, targetNestEgg);
    renderTable(yearly, currency);
  }

  function renderChart(
    yearly,
    currency,
    currentAge,
    retirementAge,
    targetNestEgg,
  ) {
    const width = 720;
    const height = 280;
    const left = 78;
    const right = 18;
    const top = 22;
    const bottom = 42;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const maxValue = Math.max(
      1,
      targetNestEgg,
      ...yearly.map((row) => row.balance),
    );
    const range = maxValue;
    const pointFor = (value, index) => ({
      x: left + (index / (yearly.length - 1)) * plotWidth,
      y: top + ((maxValue - value) / range) * plotHeight,
    });
    const points = yearly.map((row, index) => pointFor(row.balance, index));
    const path = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
      )
      .join(" ");
    const baseline = top + plotHeight;
    const area = `${path} L${points.at(-1).x} ${baseline} L${points[0].x} ${baseline} Z`;
    const formatter = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    });
    const grid = Array.from({ length: 5 }, (_, index) => {
      const value = maxValue * (1 - index / 4);
      const y = top + (plotHeight * index) / 4;
      return `<line class="retirement-gridline" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="retirement-axis-label" x="${left - 10}" y="${y + 4}" text-anchor="end">${formatter.format(value)}</text>`;
    }).join("");
    const years = retirementAge - currentAge;
    const ageMarks = [
      0,
      Math.ceil(years / 4),
      Math.ceil(years / 2),
      Math.ceil((years * 3) / 4),
      years,
    ]
      .filter((value, index, values) => values.indexOf(value) === index)
      .map((yearOffset) => {
        const x = left + (yearOffset / years) * plotWidth;
        return `<text class="retirement-axis-label" x="${x}" y="${height - 12}" text-anchor="middle">Age ${currentAge + yearOffset}</text>`;
      })
      .join("");
    const targetY = top + ((maxValue - targetNestEgg) / range) * plotHeight;
    const finalPoint = points.at(-1);

    chart.innerHTML = `
      <title id="retirementChartTitle">Illustrative retirement savings projection</title>
      <desc id="retirementChartDescription">Projected savings increase from ${formatMoney(yearly[0].balance, currency)} at age ${currentAge} to ${formatMoney(yearly.at(-1).balance, currency)} at age ${retirementAge}. The target nest egg is ${formatMoney(targetNestEgg, currency)}.</desc>
      <defs><linearGradient id="retirementFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#4d9b7b" stop-opacity=".3"/><stop offset="100%" stop-color="#4d9b7b" stop-opacity=".02"/></linearGradient></defs>
      ${grid}
      <path class="retirement-chart-area" d="${area}"/>
      <line class="retirement-target-line" x1="${left}" y1="${targetY}" x2="${width - right}" y2="${targetY}"/>
      <text class="retirement-target-label" x="${width - right}" y="${Math.max(top + 12, targetY - 7)}" text-anchor="end">Target</text>
      <path class="retirement-chart-line" d="${path}"/>
      <circle class="retirement-chart-dot" cx="${finalPoint.x}" cy="${finalPoint.y}" r="6"/>
      ${ageMarks}
    `;
  }

  function renderTable(yearly, currency) {
    const body = document.getElementById("retirementRows");
    body.replaceChildren();
    yearly.forEach((row) => {
      const tr = document.createElement("tr");
      [
        String(row.age),
        formatMoney(row.contributions, currency),
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
