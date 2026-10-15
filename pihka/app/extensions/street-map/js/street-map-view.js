// @ts-check
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { updateParams } from "../../../../core/ui/index.js";
import { loadMaplibre } from "../../../../extensions/point_map/js/maplibre-shim.js";
import { ensurePmtilesProtocol } from "../../../../extensions/point_map/js/pmtiles-protocol.js";
import {
    GHENT, LABELS, COLORS, ZERO_COLOR, NO_DATA_COLOR, baseStyle, classBreaks, classLabels, layerFeatures,
    overlayLayers, stepBy, byZoom, WIDTHS,
} from "./style.js";

const TEXT = {
    nl: {
        choose: "Kies één jaargang en één beroep (links) om de kaart te tekenen, of kies hieronder een kaartlaag.",
        layers: (n) => `${n} kaartlagen gevonden; de grootste:`,
        persons: (n) => `${n} ${n === 1 ? "persoon" : "personen"}`,
        onMap: (a, b) => `${a} van ${b} personen staan op een straat die met een straat van vandaag gekoppeld is.`,
        legend: "Personen en firma's met dit beroep",
        zero: "geen met dit beroep",
        noData: "geen vermeldingen dit jaar",
        loading: "Kaart laden…",
        streetsThen: "In de wegwijzers",
        error: "De kaart kon niet geladen worden",
    },
    en: {
        choose: "Choose one volume and one occupation (left) to draw the map, or pick a map layer below.",
        layers: (n) => `${n} map layers found; the largest:`,
        persons: (n) => `${n} ${n === 1 ? "person" : "persons"}`,
        onMap: (a, b) => `${a} of ${b} persons are on a street matched to a street of today.`,
        legend: "Persons and firms with this occupation",
        zero: "none with this occupation",
        noData: "no entries this year",
        loading: "Loading map…",
        streetsThen: "In the directories",
        error: "The map could not be loaded",
    },
};

// The streets of today, loaded once per page (about 3000 GeoJSON lines)
let streetsPromise = null;
function loadStreets(store) {
    if (!streetsPromise) {
        streetsPromise = store.queryTable("moderne_straten", { pageSize: null })
            .then(({ rows }) => rows.filter((r) => r.geometrie).map((r) => ({
                type: "Feature",
                id: r.id,
                geometry: JSON.parse(r.geometrie),
                properties: { id: r.id, name: r.name, straten: r.straten || "",
                              years: r.personen_per_jaar ? JSON.parse(r.personen_per_jaar) : {} },
            })))
            .catch((error) => { streetsPromise = null; throw error; });
    }
    return streetsPromise;
}

/** moderne_straat_id -> persons, for one volume and HISCO code (personen_per_straat, by its index). */
async function loadCounts(store, layer) {
    const { rows } = await store.queryTable("personen_per_straat", {
        filters: { jaargang_id: { type: "multi", selected: [layer.jaargang_id] },
                   beroep_id: { type: "multi", selected: [layer.beroep_id] } },
        pageSize: null,
    });
    return new Map(rows.map((r) => [r.moderne_straat_id, r.personen]));
}

const escape = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function LayerPicker({ rows, fkResolved, t }) {
    const label = (row) => row.name || `${fkResolved?.jaargang_id?.values?.[row.jaargang_id] ?? row.jaargang_id}`;
    const top = [...rows].sort((a, b) => (b.op_de_kaart ?? 0) - (a.op_de_kaart ?? 0)).slice(0, 30);
    return h("div", { class: "street-map-picker" },
        h("p", null, t.choose),
        h("p", { class: "street-map-muted" }, t.layers(rows.length)),
        h("ul", null, top.map((row) => h("li", { key: row.id },
            h("button", {
                class: "outline secondary street-map-pick",
                onClick: () => updateParams({ jaargang_id: row.jaargang_id, beroep_id: row.beroep_id }),
            }, label(row), " — ", t.persons(row.op_de_kaart ?? 0))))));
}

