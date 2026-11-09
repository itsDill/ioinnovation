(() => {
  "use strict";

  const datasets = [
    { file: "ports.json", label: "Port" },
    { file: "industrial-projects.json", label: "Industrial project" },
    { file: "data-centres.json", label: "Data centre" },
  ];
  const params = new URLSearchParams(window.location.search);
  const assetId = params.get("id");
  const elements = {
    category: document.querySelector("#assetCategory"),
    name: document.querySelector("#assetName"),
    country: document.querySelector("#assetCountry"),
    description: document.querySelector("#assetDescription"),
    facts: document.querySelector("#assetFacts"),
    sources: document.querySelector("#assetSources"),
    status: document.querySelector("#assetStatus"),
    mapLink: document.querySelector("#mapLink"),
  };

  function addFact(label, value) {
    if (value === undefined || value === null || value === "") return;
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = String(value);
    row.append(term, description);
    elements.facts.append(row);
  }

  function renderSources(sources) {
    elements.sources.replaceChildren();
    sources.forEach((source) => {
      let url;
      try {
        url = new URL(source.url);
      } catch {
        return;
      }
      if (!["https:", "http:"].includes(url.protocol)) return;
      const item = document.createElement("li");
      const link = document.createElement("a");
      const meta = document.createElement("span");
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `${source.publisher || "Source"} · ${source.title || source.url}`;
      meta.className = "asset-source-meta";
      const dates = [];
      if (source.published_date)
        dates.push(`Published ${source.published_date}`);
      if (source.accessed_date) dates.push(`Accessed ${source.accessed_date}`);
      meta.textContent = dates.join(" · ");
      item.append(link);
      if (dates.length) item.append(meta);
      elements.sources.append(item);
    });
  }

  function render(record, dataset, label) {
    document.title = `${record.name} | IO Innovation Fund Asset Profile`;
    elements.category.textContent = `${label} · source-linked asset profile`;
    elements.name.textContent = record.name;
    elements.country.textContent = record.country;
    elements.description.textContent = record.description;
    elements.mapLink.href = `/physical/map.html?focus=${encodeURIComponent(record.id)}`;

    addFact("Asset type", record.project_type || label);
    addFact("Operator", record.operator);
    addFact("Data status", record.status || "Not specified");
    addFact(
      "Coordinates",
      `${record.coordinates[0]}, ${record.coordinates[1]}`,
    );
    addFact("Pin precision", record.coordinate_precision);
    addFact("Project status", record.project_status_note);
    if (record.annual_throughput) {
      const {
        year,
        teu,
        yoy_growth_percent: growth,
      } = record.annual_throughput;
      addFact(
        "Annual throughput",
        `${(teu / 1_000_000).toFixed(2)} million TEU (${year})`,
      );
      if (Number.isFinite(growth))
        addFact("Year-over-year change", `${growth > 0 ? "+" : ""}${growth}%`);
    }
    addFact("Dataset updated", dataset.last_updated);
    renderSources(Array.isArray(record.sources) ? record.sources : []);
    elements.status.textContent =
      "Asset details loaded from the atlas dataset.";
  }

  async function loadProfile() {
    if (!assetId) throw new Error("This profile link is missing an asset ID.");
    const responses = await Promise.all(
      datasets.map(async (definition) => {
        const response = await fetch(`/data/logistics/${definition.file}`, {
          cache: "no-cache",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Could not load ${definition.file}.`);
        return { definition, dataset: await response.json() };
      }),
    );
    for (const { definition, dataset } of responses) {
      const record = dataset.records.find((entry) => entry.id === assetId);
      if (record) {
        render(record, dataset, definition.label);
        return;
      }
    }
    throw new Error(
      "This asset profile could not be found in the atlas datasets.",
    );
  }

  loadProfile().catch((error) => {
    elements.category.textContent = "Logistics atlas · asset profile";
    elements.name.textContent = "Asset profile unavailable";
    elements.description.textContent = error.message;
    elements.status.textContent =
      "Return to the Logistics Atlas and select an asset to try again.";
  });
})();
