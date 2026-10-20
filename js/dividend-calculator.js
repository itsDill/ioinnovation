(() => {
  "use strict";

  const form = document.getElementById("dividendForm");
  if (!form) return;

  const ids = [
    "shares",
    "dividend",
    "frequency",
    "sharePrice",
    "withholdingRate",
    "currency",
  ];
  const fields = Object.fromEntries(
    ids.map((id) => [id, document.getElementById(id)]),
  );
  const error = document.getElementById("dividendError");
  const results = document.getElementById("dividendResults");
  const currencySymbols = document.querySelectorAll(".dividend-currency");

  function formatMoney(value, currency) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
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
    const currency = fields.currency.value;
    updateCurrencySymbols(currency);

    const invalidFields = ids.filter((id) => {
      if (id === "sharePrice" && fields.sharePrice.value === "") return false;
      return !fields[id].validity.valid;
    });
    invalidFields.forEach((id) =>
      fields[id].setAttribute("aria-invalid", "true"),
    );
    ids
      .filter((id) => !invalidFields.includes(id))
      .forEach((id) => {
        fields[id].removeAttribute("aria-invalid");
      });

    if (invalidFields.length > 0) {
      results.hidden = true;
      error.hidden = false;
      error.textContent =
        "Check the highlighted inputs and their allowed ranges.";
      return;
    }

    error.hidden = true;
    results.hidden = false;
    const shares = Number(fields.shares.value);
    const dividendPerPayment = Number(fields.dividend.value);
    const paymentsPerYear = Number(fields.frequency.value);
    const withholdingRate = Number(fields.withholdingRate.value) / 100;
    const annualIncome = shares * dividendPerPayment * paymentsPerYear;
    const perPaymentIncome = shares * dividendPerPayment;
    const afterWithholding = annualIncome * (1 - withholdingRate);
    const sharePrice =
      fields.sharePrice.value === "" ? null : Number(fields.sharePrice.value);
    const annualYield =
      sharePrice === null
        ? null
        : ((dividendPerPayment * paymentsPerYear) / sharePrice) * 100;

    document.getElementById("annualIncome").textContent = formatMoney(
      annualIncome,
      currency,
    );
    document.getElementById("paymentIncome").textContent = formatMoney(
      perPaymentIncome,
      currency,
    );
    document.getElementById("monthlyIncome").textContent = formatMoney(
      annualIncome / 12,
      currency,
    );
    document.getElementById("afterWithholding").textContent = formatMoney(
      afterWithholding,
      currency,
    );
    document.getElementById("incomeYield").textContent =
      annualYield === null ? "Enter share price" : `${annualYield.toFixed(2)}%`;
    document.getElementById("yieldBadge").textContent =
      annualYield === null
        ? "Yield unavailable"
        : `${annualYield.toFixed(2)}% indicated yield`;
    document.getElementById("dividendAssumptions").textContent =
      `${paymentsPerYear} payment${paymentsPerYear === 1 ? "" : "s"} per year · ${withholdingRate * 100}% estimated withholding · ${currency} display currency`;
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
