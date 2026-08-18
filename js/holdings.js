(function () {
  "use strict";

  const tableBody = document.getElementById("holdingsTableBody");
  const searchInput = document.getElementById("holdingsSearch");
  const filerSelect = document.getElementById("filerFilter");
  const btcSelect = document.getElementById("btcFilter");
  const resetBtn = document.getElementById("resetFilters");
  const countLabel = document.getElementById("visibleCount");

  if (!tableBody || !searchInput || !filerSelect || !btcSelect || !resetBtn) {
    return;
  }

  const rows = Array.from(tableBody.querySelectorAll("tr"));

  function normalize(text) {
    return (text || "").toLowerCase().trim();
  }

  function applyFilters() {
    const query = normalize(searchInput.value);
    const filer = filerSelect.value;
    const btc = btcSelect.value;

    let visible = 0;

    rows.forEach((row) => {
      const rowText = normalize(row.dataset.search || row.textContent);
      const rowFiler = row.dataset.filer || "";
      const rowBtc = row.dataset.btc || "no";

      const matchQuery = !query || rowText.includes(query);
      const matchFiler = filer === "all" || filer === rowFiler;
      const matchBtc = btc === "all" || btc === rowBtc;

      const show = matchQuery && matchFiler && matchBtc;
      row.style.display = show ? "" : "none";
      if (show) {
        visible += 1;
      }
    });

    if (countLabel) {
      countLabel.textContent = String(visible);
    }
  }

  searchInput.addEventListener("input", applyFilters);
  filerSelect.addEventListener("change", applyFilters);
  btcSelect.addEventListener("change", applyFilters);

  resetBtn.addEventListener("click", function () {
    searchInput.value = "";
    filerSelect.value = "all";
    btcSelect.value = "all";
    applyFilters();
  });

  applyFilters();
})();
