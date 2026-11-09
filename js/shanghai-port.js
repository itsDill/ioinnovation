(() => {
  "use strict";

  const portId = document.body.dataset.portId || "port-of-shanghai";
  const sourceFallback =
    "https://container-news.com/global-container-port-throughput-exceeds-1-billion-teu-in-2025/";
  const rankData = [
    { name: "Shanghai", id: "port-of-shanghai", teu: 55_060_000 },
    { name: "Singapore", id: "port-of-singapore", teu: 44_660_000 },
    {
      name: "Ningbo-Zhoushan",
      id: "port-of-ningbo-zhoushan",
      teu: 43_870_000,
    },
    { name: "Shenzhen", teu: 35_410_000 },
    { name: "Qingdao", teu: 32_890_000 },
  ];

  const elements = {
    heading: document.querySelector("#portName"),
    country: document.querySelector("#portCountry"),
    throughput: document.querySelector("#throughputValue"),
    growth: document.querySelector("#growthValue"),
    rankNumber: document.querySelector("#portRankNumber"),
    lede: document.querySelector("#portLede"),
    description: document.querySelector("#portDescription"),
    atlasLink: document.querySelector("#atlasLink"),
    rankList: document.querySelector("#portRankList"),
    source: document.querySelector("#sourceLink"),
    status: document.querySelector("#dataStatus"),
  };

  function formatMillions(teu) {
    return `${(teu / 1_000_000).toFixed(2)}M`;
  }

  function renderRanking(records) {
    const recordsById = new Map(records.map((record) => [record.id, record]));
    const ports = rankData.map((rankedPort) => ({
      name: rankedPort.name,
      teu:
        recordsById.get(rankedPort.id)?.annual_throughput?.teu ??
        rankedPort.teu,
      current: rankedPort.id === portId,
    }));
    ports.sort((a, b) => b.teu - a.teu);
    const maximum = Math.max(...ports.map((port) => port.teu));
    const currentRank = ports.findIndex((item) => item.current) + 1;
    if (elements.rankNumber && currentRank > 0) {
      elements.rankNumber.textContent = `#${currentRank}`;
    }

    elements.rankList.replaceChildren(
      ...ports.map((port, index) => {
        const row = document.createElement("div");
        row.className = "port-rank-row";
        row.setAttribute("aria-current", String(port.current));
        row.setAttribute("role", "listitem");

        const name = document.createElement("span");
        name.textContent = `${index + 1}. ${port.name}`;
        const track = document.createElement("span");
        track.className = "port-rank-track";
        track.setAttribute("aria-hidden", "true");
        const bar = document.createElement("span");
        bar.style.width = `${(port.teu / maximum) * 100}%`;
        track.append(bar);
        const value = document.createElement("span");
        value.className = "port-rank-value";
        value.textContent = formatMillions(port.teu);

        row.append(name, track, value);
        return row;
      }),
    );
  }

  async function loadPortData() {
    try {
      const response = await fetch("/data/logistics/ports.json", {
        cache: "no-cache",
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(`Port data request failed (${response.status}).`);
      const data = await response.json();
      const records = Array.isArray(data.records) ? data.records : [];
      const port = records.find((record) => record.id === portId);
      const throughput = port?.annual_throughput;
      if (!port || !throughput || !Number.isFinite(throughput.teu)) {
        throw new Error("Port data is incomplete.");
      }

      elements.heading.textContent = port.name.replace(/^Port of\s+/i, "");
      elements.country.textContent = `${port.country} · Port profile`;
      elements.throughput.textContent = formatMillions(throughput.teu);
      elements.growth.textContent = `+${throughput.yoy_growth_percent}%`;
      renderRanking(records);
      if (elements.lede && port.profile_summary) {
        elements.lede.textContent = port.profile_summary;
      }
      if (elements.description) {
        elements.description.textContent = port.description;
      }
      if (elements.atlasLink) {
        elements.atlasLink.href = `/physical/map.html?focus=${encodeURIComponent(port.id)}`;
      }
      elements.status.textContent = `Port statistics loaded from the atlas dataset · ${data.last_updated}`;
      const source = port.sources?.[0];
      elements.source.href = source?.url || sourceFallback;
      elements.source.textContent = source
        ? `${source.publisher}: ${source.title}`
        : "Container News · 2025 global container port ranking";
      document.title = `${port.name}: 2025 Throughput & Port Profile | IO Innovation Fund`;
    } catch (error) {
      elements.status.textContent = `${error.message} Showing the source-linked port profile where available.`;
      elements.source.href = sourceFallback;
      elements.source.textContent =
        "Container News · 2025 global container port ranking";
    }
  }

  loadPortData();
})();
