(function () {
  "use strict";

  const kpiContainer = document.getElementById("kpiCards");
  const tableBody = document.getElementById("dashboardRows");
  const generatedAtEl = document.getElementById("generatedAt");

  function fmt(value, digits) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }
    return Number(value).toFixed(digits);
  }

  function badgeClass(result) {
    if (result === "target2" || result === "target1") return "good";
    if (result === "stopped") return "bad";
    if (result === "pending") return "pending";
    return "neutral";
  }

  async function loadDashboard() {
    const response = await fetch("/data/nasdaq-series/dashboard-summary.json");
    if (!response.ok) {
      throw new Error("Failed to load dashboard summary.");
    }

    const data = await response.json();
    renderKpis(data.kpis || {});
    renderRows(data.rows || []);

    if (generatedAtEl && data.generatedAt) {
      const dt = new Date(data.generatedAt);
      generatedAtEl.textContent = `Last generated: ${dt.toLocaleString()}`;
    }
  }

  function renderKpis(kpis) {
    if (!kpiContainer) return;

    const cards = [
      { label: "Reports", value: kpis.totalReports ?? 0 },
      { label: "Scored Days", value: kpis.scoredReports ?? 0 },
      { label: "Total R", value: fmt(kpis.totalR ?? 0, 2) },
      { label: "Avg R", value: fmt(kpis.avgR ?? 0, 2) },
      {
        label: "Hit Rate",
        value: `${fmt((kpis.hitRate ?? 0) * 100, 1)}%`,
      },
      { label: "No-Trade Days", value: kpis.noTradeDays ?? 0 },
    ];

    kpiContainer.innerHTML = cards
      .map(
        (c) => `
        <article class="kpi-card">
          <div class="kpi-value">${c.value}</div>
          <div class="kpi-label">${c.label}</div>
        </article>
      `,
      )
      .join("");
  }

  function renderRows(rows) {
    if (!tableBody) return;

    if (!rows.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">No rows found yet. Build at least one report first.</td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td>${row.date}</td>
            <td>${row.decision}</td>
            <td>${fmt(row.entryLow, 2)} - ${fmt(row.entryHigh, 2)}</td>
            <td>${fmt(row.stop, 2)}</td>
            <td>${fmt(row.target1, 2)}</td>
            <td>${fmt(row.avgConfidence, 1)}</td>
            <td>${row.scoreR === null ? "-" : fmt(row.scoreR, 2)}</td>
            <td><span class="pill ${badgeClass(row.result)}">${row.result}</span></td>
          </tr>
        `,
      )
      .join("");
  }

  loadDashboard().catch((error) => {
    console.error(error);
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">Could not load dashboard data. Run build_nasdaq_dashboard_summary.py first.</td>
        </tr>
      `;
    }
  });
})();
