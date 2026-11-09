(() => {
  "use strict";

  const positions = [
    { x: 12, y: 38, svgX: 78, svgY: 94 },
    { x: 37, y: 66, svgX: 235, svgY: 160 },
    { x: 63, y: 66, svgX: 405, svgY: 160 },
    { x: 88, y: 38, svgX: 562, svgY: 94 },
  ];
  const sampleEntities = {
    overview: [
      [
        "Example issuer",
        "Issuer",
        "Connect a company to securities, reporting, and valuation context.",
      ],
      [
        "Illustrative equity",
        "Security",
        "A sample security node; no ticker, price, or return is represented.",
      ],
      [
        "Example institution",
        "Institution",
        "A synthetic investor node, not an actual reporting manager.",
      ],
      [
        "Sample filing record",
        "Filing",
        "A mock disclosure link; it is not an SEC filing or live portfolio.",
      ],
    ],
    holdings: [
      [
        "Example manager",
        "Institution",
        "Synthetic institution label; no real portfolio is shown.",
      ],
      [
        "Illustrative reported position",
        "Position",
        "A mock holding to demonstrate filing-to-position relationships.",
      ],
      [
        "Example public issuer",
        "Issuer",
        "Synthetic issuer label without ticker or market data.",
      ],
      [
        "Sample quarterly filing",
        "Filing",
        "Illustrative filing node; use the live tool for source-linked SEC data.",
      ],
    ],
    equities: [
      [
        "Example listed company",
        "Issuer",
        "Placeholder issuer profile; no listing or quote is implied.",
      ],
      [
        "Illustrative common share",
        "Security",
        "Synthetic equity instrument with no price or performance history.",
      ],
      [
        "Example market venue",
        "Market",
        "A conceptual market connection, not exchange coverage.",
      ],
      [
        "Sample disclosure",
        "Filing",
        "Placeholder source record; verify real issuer disclosures independently.",
      ],
    ],
    ownership: [
      [
        "Example parent company",
        "Issuer",
        "Synthetic corporate entity for demonstrating ownership links.",
      ],
      [
        "Illustrative subsidiary",
        "Company",
        "A mock entity; no real corporate relationship is asserted.",
      ],
      [
        "Example shareholder",
        "Holder",
        "Placeholder holder node, not a disclosed beneficial owner.",
      ],
      [
        "Sample ownership record",
        "Filing",
        "Demonstrates a source link without representing a real filing.",
      ],
    ],
    valuation: [
      [
        "Example operating company",
        "Issuer",
        "Synthetic issuer used to explain valuation inputs.",
      ],
      [
        "Illustrative cash-flow case",
        "Model",
        "A mock scenario; it is not a forecast or investment recommendation.",
      ],
      [
        "Example discount-rate input",
        "Assumption",
        "A placeholder assumption that must be independently assessed.",
      ],
      [
        "Sample value range",
        "Output",
        "No real valuation is calculated or displayed in this preview.",
      ],
    ],
    capital: [
      [
        "Example business",
        "Issuer",
        "Synthetic company node; no actual capital plan is attributed.",
      ],
      [
        "Illustrative investment plan",
        "Project",
        "A placeholder project for exploring capital-allocation themes.",
      ],
      [
        "Example funding source",
        "Capital",
        "Mock financing category with no real transaction data.",
      ],
      [
        "Sample disclosure",
        "Filing",
        "Illustrative source node; no real corporate action is represented.",
      ],
    ],
    disclosures: [
      [
        "Example reporting company",
        "Issuer",
        "Synthetic issuer; use official records for actual disclosures.",
      ],
      [
        "Illustrative filing type",
        "Filing",
        "A mock document category, not an EDGAR document.",
      ],
      [
        "Example reporting period",
        "Period",
        "A conceptual time marker; no filing date is implied.",
      ],
      [
        "Sample source link",
        "Source",
        "Demonstrates provenance-first design without fictional citations.",
      ],
    ],
  };

  const canvas = document.querySelector("#financialMap");
  const results = document.querySelector("#financialResults");
  const kindSelect = document.querySelector("#financialKind");
  const searchInput = document.querySelector("#financialSearch");
  const summary = document.querySelector("#financialResultSummary");
  const view = document.body.dataset.financialView;
  if (!canvas || !results || !kindSelect || !searchInput || !summary) return;

  const records = (sampleEntities[view] || sampleEntities.overview).map(
    ([name, kind, note], index) => ({
      name,
      kind,
      note,
      marker: String(index),
      ...positions[index],
    }),
  );
  const edges = records.slice(0, -1).map((record, index) => {
    const next = records[index + 1];
    const middleX = (record.svgX + next.svgX) / 2;
    return `<path data-from="${record.marker}" data-to="${next.marker}" d="M ${record.svgX} ${record.svgY} Q ${middleX} ${record.svgY} ${next.svgX} ${next.svgY}" />`;
  });
  const nodes = records
    .map(
      (record) => `
        <button class="financial-network-node" type="button"
          style="left:${record.x}%;top:${record.y}%"
          data-kind="${record.kind}" data-marker="${record.marker}"
          aria-label="Filter by ${record.kind}" aria-pressed="false">
          <small>${record.kind}</small><strong>${record.name}</strong>
        </button>`,
    )
    .join("");
  canvas.insertAdjacentHTML(
    "afterbegin",
    `<svg class="financial-network-lines" viewBox="0 0 640 240" preserveAspectRatio="none" aria-hidden="true">${edges.join("")}</svg>${nodes}`,
  );

  function render() {
    const selectedKind = kindSelect.value;
    const query = searchInput.value.trim().toLowerCase();
    const visible = records.filter((record) => {
      const kindMatches = !selectedKind || record.kind === selectedKind;
      const textMatches = `${record.name} ${record.kind} ${record.note}`
        .toLowerCase()
        .includes(query);
      return kindMatches && textMatches;
    });

    summary.textContent = `${visible.length} illustrative ${visible.length === 1 ? "relationship" : "relationships"}`;
    results.innerHTML = visible.length
      ? visible
          .map(
            ({ name, kind, note }) => `
              <li class="financial-result-card">
                <strong>${name}</strong><span>${kind} · illustrative node</span><p>${note}</p>
              </li>`,
          )
          .join("")
      : '<li class="financial-no-results">No sample relationships match. Try another type or search term.</li>';

    const visibleMarkers = new Set(visible.map((record) => record.marker));
    canvas.querySelectorAll(".financial-network-node").forEach((node) => {
      const isVisible = visibleMarkers.has(node.dataset.marker);
      node.hidden = !isVisible;
      node.setAttribute(
        "aria-pressed",
        String(node.dataset.kind === selectedKind),
      );
    });
    canvas.querySelectorAll(".financial-network-lines path").forEach((line) => {
      line.toggleAttribute(
        "hidden",
        !visibleMarkers.has(line.dataset.from) ||
          !visibleMarkers.has(line.dataset.to),
      );
    });
  }

  canvas.addEventListener("click", (event) => {
    const node = event.target.closest(".financial-network-node");
    if (!node) return;
    kindSelect.value =
      kindSelect.value === node.dataset.kind ? "" : node.dataset.kind;
    render();
  });
  kindSelect.addEventListener("change", render);
  searchInput.addEventListener("input", render);
  render();
})();
