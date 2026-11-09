# Logistics atlas data

This folder is the structured data home for the logistics and infrastructure atlas. It contains the source-linked seed data shown on the map. Locations are approximate map pins where stated.

## Files

- `ports.json` — port locations and optional operator/type details.
- `industrial-projects.json` — industrial, energy, and infrastructure projects.
- `data-centres.json` — data centre locations and sourced facility details.

## Record conventions

- Each file has a `dataset`, `schema_version`, `last_updated`, and `records` array. The `dataset` value must match the corresponding filename's dataset identifier (for example, `industrial_projects` in `industrial-projects.json`).
- Update the top-level `last_updated` date (`YYYY-MM-DD`) whenever the dataset is revised. The map displays the newest date reported by the loaded files.
- Every record must have a unique, stable, lowercase, hyphenated `id`, a `name`, `country`, `coordinates`, and `description`.
- Coordinates are `[latitude, longitude]` decimal degrees, matching the map's Leaflet convention, and must be within `[-90, 90]` and `[-180, 180]`, respectively.
- Use `status: "verified"` only when a reliable source supports the location and details. Use `status: "illustrative"` for schematic examples that are not verified; do not present these as factual map data.
- Each source should include a publisher/name and direct URL. Add `accessed_date` (`YYYY-MM-DD`) and, where available, the source's `published_date` (`YYYY-MM-DD`). Avoid unsourced estimates or inferred details.
- Include `status` and a `sources` array with publisher, title, and direct URL whenever available. Coordinate precision belongs in `coordinate_precision`; extra category-specific fields are allowed and retained with the record.
- Port records may include `annual_throughput` with numeric `year`, `teu`, and `yoy_growth_percent` fields. These figures are shown in the location overview and should be linked to a source that clearly states the reporting year and basis.
- The expanded port set is a selection of major global container ports, not a numbered top-ten ranking. The 2025 source provides exact throughput for the top five; the added ports are included in its group of ports handling more than 10 million TEU, without inventing port-specific figures.
- Every atlas asset should include a root-relative `detail_url`; the map uses it for that feature's **Explore more** link. The three top-port profiles retain their dedicated pages, while other assets use the shared source-linked profile at `/physical/asset-profile.html?id=<record-id>`.
- Port profiles use `profile_summary` for their short page introduction. The Singapore and Ningbo-Zhoushan records point to their own profiles through `detail_url`.
- Industrial projects are selected examples of large or nationally significant infrastructure, not a comparable global ranking; capacity measures are included only when a source directly supports them. The set includes Three Gorges (22.5 GW), Baihetan (16 GW), and Itaipu (14 GW) by installed generating capacity. Data-centre additions prioritize exceptionally large or high-compute campuses; campus size, announced plans, and installed IT capacity are different measures, so records do not imply a single definitive global ranking.
- Keep unknown values absent or empty; do not invent operators, capacity, production, or project status.

To add a location, append a record to the appropriate JSON file, keep its `id` unique within that file, update `last_updated`, and reload the atlas or select its **Refresh data** control. Valid additions appear as markers and in atlas search. The map fetches these files from the same site with cache revalidation; its service worker is network-first and uses its last cached copy only when offline. This is a manual curation workflow, not an automatic data feed. Keep approximate-pin notes visible and do not present unsourced examples as verified records.
