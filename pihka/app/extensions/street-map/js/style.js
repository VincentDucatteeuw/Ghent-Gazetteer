// @ts-check
/**
 * The basemap style (Protomaps basemap schema, from assets/ghent.pmtiles) and the street overlay: its layers,
 * colour classes and legend. No MapLibre import here, so the class logic can be tested on its own.
 */

const POINT_MAP = new URL("../../../../extensions/point_map/", import.meta.url).href;
export const TILES_URL = "pmtiles://" + new URL("../assets/ghent.pmtiles", import.meta.url).href;
// By hand, not new URL(): that would percent-encode MapLibre's {fontstack}/{range} template
const GLYPHS_URL = POINT_MAP + "assets/glyphs/{fontstack}/{range}.pbf";
const FONT = ["Noto Sans Regular"];

// Sequential, light to dark (ColorBrewer YlOrRd): one per class, at most five classes
export const COLORS = ["#fecc5c", "#fd8d3c", "#f03b20", "#bd0026", "#67000d"];
export const WIDTHS = [2.5, 3.5, 4.5, 5.5, 7];
export const ZERO_COLOR = "#8a8a8a";
export const NO_DATA_COLOR = "#b9b9b9";

export const GHENT = { center: [3.7250, 51.0543], zoom: 13, bounds: [[3.40, 50.90], [4.00, 51.30]] };

/** The basemap: land, water, buildings, roads and rail kept quiet, so the coloured streets stand out. */
export function baseStyle() {
    const roads = (id, width, color, extra = {}) => ({
        id, type: "line", source: "protomaps", "source-layer": "roads",
        filter: ["!=", ["get", "kind"], "path"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": color,
                 "line-width": ["interpolate", ["exponential", 1.6], ["zoom"], 11, width * 0.4, 14, width, 18, width * 5] },
        ...extra,
    });
    return {
        version: 8,
        glyphs: GLYPHS_URL,
        sources: {
            protomaps: { type: "vector", url: TILES_URL, attribution: "© OpenStreetMap contributors, Protomaps" },
        },
        layers: [
            { id: "background", type: "background", paint: { "background-color": "#f4f1ea" } },
            { id: "earth", type: "fill", source: "protomaps", "source-layer": "earth", paint: { "fill-color": "#f4f1ea" } },
            { id: "landcover", type: "fill", source: "protomaps", "source-layer": "landcover",
              paint: { "fill-color": "#dfe7d3", "fill-opacity": 0.6 } },
            { id: "landuse", type: "fill", source: "protomaps", "source-layer": "landuse",
              paint: { "fill-color": "#e9e5d9", "fill-opacity": 0.6 } },
            { id: "water", type: "fill", source: "protomaps", "source-layer": "water", paint: { "fill-color": "#bcd3e6" } },
            { id: "buildings", type: "fill", source: "protomaps", "source-layer": "buildings", minzoom: 13,
              paint: { "fill-color": "#e3ded4", "fill-opacity": 0.8 } },
            { id: "rail", type: "line", source: "protomaps", "source-layer": "roads",
              filter: ["==", ["get", "kind"], "rail"],
              paint: { "line-color": "#c4bfb5", "line-width": 1, "line-dasharray": [3, 3] } },
            roads("road-casing", 1.6, "#d8d2c6"),
            roads("road", 1.0, "#ffffff"),
        ],
    };
}

/** Street names of the basemap, above the overlay (from zoom 15). */
export const LABELS = {
    id: "road-labels", type: "symbol", source: "protomaps", "source-layer": "roads", minzoom: 15,
    filter: ["has", "name"],
    layout: { "symbol-placement": "line", "text-field": ["get", "name"], "text-font": FONT, "text-size": 11 },
    paint: { "text-color": "#555", "text-halo-color": "#fff", "text-halo-width": 1.2 },
};

/**
 * Lower bounds of at most `k` classes for the counts (> 0): every count its own class when there are few, else
 * classes of equal width on a log scale from 1 to the largest count. The counts are skewed (most streets have one
 * or two), so quantiles would put nearly all bounds at 1 and 2 and lump 3 to 27 together; on a log scale the busy
 * streets keep the dark colours. Largest 27 -> classes 1, 2-3, 4-6, 7-13, 14-27.
 */
export function classBreaks(counts, k = COLORS.length) {
    const values = [...counts].filter((n) => n > 0);
    const unique = [...new Set(values)].sort((a, b) => a - b);
    if (unique.length <= k) return unique;
    const max = unique[unique.length - 1];
    const breaks = [];
    for (let i = 0; i < k; i++) breaks.push(Math.round(max ** (i / k)));
    return [...new Set(breaks)];
}

/** A line width that grows with the zoom: `width` px at zoom 15, less at the overview. */
export function byZoom(width) {
    const scaled = (f) => (typeof width === "number" ? width * f : ["*", width, f]);
    return ["interpolate", ["linear"], ["zoom"], 11, scaled(0.3), 13, scaled(0.55), 15, scaled(1), 18, scaled(1.8)];
}

/** A MapLibre `step` expression on the property `n` over the class breaks. */
export function stepBy(breaks, outputs) {
    if (breaks.length <= 1) return outputs[0];
    const expr = ["step", ["get", "n"], outputs[0]];
    breaks.slice(1).forEach((b, i) => expr.push(b, outputs[i + 1]));
    return expr;
}

/** The legend's labels: '1', '2–3', '14–27' (the last class up to the largest count). */
export function classLabels(breaks, max) {
    return breaks.map((b, i) => {
        const upper = i + 1 < breaks.length ? breaks[i + 1] - 1 : max;
        return upper > b ? `${b}–${upper}` : `${b}`;
    });
}

/** The overlay: streets without entries that year (dashed), with entries but none of the occupation, with. */
export function overlayLayers(breaks) {
    return [
        { id: "streets-no-data", type: "line", source: "streets", filter: ["==", ["get", "state"], "no-data"],
          layout: { "line-cap": "round" },
          paint: { "line-color": NO_DATA_COLOR, "line-width": byZoom(1.4), "line-dasharray": [2, 2] } },
        { id: "streets-zero", type: "line", source: "streets", filter: ["==", ["get", "state"], "zero"],
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": ZERO_COLOR, "line-width": byZoom(1.6), "line-opacity": 0.6 } },
        { id: "streets-count", type: "line", source: "streets", filter: ["==", ["get", "state"], "count"],
          layout: { "line-cap": "round", "line-join": "round", "line-sort-key": ["get", "n"] },
          paint: { "line-color": stepBy(breaks, COLORS), "line-width": byZoom(stepBy(breaks, WIDTHS)) } },
    ];
}

/**
 * The streets of today as features for one layer: state "count" (n persons of the occupation), "zero" (persons
 * that year, none of the occupation) or "no-data" (no entries on that street that year).
 */
export function layerFeatures(streets, counts, volume) {
    return streets.map((f) => {
        const n = counts.get(f.id) || 0;
        const any = (f.properties.years || {})[String(volume)] || 0;
        return { ...f, properties: { ...f.properties, n, state: n > 0 ? "count" : any > 0 ? "zero" : "no-data" } };
    });
}