function Legend({ breaks, max, t }) {
    const labels = classLabels(breaks, max);
    const swatch = (color, width, dashed = false) => h("span", {
        class: "street-map-swatch",
        style: `border-top: ${width}px ${dashed ? "dashed" : "solid"} ${color}`,
    });
    return h("div", { class: "street-map-legend" },
        h("strong", null, t.legend),
        labels.map((label, i) => h("div", { key: label }, swatch(COLORS[i], WIDTHS[i]), label)),
        h("div", null, swatch(ZERO_COLOR, 2), t.zero),
        h("div", null, swatch(NO_DATA_COLOR, 2, true), t.noData));
}

export default function StreetMapView({ rows, store, lang, fkResolved }) {
    const t = TEXT[lang] || TEXT.en;
    const layer = rows && rows.length === 1 ? rows[0] : null;
    const container = useRef(null);
    const mapRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);
    const [legend, setLegend] = useState(null);

    // the map and the streets of today: once per mount
    useEffect(() => {
        if (!layer || mapRef.current) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const [maplibregl, streets] = await Promise.all([loadMaplibre(), loadStreets(store)]);
                await ensurePmtilesProtocol();
                if (cancelled || !container.current) return;
                const map = new maplibregl.Map({
                    container: container.current, style: baseStyle(), center: GHENT.center, zoom: GHENT.zoom,
                    minZoom: 10, maxZoom: 18, maxBounds: GHENT.bounds, attributionControl: { compact: true },
                });
                map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
                mapRef.current = { map, streets, maplibregl };
                map.on("load", () => {
                    if (cancelled) return;
                    map.addSource("streets", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
                    for (const l of overlayLayers([1])) map.addLayer(l);
                    map.addLayer(LABELS);
                    for (const id of ["streets-count", "streets-zero", "streets-no-data"]) {
                        map.on("click", id, (e) => {
                            const p = e.features?.[0]?.properties;
                            if (!p) return;
                            const then = String(p.straten || "").split("|").filter(Boolean).map(escape).join(", ");
                            new maplibregl.Popup({ closeButton: true, maxWidth: "320px" })
                                .setLngLat(e.lngLat)
                                .setHTML(`<strong>${escape(p.name)}</strong><br>${escape(t.persons(Number(p.n) || 0))}`
                                    + (then ? `<br><small>${escape(t.streetsThen)}: ${then}</small>` : ""))
                                .addTo(map);
                        });
                        map.on("mouseenter", id, () => { map.getCanvas().style.cursor = "pointer"; });
                        map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; });
                    }
                    setReady(true);
                });
            } catch (e) {
                console.error(e);
                if (!cancelled) setError(e);
            }
        })();
        return () => { cancelled = true; };
    }, [layer == null]);

    useEffect(() => () => { mapRef.current?.map.remove(); mapRef.current = null; }, []);

    // the chosen layer's counts
    useEffect(() => {
        if (!ready || !layer || !mapRef.current) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const counts = await loadCounts(store, layer);
                if (cancelled || !mapRef.current) return;
                const { map, streets } = mapRef.current;
                const breaks = classBreaks(counts.values());
                const max = Math.max(0, ...counts.values());
                map.getSource("streets").setData({ type: "FeatureCollection",
                                                   features: layerFeatures(streets, counts, layer.jaargang_id) });
                map.setPaintProperty("streets-count", "line-color", stepBy(breaks.length ? breaks : [1], COLORS));
                map.setPaintProperty("streets-count", "line-width", byZoom(stepBy(breaks.length ? breaks : [1], WIDTHS)));
                setLegend({ breaks, max });
            } catch (e) {
                console.error(e);
                if (!cancelled) setError(e);
            }
        })();
        return () => { cancelled = true; };
    }, [ready, layer?.id]);

    if (!layer) return h(LayerPicker, { rows: rows || [], fkResolved, t });
    return h("section", { class: "street-map-section" },
        h("p", { class: "street-map-muted" }, layer.name, " — ", t.onMap(layer.op_de_kaart ?? 0, layer.personen ?? 0)),
        error && h("p", { class: "street-map-error" }, `${t.error}: ${error.message || error}`),
        h("div", { class: "street-map-frame" },
            h("div", { ref: container, class: "map-canvas fill-height street-map-canvas" }),
            !ready && !error && h("div", { class: "street-map-loading" }, t.loading),
            ready && legend && h(Legend, { ...legend, t })));
}
