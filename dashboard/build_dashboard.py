"""Generate a single self-contained dashboard (index.html) from
toronto_data.json. The data is inlined as a JS constant so the file works
straight from disk (file://) with no server. Leaflet + Plotly load from CDN,
and the OpenStreetMap basemap needs internet when viewed."""

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = json.loads((HERE / "toronto_data.json").read_text())
OUT = HERE / "index.html"

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Toronto Neighborhood Clusters</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script src="https://cdn.plot.ly/plotly-2.35.2.min.js" charset="utf-8"></script>
<style>
  :root {
    --bg: #0f172a; --panel: #1e293b; --panel2: #273449; --text: #e2e8f0;
    --muted: #94a3b8; --border: #334155; --accent: #38bdf8;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); }
  header { padding: 18px 24px; border-bottom: 1px solid var(--border);
    background: linear-gradient(90deg, #0f172a, #1e293b); }
  header h1 { margin: 0; font-size: 20px; }
  header p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
  .stats { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
  .stat { background: var(--panel); border: 1px solid var(--border);
    border-radius: 8px; padding: 8px 14px; min-width: 92px; }
  .stat .n { font-size: 20px; font-weight: 700; color: var(--accent); }
  .stat .l { font-size: 11px; color: var(--muted); text-transform: uppercase;
    letter-spacing: .04em; }
  .layout { display: grid; grid-template-columns: 320px 1fr; gap: 14px;
    padding: 14px; align-items: start; }
  .sidebar { display: flex; flex-direction: column; gap: 14px; }
  .card { background: var(--panel); border: 1px solid var(--border);
    border-radius: 10px; padding: 14px; }
  .card h2 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase;
    letter-spacing: .05em; color: var(--muted); }
  .legend-item { display: flex; align-items: center; gap: 10px; padding: 7px 8px;
    border-radius: 7px; cursor: pointer; font-size: 13px; transition: background .15s; }
  .legend-item:hover { background: var(--panel2); }
  .legend-item.active { background: var(--panel2); outline: 1px solid var(--accent); }
  .legend-item.dim { opacity: .4; }
  .swatch { width: 14px; height: 14px; border-radius: 50%; flex: 0 0 auto; }
  .legend-item .name { flex: 1; }
  .legend-item .name small { display: block; color: var(--muted); font-size: 11px; }
  .legend-item .cnt { color: var(--muted); font-variant-numeric: tabular-nums; }
  select { width: 100%; padding: 8px; border-radius: 7px; background: var(--panel2);
    color: var(--text); border: 1px solid var(--border); font-size: 13px; }
  #map { height: 520px; border-radius: 10px; border: 1px solid var(--border); }
  .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
  .chart-box { background: var(--panel); border: 1px solid var(--border);
    border-radius: 10px; padding: 8px; }
  .detail .hood { font-size: 16px; font-weight: 700; }
  .detail .meta { color: var(--muted); font-size: 12px; margin: 4px 0 10px; }
  .vbar { display: flex; align-items: center; gap: 8px; margin: 5px 0; font-size: 12px; }
  .vbar .track { flex: 1; height: 8px; background: var(--panel2); border-radius: 4px;
    overflow: hidden; }
  .vbar .fill { height: 100%; border-radius: 4px; }
  .vbar .lbl { width: 130px; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; }
  .vbar .pct { width: 38px; text-align: right; color: var(--muted);
    font-variant-numeric: tabular-nums; }
  .empty { color: var(--muted); font-size: 12px; font-style: italic; }
  .note { font-size: 11px; color: var(--muted); line-height: 1.5; }
  .leaflet-popup-content { font-size: 12px; }
  a { color: var(--accent); }
  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; } .charts { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<header>
  <h1>Toronto Neighborhood Clusters</h1>
  <p>K-Means segmentation of 38 Toronto neighborhoods by Foursquare venue profiles
     &middot; reconstructed from the original notebook's results</p>
  <div class="stats" id="stats"></div>
</header>

<div class="layout">
  <aside class="sidebar">
    <div class="card">
      <h2>Clusters</h2>
      <div id="legend"></div>
    </div>
    <div class="card">
      <h2>Jump to neighborhood</h2>
      <select id="hoodSelect"></select>
    </div>
    <div class="card detail" id="detail">
      <div class="empty">Click a point on the map (or pick a neighborhood) to see
        its venue profile.</div>
    </div>
    <div class="card">
      <h2>About the data</h2>
      <p class="note">Cluster labels are the original notebook's K-Means output
        (k=5). Venue percentages are the share of each category among a
        neighborhood's nearby Foursquare venues. The data could not be
        regenerated live (Wikipedia &amp; Foursquare are unreachable and the
        Foursquare endpoint is retired), so it was reconstructed from the
        notebook's saved cell outputs joined to
        <code>Geospatial_Coordinates.csv</code>.</p>
    </div>
  </aside>

  <main>
    <div id="map"></div>
    <div class="charts">
      <div class="chart-box"><div id="clusterChart"></div></div>
      <div class="chart-box"><div id="venueChart"></div></div>
    </div>
  </main>
</div>

<script>
const DATA = __DATA__;

const COLORS = ["#38bdf8", "#34d399", "#a78bfa", "#fb923c", "#f472b6"];

// Build a short descriptor for each cluster from its members' top venues.
function clusterInfo() {
  const info = {};
  DATA.forEach(d => {
    (info[d.cluster] ??= { count: 0, freq: {} });
    info[d.cluster].count++;
    d.venues.forEach(v => {
      if (v.freq > 0) info[d.cluster].freq[v.name] =
        (info[d.cluster].freq[v.name] || 0) + v.freq;
    });
  });
  Object.values(info).forEach(c => {
    c.top = Object.entries(c.freq).sort((a, b) => b[1] - a[1])
      .slice(0, 3).map(e => e[0]);
  });
  return info;
}
const CINFO = clusterInfo();
const clusterIds = Object.keys(CINFO).map(Number).sort((a, b) => a - b);

let activeCluster = null; // null = show all

// ---- summary stats ----
const boroughs = new Set(DATA.map(d => d.borough));
const cats = new Set();
DATA.forEach(d => d.venues.forEach(v => { if (v.freq > 0) cats.add(v.name); }));
const stats = [
  ["Neighborhoods", DATA.length],
  ["Clusters", clusterIds.length],
  ["Boroughs", boroughs.size],
  ["Venue types", cats.size],
];
document.getElementById("stats").innerHTML = stats.map(
  ([l, n]) => `<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`
).join("");

// ---- map ----
const map = L.map("map").setView([43.6535, -79.3839], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const markers = DATA.map(d => {
  const top = d.venues.filter(v => v.freq > 0).slice(0, 5)
    .map(v => `${v.name} (${Math.round(v.freq * 100)}%)`).join("<br>");
  const m = L.circleMarker([d.lat, d.lng], {
    radius: 9, color: "#0f172a", weight: 1,
    fillColor: COLORS[d.cluster], fillOpacity: 0.85,
  }).bindPopup(
    `<b>${d.neighborhood}</b><br><i>${d.borough}</i> &middot; Cluster ${d.cluster}` +
    `<br><br>${top || "<i>no venues found</i>"}`
  );
  m.on("click", () => showDetail(d));
  m._rec = d;
  m.addTo(map);
  return m;
});

// ---- legend ----
function renderLegend() {
  const el = document.getElementById("legend");
  el.innerHTML = clusterIds.map(id => {
    const c = CINFO[id];
    const dim = activeCluster !== null && activeCluster !== id ? "dim" : "";
    const act = activeCluster === id ? "active" : "";
    return `<div class="legend-item ${dim} ${act}" data-c="${id}">
      <span class="swatch" style="background:${COLORS[id]}"></span>
      <span class="name">Cluster ${id}<small>${c.top.join(" · ") || "—"}</small></span>
      <span class="cnt">${c.count}</span></div>`;
  }).join("") +
  `<div class="legend-item ${activeCluster === null ? "active" : ""}" data-c="all">
     <span class="swatch" style="background:#64748b"></span>
     <span class="name">Show all</span><span class="cnt">${DATA.length}</span></div>`;
  el.querySelectorAll(".legend-item").forEach(item => {
    item.onclick = () => {
      const c = item.dataset.c;
      activeCluster = (c === "all") ? null : Number(c);
      applyFilter();
    };
  });
}

function applyFilter() {
  markers.forEach(m => {
    const show = activeCluster === null || m._rec.cluster === activeCluster;
    if (show) m.addTo(map); else map.removeLayer(m);
  });
  renderLegend();
  drawVenueChart();
  drawClusterChart();
}

// ---- detail panel ----
function showDetail(d) {
  const venues = d.venues.filter(v => v.freq > 0);
  const max = Math.max(...d.venues.map(v => v.freq), 0.01);
  const bars = (venues.length ? venues : d.venues.slice(0, 5)).map(v => `
    <div class="vbar">
      <span class="lbl" title="${v.name}">${v.name}</span>
      <span class="track"><span class="fill" style="width:${(v.freq / max) * 100}%;
        background:${COLORS[d.cluster]}"></span></span>
      <span class="pct">${Math.round(v.freq * 100)}%</span>
    </div>`).join("");
  document.getElementById("detail").innerHTML = `
    <div class="hood">${d.neighborhood}</div>
    <div class="meta">${d.borough} &middot; ${d.postcode} &middot;
      <span style="color:${COLORS[d.cluster]}">&#9679;</span> Cluster ${d.cluster}</div>
    ${bars}
    ${venues.length ? "" : '<div class="empty">Few venues nearby — categories are tied.</div>'}`;
}

// ---- dropdown ----
const sel = document.getElementById("hoodSelect");
sel.innerHTML = '<option value="">Select…</option>' +
  DATA.map((d, i) => `<option value="${i}">${d.neighborhood}</option>`).join("");
sel.onchange = () => {
  if (sel.value === "") return;
  const d = DATA[+sel.value];
  map.setView([d.lat, d.lng], 14);
  markers[+sel.value].openPopup();
  showDetail(d);
};

// ---- charts ----
const PLOT_LAYOUT = {
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0", size: 11 }, margin: { t: 36, r: 10, b: 80, l: 110 },
};
const PLOT_CFG = { displayModeBar: false, responsive: true };

function drawClusterChart() {
  const x = clusterIds.map(id => "Cluster " + id);
  const y = clusterIds.map(id => CINFO[id].count);
  const colors = clusterIds.map(id =>
    activeCluster === null || activeCluster === id ? COLORS[id] : "#475569");
  Plotly.react("clusterChart", [{
    type: "bar", x, y, marker: { color: colors },
    hovertemplate: "%{x}: %{y} neighborhoods<extra></extra>",
  }], { ...PLOT_LAYOUT, title: "Neighborhoods per cluster",
        margin: { t: 36, r: 10, b: 50, l: 40 } }, PLOT_CFG);
}

function drawVenueChart() {
  const pool = activeCluster === null ? DATA
    : DATA.filter(d => d.cluster === activeCluster);
  const agg = {};
  pool.forEach(d => d.venues.forEach(v => {
    if (v.freq > 0) agg[v.name] = (agg[v.name] || 0) + v.freq;
  }));
  const top = Object.entries(agg).sort((a, b) => a[1] - b[1]).slice(-15);
  const title = activeCluster === null
    ? "Top venue categories (all clusters)"
    : `Top venue categories · Cluster ${activeCluster}`;
  Plotly.react("venueChart", [{
    type: "bar", orientation: "h",
    y: top.map(e => e[0]), x: top.map(e => +e[1].toFixed(2)),
    marker: { color: activeCluster === null ? "#38bdf8" : COLORS[activeCluster] },
    hovertemplate: "%{y}: %{x}<extra></extra>",
  }], { ...PLOT_LAYOUT, title }, PLOT_CFG);
}

renderLegend();
drawClusterChart();
drawVenueChart();
</script>
</body>
</html>
"""


def main():
    html = HTML.replace("__DATA__", json.dumps(DATA))
    OUT.write_text(html)
    print(f"Wrote dashboard to {OUT}  ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
