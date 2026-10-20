(() => {
  "use strict";

  const form = document.getElementById("allocationForm");
  if (!form) return;

  const inputBody = document.getElementById("allocationInputs");
  const outputBody = document.getElementById("allocationRows");
  const error = document.getElementById("allocationError");
  const results = document.getElementById("allocationResults");
  const chart = document.getElementById("allocationChart");
  const colors = [
    "#34866d",
    "#d59a4d",
    "#718fc4",
    "#9a78b5",
    "#d47769",
    "#53a9a1",
    "#a0a74f",
    "#d281a2",
    "#71808b",
    "#bb7651",
  ];
  let nextId = 1;
  const sampleRows = [
    { name: "US stocks", current: 5000, target: 50 },
    { name: "International stocks", current: 2000, target: 20 },
    { name: "Bonds", current: 2500, target: 25 },
    { name: "Cash", current: 500, target: 5 },
  ];

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
    document.querySelectorAll(".allocation-currency").forEach((element) => {
      element.textContent = symbol;
    });
  }

  function addInputRow(item = { name: "", current: 0, target: 0 }) {
    if (inputBody.rows.length >= 10) return;
    const row = document.createElement("tr");
    row.dataset.id = String(nextId++);

    const nameCell = document.createElement("td");
    const name = document.createElement("input");
    name.className = "control allocation-name";
    name.type = "text";
    name.maxLength = 40;
    name.value = item.name;
    name.setAttribute("aria-label", "Asset category");
    nameCell.appendChild(name);

    const valueCell = document.createElement("td");
    const valueWrap = document.createElement("span");
    valueWrap.className = "allocation-input-wrap";
    const symbol = document.createElement("span");
    symbol.className = "allocation-currency";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = currencySymbol();
    const value = document.createElement("input");
    value.className = "control allocation-current";
    value.type = "number";
    value.min = "0";
    value.max = "1000000000000";
    value.step = "any";
    value.inputMode = "decimal";
    value.value = String(item.current);
    value.setAttribute(
      "aria-label",
      `${item.name || "Category"} current value`,
    );
    valueWrap.append(symbol, value);
    valueCell.appendChild(valueWrap);

    const targetCell = document.createElement("td");
    const targetWrap = document.createElement("span");
    targetWrap.className = "allocation-input-wrap allocation-target-wrap";
    const target = document.createElement("input");
    target.className = "control allocation-target";
    target.type = "number";
    target.min = "0";
    target.max = "100";
    target.step = "any";
    target.inputMode = "decimal";
    target.value = String(item.target);
    target.setAttribute(
      "aria-label",
      `${item.name || "Category"} target percentage`,
    );
    const percent = document.createElement("span");
    percent.className = "allocation-suffix";
    percent.setAttribute("aria-hidden", "true");
    percent.textContent = "%";
    targetWrap.append(target, percent);
    targetCell.appendChild(targetWrap);

    const actionCell = document.createElement("td");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "allocation-remove";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${item.name || "category"}`);
    remove.addEventListener("click", () => {
      if (inputBody.rows.length > 1) {
        row.remove();
        refreshRemoveButtons();
        calculate();
      }
    });
    actionCell.appendChild(remove);

    row.append(nameCell, valueCell, targetCell, actionCell);
    inputBody.appendChild(row);
    refreshRemoveButtons();
  }

  function refreshRemoveButtons() {
    [...inputBody.querySelectorAll(".allocation-remove")].forEach((button) => {
      button.disabled = inputBody.rows.length <= 1;
    });
  }

  function currencySymbol() {
    return document.querySelector(".allocation-currency")?.textContent || "$";
  }

  function readRows() {
    return [...inputBody.rows].map((row, index) => ({
      id: row.dataset.id,
      index,
      name: row.querySelector(".allocation-name").value.trim(),
      current: Number(row.querySelector(".allocation-current").value),
      target: Number(row.querySelector(".allocation-target").value),
      valid: [...row.querySelectorAll("input")].every(
        (input) => input.validity.valid,
      ),
    }));
  }

  function calculate() {
    const currency = document.getElementById("allocationCurrency").value;
    updateCurrencySymbols(currency);
    const rows = readRows();
    const contributionInput = document.getElementById("newContribution");
    const validContribution = contributionInput.validity.valid;
    const validNames = rows.every((row) => row.name.length > 0);
    const targetTotal = rows.reduce((sum, row) => sum + row.target, 0);
    const targetsAddUp = Math.abs(targetTotal - 100) < 0.000001;
    const validRows = rows.every((row) => row.valid);

    [...inputBody.rows].forEach((row, index) => {
      const nameField = row.querySelector(".allocation-name");
      const targetField = row.querySelector(".allocation-target");
      nameField.setAttribute("aria-invalid", String(!rows[index].name));
      targetField.setAttribute(
        "aria-invalid",
        String(!rows[index].valid || !targetsAddUp),
      );
      row
        .querySelector(".allocation-current")
        .setAttribute("aria-invalid", String(!rows[index].valid));
    });
    contributionInput.setAttribute("aria-invalid", String(!validContribution));
    document
      .getElementById("allocationCurrency")
      .removeAttribute("aria-invalid");

    document.getElementById("targetTotal").textContent =
      `Target total: ${targetTotal.toFixed(1)}%`;
    document
      .getElementById("targetTotal")
      .classList.toggle("is-valid", targetsAddUp);
    document
      .getElementById("targetTotal")
      .classList.toggle("is-invalid", !targetsAddUp);
    if (!validContribution || !validRows || !validNames || !targetsAddUp) {
      results.hidden = true;
      error.hidden = false;
      error.textContent = !targetsAddUp
        ? `Target percentages must add to 100% (currently ${targetTotal.toFixed(1)}%).`
        : !validNames
          ? "Enter a name for every category."
          : "Check the highlighted values and ensure they are within range.";
      return;
    }

    error.hidden = true;
    results.hidden = false;
    const total = rows.reduce((sum, row) => sum + row.current, 0);
    const contribution = Number(contributionInput.value);
    const totalAfterContribution = total + contribution;
    let totalAbsoluteDrift = 0;
    let largestOverweight = null;
    let largestUnderweight = null;
    const enriched = rows.map((row) => {
      const currentWeight = total > 0 ? (row.current / total) * 100 : 0;
      const drift = currentWeight - row.target;
      totalAbsoluteDrift += Math.abs(drift);
      if (
        drift > 0 &&
        (!largestOverweight || drift > largestOverweight.drift)
      ) {
        largestOverweight = { ...row, drift };
      }
      if (
        drift < 0 &&
        (!largestUnderweight || drift < largestUnderweight.drift)
      ) {
        largestUnderweight = { ...row, drift };
      }
      const targetValue = (totalAfterContribution * row.target) / 100;
      const shortfall = Math.max(0, targetValue - row.current);
      return {
        ...row,
        currentWeight,
        drift,
        targetValue,
        shortfall,
        difference: targetValue - row.current,
      };
    });
    const totalShortfall = enriched.reduce(
      (sum, row) => sum + row.shortfall,
      0,
    );
    enriched.forEach((row) => {
      const allocatedContribution =
        totalShortfall > 0 && contribution <= totalShortfall
          ? (contribution * row.shortfall) / totalShortfall
          : Math.max(0, row.shortfall) +
            (Math.max(0, contribution - totalShortfall) * row.target) / 100;
      row.afterContribution = row.current + allocatedContribution;
    });

    document.getElementById("portfolioTotal").textContent = formatMoney(
      totalAfterContribution,
      currency,
    );
    document.getElementById("portfolioTotalLabel").textContent =
      contribution > 0 ? "Portfolio after contribution" : "Current portfolio";
    document.getElementById("allocationDrift").textContent =
      `${(total > 0 ? totalAbsoluteDrift : 100).toFixed(1)}% total allocation drift`;
    document.getElementById("categoryCount").textContent = String(rows.length);
    document.getElementById("largestOverweight").textContent = largestOverweight
      ? `${largestOverweight.name} (+${largestOverweight.drift.toFixed(1)}%)`
      : "None";
    document.getElementById("largestUnderweight").textContent =
      largestUnderweight
        ? `${largestUnderweight.name} (${largestUnderweight.drift.toFixed(1)}%)`
        : "None";
    document.getElementById("targetWeightSummary").textContent =
      `${targetTotal.toFixed(1)}%`;
    document.getElementById("contributionSummary").textContent =
      contribution > 0
        ? `${formatMoney(contribution, currency)} new contribution included in the total; suggested cash goes to underweight categories first, with any remainder allocated by target weights.`
        : "Add a contribution above to estimate allocating new cash by target weights.";

    renderTable(enriched, total, contribution, currency);
    renderChart(enriched, totalAfterContribution, currency);
  }

  function renderTable(rows, total, contribution, currency) {
    outputBody.replaceChildren();
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      const values = [
        row.name,
        `${row.currentWeight.toFixed(1)}%`,
        `${row.target.toFixed(1)}%`,
        `${row.drift > 0 ? "+" : ""}${row.drift.toFixed(1)}%`,
        formatMoney(row.targetValue, currency),
        formatMoney(row.difference, currency),
        contribution > 0 ? formatMoney(row.afterContribution, currency) : "—",
      ];
      values.forEach((value, index) => {
        const cell = document.createElement(index === 0 ? "th" : "td");
        cell.textContent = value;
        if (index === 0) cell.scope = "row";
        if (index === 3)
          cell.className =
            row.drift > 0.05
              ? "is-overweight"
              : row.drift < -0.05
                ? "is-underweight"
                : "";
        tr.appendChild(cell);
      });
      outputBody.appendChild(tr);
    });
  }

  function renderChart(rows, total, currency) {
    const width = 720;
    const rowHeight = 58;
    const height = Math.max(150, 78 + rows.length * rowHeight);
    const left = 150;
    const right = 48;
    const plotWidth = width - left - right;
    const barHeight = 8;
    const bars = rows
      .map((row, index) => {
        const y = 38 + index * rowHeight;
        const currentWidth = (plotWidth * row.currentWeight) / 100;
        const afterWeight =
          total > 0 ? (row.afterContribution / total) * 100 : 0;
        const afterWidth = (plotWidth * afterWeight) / 100;
        const targetX = left + (plotWidth * row.target) / 100;
        const color = colors[index % colors.length];
        const safeName = escapeHtml(row.name);
        return `<text class="allocation-chart-label" x="${left - 12}" y="${y + 14}" text-anchor="end">${safeName}</text><rect class="allocation-chart-bar-bg" x="${left}" y="${y}" width="${plotWidth}" height="${barHeight}" rx="4"/><rect x="${left}" y="${y}" width="${currentWidth}" height="${barHeight}" rx="4" fill="${color}"/><rect class="allocation-contribution-bar" x="${left}" y="${y + 13}" width="${plotWidth}" height="${barHeight}" rx="4"/><rect x="${left}" y="${y + 13}" width="${afterWidth}" height="${barHeight}" rx="4" fill="${color}" opacity=".55"/><line class="allocation-target-marker" x1="${targetX}" y1="${y - 4}" x2="${targetX}" y2="${y + 25}"/><text class="allocation-chart-value" x="${width - right + 6}" y="${y + 7}">${row.currentWeight.toFixed(0)}% → ${afterWeight.toFixed(0)}%</text>`;
      })
      .join("");
    const legend = document.getElementById("allocationLegend");
    legend.replaceChildren();
    rows.forEach((row, index) => {
      const item = document.createElement("span");
      item.className = "allocation-legend-item";
      const swatch = document.createElement("i");
      swatch.style.backgroundColor = colors[index % colors.length];
      swatch.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = `${row.name} — ${row.target.toFixed(1)}% target`;
      item.append(swatch, label);
      legend.appendChild(item);
    });
    chart.setAttribute("viewBox", `0 0 ${width} ${height}`);
    chart.innerHTML = `<title id="allocationChartTitle">Current and post-contribution portfolio weights against targets</title><desc id="allocationChartDescription">Dark solid bars show current weights. Tinted bars show projected weights after the contribution. Vertical markers indicate target percentages. Portfolio value after the contribution: ${formatMoney(total, currency)}.</desc><defs><pattern id="contributionPattern" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#edf2ef"/><rect width="2" height="6" fill="#c6d4cc"/></pattern></defs><text class="allocation-chart-axis" x="${left}" y="20">Current weight · After contribution · marker = target</text>${bars}`;
  }

  function escapeHtml(value) {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  document.getElementById("addCategory").addEventListener("click", () => {
    if (inputBody.rows.length >= 10) {
      error.hidden = false;
      error.textContent = "You can add up to 10 categories.";
      return;
    }
    addInputRow();
    calculate();
  });
  form.addEventListener("input", calculate);
  form.addEventListener("change", calculate);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });
  form.addEventListener("reset", (event) => {
    event.preventDefault();
    window.setTimeout(() => {
      inputBody.replaceChildren();
      nextId = 1;
      sampleRows.forEach(addInputRow);
      document.getElementById("newContribution").value = "0";
      document.getElementById("allocationCurrency").value = "USD";
      calculate();
    }, 0);
  });

  sampleRows.forEach(addInputRow);
  calculate();
})();
