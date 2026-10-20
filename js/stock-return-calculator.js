(() => {
  "use strict";

  const form = document.getElementById("returnsForm");
  if (!form) return;

  const fields = {
    startPrice: document.getElementById("startPrice"),
    endPrice: document.getElementById("endPrice"),
    shares: document.getElementById("shares"),
    initialInvestment: document.getElementById("initialInvestment"),
    dividends: document.getElementById("dividends"),
    startDate: document.getElementById("startDate"),
    endDate: document.getElementById("endDate"),
    currency: document.getElementById("returnsCurrency"),
  };
  const sharesField = document.getElementById("sharesField");
  const investedField = document.getElementById("investedField");
  const error = document.getElementById("returnsError");
  const results = document.getElementById("returnsResults");

  function formatMoney(value, currency) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatPercent(value) {
    return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`;
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
    document.querySelectorAll(".returns-currency").forEach((element) => {
      element.textContent = symbol;
    });
  }

  function setMode() {
    const mode = form.querySelector('input[name="amountMode"]:checked').value;
    const byShares = mode === "shares";
    sharesField.hidden = !byShares;
    investedField.hidden = byShares;
    fields.shares.required = byShares;
    fields.initialInvestment.required = !byShares;
  }

  function calculate() {
    setMode();
    const currency = fields.currency.value;
    updateCurrencySymbols(currency);
    const mode = form.querySelector('input[name="amountMode"]:checked').value;
    const activeFields = [
      fields.startPrice,
      fields.endPrice,
      fields.dividends,
      fields.currency,
      mode === "shares" ? fields.shares : fields.initialInvestment,
    ];
    const invalidField = activeFields.find((field) => !field.validity.valid);
    const hasStartDate = fields.startDate.value !== "";
    const hasEndDate = fields.endDate.value !== "";
    const datesArePaired = hasStartDate === hasEndDate;
    const startDate = hasStartDate
      ? new Date(`${fields.startDate.value}T00:00:00Z`)
      : null;
    const endDate = hasEndDate
      ? new Date(`${fields.endDate.value}T00:00:00Z`)
      : null;
    const elapsedDays =
      startDate && endDate ? (endDate - startDate) / 86400000 : 0;
    const datesAreValid = datesArePaired && (!hasStartDate || elapsedDays > 0);

    [...Object.values(fields)].forEach((field) =>
      field.removeAttribute("aria-invalid"),
    );
    if (invalidField) invalidField.setAttribute("aria-invalid", "true");
    if (!datesAreValid) {
      fields.startDate.setAttribute(
        "aria-invalid",
        String(!datesArePaired || elapsedDays <= 0),
      );
      fields.endDate.setAttribute(
        "aria-invalid",
        String(!datesArePaired || elapsedDays <= 0),
      );
    }

    if (invalidField || !datesAreValid) {
      results.hidden = true;
      error.hidden = false;
      error.textContent = invalidField
        ? "Check the highlighted inputs and their allowed ranges."
        : "Enter both dates, and make sure the end date is later than the start date.";
      return;
    }

    const startPrice = Number(fields.startPrice.value);
    const endPrice = Number(fields.endPrice.value);
    const dividendsPerShare = Number(fields.dividends.value);
    const shares =
      mode === "shares"
        ? Number(fields.shares.value)
        : Number(fields.initialInvestment.value) / startPrice;
    const startingValue = shares * startPrice;
    const endingShareValue = shares * endPrice;
    const dividendValue = shares * dividendsPerShare;
    const endingValue = endingShareValue + dividendValue;
    const dollarChange = endingValue - startingValue;
    const totalReturn =
      startingValue > 0 ? (dollarChange / startingValue) * 100 : 0;
    const priceReturn = ((endPrice - startPrice) / startPrice) * 100;
    const dividendContribution =
      startingValue > 0 ? (dividendValue / startingValue) * 100 : 0;
    const annualized =
      elapsedDays > 0
        ? endingValue === 0
          ? -100
          : endingValue > 0
            ? (Math.pow(endingValue / startingValue, 365.25 / elapsedDays) -
                1) *
              100
            : null
        : null;

    error.hidden = true;
    error.textContent = "";
    results.hidden = false;
    document.getElementById("totalReturn").textContent =
      formatPercent(totalReturn);
    document.getElementById("priceReturnValue").textContent =
      formatPercent(priceReturn);
    document.getElementById("annualizedReturn").textContent =
      annualized === null ? "Add dates" : formatPercent(annualized);
    document.getElementById("startingValue").textContent = formatMoney(
      startingValue,
      currency,
    );
    document.getElementById("endingValue").textContent = formatMoney(
      endingValue,
      currency,
    );
    document.getElementById("dollarChange").textContent =
      `${dollarChange >= 0 ? "+" : "−"}${formatMoney(Math.abs(dollarChange), currency)}`;
    document.getElementById("dividendContribution").textContent =
      formatPercent(dividendContribution);
    const badge = document.getElementById("performanceBadge");
    badge.textContent = `Price return ${formatPercent(priceReturn)}`;
    badge.classList.toggle("is-positive", totalReturn >= 0);
    badge.classList.toggle("is-negative", totalReturn < 0);
    const dateDescription =
      elapsedDays > 0
        ? `${fields.startDate.value} to ${fields.endDate.value} · ${Math.round(elapsedDays)} days`
        : "Dates not provided · annualized return unavailable";
    document.getElementById("returnsAssumptions").textContent =
      `${mode === "shares" ? `${new Intl.NumberFormat().format(shares)} shares` : `Initial investment ${formatMoney(startingValue, currency)}`} · ${formatMoney(dividendValue, currency)} total cash dividends · ${dateDescription} · ${currency} display only`;
    renderVisual(startingValue, endingValue, currency);
  }

  function renderVisual(startingValue, endingValue, currency) {
    const visual = document.getElementById("returnsVisual");
    const maxValue = Math.max(startingValue, endingValue, 1);
    const startWidth = (startingValue / maxValue) * 100;
    const endWidth = (endingValue / maxValue) * 100;
    visual.innerHTML = `
      <div class="returns-bar-row">
        <div class="returns-bar-label"><span>Starting value</span><strong>${formatMoney(startingValue, currency)}</strong></div>
        <div class="returns-bar-track"><span class="returns-bar returns-bar--start" style="width:${startWidth.toFixed(2)}%"></span></div>
      </div>
      <div class="returns-bar-row">
        <div class="returns-bar-label"><span>Ending value + cash dividends</span><strong>${formatMoney(endingValue, currency)}</strong></div>
        <div class="returns-bar-track"><span class="returns-bar returns-bar--end" style="width:${endWidth.toFixed(2)}%"></span></div>
      </div>`;
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
