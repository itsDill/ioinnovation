(() => {
  "use strict";

  const chart = document.getElementById("holdingsChart");
  const selector = document.getElementById("quarterSelect");
  const summary = document.getElementById("chartSummary");
  if (!chart || !selector || !summary) return;

  const holdings = [
    { ticker: "ALPH", q1: 40, q2: 55 },
    { ticker: "BETA", q1: 30, q2: 24 },
    { ticker: "GAMM", q1: 20, q2: 31 },
    { ticker: "DELT", q1: 10, q2: 12 },
  ];
  const svgNamespace = "http://www.w3.org/2000/svg";
  const width = 720;
  const height = 330;
  const left = 76;
  const right = 22;
  const top = 22;
  const bottom = 48;

  function svgElement(name, attributes = {}, text = "") {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });
    if (text) element.textContent = text;
    return element;
  }

  function draw() {
    const view = selector.value;
    const isChange = view === "change";
    const values = holdings.map((holding) =>
      view === "q1"
        ? holding.q1
        : view === "q2"
          ? holding.q2
          : holding.q2 - holding.q1,
    );
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    const maximum = isChange ? 20 : Math.ceil(Math.max(...values) / 20) * 20;
    const minimum = isChange ? -20 : 0;
    const valueRange = maximum - minimum;
    const y = (value) => top + ((maximum - value) / valueRange) * chartHeight;
    const baseline = y(0);

    chart.replaceChildren();
    chart.append(
      svgElement(
        "title",
        { id: "chartTitle" },
        isChange
          ? "Fictional reported-value changes between quarters"
          : `Fictional portfolio values for ${view === "q1" ? "Quarter 1" : "Quarter 2"}`,
      ),
      svgElement(
        "desc",
        { id: "chartDesc" },
        "Interactive example chart with four made-up holdings. Values are in millions of dollars and are not SEC filing data.",
      ),
    );

    const ticks = isChange
      ? [-20, -10, 0, 10, 20]
      : [0, maximum / 4, maximum / 2, maximum * 0.75, maximum];
    ticks.forEach((tick) => {
      const tickY = y(tick);
      chart.appendChild(
        svgElement("line", {
          x1: left,
          y1: tickY,
          x2: width - right,
          y2: tickY,
          class:
            tick === 0 && isChange
              ? "explainer-zero-line"
              : "explainer-gridline",
        }),
      );
      chart.appendChild(
        svgElement(
          "text",
          {
            x: left - 10,
            y: tickY + 4,
            "text-anchor": "end",
            class: "explainer-axis-label",
          },
          isChange
            ? `${tick < 0 ? "−" : ""}$${Math.abs(tick)}M`
            : `$${tick.toFixed(0)}M`,
        ),
      );
    });

    const slotWidth = chartWidth / holdings.length;
    const barWidth = Math.min(66, slotWidth * 0.48);
    holdings.forEach((holding, index) => {
      const value = values[index];
      const barY = isChange ? Math.min(y(value), baseline) : y(value);
      const barHeight = Math.max(2, Math.abs(baseline - y(value)));
      const x = left + slotWidth * index + (slotWidth - barWidth) / 2;
      const bar = svgElement("rect", {
        x,
        y: barY,
        width: barWidth,
        height: barHeight,
        rx: 7,
        fill: isChange
          ? value >= 0
            ? "#269a73"
            : "#c65f68"
          : view === "q1"
            ? "#6686bd"
            : "#269a73",
      });
      bar.appendChild(
        svgElement(
          "title",
          {},
          `${holding.ticker}: ${value < 0 ? "−" : ""}$${Math.abs(value)} million`,
        ),
      );
      chart.appendChild(bar);
      chart.appendChild(
        svgElement(
          "text",
          {
            x: x + barWidth / 2,
            y: isChange
              ? value >= 0
                ? barY - 8
                : barY + barHeight + 17
              : barY - 8,
            "text-anchor": "middle",
            class: "explainer-axis-label",
          },
          `${value < 0 ? "−" : ""}$${Math.abs(value)}M`,
        ),
      );
      chart.appendChild(
        svgElement(
          "text",
          {
            x: x + barWidth / 2,
            y: height - 18,
            "text-anchor": "middle",
            class: "explainer-category-label",
          },
          holding.ticker,
        ),
      );
    });

    const total = values.reduce((sum, value) => sum + value, 0);
    if (isChange) {
      summary.textContent = `Fictional example only. The combined reported value changes by ${total < 0 ? "−" : "+"}$${Math.abs(total)} million. A value change alone does not show how much was bought or sold.`;
    } else {
      summary.textContent = `Fictional example only. ${view === "q1" ? "Quarter 1" : "Quarter 2"} reported values total $${total} million. Changes in reported value do not prove that the manager bought or sold the same amount.`;
    }
  }

  selector.addEventListener("change", draw);
  draw();
})();
