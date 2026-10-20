(() => {
  "use strict";

  const form = document.getElementById("positionForm");
  if (!form) return;

  const ids = [
    "accountValue",
    "riskPercent",
    "riskAmount",
    "entryPrice",
    "stopPrice",
    "positionCurrency",
  ];
  const fields = Object.fromEntries(
    ids.map((id) => [id, document.getElementById(id)]),
  );
  const riskType = document.getElementById("riskType");
  const riskPercentField = document.getElementById("riskPercentField");
  const riskAmountField = document.getElementById("riskAmountField");
  const error = document.getElementById("positionError");
  const results = document.getElementById("positionResults");
  const warning = document.getElementById("positionWarning");

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
    document.querySelectorAll(".position-currency").forEach((element) => {
      element.textContent = symbol;
    });
  }

  function syncRiskType() {
    const fixed = riskType.value === "fixed";
    riskPercentField.hidden = fixed;
    riskAmountField.hidden = !fixed;
    fields.riskPercent.required = !fixed;
    fields.riskAmount.required = fixed;
  }

  function calculate() {
    syncRiskType();
    const currency = fields.positionCurrency.value;
    updateCurrencySymbols(currency);

    const activeIds = [
      "accountValue",
      "entryPrice",
      "stopPrice",
      fields.positionCurrency.id,
      riskType.value === "percent" ? "riskPercent" : "riskAmount",
    ];
    const invalidIds = activeIds.filter((id) => !fields[id].validity.valid);
    ids.forEach((id) => {
      if (!activeIds.includes(id)) fields[id].removeAttribute("aria-invalid");
      else if (invalidIds.includes(id))
        fields[id].setAttribute("aria-invalid", "true");
      else fields[id].removeAttribute("aria-invalid");
    });

    const entry = Number(fields.entryPrice.value);
    const stop = Number(fields.stopPrice.value);
    const direction = document.getElementById("direction").value;
    const stopIsCorrectSide =
      direction === "long" ? stop < entry : stop > entry;
    const perShareRisk = Math.abs(entry - stop);
    if (!stopIsCorrectSide || perShareRisk <= 0) {
      fields.stopPrice.setAttribute("aria-invalid", "true");
      invalidIds.push("stopPrice");
    }

    if (invalidIds.length > 0) {
      results.hidden = true;
      error.hidden = false;
      error.textContent = !stopIsCorrectSide
        ? direction === "long"
          ? "For a long position, the stop price must be below the entry price."
          : "For a short position, the stop price must be above the entry price."
        : "Check the highlighted inputs and their allowed ranges.";
      return;
    }

    error.hidden = true;
    results.hidden = false;

    const accountValue = Number(fields.accountValue.value);
    const riskBudget =
      riskType.value === "percent"
        ? accountValue * (Number(fields.riskPercent.value) / 100)
        : Number(fields.riskAmount.value);
    const precision = document.getElementById("sharePrecision").value;
    const quantity =
      precision === "whole"
        ? Math.floor(riskBudget / perShareRisk)
        : Math.floor((riskBudget / perShareRisk) * 10000) / 10000;
    const positionValue = quantity * entry;
    const estimatedRisk = quantity * perShareRisk;
    const riskPercentOfAccount = (estimatedRisk / accountValue) * 100;

    document.getElementById("shareQuantity").textContent =
      `${new Intl.NumberFormat(undefined, {
        minimumFractionDigits: precision === "whole" ? 0 : 0,
        maximumFractionDigits: precision === "whole" ? 0 : 4,
      }).format(quantity)} ${quantity === 1 ? "share" : "shares"}`;
    document.getElementById("riskBudget").textContent = formatMoney(
      riskBudget,
      currency,
    );
    document.getElementById("riskPerShare").textContent = formatMoney(
      perShareRisk,
      currency,
    );
    document.getElementById("positionValue").textContent = formatMoney(
      positionValue,
      currency,
    );
    document.getElementById("accountRisk").textContent =
      `${riskPercentOfAccount.toFixed(2)}%`;
    document.getElementById("riskBadge").textContent =
      riskType.value === "percent"
        ? `${Number(fields.riskPercent.value).toFixed(2)}% account risk`
        : `${formatMoney(riskBudget, currency)} fixed risk`;
    document.getElementById("positionAssumptions").textContent =
      `Estimated maximum loss at the entered stop: ${formatMoney(estimatedRisk, currency)} · ${direction} position · ${currency} display currency only`;

    const exceedsAccount = positionValue > accountValue;
    warning.hidden = !exceedsAccount;
    warning.textContent = exceedsAccount
      ? "The estimated position value exceeds the account value. This sizing estimate does not model leverage, margin, or buying-power limits."
      : "";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });
  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      riskType.value = "percent";
      fields.accountValue.value = "25000";
      fields.riskPercent.value = "1";
      fields.riskAmount.value = "250";
      document.getElementById("direction").value = "long";
      fields.entryPrice.value = "100";
      fields.stopPrice.value = "95";
      document.getElementById("sharePrecision").value = "whole";
      fields.positionCurrency.value = "USD";
      calculate();
    }, 0);
  });

  calculate();
})();
