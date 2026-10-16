// @ts-check
/**
 * Scan crops (Wegwijzers): the cell type "iiif-crop". An entry stores only the IIIF Image API region and size of
 * its crop ("pct:56.2,48.6,40.6,2.7/1000,"); the scan's service, the same for every entry on it and some 500
 * characters long, is the label of the row's scan (table scans, through the column named by format.scanColumn),
 * which Pihka has already resolved for the FK column. Copied into the site by `wegwijzers visualise`
 * (app/extensions/iiif-crop).
 *
 *   "afbeelding": { "type": "iiif-crop", "format": { "scanColumn": "scan_id" } }
 */
import { h } from "preact";
import { cropUrl } from "./js/crop-url.js";

function IiifCrop({ col, value, row, fkResolved, imageHeight }) {
    const scanColumn = col?.format?.scanColumn || "scan_id";
    const service = fkResolved?.[scanColumn]?.displayMap?.[row?.[scanColumn]];
    const src = cropUrl(service, value);
    if (!src) return "";
    return h("img", {
        src,
        alt: String(row?.name ?? "scan"),
        loading: "lazy",
        style: `max-height:${imageHeight};max-width:100%;border-radius:3px`,
    });
}

export function register(api) {
    api.registerComponent({ kind: "cell", id: "iiif-crop", component: IiifCrop });
}
