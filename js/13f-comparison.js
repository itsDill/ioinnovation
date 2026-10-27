(function () {
  "use strict";

  const elements = {
    status: document.getElementById("datasetStatus"),
    filerA: document.getElementById("filerA"),
    filerB: document.getElementById("filerB"),
    comparisonCardB: document.getElementById("comparisonCardB"),
    modeHint: document.getElementById("modeHint"),
    examples: document.getElementById("comparisonExamples"),
    singleMode: document.getElementById("singleMode"),
    compareMode: document.getElementById("compareMode"),
    filingA: document.getElementById("filingA"),
    filingB: document.getElementById("filingB"),
    metaA: document.getElementById("filerAMeta"),
    metaB: document.getElementById("filerBMeta"),
    periodNotice: document.getElementById("periodNotice"),
    sharedCount: document.getElementById("sharedCount"),
    primaryMetricLabel: document.getElementById("primaryMetricLabel"),
    primaryMetricFoot: document.getElementById("primaryMetricFoot"),
    totalA: document.getElementById("totalA"),
    totalB: document.getElementById("totalB"),
    totalALabel: document.getElementById("totalALabel"),
    totalBLabel: document.getElementById("totalBLabel"),
    periodA: document.getElementById("periodA"),
    periodB: document.getElementById("periodB"),
    positionCount: document.getElementById("positionCount"),
    positionCountLabel: document.getElementById("positionCountLabel"),
    positionCountFoot: document.getElementById("positionCountFoot"),
    insightPrimaryLabel: document.getElementById("insightPrimaryLabel"),
    insightPrimaryValue: document.getElementById("insightPrimaryValue"),
    insightPrimaryFoot: document.getElementById("insightPrimaryFoot"),
    insightPrimaryMeter: document.getElementById("insightPrimaryMeter"),
    insightOptionsValue: document.getElementById("insightOptionsValue"),
    insightOptionsFoot: document.getElementById("insightOptionsFoot"),
    insightOptionsMeter: document.getElementById("insightOptionsMeter"),
    insightLeaders: document.getElementById("insightLeaders"),
    insightsCaveat: document.getElementById("insightsCaveat"),
    columnA: document.getElementById("columnA"),
    columnB: document.getElementById("columnB"),
    weightA: document.getElementById("weightA"),
    weightB: document.getElementById("weightB"),
    search: document.getElementById("positionSearch"),
    filter: document.getElementById("positionFilter"),
    visibleCount: document.getElementById("visibleCount"),
    previousPage: document.getElementById("previousPage"),
    nextPage: document.getElementById("nextPage"),
    pageStatus: document.getElementById("pageStatus"),
    rows: document.getElementById("comparisonRows"),
    resultsStatus: document.getElementById("resultsStatus"),
    export: document.getElementById("exportCsv"),
    share: document.getElementById("shareComparison"),
    downloadShareCard: document.getElementById("downloadShareCard"),
    shareCardDescription: document.getElementById("shareCardDescription"),
    holdingsChart: document.getElementById("holdingsChart"),
    holdingsChartTitle: document.getElementById("holdingsChartTitle"),
    holdingsChartCaption: document.getElementById("holdingsChartCaption"),
    historyChart: document.getElementById("historyChart"),
    historyChartNote: document.getElementById("historyChartNote"),
    concentrationChart: document.getElementById("concentrationChart"),
    concentrationNote: document.getElementById("concentrationNote"),
  };

  const numberFormat = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  });
  const compactCurrencyFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  });
  const compactShareFormat = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  let institutions = [];
  let latestByFiler = new Map();
  let filingsByFiler = new Map();
  let snapshotCache = new Map();
  let mode = "single";
  let currentRows = [];
  let filteredRows = [];
  let currentPage = 0;
  const pageSize = 50;
  let currentA = null;
  let currentB = null;
  let currentSnapshotA = null;
  let currentSnapshotB = null;
  let comparisonRequest = 0;

  function formatMoney(value) {
    return compactCurrencyFormat.format(Number(value) || 0);
  }

  function formatFullMoney(value) {
    return `$${numberFormat.format(Number(value) || 0)}`;
  }

  function formatShares(value) {
    const shares = Number(value) || 0;
    return `${compactShareFormat.format(shares)} ${shares === 1 ? "share" : "shares"}`;
  }

  function setMeter(element, value) {
    element.style.width = `${Math.max(0, Math.min(100, Number(value) || 0))}%`;
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");
  }

  function makeOption(filer) {
    const option = document.createElement("option");
    option.value = filer.slug;
    option.textContent = filer.name;
    return option;
  }

  function makeFilingOption(filing) {
    const option = document.createElement("option");
    option.value = filing.accession;
    const formLabel = filing.form === "13F-HR/A" ? " · amended" : "";
    option.textContent = `${filing.report_period || "Period not listed"} · filed ${filing.filing_date || "date unavailable"}${formLabel}`;
    return option;
  }

  function groupHoldings(rows) {
    const grouped = new Map();

    rows.forEach((row) => {
      const cusip = normalize(row.cusip);
      const issuer = normalize(row.issuer);
      const title = normalize(row.title_of_class);
      const putCall = normalize(row.put_call);
      const key = cusip
        ? `${cusip}|${putCall}`
        : `${issuer}|${title}|${putCall}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.value += Number(row.value_usd) || 0;
        existing.shares += Number(row.shares) || 0;
        if (!existing.ticker && row.ticker) existing.ticker = row.ticker;
        if (existing.discretion !== (row.discretion || ""))
          existing.discretion = "Multiple";
        return;
      }

      grouped.set(key, {
        key,
        cusip: row.cusip || "",
        issuer: row.issuer || "Unknown issuer",
        ticker: row.ticker || "",
        title: row.title_of_class || "",
        putCall: row.put_call || "",
        discretion: row.discretion || "",
        value: Number(row.value_usd) || 0,
        shares: Number(row.shares) || 0,
        filingUrl: row.filing_url || "",
      });
    });

    return Array.from(grouped.values());
  }

  function fillSelectors() {
    if (!institutions.length)
      throw new Error("No manually entered or baseline 13F data is available.");
    elements.filerA.replaceChildren(...institutions.map(makeOption));
    elements.filerB.replaceChildren(...institutions.map(makeOption));
    populateExamples();
    elements.compareMode.disabled = institutions.length < 2;

    const params = new URLSearchParams(window.location.search);
    setMode(
      params.get("mode") === "compare" || params.has("b")
        ? "compare"
        : "single",
    );
    const requestedA = params.get("a");
    const requestedB = params.get("b");
    const validSlugs = new Set(institutions.map((filer) => filer.slug));

    elements.filerA.value = validSlugs.has(requestedA)
      ? requestedA
      : institutions[0].slug;
    elements.filerB.value = validSlugs.has(requestedB)
      ? requestedB
      : institutions.find((filer) => filer.slug !== elements.filerA.value)
          ?.slug || elements.filerA.value;
    if (elements.filerA.value === elements.filerB.value) {
      elements.filerB.value =
        institutions.find((filer) => filer.slug !== elements.filerA.value)
          ?.slug || elements.filerA.value;
    }

    populateFilingSelector(
      elements.filingA,
      elements.filerA.value,
      params.get("pa"),
    );
    populateFilingSelector(
      elements.filingB,
      elements.filerB.value,
      params.get("pb"),
    );

    [
      elements.filerA,
      elements.filerB,
      elements.search,
      elements.filter,
    ].forEach((control) => {
      control.disabled = false;
    });
    setMode(mode);
    elements.share.disabled = false;
  }

  function populateExamples() {
    const examples = [
      {
        label: "Berkshire portfolio",
        mode: "single",
        a: "berkshire-hathaway",
      },
      {
        label: "Berkshire vs Bridgewater",
        mode: "compare",
        a: "berkshire-hathaway",
        b: "bridgewater-associates",
      },
      {
        label: "Berkshire vs Pershing Square",
        mode: "compare",
        a: "berkshire-hathaway",
        b: "pershing-square-capital",
      },
      {
        label: "Scion vs Berkshire",
        mode: "compare",
        a: "scion-asset-management",
        b: "berkshire-hathaway",
      },
    ].filter((example) =>
      example.mode === "single"
        ? institutions.some((item) => item.slug === example.a)
        : institutions.some((item) => item.slug === example.a) &&
          institutions.some((item) => item.slug === example.b),
    );

    elements.examples.replaceChildren();
    examples.forEach((example) => {
      const button = document.createElement("button");
      button.className = "comparison-example-chip";
      button.type = "button";
      button.dataset.mode = example.mode;
      button.dataset.filerA = example.a;
      if (example.b) button.dataset.filerB = example.b;
      button.textContent = example.label;
      elements.examples.appendChild(button);
    });
  }

  function applyExample(button) {
    const filerA = institutions.find(
      (item) => item.slug === button.dataset.filerA,
    );
    const filerB = institutions.find(
      (item) => item.slug === button.dataset.filerB,
    );
    if (!filerA) return;

    elements.filerA.value = filerA.slug;
    populateFilingSelector(elements.filingA, filerA.slug, null);
    if (filerB) {
      elements.filerB.value = filerB.slug;
      populateFilingSelector(elements.filingB, filerB.slug, null);
    }
    setMode(button.dataset.mode);
    buildDashboard();
  }

  function setMode(nextMode) {
    mode = nextMode === "compare" ? "compare" : "single";
    const isComparison = mode === "compare";
    if (
      isComparison &&
      elements.filerA.value &&
      elements.filerA.value === elements.filerB.value
    ) {
      const otherFiler = institutions.find(
        (filer) => filer.slug !== elements.filerA.value,
      );
      if (otherFiler) {
        elements.filerB.value = otherFiler.slug;
        populateFilingSelector(elements.filingB, otherFiler.slug, null);
      }
    }
    elements.comparisonCardB.hidden = !isComparison;
    elements.singleMode.setAttribute("aria-pressed", String(!isComparison));
    elements.compareMode.setAttribute("aria-pressed", String(isComparison));
    elements.modeHint.textContent = isComparison
      ? "Choose two managers and a filing period for each. You can compare positions, portfolio weights, and filing history."
      : "Choose a manager and filing period to explore one reported portfolio. Switch to compare two portfolios side by side.";
    document
      .querySelector(".comparison-page")
      .classList.toggle("single-mode", !isComparison);
    document.getElementById("compare-heading").textContent = isComparison
      ? "Select two institutions"
      : "Select an institution";
    document.getElementById("results-heading").textContent = isComparison
      ? "Side-by-side holdings"
      : "Reported holdings";
    elements.filter.querySelector('[value="shared"]').hidden = !isComparison;
    elements.filter.querySelector('[value="a-only"]').hidden = !isComparison;
    elements.filter.querySelector('[value="b-only"]').hidden = !isComparison;
    elements.filingB.disabled =
      !isComparison || elements.filingB.options.length === 0;
    elements.filerB.disabled = !isComparison || institutions.length < 2;
    elements.share.textContent = isComparison
      ? "Copy comparison link"
      : "Copy dashboard link";
    if (!isComparison && elements.filter.value !== "all")
      elements.filter.value = "all";
  }

  function populateFilingSelector(select, slug, requestedAccession) {
    const filings = filingsByFiler.get(slug) || [];
    select.replaceChildren(...filings.map(makeFilingOption));
    if (!filings.length) {
      select.add(new Option("No archived filing available", ""));
      select.disabled = true;
      return;
    }
    const requestedExists = filings.some(
      (filing) => filing.accession === requestedAccession,
    );
    select.value = requestedExists
      ? requestedAccession
      : filings.find(
          (filing) =>
            filing.accession ===
            institutions.find((item) => item.slug === slug)?.accession,
        )?.accession || filings[0].accession;
    select.disabled = false;
  }

  function setMeta(element, filer) {
    element.replaceChildren();
    element.append(
      `Report period: ${filer.report_period || "Not listed"} · Filed: ${filer.filing_date || "Not listed"} · `,
    );
    if (filer.filing_url) {
      const sourceLink = document.createElement("a");
      sourceLink.href = filer.filing_url;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
      sourceLink.textContent = "SEC source";
      element.appendChild(sourceLink);
    } else {
      element.append("SEC source unavailable");
    }
  }

  function updateShareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("a", elements.filerA.value);
    if (mode === "compare") {
      url.searchParams.set("mode", "compare");
      url.searchParams.set("b", elements.filerB.value);
      if (elements.filingB.value)
        url.searchParams.set("pb", elements.filingB.value);
      else url.searchParams.delete("pb");
    } else {
      url.searchParams.delete("mode");
      url.searchParams.delete("b");
      url.searchParams.delete("pb");
    }
    if (elements.filingA.value)
      url.searchParams.set("pa", elements.filingA.value);
    else url.searchParams.delete("pa");
    window.history.replaceState({}, "", url);
  }

  function createCell(text, className) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = text;
    return cell;
  }

  function renderPositionCell(row) {
    const cell = document.createElement("td");
    cell.dataset.label = "Position";
    const name = document.createElement("span");
    name.className = "comparison-position-name";
    name.textContent = row.issuer;
    cell.appendChild(name);

    const detail = [
      row.ticker,
      row.cusip ? `CUSIP ${row.cusip}` : row.title,
      row.putCall ? `${row.putCall} option` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    if (detail) {
      const subline = document.createElement("span");
      subline.className = "comparison-position-detail";
      subline.textContent = detail;
      cell.appendChild(subline);
    }

    return cell;
  }

  function renderValue(value) {
    if (value === null) return document.createTextNode("—");
    const span = document.createElement("span");
    span.className = "comparison-value";
    span.textContent = formatMoney(value);
    span.title = formatFullMoney(value);
    span.setAttribute("aria-label", formatFullMoney(value));
    return span;
  }

  function appendPositionDetails(cell, position) {
    if (!position) return;
    const detail = document.createElement("span");
    detail.className = "comparison-cell-detail";
    const parts = [formatShares(position.shares)];
    if (position.putCall) parts.push(`${position.putCall} option`);
    if (position.discretion) parts.push(position.discretion);
    detail.textContent = parts.join(" · ");
    cell.appendChild(detail);
  }

  function renderWeight(position, label, series) {
    const cell = document.createElement("td");
    cell.dataset.label = label;
    if (!position) {
      cell.textContent = "—";
      return cell;
    }
    const weight = Math.max(0, Math.min(100, position.weight));
    const meter = document.createElement("span");
    meter.className = `comparison-weight-meter comparison-weight-meter-${series}`;
    meter.setAttribute("aria-hidden", "true");
    const fill = document.createElement("span");
    fill.style.width = `${weight}%`;
    meter.appendChild(fill);
    const value = document.createElement("span");
    value.className = "comparison-weight-value";
    value.textContent = `${position.weight.toFixed(2)}%`;
    cell.append(meter, value);
    return cell;
  }

  function renderRows() {
    const query = normalize(elements.search.value);
    const filter = elements.filter.value;
    filteredRows = currentRows.filter((row) => {
      const matchesQuery =
        !query ||
        normalize(
          `${row.issuer} ${row.ticker} ${row.cusip} ${row.title}`,
        ).includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "shared" && row.a && row.b) ||
        (filter === "a-only" && row.a && !row.b) ||
        (filter === "b-only" && !row.a && row.b);
      return matchesQuery && matchesFilter;
    });

    const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    currentPage = Math.min(currentPage, pageCount - 1);
    const first = currentPage * pageSize;
    const visibleRows = filteredRows.slice(first, first + pageSize);
    const fragment = document.createDocumentFragment();
    visibleRows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.appendChild(renderPositionCell(row));
      const valueA = row.a ? row.a.value : null;
      const valueB = row.b ? row.b.value : null;
      const valueCellA = createCell("");
      valueCellA.dataset.label = currentA.name;
      tr.appendChild(valueCellA);
      tr.lastElementChild.appendChild(renderValue(valueA));
      appendPositionDetails(valueCellA, row.a);
      tr.appendChild(renderWeight(row.a, `${currentA.name} weight`, "a"));
      const valueCellB = createCell("");
      valueCellB.dataset.label = currentB?.name || "Portfolio B";
      tr.appendChild(valueCellB);
      tr.lastElementChild.appendChild(renderValue(valueB));
      appendPositionDetails(valueCellB, row.b);
      tr.appendChild(
        renderWeight(row.b, `${currentB?.name || "Portfolio B"} weight`, "b"),
      );

      const matchCell = document.createElement("td");
      matchCell.dataset.label = "Match";
      const badge = document.createElement("span");
      const isShared = Boolean(row.a && row.b);
      badge.className = `comparison-match${isShared ? " comparison-match-shared" : ""}`;
      badge.textContent = currentB
        ? isShared
          ? "Shared"
          : row.a
            ? "A only"
            : "B only"
        : "Reported";
      matchCell.appendChild(badge);
      tr.appendChild(matchCell);
      fragment.appendChild(tr);
    });

    elements.rows.replaceChildren(fragment);
    if (!visibleRows.length) {
      const tr = document.createElement("tr");
      const td = createCell(
        "No positions match these filters.",
        "comparison-empty",
      );
      td.colSpan = 6;
      tr.appendChild(td);
      elements.rows.appendChild(tr);
    }
    const firstVisible = filteredRows.length ? first + 1 : 0;
    const lastVisible = Math.min(
      first + visibleRows.length,
      filteredRows.length,
    );
    elements.visibleCount.textContent = `Showing ${numberFormat.format(firstVisible)}–${numberFormat.format(lastVisible)} of ${numberFormat.format(filteredRows.length)} matching positions`;
    elements.pageStatus.textContent = `Page ${currentPage + 1} of ${pageCount}`;
    elements.previousPage.disabled = currentPage === 0;
    elements.nextPage.disabled = currentPage >= pageCount - 1;
  }

  function renderPortfolioInsights(holdingsA, holdingsB, totalA, totalB) {
    const rankedA = holdingsA.slice().sort((a, b) => b.value - a.value);
    const rankedB = holdingsB.slice().sort((a, b) => b.value - a.value);
    const topTenValueA = rankedA
      .slice(0, 10)
      .reduce((sum, item) => sum + item.value, 0);
    const topTenShareA = totalA ? (topTenValueA / totalA) * 100 : 0;

    if (currentB) {
      const overlapWeight = currentRows.reduce((sum, row) => {
        if (!row.a || !row.b) return sum;
        return sum + Math.min(row.a.weight, row.b.weight);
      }, 0);
      elements.insightPrimaryLabel.textContent = "Reported-weight overlap";
      elements.insightPrimaryValue.textContent = `${overlapWeight.toFixed(1)}%`;
      elements.insightPrimaryFoot.textContent =
        "Sum of the smaller portfolio weight for each matched position";
      setMeter(elements.insightPrimaryMeter, overlapWeight);
      elements.insightsCaveat.textContent =
        "Overlap is calculated from matched reported positions and portfolio weights. Different reporting periods, option types, and 13F omissions can affect interpretation; this is not a measure of performance or current exposure.";
    } else {
      elements.insightPrimaryLabel.textContent = "Top 10 concentration";
      elements.insightPrimaryValue.textContent = `${topTenShareA.toFixed(1)}%`;
      elements.insightPrimaryFoot.textContent = `${formatMoney(topTenValueA)} across ${Math.min(10, rankedA.length)} largest reported positions`;
      setMeter(elements.insightPrimaryMeter, topTenShareA);
      elements.insightsCaveat.textContent =
        "These calculations summarize disclosed 13F line items only. A 13F is a delayed, partial snapshot; it does not show a complete portfolio or current positions.";
    }

    const optionStats = [
      { name: currentA.name, holdings: holdingsA, total: totalA },
      ...(currentB
        ? [{ name: currentB.name, holdings: holdingsB, total: totalB }]
        : []),
    ].map((portfolio) => {
      const optionRows = portfolio.holdings.filter((item) => item.putCall);
      const optionValue = optionRows.reduce((sum, item) => sum + item.value, 0);
      return {
        ...portfolio,
        optionRows,
        optionValue,
        optionShare: portfolio.total
          ? (optionValue / portfolio.total) * 100
          : 0,
      };
    });
    elements.insightOptionsValue.textContent = optionStats
      .map((item) => `${item.optionShare.toFixed(1)}%`)
      .join(" / ");
    elements.insightOptionsFoot.textContent =
      optionStats
        .map(
          (item) =>
            `${item.name}: ${item.optionRows.length} lines · ${formatMoney(item.optionValue)} reported value`,
        )
        .join(" | ") + " · reported line value, not option contract notional";
    setMeter(
      elements.insightOptionsMeter,
      Math.max(...optionStats.map((item) => item.optionShare)),
    );

    const leaderGroups = [
      { label: currentA.name, holdings: rankedA, total: totalA, color: "a" },
      ...(currentB
        ? [
            {
              label: currentB.name,
              holdings: rankedB,
              total: totalB,
              color: "b",
            },
          ]
        : []),
    ];
    elements.insightLeaders.replaceChildren();
    leaderGroups.forEach((group) => {
      const leader = group.holdings[0];
      if (!leader) return;
      const row = document.createElement("div");
      row.className = `insight-leader insight-leader-${group.color}`;
      const copy = document.createElement("span");
      copy.className = "insight-leader-copy";
      const name = document.createElement("strong");
      name.textContent = leader.ticker || leader.issuer;
      const meta = document.createElement("small");
      const leaderWeight = group.total ? (leader.value / group.total) * 100 : 0;
      meta.textContent = `${group.label} · ${formatShares(leader.shares)} · ${leaderWeight.toFixed(1)}% of filing`;
      copy.append(name, meta);
      const value = document.createElement("b");
      value.textContent = formatMoney(leader.value);
      value.title = formatFullMoney(leader.value);
      row.append(copy, value);
      elements.insightLeaders.appendChild(row);
    });
    if (!elements.insightLeaders.childElementCount) {
      elements.insightLeaders.textContent = "No reported positions available.";
    }
  }

  function svgNode(name, attributes = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) =>
      node.setAttribute(key, value),
    );
    return node;
  }

  function svgText(svg, x, y, text, className = "dashboard-svg-label") {
    const label = svgNode("text", { x, y, class: className });
    label.textContent = text;
    svg.appendChild(label);
    return label;
  }

  function renderHoldingsChart(holdingsA, holdingsB, totalA, totalB) {
    const isComparison = mode === "compare";
    elements.holdingsChart.replaceChildren();
    elements.holdingsChartTitle.textContent = isComparison
      ? "Largest positions across selected portfolios"
      : "Largest reported positions";
    elements.holdingsChartCaption.textContent = isComparison
      ? "Share of each reported 13F portfolio"
      : "Share of reported 13F value";

    const mapA = new Map(holdingsA.map((holding) => [holding.key, holding]));
    const mapB = new Map(holdingsB.map((holding) => [holding.key, holding]));
    const keys = new Set([...mapA.keys(), ...mapB.keys()]);
    const positions = Array.from(keys, (key) => {
      const a = mapA.get(key);
      const b = mapB.get(key);
      return {
        label: (a || b).ticker || (a || b).issuer,
        issuer: (a || b).issuer,
        a: a ? (totalA ? (a.value / totalA) * 100 : 0) : 0,
        b: b ? (totalB ? (b.value / totalB) * 100 : 0) : 0,
      };
    })
      .sort((a, b) => Math.max(b.a, b.b) - Math.max(a.a, a.b))
      .slice(0, 8);

    if (!positions.length) {
      elements.holdingsChart.textContent =
        "No holding data is available for this filing.";
      return;
    }

    const rowHeight = isComparison ? 54 : 42;
    const width = 760;
    const height = positions.length * rowHeight + (isComparison ? 52 : 20);
    const chart = svgNode("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "presentation",
      class: "dashboard-svg",
    });
    const labelWidth = 160;
    const plotWidth = 530;
    const maxValue = Math.max(
      1,
      ...positions.flatMap((item) => [item.a, item.b]),
    );
    const scale = plotWidth / maxValue;
    if (isComparison) {
      chart.appendChild(
        svgNode("rect", {
          x: labelWidth,
          y: 12,
          width: 11,
          height: 11,
          rx: 3,
          class: "chart-bar-a",
        }),
      );
      svgText(
        chart,
        labelWidth + 16,
        22,
        currentA.name,
        "dashboard-svg-legend",
      );
      chart.appendChild(
        svgNode("rect", {
          x: 390,
          y: 12,
          width: 11,
          height: 11,
          rx: 3,
          class: "chart-bar-b",
        }),
      );
      svgText(chart, 406, 22, currentB.name, "dashboard-svg-legend");
    }
    positions.forEach((position, index) => {
      const y = (isComparison ? 46 : 15) + index * rowHeight;
      svgText(
        chart,
        0,
        y + (isComparison ? 13 : 17),
        position.label.slice(0, 22),
      );
      if (position.label !== position.issuer) {
        svgText(
          chart,
          0,
          y + (isComparison ? 29 : 31),
          position.issuer.slice(0, 28),
          "dashboard-svg-sub-label",
        );
      }
      const barY = y + (isComparison ? 2 : 3);
      chart.appendChild(
        svgNode("rect", {
          x: labelWidth,
          y: barY,
          width: Math.max(position.a ? 2 : 0, position.a * scale),
          height: 13,
          rx: 4,
          class: "chart-bar-a",
        }),
      );
      svgText(
        chart,
        labelWidth + position.a * scale + 7,
        barY + 11,
        `${position.a.toFixed(1)}%`,
        "dashboard-svg-value",
      );
      if (isComparison) {
        chart.appendChild(
          svgNode("rect", {
            x: labelWidth,
            y: barY + 17,
            width: Math.max(position.b ? 2 : 0, position.b * scale),
            height: 13,
            rx: 4,
            class: "chart-bar-b",
          }),
        );
        svgText(
          chart,
          labelWidth + position.b * scale + 7,
          barY + 28,
          `${position.b.toFixed(1)}%`,
          "dashboard-svg-value",
        );
      }
    });
    elements.holdingsChart.appendChild(chart);
  }

  function renderConcentration(holdingsA, holdingsB, totalA, totalB) {
    const portfolios = [
      {
        name: currentA.name,
        holdings: holdingsA,
        total: totalA,
        color: "chart-bar-a",
      },
    ];
    if (mode === "compare")
      portfolios.push({
        name: currentB.name,
        holdings: holdingsB,
        total: totalB,
        color: "chart-bar-b",
      });
    elements.concentrationChart.replaceChildren();
    const chart = svgNode("svg", {
      viewBox: `0 0 560 ${portfolios.length * 176 + 8}`,
      role: "presentation",
      class: "dashboard-svg",
    });
    portfolios.forEach((portfolio, index) => {
      const ranked = portfolio.holdings
        .slice()
        .sort((a, b) => b.value - a.value);
      const topHoldings = ranked.slice(0, 4);
      const topValue = topHoldings.reduce((sum, item) => sum + item.value, 0);
      const remainder = Math.max(0, portfolio.total - topValue);
      const segments = [
        ...topHoldings.map((holding) => ({
          label: holding.ticker || holding.issuer,
          value: holding.value,
        })),
        ...(remainder > 0
          ? [{ label: "Other positions", value: remainder }]
          : []),
      ].filter((item) => item.value > 0);
      const share = portfolio.total ? (topValue / portfolio.total) * 100 : 0;
      const y = index * 176 + 16;
      const centerX = 82;
      const centerY = y + 66;
      const radius = 48;
      const circumference = 2 * Math.PI * radius;
      chart.appendChild(
        svgNode("circle", {
          cx: centerX,
          cy: centerY,
          r: radius,
          class: "donut-track",
        }),
      );
      let offset = 0;
      segments.forEach((segment, segmentIndex) => {
        const segmentLength =
          (segment.value / (portfolio.total || 1)) * circumference;
        chart.appendChild(
          svgNode("circle", {
            cx: centerX,
            cy: centerY,
            r: radius,
            class: `donut-segment donut-segment-${segmentIndex % 5}`,
            "stroke-dasharray": `${segmentLength} ${circumference - segmentLength}`,
            "stroke-dashoffset": -offset,
            transform: `rotate(-90 ${centerX} ${centerY})`,
          }),
        );
        offset += segmentLength;
      });
      svgText(
        chart,
        centerX,
        centerY - 2,
        `${share.toFixed(0)}%`,
        "donut-center-value",
      ).setAttribute("text-anchor", "middle");
      svgText(
        chart,
        centerX,
        centerY + 13,
        "TOP 4",
        "donut-center-label",
      ).setAttribute("text-anchor", "middle");
      svgText(
        chart,
        154,
        y + 13,
        portfolio.name.slice(0, 42),
        "donut-portfolio-name",
      );
      segments.forEach((segment, segmentIndex) => {
        const legendY = y + 36 + segmentIndex * 25;
        chart.appendChild(
          svgNode("circle", {
            cx: 159,
            cy: legendY - 3,
            r: 4,
            class: `donut-legend-dot donut-segment-${segmentIndex % 5}`,
          }),
        );
        const percentage = portfolio.total
          ? (segment.value / portfolio.total) * 100
          : 0;
        svgText(
          chart,
          170,
          legendY,
          `${segment.label.slice(0, 25)} · ${percentage.toFixed(1)}%`,
          "donut-legend-label",
        );
      });
    });
    elements.concentrationChart.appendChild(chart);
    elements.concentrationNote.textContent =
      "Top four positions are shown individually; the remaining reported value is grouped as other. 13F filings are incomplete snapshots, not full portfolios.";
  }

  function drawShareCard() {
    if (!currentA) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) {
      elements.resultsStatus.textContent =
        "Could not create the share image in this browser.";
      return;
    }

    const gradient = context.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#11152b");
    gradient.addColorStop(0.55, "#172b3b");
    gradient.addColorStop(1, "#251b38");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(54, 220, 190, 0.12)";
    context.beginPath();
    context.arc(1110, 35, 245, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#39dec0";
    context.fillRect(64, 62, 54, 6);
    context.fillStyle = "#a9b5ca";
    context.font = "700 18px system-ui, sans-serif";
    context.fillText("IO INNOVATION  /  13F SNAPSHOT", 64, 104);
    context.fillStyle = "#f6f7fb";
    context.font = "800 42px system-ui, sans-serif";
    context.fillText(
      currentB ? "Portfolio comparison" : "Portfolio snapshot",
      64,
      164,
    );
    context.fillStyle = "#b9c3d3";
    context.font = "500 18px system-ui, sans-serif";
    context.fillText("Reported holdings · historical SEC disclosure", 64, 197);

    const columns = currentB
      ? [
          {
            filer: currentA,
            value: currentA.total_value_usd,
            key: "a",
            color: "#42d9c2",
            x: 64,
          },
          {
            filer: currentB,
            value: currentB.total_value_usd,
            key: "b",
            color: "#ff8b72",
            x: 618,
          },
        ]
      : [
          {
            filer: currentA,
            value: currentA.total_value_usd,
            key: "a",
            color: "#42d9c2",
            x: 64,
          },
        ];
    const panelWidth = currentB ? 518 : 1072;
    columns.forEach((column) => {
      context.fillStyle = "rgba(255,255,255,0.07)";
      context.beginPath();
      context.roundRect(column.x, 230, panelWidth, 310, 22);
      context.fill();
      context.fillStyle = column.color;
      context.beginPath();
      context.arc(column.x + 26, 270, 7, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#ffffff";
      context.font = "700 22px system-ui, sans-serif";
      context.fillText(column.filer.name, column.x + 46, 278, panelWidth - 72);
      context.fillStyle = "#aebbd0";
      context.font = "500 15px system-ui, sans-serif";
      context.fillText(
        `Quarter ended ${column.filer.report_period || "not listed"}`,
        column.x + 24,
        308,
      );
      context.fillStyle = "#ffffff";
      context.font = "800 34px system-ui, sans-serif";
      context.fillText(formatMoney(column.value), column.x + 24, 359);
      context.fillStyle = "#aebbd0";
      context.font = "600 13px system-ui, sans-serif";
      context.fillText("LARGEST REPORTED POSITIONS", column.x + 24, 395);

      const portfolioRows = currentRows
        .filter((row) => row[column.key])
        .sort((left, right) => right[column.key].value - left[column.key].value)
        .slice(0, currentB ? 3 : 4);
      portfolioRows.forEach((row, rowIndex) => {
        const rowY = 430 + rowIndex * 27;
        const holding = row[column.key];
        context.fillStyle = "#e8edf5";
        context.font = "600 15px system-ui, sans-serif";
        context.fillText(
          `${row.ticker || row.issuer}  ·  ${holding.weight.toFixed(1)}%`,
          column.x + 24,
          rowY,
          panelWidth - 48,
        );
      });
    });

    context.fillStyle = "#aebbd0";
    context.font = "500 14px system-ui, sans-serif";
    context.fillText(
      "13F filings are delayed, partial disclosures—not current positions or investment advice.",
      64,
      585,
    );
    context.fillStyle = "#e7edf5";
    context.font = "700 14px system-ui, sans-serif";
    context.textAlign = "right";
    context.fillText("ioinnovationfund.com", 1136, 585);
    context.textAlign = "left";

    const link = document.createElement("a");
    link.download = currentB
      ? `13f-snapshot-${currentA.slug}-vs-${currentB.slug}.png`
      : `13f-snapshot-${currentA.slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    elements.resultsStatus.textContent =
      "Your share card has been downloaded as a PNG image.";
  }

  function renderHistoryChart() {
    const selectedFilers = [currentA];
    if (mode === "compare") selectedFilers.push(currentB);
    const series = selectedFilers.filter(Boolean).map((filer, index) => {
      const latestByPeriod = new Map();
      (filingsByFiler.get(filer.slug) || []).forEach((item) => {
        if (!item.report_period || !(Number(item.total_value_usd) > 0)) return;
        const existing = latestByPeriod.get(item.report_period);
        if (
          !existing ||
          String(item.filing_date || "") > String(existing.filing_date || "")
        ) {
          latestByPeriod.set(item.report_period, item);
        }
      });
      const filings = Array.from(latestByPeriod.values()).sort((a, b) =>
        a.report_period.localeCompare(b.report_period),
      );
      return {
        name: filer.name,
        filings,
        color: index ? "chart-line-b" : "chart-line-a",
      };
    });
    elements.historyChart.replaceChildren();
    const allValues = series.flatMap((item) =>
      item.filings.map((filing) => Number(filing.total_value_usd)),
    );
    if (!allValues.length) {
      elements.historyChart.textContent =
        "No historical filing values are available yet.";
      elements.historyChartNote.textContent =
        "Add earlier quarter filings to the manual data file to build a trend.";
      return;
    }
    const chart = svgNode("svg", {
      viewBox: "0 0 620 250",
      role: "presentation",
      class: "dashboard-svg",
    });
    const left = 64,
      right = 602,
      top = 28,
      bottom = 195;
    const max = Math.max(...allValues) * 1.08;
    const reportPeriods = Array.from(
      new Set(
        series.flatMap((line) =>
          line.filings.map((filing) => filing.report_period),
        ),
      ),
    ).sort();
    const periodValues = reportPeriods.map((period) =>
      new Date(`${period}T00:00:00Z`).getTime(),
    );
    const minPeriod = Math.min(...periodValues);
    const maxPeriod = Math.max(...periodValues);
    const periodSpan = maxPeriod - minPeriod || 1;
    [0, 0.5, 1].forEach((fraction) => {
      const y = bottom - fraction * (bottom - top);
      chart.appendChild(
        svgNode("line", {
          x1: left,
          y1: y,
          x2: right,
          y2: y,
          class: "chart-grid-line",
        }),
      );
      svgText(
        chart,
        0,
        y + 4,
        formatMoney(max * fraction),
        "dashboard-svg-axis",
      );
    });
    series.forEach((line) => {
      const points = line.filings.map((filing) => {
        const reportDate = new Date(
          `${filing.report_period}T00:00:00Z`,
        ).getTime();
        const x =
          left + ((reportDate - minPeriod) / periodSpan) * (right - left);
        const y =
          bottom - (Number(filing.total_value_usd) / max) * (bottom - top);
        return { x, y, filing };
      });
      if (points.length > 1)
        chart.appendChild(
          svgNode("polyline", {
            points: points.map((point) => `${point.x},${point.y}`).join(" "),
            class: line.color,
          }),
        );
      points.forEach((point) => {
        chart.appendChild(
          svgNode("circle", {
            cx: point.x,
            cy: point.y,
            r: 4.5,
            class: line.color,
          }),
        );
      });
    });
    const labelIndexes =
      reportPeriods.length <= 6
        ? reportPeriods.map((_, index) => index)
        : Array.from(
            new Set([
              0,
              Math.round((reportPeriods.length - 1) / 2),
              reportPeriods.length - 1,
            ]),
          );
    labelIndexes.forEach((index) => {
      const x =
        left +
        ((periodValues[index] - minPeriod) / periodSpan) * (right - left);
      svgText(
        chart,
        x,
        222,
        reportPeriods[index].slice(0, 7),
        "dashboard-svg-axis",
      );
    });
    elements.historyChart.appendChild(chart);
    elements.historyChartNote.textContent = series.every(
      (item) => item.filings.length < 2,
    )
      ? "Only one filing period is available for each selected manager. Add earlier quarters to the manual data file to show trends."
      : "Values are the reported holdings totals in each selected SEC filing; they are not investment returns.";
  }

  async function buildDashboard() {
    const requestId = ++comparisonRequest;
    const filerA = institutions.find(
      (filer) => filer.slug === elements.filerA.value,
    );
    const filerB =
      mode === "compare"
        ? institutions.find((filer) => filer.slug === elements.filerB.value)
        : null;
    if (!filerA || (mode === "compare" && !filerB)) return;

    elements.resultsStatus.textContent = "Loading selected filing snapshots…";
    let snapshotA;
    let snapshotB = null;
    try {
      snapshotA = await loadSnapshot(filerA, elements.filingA.value);
      if (filerB)
        snapshotB = await loadSnapshot(filerB, elements.filingB.value);
    } catch (error) {
      if (requestId === comparisonRequest) {
        elements.resultsStatus.textContent = `Selected filing data could not be loaded: ${error.message}`;
      }
      return;
    }
    if (requestId !== comparisonRequest) return;
    currentSnapshotA = snapshotA;
    currentSnapshotB = snapshotB;
    currentA = snapshotA.filer;
    currentB = snapshotB?.filer || null;

    const holdingsA = groupHoldings(snapshotA.holdings || []);
    const holdingsB = snapshotB ? groupHoldings(snapshotB.holdings || []) : [];
    const mapA = new Map(holdingsA.map((holding) => [holding.key, holding]));
    const mapB = new Map(holdingsB.map((holding) => [holding.key, holding]));
    const keys = new Set([...mapA.keys(), ...mapB.keys()]);
    const totalA =
      Number(currentA.total_value_usd) ||
      holdingsA.reduce((sum, holding) => sum + holding.value, 0);
    const totalB = currentB
      ? Number(currentB.total_value_usd) ||
        holdingsB.reduce((sum, holding) => sum + holding.value, 0)
      : 0;

    currentRows = Array.from(keys, (key) => {
      const a = mapA.get(key) || null;
      const b = mapB.get(key) || null;
      const source = a || b;
      return {
        key,
        issuer: source.issuer,
        ticker: source.ticker,
        cusip: source.cusip,
        title: source.title,
        a: a ? { ...a, weight: totalA ? (a.value / totalA) * 100 : 0 } : null,
        b: b ? { ...b, weight: totalB ? (b.value / totalB) * 100 : 0 } : null,
      };
    }).sort((left, right) => {
      const leftShared = left.a && left.b ? 1 : 0;
      const rightShared = right.a && right.b ? 1 : 0;
      if (leftShared !== rightShared) return rightShared - leftShared;
      return (
        Math.max(right.a?.value || 0, right.b?.value || 0) -
        Math.max(left.a?.value || 0, left.b?.value || 0)
      );
    });

    elements.metaA.textContent = "";
    setMeta(elements.metaA, currentA);
    elements.metaB.textContent = "";
    if (currentB) setMeta(elements.metaB, currentB);
    elements.totalA.textContent = formatMoney(totalA);
    elements.totalA.title = formatFullMoney(totalA);
    elements.periodA.textContent = `${holdingsA.length} grouped positions · ${currentA.report_period || "Period not listed"}`;
    elements.totalALabel.textContent = currentB
      ? `${currentA.name} reported value`
      : "Reported 13F value";
    elements.columnA.textContent = currentA.name;
    elements.columnB.textContent = currentB?.name || "Institution B";
    elements.weightA.textContent = currentB ? "A weight" : "Portfolio weight";
    elements.weightB.textContent = "B weight";
    const sharedPositions = currentRows.filter((row) => row.a && row.b).length;
    if (currentB) {
      elements.totalBLabel.textContent = `${currentB.name} reported value`;
      elements.totalB.textContent = formatMoney(totalB);
      elements.totalB.title = formatFullMoney(totalB);
      elements.periodB.textContent = `${holdingsB.length} grouped positions · ${currentB.report_period || "Period not listed"}`;
      elements.primaryMetricLabel.textContent = "Shared positions";
      elements.primaryMetricFoot.textContent =
        "Matched by CUSIP where available";
      elements.positionCountLabel.textContent = "Positions in comparison";
      elements.positionCount.textContent = numberFormat.format(
        currentRows.length,
      );
      elements.positionCountFoot.textContent =
        "Combined distinct reported positions";
      elements.sharedCount.textContent = numberFormat.format(sharedPositions);
    } else {
      const rankedHoldings = holdingsA
        .slice()
        .sort((a, b) => b.value - a.value);
      const largest = rankedHoldings[0];
      const topFiveValue = rankedHoldings
        .slice(0, 5)
        .reduce((sum, item) => sum + item.value, 0);
      elements.totalBLabel.textContent = "Largest reported position";
      elements.totalB.textContent = largest ? formatMoney(largest.value) : "—";
      elements.totalB.title = largest
        ? `${largest.issuer}: ${formatFullMoney(largest.value)}`
        : "No position data";
      elements.periodB.textContent = largest?.issuer || "No holding data";
      elements.primaryMetricLabel.textContent = "Reported positions";
      elements.primaryMetricFoot.textContent = currentA.filing_date
        ? `Filing date ${currentA.filing_date}`
        : "Positions disclosed in this filing";
      elements.positionCountLabel.textContent = "Top five concentration";
      elements.positionCount.textContent = `${totalA ? ((topFiveValue / totalA) * 100).toFixed(1) : "0.0"}%`;
      elements.positionCountFoot.textContent = "Share of reported 13F value";
      elements.sharedCount.textContent = numberFormat.format(holdingsA.length);
    }

    const periodsMatch = Boolean(
      currentB &&
      currentA.report_period &&
      currentA.report_period === currentB.report_period,
    );
    const oldestPeriod = [currentA.report_period, currentB?.report_period]
      .filter(Boolean)
      .sort()[0];
    const periodAge = oldestPeriod
      ? (Date.now() - new Date(`${oldestPeriod}T00:00:00Z`).getTime()) /
        (1000 * 60 * 60 * 24)
      : 0;
    const staleNote =
      periodAge > 365
        ? " At least one selected report period is more than a year old; treat it as historical context."
        : "";
    elements.periodNotice.textContent = !currentB
      ? `${currentA.name} · quarter ended ${currentA.report_period || "not listed"}. 13F holdings are delayed snapshots, not current positions.`
      : (periodsMatch
          ? `Both filings report the quarter ended ${currentA.report_period}. Filed dates may still differ; these are reported snapshots, not current positions.`
          : `Different reporting periods: ${currentA.name} reports ${currentA.report_period || "an unspecified period"}; ${currentB.name} reports ${currentB.report_period || "an unspecified period"}. Treat these as separate snapshots, not a like-for-like comparison.`) +
        staleNote;

    renderHoldingsChart(holdingsA, holdingsB, totalA, totalB);
    renderConcentration(holdingsA, holdingsB, totalA, totalB);
    renderPortfolioInsights(holdingsA, holdingsB, totalA, totalB);
    renderHistoryChart();

    elements.export.disabled = false;
    elements.downloadShareCard.disabled = false;
    elements.shareCardDescription.textContent = currentB
      ? `${currentA.name} vs ${currentB.name} · ${currentA.report_period || "period not listed"} and ${currentB.report_period || "period not listed"}. Download a snapshot card to share.`
      : `${currentA.name} · quarter ended ${currentA.report_period || "not listed"}. Download a snapshot card with the largest reported positions.`;
    elements.resultsStatus.textContent = currentB
      ? "Open the SEC source links beside each selected filing to verify the reported positions."
      : "Open the SEC source link beside this filing to verify the reported positions.";
    updateShareUrl();
    renderRows();
  }

  async function loadSnapshot(filer, accession) {
    const filings = filingsByFiler.get(filer.slug) || [];
    const filing =
      filings.find((item) => item.accession === accession) || filings[0];
    if (!filing) {
      return { filer, holdings: latestByFiler.get(filer.slug) || [] };
    }
    const cacheKey = `${filer.slug}:${filing.accession}`;
    if (snapshotCache.has(cacheKey)) return snapshotCache.get(cacheKey);

    if (filing.snapshot_url) {
      const response = await fetch(filing.snapshot_url, {
        cache: "force-cache",
      });
      if (!response.ok)
        throw new Error(`Could not load filing snapshot (${response.status})`);
      const snapshot = await response.json();
      snapshotCache.set(cacheKey, snapshot);
      return snapshot;
    }

    const latest = latestByFiler.get(filer.slug) || [];
    const snapshot = {
      filer: { ...filer, ...filing },
      holdings: latest.filter((row) => row.accession === filing.accession),
    };
    snapshotCache.set(cacheKey, snapshot);
    return snapshot;
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    const query = normalize(elements.search.value);
    const filter = elements.filter.value;
    const rows = currentRows.filter((row) => {
      const matchesQuery =
        !query ||
        normalize(
          `${row.issuer} ${row.ticker} ${row.cusip} ${row.title}`,
        ).includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "shared" && row.a && row.b) ||
        (filter === "a-only" && row.a && !row.b) ||
        (filter === "b-only" && !row.a && row.b);
      return matchesQuery && matchesFilter;
    });
    const headings = [
      "Issuer",
      "Ticker",
      "CUSIP",
      `${currentA.name} value (USD)`,
      `${currentA.name} weight (%)`,
      `${currentA.name} reported shares`,
      `${currentA.name} put/call`,
      `${currentA.name} discretion`,
    ];
    if (currentB)
      headings.push(
        `${currentB.name} value (USD)`,
        `${currentB.name} weight (%)`,
        `${currentB.name} reported shares`,
        `${currentB.name} put/call`,
        `${currentB.name} discretion`,
        "Match",
      );
    const lines = [
      headings,
      ...rows.map((row) => [
        row.issuer,
        row.ticker,
        row.cusip,
        row.a?.value ?? "",
        row.a ? row.a.weight.toFixed(4) : "",
        row.a?.shares ?? "",
        row.a?.putCall ?? "",
        row.a?.discretion ?? "",
        ...(currentB
          ? [
              row.b?.value ?? "",
              row.b ? row.b.weight.toFixed(4) : "",
              row.b?.shares ?? "",
              row.b?.putCall ?? "",
              row.b?.discretion ?? "",
              row.a && row.b ? "Shared" : row.a ? "A only" : "B only",
            ]
          : []),
      ]),
    ]
      .map((line) => line.map(csvEscape).join(","))
      .join("\r\n");

    const blob = new Blob([`\uFEFF${lines}`], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = currentB
      ? `13f-comparison-${currentA.slug}-vs-${currentB.slug}.csv`
      : `13f-holdings-${currentA.slug}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  async function copyComparisonLink() {
    updateShareUrl();
    try {
      await navigator.clipboard.writeText(window.location.href);
      elements.resultsStatus.textContent = "Comparison link copied.";
    } catch (error) {
      elements.resultsStatus.textContent = `Copy this comparison link: ${window.location.href}`;
    }
  }

  async function loadData() {
    try {
      const [latestResponse, manualResponse] = await Promise.all([
        fetch("/data/holdings-latest.json", { cache: "no-cache" }).catch(
          () => null,
        ),
        fetch("/data/manual/filings.json", { cache: "no-cache" }).catch(
          () => null,
        ),
      ]);
      const data = latestResponse?.ok
        ? await latestResponse.json()
        : { filers: [], holdings: [] };
      const manual = manualResponse?.ok
        ? await manualResponse.json()
        : { filings: [] };
      const latestFilers = Array.isArray(data.filers) ? data.filers : [];
      const sourceRows = Array.isArray(data.holdings) ? data.holdings : [];
      latestFilers.forEach((filer) => {
        latestByFiler.set(
          filer.slug,
          sourceRows.filter((row) => row.filer_slug === filer.slug),
        );
      });

      const manualFilings = Array.isArray(manual.filings) ? manual.filings : [];
      const bySlug = new Map();
      const addInstitution = (record) => {
        if (!record?.slug) return;
        const existing = bySlug.get(record.slug) || { ...record, filings: [] };
        bySlug.set(record.slug, {
          ...existing,
          ...record,
          filings: existing.filings,
        });
      };
      latestFilers.forEach(addInstitution);
      manualFilings.forEach((entry) => addInstitution(entry.filer));

      latestFilers.forEach((filer) => {
        if (!filer.accession) return;
        const legacyFiling = {
          accession: filer.accession,
          report_period: filer.report_period,
          filing_date: filer.filing_date,
          filing_url: filer.filing_url,
          form: filer.form || "13F-HR",
          total_value_usd: filer.total_value_usd,
        };
        const legacyHoldings = latestByFiler.get(filer.slug) || [];
        snapshotCache.set(`${filer.slug}:${filer.accession}`, {
          filer: { ...filer, ...legacyFiling },
          holdings: legacyHoldings,
        });
        filingsByFiler.set(filer.slug, [legacyFiling]);
      });
      manualFilings.forEach((entry) => {
        if (
          !entry.filer?.slug ||
          !entry.accession ||
          !Array.isArray(entry.holdings)
        )
          return;
        const slug = entry.filer.slug;
        const filing = {
          accession: entry.accession,
          report_period: entry.report_period,
          filing_date: entry.filing_date,
          filing_url: entry.filing_url,
          form: entry.amended ? "13F-HR/A" : "13F-HR",
          amended: Boolean(entry.amended),
          total_value_usd: entry.holdings.reduce(
            (sum, holding) => sum + (Number(holding.value_usd) || 0),
            0,
          ),
        };
        const snapshot = {
          filer: { ...entry.filer, ...filing },
          holdings: entry.holdings.map((holding) => ({
            ...holding,
            filing_url: holding.filing_url || entry.filing_url,
          })),
        };
        snapshotCache.set(`${slug}:${entry.accession}`, snapshot);
        const filings = filingsByFiler.get(slug) || [];
        const previousIndex = filings.findIndex(
          (item) => item.accession === entry.accession,
        );
        if (previousIndex >= 0) filings.splice(previousIndex, 1);
        filings.push(filing);
        filingsByFiler.set(slug, filings);
      });
      institutions = Array.from(bySlug.values())
        .map((filer) => {
          const filings = filingsByFiler.get(filer.slug) || [];
          filings.sort((a, b) =>
            `${b.report_period || ""}${b.filing_date || ""}`.localeCompare(
              `${a.report_period || ""}${a.filing_date || ""}`,
            ),
          );
          filingsByFiler.set(filer.slug, filings);
          const latest = filings[0];
          return { ...filer, ...latest, filings };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      fillSelectors();
      const filingCount = Array.from(filingsByFiler.values()).reduce(
        (total, filings) => total + filings.length,
        0,
      );
      elements.status.textContent = `${manualFilings.length} manually curated filings · ${institutions.length} institutions · ${filingCount} available snapshots${data.generated_at ? ` · baseline ${data.generated_at.slice(0, 10)}` : ""}`;
      buildDashboard();
    } catch (error) {
      elements.status.textContent = "Filing data could not be loaded.";
      elements.rows.replaceChildren();
      const tr = document.createElement("tr");
      const td = createCell(
        `${error.message} Try reloading, or browse the source holdings data.`,
        "comparison-empty",
      );
      td.colSpan = 6;
      tr.appendChild(td);
      elements.rows.appendChild(tr);
    }
  }

  elements.filerA.addEventListener("change", () => {
    if (mode === "compare" && elements.filerA.value === elements.filerB.value) {
      elements.filerB.value =
        institutions.find((filer) => filer.slug !== elements.filerA.value)
          ?.slug || elements.filerA.value;
    }
    populateFilingSelector(elements.filingA, elements.filerA.value, null);
    if (mode === "compare")
      populateFilingSelector(elements.filingB, elements.filerB.value, null);
    buildDashboard();
  });
  elements.filerB.addEventListener("change", () => {
    if (elements.filerA.value === elements.filerB.value) {
      elements.filerA.value =
        institutions.find((filer) => filer.slug !== elements.filerB.value)
          ?.slug || elements.filerB.value;
    }
    populateFilingSelector(elements.filingA, elements.filerA.value, null);
    populateFilingSelector(elements.filingB, elements.filerB.value, null);
    buildDashboard();
  });
  elements.filingA.addEventListener("change", buildDashboard);
  elements.filingB.addEventListener("change", buildDashboard);
  elements.singleMode.addEventListener("click", () => {
    setMode("single");
    buildDashboard();
  });
  elements.compareMode.addEventListener("click", () => {
    setMode("compare");
    buildDashboard();
  });
  elements.search.addEventListener("input", () => {
    currentPage = 0;
    renderRows();
  });
  elements.filter.addEventListener("change", () => {
    currentPage = 0;
    renderRows();
  });
  elements.previousPage.addEventListener("click", () => {
    currentPage = Math.max(0, currentPage - 1);
    renderRows();
  });
  elements.nextPage.addEventListener("click", () => {
    currentPage += 1;
    renderRows();
  });
  elements.export.addEventListener("click", exportCsv);
  elements.share.addEventListener("click", copyComparisonLink);
  elements.examples.addEventListener("click", (event) => {
    const button = event.target.closest(".comparison-example-chip");
    if (button) applyExample(button);
  });
  elements.downloadShareCard.addEventListener("click", drawShareCard);

  loadData();
})();
