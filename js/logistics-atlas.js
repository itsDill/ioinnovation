(() => {
  "use strict";

  const mapElement = document.querySelector("#map");
  if (!mapElement) return;

  const colors = {
    ports: "#0b7fa8",
    projects: "#d6336c",
    datacentres: "#a8740a",
    borders: "#607986",
    labels: "#607986",
  };
  const layerOn = {
    ports: true,
    projects: true,
    datacentres: true,
    borders: true,
    labels: true,
  };
  const features = [
    {
      name: "Shanghai",
      type: "Port",
      layer: "ports",
      coords: [31.23, 121.47],
      overview:
        "Major global container port; shown as an illustrative reference point.",
    },
    {
      name: "Singapore",
      type: "Port",
      layer: "ports",
      coords: [1.26, 103.82],
      overview:
        "Major transshipment hub on the Malacca Strait; shown as an illustrative reference point.",
    },
    {
      name: "Rotterdam",
      type: "Port",
      layer: "ports",
      coords: [51.95, 4.14],
      overview:
        "Major European port; shown as an illustrative reference point.",
    },
    {
      name: "Los Angeles",
      type: "Port",
      layer: "ports",
      coords: [33.74, -118.27],
      overview:
        "US West Coast gateway; shown as an illustrative reference point.",
    },
    {
      name: "New York",
      type: "Port",
      layer: "ports",
      coords: [40.67, -74.05],
      overview:
        "US East Coast gateway; shown as an illustrative reference point.",
    },
    {
      name: "Jebel Ali",
      type: "Port",
      layer: "ports",
      coords: [24.99, 55.06],
      overview: "Port and logistics hub in the United Arab Emirates.",
    },
    {
      name: "Busan",
      type: "Port",
      layer: "ports",
      coords: [35.1, 129.04],
      overview: "Major Korean port; shown as an illustrative reference point.",
    },
    {
      name: "Santos",
      type: "Port",
      layer: "ports",
      coords: [-23.95, -46.33],
      overview:
        "Major Brazilian port; shown as an illustrative reference point.",
    },
    {
      name: "Durban",
      type: "Port",
      layer: "ports",
      coords: [-29.87, 31.03],
      overview: "South African port; shown as an illustrative reference point.",
    },
    {
      name: "Sydney / Port Botany",
      type: "Port",
      layer: "ports",
      coords: [-33.97, 151.22],
      overview: "Port Botany is Sydney’s principal container port area.",
    },
    {
      name: "Colón",
      type: "Port",
      layer: "ports",
      coords: [9.36, -79.9],
      overview: "Port area near the Atlantic entrance to the Panama Canal.",
    },
    {
      name: "Mumbai / Nhava Sheva",
      type: "Port",
      layer: "ports",
      coords: [18.95, 72.95],
      overview:
        "Port region serving Mumbai; shown as an illustrative reference point.",
    },
    {
      name: "New York JFK",
      type: "Airport",
      layer: "air",
      coords: [40.64, -73.78],
      overview: "International airport serving the New York region.",
    },
    {
      name: "London Heathrow",
      type: "Airport",
      layer: "air",
      coords: [51.47, -0.45],
      overview: "International airport serving the London region.",
    },
    {
      name: "Dubai International",
      type: "Airport",
      layer: "air",
      coords: [25.25, 55.36],
      overview: "International airport serving Dubai.",
    },
    {
      name: "Singapore Changi",
      type: "Airport",
      layer: "air",
      coords: [1.36, 103.99],
      overview: "International airport serving Singapore.",
    },
    {
      name: "Tokyo Haneda",
      type: "Airport",
      layer: "air",
      coords: [35.55, 139.78],
      overview: "International airport serving Tokyo.",
    },
    {
      name: "Los Angeles International",
      type: "Airport",
      layer: "air",
      coords: [33.94, -118.41],
      overview: "International airport serving Los Angeles.",
    },
    {
      name: "São Paulo Guarulhos",
      type: "Airport",
      layer: "air",
      coords: [-23.43, -46.47],
      overview: "International airport serving São Paulo.",
    },
    {
      name: "Johannesburg OR Tambo",
      type: "Airport",
      layer: "air",
      coords: [-26.13, 28.24],
      overview: "International airport serving Johannesburg.",
    },
    {
      name: "Delhi Indira Gandhi",
      type: "Airport",
      layer: "air",
      coords: [28.56, 77.1],
      overview: "International airport serving Delhi.",
    },
    {
      name: "Three Gorges Dam",
      type: "Industrial project",
      layer: "ind",
      coords: [30.82, 111.0],
      overview:
        "Hydroelectric power station in Hubei, China. Marker is illustrative; no capacity or operating data is shown.",
    },
    {
      name: "NEOM",
      type: "Industrial project",
      layer: "ind",
      coords: [28.0, 35.2],
      overview:
        "Large-scale development initiative in northwestern Saudi Arabia; project scope and status can change.",
    },
    {
      name: "Giga Berlin",
      type: "Industrial project",
      layer: "ind",
      coords: [52.4, 13.8],
      overview: "Vehicle manufacturing site in Brandenburg, Germany.",
    },
    {
      name: "Ras Tanura",
      type: "Industrial project",
      layer: "ind",
      coords: [26.65, 50.16],
      overview: "Oil and export infrastructure on Saudi Arabia’s Gulf coast.",
    },
    {
      name: "Pilbara iron ore region",
      type: "Industrial region",
      layer: "ind",
      coords: [-22.3, 118.6],
      overview:
        "Iron ore mining region in Western Australia; this marker does not represent a specific mine.",
    },
    {
      name: "Itaipú Dam",
      type: "Industrial project",
      layer: "ind",
      coords: [-25.41, -54.59],
      overview: "Hydroelectric power station on the Brazil–Paraguay border.",
    },
    {
      name: "Hsinchu Science Park",
      type: "Industrial region",
      layer: "ind",
      coords: [24.78, 121.0],
      overview: "Technology and semiconductor cluster in Taiwan.",
    },
    {
      name: "Gigafactory Nevada",
      type: "Industrial project",
      layer: "ind",
      coords: [39.54, -119.44],
      overview: "Battery manufacturing site near Reno, Nevada.",
    },
    {
      name: "Yamal LNG",
      type: "Industrial project",
      layer: "ind",
      coords: [71.26, 72.08],
      overview: "Liquefied natural gas project on the Yamal Peninsula.",
    },
    {
      name: "Panama Canal",
      type: "Strategic maritime chokepoint",
      layer: "disruption",
      coords: [9.08, -79.68],
      overview:
        "A major canal connecting Atlantic and Pacific shipping. This marks general routing sensitivity if passage is disrupted; it is not a current threat assessment or live operating status.",
    },
    {
      name: "Suez Canal",
      type: "Strategic maritime chokepoint",
      layer: "disruption",
      coords: [30.45, 32.35],
      overview:
        "A key maritime link between the Mediterranean and Red Sea. This marks general routing sensitivity if passage is disrupted; it is not a current threat assessment or live operating status.",
    },
    {
      name: "Strait of Hormuz",
      type: "Strategic maritime chokepoint",
      layer: "disruption",
      coords: [26.56, 56.25],
      overview:
        "A narrow maritime passage at the entrance to the Persian Gulf. This marks general routing sensitivity if passage is disrupted; it is not a current threat assessment or live operating status.",
    },
    {
      name: "Bab el-Mandeb",
      type: "Strategic maritime chokepoint",
      layer: "disruption",
      coords: [12.58, 43.33],
      overview:
        "A maritime passage connecting the Red Sea and Gulf of Aden. This marks general routing sensitivity if passage is disrupted; it is not a current threat assessment or live operating status.",
    },
    {
      name: "Strait of Malacca",
      type: "Strategic maritime chokepoint",
      layer: "disruption",
      coords: [2.5, 101.5],
      overview:
        "A heavily used maritime passage between the Indian and Pacific Oceans. This marks general routing sensitivity if passage is disrupted; it is not a current threat assessment or live operating status.",
    },
    {
      name: "Turkish Straits",
      type: "Strategic maritime chokepoint",
      layer: "disruption",
      coords: [41.1, 29.0],
      overview:
        "The Bosporus and Dardanelles link the Black Sea with the Mediterranean. This marks general routing sensitivity if passage is disrupted; it is not a current threat assessment or live operating status.",
    },
  ];

  const routes = [
    {
      name: "Asia–Europe shipping example",
      type: "Illustrative shipping route",
      layer: "shipping",
      anchor: "ports-trade",
      coords: [
        [31.23, 121.47],
        [22, 120],
        [9, 110],
        [1.26, 103.82],
        [-2, 85],
        [8, 65],
        [20, 52],
        [30, 42],
        [36, 25],
        [45, 12],
        [51.95, 4.14],
      ],
      overview:
        "A schematic connection between sample port locations. This is not a verified shipping lane or vessel track.",
    },
    {
      name: "Transpacific shipping example",
      type: "Illustrative shipping route",
      layer: "shipping",
      anchor: "ports-trade",
      coords: [
        [31.23, 121.47],
        [35, 160],
        [38, 180],
        [38, -160],
        [36, -140],
        [33.74, -118.27],
      ],
      overview:
        "A schematic transpacific connection between sample ports. This is not a verified shipping lane or vessel track.",
    },
    {
      name: "North Atlantic shipping example",
      type: "Illustrative shipping route",
      layer: "shipping",
      anchor: "ports-trade",
      coords: [
        [51.95, 4.14],
        [54, 0],
        [52, -20],
        [48, -40],
        [44, -60],
        [40.67, -74.05],
      ],
      overview:
        "A schematic North Atlantic connection between sample ports. This is not a verified shipping lane or vessel track.",
    },
    {
      name: "Trans-Siberian Railway",
      type: "Illustrative rail corridor",
      layer: "rail",
      anchor: "regions-projects",
      coords: [
        [55.75, 37.62],
        [56, 50],
        [57, 60],
        [55, 73],
        [55, 83],
        [56, 92],
        [52, 104],
        [51, 113],
        [50, 127],
        [43.12, 131.89],
      ],
      overview:
        "A schematic Moscow–Vladivostok rail corridor. The displayed geometry is illustrative, not a surveyed alignment.",
    },
    {
      name: "China rail corridor example",
      type: "Illustrative rail corridor",
      layer: "rail",
      anchor: "regions-projects",
      coords: [
        [39.9, 116.4],
        [36, 117],
        [33, 119],
        [31.23, 121.47],
        [28, 119],
        [23.13, 113.26],
      ],
      overview:
        "A schematic rail connection between Chinese city regions. Not a precise rail alignment or service map.",
    },
    {
      name: "European rail corridor example",
      type: "Illustrative rail corridor",
      layer: "rail",
      anchor: "regions-projects",
      coords: [
        [48.86, 2.35],
        [50, 8],
        [52.52, 13.4],
        [52, 21],
        [54, 30],
        [55.75, 37.62],
      ],
      overview:
        "A schematic European rail connection. Not a precise rail alignment or service map.",
    },
    {
      name: "United States road corridor example",
      type: "Illustrative highway corridor",
      layer: "road",
      anchor: "regions-projects",
      coords: [
        [37.77, -122.42],
        [40.5, -115],
        [39.7, -105],
        [41, -96],
        [41.88, -87.63],
        [41, -80],
        [40.67, -74.05],
      ],
      overview:
        "A schematic cross-country road connection. Not a turn-by-turn road geometry or live traffic layer.",
    },
    {
      name: "East Africa road corridor example",
      type: "Illustrative highway corridor",
      layer: "road",
      anchor: "regions-projects",
      coords: [
        [30.04, 31.24],
        [15, 33],
        [-1.29, 36.82],
        [-14, 33],
        [-26, 28],
        [-33.92, 18.42],
      ],
      overview:
        "A schematic north–south road corridor example. Not a verified continuous highway alignment.",
    },
    {
      name: "Europe air connection example",
      type: "Illustrative flight connection",
      layer: "flightpaths",
      anchor: "ports-trade",
      coords: [
        [51.47, -0.45],
        [48, 12],
        [40, 28],
        [25.25, 55.36],
      ],
      overview:
        "A schematic connection between sample airports. It does not show a real flight path, schedule, or live aircraft.",
    },
    {
      name: "Asia air connection example",
      type: "Illustrative flight connection",
      layer: "flightpaths",
      anchor: "ports-trade",
      coords: [
        [1.36, 103.99],
        [15, 125],
        [28, 140],
        [35.55, 139.78],
      ],
      overview:
        "A schematic connection between sample airports. It does not show a real flight path, schedule, or live aircraft.",
    },
    {
      name: "Singapore–Sydney shipping example",
      type: "Illustrative shipping route",
      layer: "shipping",
      anchor: "ports-trade",
      coords: [
        [1.26, 103.82],
        [-8, 112],
        [-18, 122],
        [-27, 135],
        [-33.97, 151.22],
      ],
      overview:
        "A schematic Southeast Asia–Australia connection between sample port areas. It is not a verified shipping lane or vessel track.",
    },
    {
      name: "East Asia–South America shipping example",
      type: "Illustrative shipping route",
      layer: "shipping",
      anchor: "ports-trade",
      coords: [
        [31.23, 121.47],
        [12, 145],
        [-8, 165],
        [-28, -170],
        [-35, -135],
        [-32, -95],
        [-23.95, -46.33],
      ],
      overview:
        "A schematic Pacific connection between sample port areas. It is not a verified shipping lane or vessel track.",
    },
    {
      name: "Gulf–South Asia shipping example",
      type: "Illustrative shipping route",
      layer: "shipping",
      anchor: "ports-trade",
      coords: [
        [24.99, 55.06],
        [18, 62],
        [12, 70],
        [8, 82],
        [3, 94],
        [1.26, 103.82],
      ],
      overview:
        "A schematic Gulf-to-Southeast Asia connection between sample port areas. It is not a verified shipping lane or vessel track.",
    },
    {
      name: "Europe–West Africa shipping example",
      type: "Illustrative shipping route",
      layer: "shipping",
      anchor: "ports-trade",
      coords: [
        [51.95, 4.14],
        [43, -4],
        [31, -10],
        [15, -17],
        [-2, -15],
        [-12, -8],
        [-23.95, -46.33],
      ],
      overview:
        "A schematic Europe–Atlantic connection between sample port areas. It is not a verified shipping lane or vessel track.",
    },
    {
      name: "Indian Ocean shipping example",
      type: "Illustrative shipping route",
      layer: "shipping",
      anchor: "ports-trade",
      coords: [
        [-29.87, 31.03],
        [-20, 42],
        [-8, 55],
        [1.26, 75],
        [1.26, 103.82],
      ],
      overview:
        "A schematic Indian Ocean connection between sample port areas. It is not a verified shipping lane or vessel track.",
    },
  ];

  if (!window.L) {
    mapElement.innerHTML =
      '<div class="panel" style="inset:20% 10%;padding:20px;height:max-content">The map library did not load. Check your connection and reload to view the interactive map.</div>';
    return;
  }

  const map = L.map(mapElement, {
    zoomControl: false,
    minZoom: 2,
    maxZoom: 18,
    worldCopyJump: true,
    preferCanvas: false,
    scrollWheelZoom: true,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
  }).setView([22, 10], 2.25);
  window.logisticsAtlasMap = map;

  const mapTexture = document.querySelector("#mapTexture");
  const themeToggle = document.querySelector("#themeToggle");
  const themeLabel = document.querySelector("#themeLabel");
  const themeGlyph = themeToggle?.querySelector(".theme-glyph");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const savedTheme = localStorage.getItem("theme");
  const hasSavedTheme = ["dark", "light"].includes(savedTheme);
  const validTextures = ["street", "minimal", "terrain", "satellite"];
  let currentTheme = hasSavedTheme
    ? savedTheme
    : prefersDark.matches
      ? "dark"
      : "light";
  let currentTexture = localStorage.getItem("logisticsAtlasTexture");
  if (!validTextures.includes(currentTexture)) currentTexture = "street";

  const tileProviders = {
    street: {
      day: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        options: {
          subdomains: "abc",
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
        },
      },
      night: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        options: {
          subdomains: "abcd",
          maxZoom: 20,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
        },
      },
    },
    minimal: {
      day: {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        options: {
          subdomains: "abcd",
          maxZoom: 20,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
        },
      },
      night: {
        url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        options: {
          subdomains: "abcd",
          maxZoom: 20,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
        },
      },
    },
    terrain: {
      day: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        options: {
          maxZoom: 19,
          attribution:
            'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &mdash; Sources: Esri, USGS, NOAA',
        },
      },
      night: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        options: {
          maxZoom: 19,
          className: "atlas-terrain-tiles",
          attribution:
            'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &mdash; Sources: Esri, USGS, NOAA',
        },
      },
    },
    satellite: {
      day: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        options: {
          maxZoom: 19,
          attribution:
            'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &mdash; Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        },
      },
      night: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        options: {
          maxZoom: 19,
          attribution:
            'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &mdash; Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        },
      },
    },
  };

  let baseLayer;
  function applyTheme(theme, savePreference = false) {
    currentTheme = theme;
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
      themeToggle.setAttribute(
        "aria-label",
        `Switch to ${theme === "dark" ? "day" : "night"} map theme`,
      );
    }
    if (themeLabel)
      themeLabel.textContent = `${theme === "dark" ? "Night" : "Day"} mode`;
    if (themeGlyph) themeGlyph.textContent = theme === "dark" ? "☾" : "☀";
    if (savePreference) localStorage.setItem("theme", theme);
    if (baseLayer) setBaseLayer();
    mapElement.classList.toggle(
      "atlas-night-terrain",
      theme === "dark" && currentTexture === "terrain",
    );
  }

  function setBaseLayer() {
    const provider =
      tileProviders[currentTexture][currentTheme === "dark" ? "night" : "day"];
    if (baseLayer) map.removeLayer(baseLayer);
    baseLayer = L.tileLayer(provider.url, {
      minZoom: 2,
      ...provider.options,
    }).addTo(map);
  }

  function setTexture(texture, savePreference = true) {
    if (!validTextures.includes(texture)) return;
    currentTexture = texture;
    if (mapTexture) mapTexture.value = texture;
    if (savePreference) localStorage.setItem("logisticsAtlasTexture", texture);
    setBaseLayer();
    mapElement.classList.toggle(
      "atlas-night-terrain",
      currentTheme === "dark" && texture === "terrain",
    );
  }

  if (mapTexture) {
    mapTexture.value = currentTexture;
    mapTexture.addEventListener("change", () => setTexture(mapTexture.value));
  }
  themeToggle?.addEventListener("click", () =>
    applyTheme(currentTheme === "dark" ? "light" : "dark", true),
  );
  prefersDark.addEventListener("change", (event) => {
    if (!localStorage.getItem("theme")) {
      applyTheme(event.matches ? "dark" : "light");
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "theme") {
      applyTheme(
        ["dark", "light"].includes(event.newValue)
          ? event.newValue
          : prefersDark.matches
            ? "dark"
            : "light",
      );
    } else if (event.key === "logisticsAtlasTexture") {
      setTexture(event.newValue, false);
    }
  });
  applyTheme(currentTheme);
  setTexture(currentTexture, false);

  const groups = Object.fromEntries(
    Object.keys(layerOn).map((key) => [key, L.layerGroup().addTo(map)]),
  );
  const dataGroups = Object.fromEntries(
    ["ports", "projects", "datacentres"].map((key) => [
      key,
      L.layerGroup().addTo(groups[key]),
    ]),
  );
  const allFeatures = [];
  const countryFeatures = [];
  let selectedLayer = null;
  let selectedFeature = null;

  map.createPane("countryBorders");
  map.getPane("countryBorders").style.zIndex = 350;

  function setFeatureStyle(feature, style) {
    if (feature?.pathLayers) {
      feature.pathLayers.forEach((layer) => layer.setStyle(style));
    } else if (
      feature?.layerRef &&
      typeof feature.layerRef.setStyle === "function"
    ) {
      feature.layerRef.setStyle(style);
    }
  }

  function openFeature(feature) {
    if (selectedFeature)
      setFeatureStyle(selectedFeature, selectedFeature.baseStyle);
    if (selectedLayer && typeof selectedLayer.setZIndexOffset === "function") {
      selectedLayer.setZIndexOffset(0);
    }
    selectedLayer = feature.layerRef || null;
    selectedFeature = feature;
    setFeatureStyle(feature, {
      weight: 5,
      opacity: 1,
      color: colors[feature.layer] || colors.borders,
    });
    selectedLayer?.bringToFront?.();
    if (selectedLayer && typeof selectedLayer.setZIndexOffset === "function") {
      selectedLayer.setZIndexOffset(1000);
    }
    document.querySelector("#featureType").textContent = feature.type;
    document.querySelector("#featureTitle").textContent = feature.name;
    document.querySelector("#featureOverview").textContent = feature.overview;
    const meta = document.querySelector("#featureMeta");
    const metaParts = [
      feature.country,
      feature.annualThroughput
        ? `${feature.annualThroughput.year} throughput: ${(feature.annualThroughput.teu / 1_000_000).toFixed(2)}M TEU · +${feature.annualThroughput.yoyGrowthPercent}% YoY`
        : "",
      feature.status ? `Data status: ${feature.status}` : "",
      feature.coordinatePrecision,
      feature.geometryNote,
    ].filter(Boolean);
    meta.textContent = metaParts.join(" · ");
    meta.hidden = metaParts.length === 0;
    const sourceList = document.querySelector("#featureSources");
    sourceList.replaceChildren();
    (feature.sources || []).forEach((source) => {
      let sourceUrl;
      try {
        sourceUrl = new URL(source.url, window.location.href);
      } catch {
        return;
      }
      if (!["http:", "https:"].includes(sourceUrl.protocol)) return;
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = sourceUrl.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `${source.publisher || "Source"} · ${source.title || source.url}`;
      item.append(link);
      sourceList.append(item);
    });
    document.querySelector("#featureExplore").href =
      feature.detailUrl ||
      `/physical-assets.html#${feature.anchor || "atlas-explorer-title"}`;
    document.querySelector("#featureCard").hidden = false;
    document.querySelector("#announce").textContent =
      `${feature.name} overview opened. ${feature.overview}`;
  }

  function markerIcon(layer, glyph, kind = "") {
    return L.divIcon({
      className: "",
      html: `<span class="atlas-marker ${kind}" style="--marker-color:${colors[layer]}"><span>${glyph}</span></span>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }

  function addMarker(feature, glyph, kind = "") {
    const marker = L.marker(feature.coords, {
      icon: markerIcon(feature.layer, glyph, kind),
      title: feature.name,
      keyboard: true,
    });
    feature.layerRef = marker;
    marker.on("click", () => openFeature(feature));
    marker.addTo(dataGroups[feature.layer]);
    allFeatures.push(feature);
    return marker;
  }

  const countryLabels = [];
  const countryDataUrl =
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
  const countryStatus = document.querySelector("#countryStatus");

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  }

  function updateCountryLabels() {
    const showLabels = layerOn.labels && map.getZoom() >= 3.25;
    countryLabels.forEach((marker) => {
      if (showLabels && !map.hasLayer(marker)) marker.addTo(groups.labels);
      else if (!showLabels && map.hasLayer(marker))
        groups.labels.removeLayer(marker);
    });
  }

  fetch(countryDataUrl)
    .then((response) => {
      if (!response.ok)
        throw new Error(`Country data request failed: ${response.status}`);
      return response.json();
    })
    .then((geojson) => {
      const countryLayer = L.geoJSON(geojson, {
        pane: "countryBorders",
        style: () => ({
          color: colors.borders,
          weight: 0.7,
          opacity: 0.65,
          fillOpacity: 0,
        }),
        onEachFeature: (country, layer) => {
          const properties = country.properties || {};
          const englishName =
            properties.ADMIN ||
            properties.NAME_EN ||
            properties.name_en ||
            properties.NAME ||
            properties.name;
          if (!englishName) return;
          const center = layer.getBounds().getCenter();
          const feature = {
            name: englishName,
            type: "Country boundary",
            layer: "borders",
            coords: [center.lat, center.lng],
            overview: `Country name is displayed in English from Natural Earth administrative data. Borders are generalized for a global overview and may not represent every disputed boundary.`,
            layerRef: layer,
            baseStyle: {
              color: colors.borders,
              weight: 0.7,
              opacity: 0.65,
              fillOpacity: 0,
            },
            anchor: "regions-projects",
          };
          layer.on("click", () => openFeature(feature));
          layer.bindTooltip(`${englishName} · country boundary`, {
            className: "atlas-tip",
          });
          allFeatures.push(feature);
          countryFeatures.push(feature);

          const label = L.marker(center, {
            interactive: false,
            keyboard: false,
            icon: L.divIcon({
              className: "",
              html: `<span class="atlas-country-label">${escapeHtml(englishName)}</span>`,
              iconSize: [1, 1],
              iconAnchor: [0, 0],
            }),
            title: englishName,
          });
          countryLabels.push(label);
        },
      });
      countryLayer.addTo(groups.borders);
      updateCountryLabels();
      countryStatus.textContent = "Country names: English · Natural Earth";
      document.querySelector("#announce").textContent =
        "English country labels and generalized country borders loaded.";
    })
    .catch(() => {
      countryStatus.textContent =
        "Country labels unavailable · check connection";
    });
  map.on("zoomend", updateCountryLabels);

  const datasetDefinitions = [
    {
      file: "ports.json",
      dataset: "ports",
      layer: "ports",
      type: "Port",
      glyph: "⚓",
    },
    {
      file: "industrial-projects.json",
      dataset: "industrial_projects",
      layer: "projects",
      type: "Industrial project",
      glyph: "▰",
    },
    {
      file: "data-centres.json",
      dataset: "data_centres",
      layer: "datacentres",
      type: "Data centre",
      glyph: "▦",
    },
  ];
  const dataStatus = document.querySelector("#dataStatus");
  const refreshButton = document.querySelector("#refreshData");

  function isValidPoint(point) {
    return (
      Array.isArray(point) &&
      point.length === 2 &&
      Number.isFinite(point[0]) &&
      point[0] >= -90 &&
      point[0] <= 90 &&
      Number.isFinite(point[1]) &&
      point[1] >= -180 &&
      point[1] <= 180
    );
  }

  function mapRecord(record, definition) {
    if (!record?.id || !record.name || !record.description || !record.country)
      throw new Error(
        "Record is missing an id, name, country, or description.",
      );
    const annualThroughput = record.annual_throughput;
    if (
      annualThroughput &&
      (!Number.isInteger(annualThroughput.year) ||
        !Number.isFinite(annualThroughput.teu) ||
        annualThroughput.teu < 0 ||
        !Number.isFinite(annualThroughput.yoy_growth_percent))
    ) {
      throw new Error(`Location ${record.id} has invalid annual throughput.`);
    }
    const common = {
      id: record.id,
      name: record.name,
      country: record.country,
      status: record.status || "unverified",
      overview: record.description,
      sources: Array.isArray(record.sources) ? record.sources : [],
      detailUrl:
        typeof record.detail_url === "string" &&
        record.detail_url.startsWith("/") &&
        !record.detail_url.startsWith("//")
          ? record.detail_url
          : null,
      anchor: definition.layer === "ports" ? "ports-trade" : "regions-projects",
    };
    if (!isValidPoint(record.coordinates))
      throw new Error(`Location ${record.id} has invalid coordinates.`);
    return {
      ...common,
      type: definition.type,
      layer: definition.layer,
      coords: record.coordinates,
      annualThroughput: record.annual_throughput
        ? {
            year: record.annual_throughput.year,
            teu: record.annual_throughput.teu,
            yoyGrowthPercent: record.annual_throughput.yoy_growth_percent,
          }
        : null,
      coordinatePrecision:
        record.coordinate_precision || "Coordinate precision not provided.",
      kind: definition.layer === "projects" ? "project" : definition.layer,
    };
  }

  async function loadLogisticsData() {
    refreshButton.disabled = true;
    refreshButton.setAttribute("aria-busy", "true");
    dataStatus.textContent = "Refreshing atlas data…";
    const requests = await Promise.allSettled(
      datasetDefinitions.map(async (definition) => {
        const response = await fetch(`/data/logistics/${definition.file}`, {
          cache: "no-cache",
          headers: { Accept: "application/json" },
        });
        if (!response.ok)
          throw new Error(`${definition.file}: HTTP ${response.status}`);
        const dataset = await response.json();
        if (
          dataset.dataset !== definition.dataset ||
          !Array.isArray(dataset.records)
        )
          throw new Error(`${definition.file}: missing records array`);
        return { definition, dataset };
      }),
    );
    const loadedDates = [];
    const failures = [];

    requests.forEach((request, index) => {
      const definition = datasetDefinitions[index];
      if (request.status === "rejected") {
        failures.push(`${definition.file}: ${request.reason.message}`);
        return;
      }
      const { dataset } = request.value;
      dataGroups[definition.layer].clearLayers();
      for (
        let featureIndex = allFeatures.length - 1;
        featureIndex >= 0;
        featureIndex--
      ) {
        if (allFeatures[featureIndex].layer === definition.layer)
          allFeatures.splice(featureIndex, 1);
      }
      if (dataset.last_updated) loadedDates.push(dataset.last_updated);
      dataset.records.forEach((record) => {
        try {
          const feature = mapRecord(record, definition);
          addMarker(feature, definition.glyph, feature.kind);
        } catch (error) {
          failures.push(
            `${definition.file} · ${record?.id || "record"}: ${error.message}`,
          );
        }
      });
    });

    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (focusId) {
      const focusedFeature = allFeatures.find(
        (feature) => feature.id === focusId,
      );
      if (focusedFeature) {
        map.flyTo(focusedFeature.coords, Math.max(map.getZoom(), 6), {
          duration: 0.6,
        });
        openFeature(focusedFeature);
      }
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("focus");
      window.history.replaceState(null, "", cleanUrl);
    }

    renderResults();
    const recordsLoaded = allFeatures.filter((feature) =>
      Object.hasOwn(dataGroups, feature.layer),
    ).length;
    refreshButton.disabled = false;
    refreshButton.removeAttribute("aria-busy");
    if (requests.every((request) => request.status === "rejected")) {
      dataStatus.textContent = `Unable to refresh data; previously loaded records were kept. ${failures.join(" · ")}`;
      return;
    }
    const latestDate = loadedDates.sort().at(-1);
    dataStatus.textContent = `${recordsLoaded} records loaded · ${requests.filter((request) => request.status === "fulfilled").length}/${datasetDefinitions.length} files${latestDate ? ` · updated ${latestDate}` : ""}${failures.length ? ` · Issues: ${failures.join(" · ")}` : ""}`;
  }

  refreshButton.addEventListener("click", loadLogisticsData);
  loadLogisticsData();

  // Retained only as an inactive legacy prototype; the atlas now uses JSON records.
  if (false) {
    const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    const vehicles = [
      {
        name: "Demo vessel",
        layer: "shipping",
        route: 0,
        glyph: "▰",
        duration: 52000,
        overview:
          "Animated illustrative vessel moving along a schematic path. No vessel tracking or live AIS data is shown.",
      },
      {
        name: "Demo vessel",
        layer: "shipping",
        route: 2,
        glyph: "▰",
        duration: 68000,
        overview:
          "Animated illustrative vessel moving along a schematic path. No vessel tracking or live AIS data is shown.",
      },
      {
        name: "Demo aircraft",
        layer: "flightpaths",
        route: 8,
        glyph: "✈",
        duration: 24000,
        overview:
          "Animated illustrative aircraft moving along a schematic connection. No real flight or schedule data is shown.",
      },
      {
        name: "Demo aircraft",
        layer: "flightpaths",
        route: 9,
        glyph: "✈",
        duration: 27000,
        overview:
          "Animated illustrative aircraft moving along a schematic connection. No real flight or schedule data is shown.",
      },
      {
        name: "Demo train",
        layer: "rail",
        route: 3,
        glyph: "▰",
        duration: 72000,
        overview:
          "Animated illustrative train moving along a schematic corridor. No real service or live train data is shown.",
      },
      {
        name: "Demo truck",
        layer: "road",
        route: 6,
        glyph: "●",
        duration: 40000,
        overview:
          "Animated illustrative truck moving along a schematic corridor. No live vehicle or traffic data is shown.",
      },
    ];

    const vehicleMarkers = vehicles.map((vehicle, index) => {
      const route = routes[vehicle.route];
      const marker = L.marker(route.coords[0], {
        icon: markerIcon(vehicle.layer, vehicle.glyph, "vehicle"),
        title: vehicle.name,
        keyboard: true,
        zIndexOffset: 500,
      }).addTo(groups[vehicle.layer]);
      const feature = {
        name: vehicle.name,
        type: "Animated demo vehicle",
        layer: vehicle.layer,
        anchor:
          vehicle.layer === "rail" || vehicle.layer === "road"
            ? "regions-projects"
            : "ports-trade",
        overview: vehicle.overview,
        coords: route.coords[0],
        layerRef: marker,
      };
      marker.on("click", () => openFeature(feature));
      allFeatures.push(feature);
      return { ...vehicle, marker, index };
    });

    function interpolate(coords, progress) {
      const lengths = [];
      let total = 0;
      for (let i = 1; i < coords.length; i++) {
        const a = L.latLng(coords[i - 1]);
        const b = L.latLng(coords[i]);
        const length = map.distance(a, b);
        lengths.push(length);
        total += length;
      }
      let remaining = progress * total;
      for (let i = 0; i < lengths.length; i++) {
        if (remaining <= lengths[i] || i === lengths.length - 1) {
          const fraction = lengths[i] ? remaining / lengths[i] : 0;
          return [
            coords[i][0] + (coords[i + 1][0] - coords[i][0]) * fraction,
            coords[i][1] + (coords[i + 1][1] - coords[i][1]) * fraction,
          ];
        }
        remaining -= lengths[i];
      }
      return coords[coords.length - 1];
    }

    let animationFrame = 0;
    const animateVehicles = (now) => {
      if (!motionAllowed || document.hidden) return;
      vehicleMarkers.forEach((vehicle) => {
        if (!layerOn[vehicle.layer]) return;
        const route = routes[vehicle.route];
        const progress =
          ((now + vehicle.index * 3700) % vehicle.duration) / vehicle.duration;
        vehicle.marker.setLatLng(interpolate(route.coords, progress));
      });
      animationFrame = window.requestAnimationFrame(animateVehicles);
    };
    if (motionAllowed)
      animationFrame = window.requestAnimationFrame(animateVehicles);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) window.cancelAnimationFrame(animationFrame);
      else if (motionAllowed)
        animationFrame = window.requestAnimationFrame(animateVehicles);
    });
  }

  function renderResults() {
    const query = document.querySelector("#search").value.trim().toLowerCase();
    const results = document.querySelector("#results");
    results.replaceChildren();
    if (!query) return;
    const matches = allFeatures
      .filter((feature) => layerOn[feature.layer])
      .filter((feature) =>
        `${feature.name} ${feature.type} ${feature.country || ""} ${feature.overview}`
          .toLowerCase()
          .includes(query),
      )
      .sort((a, b) => {
        const score = (feature) => {
          const name = feature.name.toLowerCase();
          if (name === query) return 0;
          if (name.startsWith(query)) return 1;
          if (name.includes(query)) return 2;
          return 3;
        };
        return score(a) - score(b);
      })
      .slice(0, 8);
    matches.forEach((feature) => {
      const option = document.createElement("button");
      option.type = "button";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      const title = document.createElement("strong");
      title.textContent = feature.name;
      const caption = document.createElement("span");
      caption.textContent = `${feature.type} · ${feature.overview}`;
      option.append(title, caption);
      option.addEventListener("click", () => {
        if (feature.path && feature.layerRef?.getBounds) {
          map.fitBounds(feature.layerRef.getBounds(), {
            padding: [70, 70],
            maxZoom: 11,
          });
        } else if (feature.coords)
          map.flyTo(feature.coords, Math.max(map.getZoom(), 6), {
            duration: 0.8,
          });
        openFeature(feature);
      });
      results.append(option);
    });
    if (!matches.length) {
      const empty = document.createElement("span");
      empty.className = "search-empty";
      empty.textContent = "No matching visible layers.";
      results.append(empty);
    }
  }

  document.querySelector("#search").addEventListener("input", renderResults);
  document.querySelectorAll("#layers button").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.l;
      layerOn[key] = !layerOn[key];
      button.classList.toggle("off", !layerOn[key]);
      button.setAttribute("aria-pressed", String(layerOn[key]));
      if (layerOn[key]) groups[key].addTo(map);
      else map.removeLayer(groups[key]);
      if (key === "labels") updateCountryLabels();
      renderResults();
      if (selectedFeature && !layerOn[selectedFeature.layer]) {
        closeCard();
      }
    });
  });

  document.querySelector("#zi").addEventListener("click", () => map.zoomIn());
  document.querySelector("#zo").addEventListener("click", () => map.zoomOut());
  document
    .querySelector("#zr")
    .addEventListener("click", () => map.flyTo([22, 10], 2.25));

  const closeCard = () => {
    document.querySelector("#featureCard").hidden = true;
    if (selectedFeature)
      setFeatureStyle(selectedFeature, selectedFeature.baseStyle);
    if (selectedLayer && typeof selectedLayer.setZIndexOffset === "function") {
      selectedLayer.setZIndexOffset(0);
    }
    selectedLayer = null;
    selectedFeature = null;
  };
  document.querySelector("#featureClose").addEventListener("click", closeCard);
  document
    .querySelector("#featureCloseSecondary")
    .addEventListener("click", closeCard);
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !document.querySelector("#featureCard").hidden
    )
      closeCard();
  });

  document.querySelector("#hideControls").addEventListener("click", () => {
    document.querySelector("#head").hidden = true;
    document.querySelector("#showControls").hidden = false;
    document.querySelector("#showControls").focus();
    map.invalidateSize();
  });
  document.querySelector("#showControls").addEventListener("click", () => {
    document.querySelector("#head").hidden = false;
    document.querySelector("#showControls").hidden = true;
    document.querySelector("#search").focus();
    map.invalidateSize();
  });

  map.on("click", (event) => {
    const lat = event.latlng.lat.toFixed(3);
    const lng = event.latlng.lng.toFixed(3);
    document.querySelector("#announce").textContent =
      `Map position ${lat}, ${lng}. Select a marker or colored route for an overview.`;
  });
  map.whenReady(() => window.setTimeout(() => map.invalidateSize(), 50));
})();
