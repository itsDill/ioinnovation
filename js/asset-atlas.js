(() => {
  "use strict";

  const atlasItems = [
    {
      id: "mines-processing",
      title: "Mines & processing",
      layer: "physical",
      group: "Extraction",
      region: "Sample region A",
      x: 21,
      y: 33,
    },
    {
      id: "ports-trade",
      title: "Ports & trade links",
      layer: "physical",
      group: "Logistics",
      region: "Sample region B",
      x: 36,
      y: 62,
    },
    {
      id: "manufacturing",
      title: "Factories & supply chains",
      layer: "physical",
      group: "Industry",
      region: "Sample region C",
      x: 50,
      y: 31,
    },
    {
      id: "energy-infrastructure",
      title: "Energy infrastructure",
      layer: "physical",
      group: "Energy",
      region: "Sample region D",
      x: 54,
      y: 57,
    },
    {
      id: "datacentres",
      title: "Data centres",
      layer: "physical",
      group: "Compute",
      region: "Sample region E",
      x: 69,
      y: 45,
    },
    {
      id: "regions-projects",
      title: "Regions & projects",
      layer: "physical",
      group: "Regional context",
      region: "Sample region F",
      x: 81,
      y: 58,
    },
    {
      id: "copper",
      title: "Copper",
      layer: "resources",
      group: "Electrification",
      region: "Sample region A",
      x: 26,
      y: 42,
    },
    {
      id: "lithium",
      title: "Lithium",
      layer: "resources",
      group: "Batteries",
      region: "Sample region B",
      x: 42,
      y: 52,
    },
    {
      id: "gold",
      title: "Gold",
      layer: "resources",
      group: "Precious metals",
      region: "Sample region C",
      x: 58,
      y: 40,
    },
    {
      id: "oil",
      title: "Oil & liquid fuels",
      layer: "resources",
      group: "Energy",
      region: "Sample region D",
      x: 64,
      y: 61,
    },
    {
      id: "critical-minerals",
      title: "Critical minerals",
      layer: "resources",
      group: "Strategic inputs",
      region: "Sample region E",
      x: 74,
      y: 35,
    },
    {
      id: "value-chains",
      title: "Supply & processing",
      layer: "resources",
      group: "Value chains",
      region: "Sample region F",
      x: 84,
      y: 67,
    },
  ];

  const map = document.querySelector("#atlasMap");
  const results = document.querySelector("#atlasResults");
  const search = document.querySelector("#atlasSearch");
  const region = document.querySelector("#atlasRegion");
  const count = document.querySelector("#atlasCount");
  const emptyState = document.querySelector("#atlasEmpty");
  const toggles = [...document.querySelectorAll("[data-atlas-layer]")];
  if (
    !map ||
    !results ||
    !search ||
    !region ||
    !count ||
    !emptyState ||
    !toggles.length
  )
    return;
  const topicCards = [...results.querySelectorAll(".atlas-topic-card")];

  map.insertAdjacentHTML(
    "beforeend",
    atlasItems
      .map(
        (item, index) => `
    <button class="atlas-map-pin layer-${item.layer}" type="button"
      style="left:${item.x}%;top:${item.y}%" data-item="${item.id}"
      aria-label="Show ${item.title}, ${item.region}" aria-pressed="false"
      title="${item.title} · ${item.region}"><span>${String(index + 1).padStart(2, "0")}</span></button>`,
      )
      .join(""),
  );

  function render() {
    const activeLayers = new Set(
      toggles
        .filter((button) => button.getAttribute("aria-pressed") === "true")
        .map((button) => button.dataset.atlasLayer),
    );
    const selectedRegion = region.value;
    const term = search.value.trim().toLowerCase();
    const visible = atlasItems.filter((item) => {
      const card = document.getElementById(item.id);
      const layerMatch =
        activeLayers.has("all") || activeLayers.has(item.layer);
      const regionMatch = !selectedRegion || item.region === selectedRegion;
      const searchMatch =
        card?.textContent.toLowerCase().includes(term) ?? false;
      return layerMatch && regionMatch && searchMatch;
    });
    count.textContent = `${visible.length} ${visible.length === 1 ? "topic" : "topics"} shown`;
    const visibleIds = new Set(visible.map((item) => item.id));
    topicCards.forEach((card) => {
      card.hidden = !visibleIds.has(card.id);
    });
    emptyState.hidden = visible.length > 0;
    map.querySelectorAll(".atlas-map-pin").forEach((pin) => {
      pin.hidden = !visibleIds.has(pin.dataset.item);
      pin.setAttribute(
        "aria-pressed",
        String(pin.dataset.item === map.dataset.selectedItem),
      );
    });
  }

  toggles.forEach((button) =>
    button.addEventListener("click", () => {
      toggles.forEach((candidate) =>
        candidate.setAttribute("aria-pressed", String(candidate === button)),
      );
      map.dataset.selectedItem = "";
      render();
    }),
  );
  region.addEventListener("change", render);
  search.addEventListener("input", render);
  map.addEventListener("click", (event) => {
    const pin = event.target.closest(".atlas-map-pin");
    if (!pin) return;
    map.dataset.selectedItem =
      map.dataset.selectedItem === pin.dataset.item ? "" : pin.dataset.item;
    render();
    const target = document.getElementById(pin.dataset.item);
    if (target) {
      target.querySelector("details").open = true;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
  render();

  const hashTarget = document.getElementById(window.location.hash.slice(1));
  if (hashTarget) {
    const details = hashTarget.querySelector("details");
    if (details) details.open = true;
    requestAnimationFrame(() => hashTarget.scrollIntoView({ block: "center" }));
  }
})();
