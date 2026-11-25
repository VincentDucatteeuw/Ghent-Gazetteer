// @ts-check
/**
 * Street map (Wegwijzers): the persons and firms of one occupation (HISCO code) in one volume, per street of
 * today, drawn on that street's geometry over a basemap of Ghent.
 *
 * The perspective "kaart" lists map layers (table kaartlagen: one per volume and code). With one layer chosen
 * (facets jaargang_id and beroep_id), the view loads that layer's counts (table personen_per_straat, by its index)
 * and colours the streets of today (table moderne_straten, GeoJSON, loaded once). Copied into the site by
 * `wegwijzers visualise` (app/extensions/street-map); MapLibre, PMTiles and the glyphs are the point_map
 * extension's, the basemap (assets/ghent.pmtiles) an extract of the Protomaps basemap.
 */
import StreetMapView from "./js/street-map-view.js";

const POINT_MAP = new URL("../../../extensions/point_map/", import.meta.url).href;

export function register(api) {
    api.stylesheet(POINT_MAP + "vendor/maplibre-gl/dist/maplibre-gl.css", { key: "maplibre-gl-css" });
    api.stylesheet(POINT_MAP + "css/maplibre-pico-reset.css", { key: "maplibre-pico-reset" });
    api.stylesheet(new URL("./css/street-map.css", import.meta.url).href);

    api.registerComponent({
        kind: "view",
        id: "street_map",
        context: "list",
        component: StreetMapView,
        icon: "🗺",
        paginated: false,
        availableFor: (columns) => ["jaargang_id", "beroep_id", "op_de_kaart"]
            .every((name) => columns.some((c) => c.name === name)),
    });
}
