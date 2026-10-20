(() => {
  "use strict";

  const form = document.getElementById("dcfForm");
  if (!form) return;

  const ids = [
    "baseFcf",
    "fcfGrowth",
    "forecastYears",
    "discountRate",
    "terminalGrowth",
    "netDebt",
    "sharesOutstanding",
    "dcfCurrency",
  ];
  const fields = Object.fromEntries(
    ids.map((id) => [id, document.getElementById(id)]),
  );
  const error = document.getElementById("dcfError");
  const currencySymbols = document.querySelectorAll(".dcf-currency");

  function formatMoney(value, currency, fractionDigits = 0) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
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

  function project({
    baseFcf,
    fcfGrowth,
    years,
    discountRate,
    terminalGrowth,
  }) {
    const forecast = [];
    let presentValueForecast = 0;

    for (let year = 1; year <= years; year += 1) {
      const cashFlow = baseFcf * Math.pow(1 + fcfGrowth, year);
      const discountFactor = 1 / Math.pow(1 + discountRate, year);
      const presentValue = cashFlow * discountFactor;
      presentValueForecast += presentValue;
      forecast.push({ year, cashFlow, discountFactor, presentValue });
    }

    const finalCashFlow = forecast.at(-1)?.cashFlow ?? 0;
    const terminalValue =
      (finalCashFlow * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
    const terminalDiscountFactor = 1 / Math.pow(1 + discountRate, years);
    const presentValueTerminal = terminalValue * terminalDiscountFactor;
    const enterpriseValue = presentValueForecast + presentValueTerminal;

    return {
      forecast,
      finalCashFlow,
      terminalValue,
      terminalDiscountFactor,
      presentValueForecast,
      presentValueTerminal,
      enterpriseValue,
    };
  }

  function calculate() {
    const currency = fields.dcfCurrency.value;
    updateCurrencySymbols(currency);

    const validFields = form.checkValidity();
    const discountRate = Number(fields.discountRate.value) / 100;
    const terminalGrowth = Number(fields.terminalGrowth.value) / 100;
    const validRates = discountRate > terminalGrowth;

    ids.forEach((id) => {
      const field = fields[id];
      const isInvalid =
        !field.validity.valid ||
        ((id === "discountRate" || id === "terminalGrowth") && !validRates);
      field.setAttribute("aria-invalid", String(isInvalid));
    });

    if (!validFields || !validRates) {
      document.getElementById("dcfResults").hidden = true;
      error.hidden = false;
      error.textContent = validFields
        ? "The discount rate must be greater than the terminal growth rate."
        : "Check the highlighted inputs and their allowed ranges.";
      return;
    }

    error.hidden = true;
    document.getElementById("dcfResults").hidden = false;
    const baseFcf = Number(fields.baseFcf.value);
    const fcfGrowth = Number(fields.fcfGrowth.value) / 100;
    const years = Number(fields.forecastYears.value);
    const netDebt = Number(fields.netDebt.value);
    const sharesOutstanding = Number(fields.sharesOutstanding.value);
    const assumptions = {
      baseFcf,
      fcfGrowth,
      years,
      discountRate,
      terminalGrowth,
    };
    const result = project(assumptions);
    const equityValue = result.enterpriseValue - netDebt;
    const valuePerShare = equityValue / sharesOutstanding;
    const terminalShare =
      result.enterpriseValue === 0
        ? 0
        : (result.presentValueTerminal / result.enterpriseValue) * 100;

    document.getElementById("valuePerShare").textContent = formatMoney(
      valuePerShare,
      currency,
      2,
    );
    document.getElementById("equityValue").textContent = formatMoney(
      equityValue,
      currency,
    );
    document.getElementById("enterpriseValue").textContent = formatMoney(
      result.enterpriseValue,
      currency,
    );
    document.getElementById("pvForecast").textContent = formatMoney(
      result.presentValueForecast,
      currency,
    );
    document.getElementById("pvTerminal").textContent = formatMoney(
      result.presentValueTerminal,
      currency,
    );
    document.getElementById("terminalShare").textContent =
      `${terminalShare.toFixed(1)}%`;
    document.getElementById("dcfAssumptions").textContent =
      `FCFF growth ${(fcfGrowth * 100).toFixed(1)}% annually · Discount rate ${(discountRate * 100).toFixed(1)}% · Terminal growth ${(terminalGrowth * 100).toFixed(1)}% · ${years}-year forecast`;

    renderForecast(result, currency, years);
    renderSensitivity(assumptions, netDebt, sharesOutstanding, currency);
  }

  function renderForecast(result, currency, years) {
    const body = document.getElementById("forecastRows");
    body.replaceChildren();

    result.forecast.forEach((row) => {
      appendRow(body, [
        `Year ${row.year}`,
        formatMoney(row.cashFlow, currency),
        row.discountFactor.toFixed(4),
        formatMoney(row.presentValue, currency),
      ]);
    });

    appendRow(
      body,
      [
        `Terminal value (year ${years})`,
        formatMoney(result.terminalValue, currency),
        result.terminalDiscountFactor.toFixed(4),
        formatMoney(result.presentValueTerminal, currency),
      ],
      "dcf-terminal-row",
    );
  }

  function appendRow(body, values, className = "") {
    const row = document.createElement("tr");
    if (className) row.className = className;
    values.forEach((value, index) => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      cell.textContent = value;
      if (index === 0) {
        cell.scope = "row";
      } else {
        cell.className = "dcf-numeric-cell";
      }
      row.appendChild(cell);
    });
    body.appendChild(row);
  }

  function renderSensitivity(
    assumptions,
    netDebt,
    sharesOutstanding,
    currency,
  ) {
    const steps = [-2, -1, 0, 1, 2];
    const rateStep = 0.005;
    const discountRates = steps.map(
      (step) => assumptions.discountRate + step * rateStep,
    );
    const terminalRates = steps.map(
      (step) => assumptions.terminalGrowth + step * rateStep,
    );
    const head = document.getElementById("sensitivityHead");
    const body = document.getElementById("sensitivityRows");
    head.replaceChildren();
    body.replaceChildren();

    const headerRow = document.createElement("tr");
    const corner = document.createElement("th");
    corner.scope = "col";
    corner.textContent = "Discount rate ↓ / Terminal growth →";
    headerRow.appendChild(corner);
    terminalRates.forEach((rate) => {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = `${(rate * 100).toFixed(1)}%`;
      headerRow.appendChild(cell);
    });
    head.appendChild(headerRow);

    discountRates.forEach((discountRate, rowIndex) => {
      const row = document.createElement("tr");
      const rowHeader = document.createElement("th");
      rowHeader.scope = "row";
      rowHeader.textContent = `${(discountRate * 100).toFixed(1)}%`;
      row.appendChild(rowHeader);

      terminalRates.forEach((terminalGrowth, columnIndex) => {
        const cell = document.createElement("td");
        if (rowIndex === 2 && columnIndex === 2) {
          cell.classList.add("dcf-current-assumption");
        }
        if (discountRate <= terminalGrowth) {
          cell.textContent = "—";
          cell.setAttribute(
            "aria-label",
            "Not available: discount rate must exceed terminal growth",
          );
        } else {
          const scenario = project({
            ...assumptions,
            discountRate,
            terminalGrowth,
          });
          const scenarioEquityValue = scenario.enterpriseValue - netDebt;
          cell.textContent = formatMoney(
            scenarioEquityValue / sharesOutstanding,
            currency,
            2,
          );
        }
        if (rowIndex === 2 && columnIndex === 2) {
          cell.setAttribute(
            "aria-label",
            `Current assumptions: ${cell.textContent}`,
          );
        }
        row.appendChild(cell);
      });
      body.appendChild(row);
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
