(() => {
  "use strict";

  const positions = [
    { x: 19, y: 33 },
    { x: 38, y: 67 },
    { x: 58, y: 34 },
    { x: 79, y: 61 },
  ];
  const sampleResearch = {
    overview: [
      [
        "Illustrative production shift",
        "Industry",
        "Sample group A",
        "A conceptual example of a structural sector change; no live indicator is represented.",
      ],
      [
        "Illustrative capacity pipeline",
        "Infrastructure",
        "Sample group B",
        "A synthetic project-stage example, not a real asset, project, or schedule.",
      ],
      [
        "Illustrative capital lens",
        "Investment",
        "Sample group C",
        "A sample research question; not a security view or investment signal.",
      ],
      [
        "Illustrative material pathway",
        "Commodities",
        "Sample group D",
        "A conceptual resource link with no real trade, price, or volume data.",
      ],
      [
        "Illustrative ownership context",
        "Ownership",
        "Sample group A",
        "A synthetic ownership-research topic, not a filing or position.",
      ],
      [
        "Illustrative source-quality check",
        "Method",
        "Sample group B",
        "A placeholder for source, timing, and uncertainty documentation.",
      ],
    ],
    industry: [
      [
        "Illustrative production shift",
        "Industry",
        "Sample group A",
        "A conceptual example of how production methods may change; no sector metric is shown.",
      ],
      [
        "Illustrative technology adoption",
        "Industry",
        "Sample group B",
        "A synthetic adoption theme, not a measured trend or forecast.",
      ],
      [
        "Illustrative cost-curve question",
        "Industry",
        "Sample group C",
        "A research prompt for comparing disclosed assumptions and drivers.",
      ],
      [
        "Illustrative demand transition",
        "Industry",
        "Sample group D",
        "A placeholder topic; no demand estimate or live signal is implied.",
      ],
    ],
    infrastructure: [
      [
        "Illustrative project concept",
        "Infrastructure",
        "Sample group A",
        "A synthetic pipeline node; no real project, location, developer, or date is implied.",
      ],
      [
        "Illustrative capacity addition",
        "Infrastructure",
        "Sample group B",
        "A placeholder for comparing reported capacity plans, not a sourced project record.",
      ],
      [
        "Illustrative grid connection",
        "Infrastructure",
        "Sample group C",
        "A conceptual dependency between infrastructure layers, not a real connection.",
      ],
      [
        "Illustrative buildout stage",
        "Infrastructure",
        "Sample group D",
        "A sample project-stage classification; no completion timing is stated.",
      ],
    ],
    investment: [
      [
        "Illustrative company research question",
        "Investment",
        "Sample group A",
        "A neutral research prompt; no issuer-specific conclusion or recommendation.",
      ],
      [
        "Illustrative valuation assumption",
        "Investment",
        "Sample group B",
        "A placeholder for transparent assumptions, not a valuation or target price.",
      ],
      [
        "Illustrative disclosure review",
        "Investment",
        "Sample group C",
        "A synthetic workflow example; no live filing is summarized.",
      ],
      [
        "Illustrative risk checklist",
        "Investment",
        "Sample group D",
        "A research framework only, not personalized advice or a security rating.",
      ],
    ],
    commodities: [
      [
        "Illustrative source-to-use chain",
        "Commodities",
        "Sample group A",
        "Synthetic value-chain example; no real source area, processor, or end user.",
      ],
      [
        "Illustrative processing dependency",
        "Commodities",
        "Sample group B",
        "A conceptual materials step, not an actual facility or capacity.",
      ],
      [
        "Illustrative logistics question",
        "Commodities",
        "Sample group C",
        "A research prompt with no mapped route, shipment, or trade flow.",
      ],
      [
        "Illustrative substitution theme",
        "Commodities",
        "Sample group D",
        "A placeholder question, not a demand, price, or substitution forecast.",
      ],
    ],
    ownership: [
      [
        "Illustrative filing review",
        "Ownership",
        "Sample group A",
        "A synthetic filing-research example, not a real position or disclosure.",
      ],
      [
        "Illustrative institutional lens",
        "Ownership",
        "Sample group B",
        "A neutral ownership research prompt; no investor activity is represented.",
      ],
      [
        "Illustrative capital allocation",
        "Ownership",
        "Sample group C",
        "A framework topic, not an issuer-specific assessment.",
      ],
      [
        "Illustrative company structure",
        "Ownership",
        "Sample group D",
        "A synthetic relationship example; no real entity links are asserted.",
      ],
    ],
    method: [
      [
        "Illustrative primary-source check",
        "Method",
        "Sample group A",
        "A placeholder for source citation and publication-date review.",
      ],
      [
        "Illustrative timing review",
        "Method",
        "Sample group B",
        "A synthetic reminder that reporting periods and publication dates can differ.",
      ],
      [
        "Illustrative uncertainty note",
        "Method",
        "Sample group C",
        "A sample field for uncertainty and known data limitations.",
      ],
      [
        "Illustrative interpretation boundary",
        "Method",
        "Sample group D",
        "A reminder to separate reported facts from analysis and inference.",
      ],
    ],
  };

  const map = document.querySelector("#intelligenceMap");
  const results = document.querySelector("#intelligenceResults");
  const groupSelect = document.querySelector("#intelligenceGroup");
  const lensSelect = document.querySelector("#intelligenceLens");
  const searchInput = document.querySelector("#intelligenceSearch");
  const summary = document.querySelector("#intelligenceResultSummary");
  const view = document.body.dataset.intelligenceView;
  if (
    !map ||
    !results ||
    !groupSelect ||
    !lensSelect ||
    !searchInput ||
    !summary
  )
    return;

  const records = (sampleResearch[view] || sampleResearch.overview).map(
    ([name, lens, group, note], index) => ({
      name,
      lens,
      group,
      note,
      marker: String(index + 1).padStart(2, "0"),
      ...positions[index % positions.length],
    }),
  );
  map.insertAdjacentHTML(
    "beforeend",
    records
      .map(
        (record) => `
      <button class="intelligence-map-pin" type="button"
        style="left:${record.x}%;top:${record.y}%"
        data-group="${record.group}" data-marker="${record.marker}"
        aria-label="Filter by ${record.group}" aria-pressed="false"
        title="${record.group}"><span>${record.marker}</span></button>`,
      )
      .join(""),
  );

  function render() {
    const selectedGroup = groupSelect.value;
    const selectedLens = lensSelect.value;
    const query = searchInput.value.trim().toLowerCase();
    const visible = records.filter((record) => {
      const groupMatches = !selectedGroup || record.group === selectedGroup;
      const lensMatches = !selectedLens || record.lens === selectedLens;
      const textMatches =
        `${record.name} ${record.lens} ${record.group} ${record.note}`
          .toLowerCase()
          .includes(query);
      return groupMatches && lensMatches && textMatches;
    });

    summary.textContent = `${visible.length} illustrative ${visible.length === 1 ? "example" : "examples"}`;
    results.innerHTML = visible.length
      ? visible
          .map(
            ({ name, lens, group, note }) => `
          <li class="intelligence-result-card">
            <strong>${name}</strong>
            <span>${lens} · ${group}</span>
            <p>${note}</p>
          </li>`,
          )
          .join("")
      : '<li class="intelligence-no-results">No sample entries match. Try another research lens, group, or search term.</li>';

    const visibleMarkers = new Set(visible.map((record) => record.marker));
    map.querySelectorAll(".intelligence-map-pin").forEach((pin) => {
      pin.hidden = !visibleMarkers.has(pin.dataset.marker);
      pin.setAttribute(
        "aria-pressed",
        String(pin.dataset.group === selectedGroup),
      );
    });
  }

  map.addEventListener("click", (event) => {
    const pin = event.target.closest(".intelligence-map-pin");
    if (!pin) return;
    groupSelect.value =
      groupSelect.value === pin.dataset.group ? "" : pin.dataset.group;
    render();
  });
  groupSelect.addEventListener("change", render);
  lensSelect.addEventListener("change", render);
  searchInput.addEventListener("input", render);
  render();
})();
