// @ts-check
import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import Tify from "../vendor/tify/dist/tify.js";

const TRANSLATIONS_DIR = new URL("../vendor/tify/dist/translations", import.meta.url).href;

/**
 * Detail view mounting TIFY on the row's first non-empty "iiif" column.
 * Receives the standard DetailViewProps (see core view-registry.js).
 */
export function IiifDetailView({ columns, row, lang }) {
    const container = useRef(null);

    const manifestCol = row
        ? columns.find(c => c.displayType === "iiif" && row[c.name] != null && row[c.name] !== "")
        : null;
    const manifestUrl = manifestCol ? String(row[manifestCol.name]) : null;
    // "format": { "pageColumn": "canvas" } opens the viewer at the 1-based canvas in that column
    const pageColumn = manifestCol?.format?.pageColumn;
    const page = pageColumn ? Number(row[pageColumn]) || 0 : 0;

    useEffect(() => {
        if (!container.current || !manifestUrl) return;
        // "P" = physical page number only; TIFY's default "P · L" duplicates
        // the number when a manifest labels pages with plain numbers. Restore
        // labels per column via "format": { "pageLabelFormat": "P · L" }.
        const format = manifestCol?.format ?? {};
        const tify = new Tify({
            container: container.current,
            manifestUrl,
            language: lang || "en",
            translationsDirUrl: TRANSLATIONS_DIR,
            pageLabelFormat: typeof format.pageLabelFormat === "string" ? format.pageLabelFormat : "P",
            ...(page > 0 ? { pages: [page] } : {}),
        });
        // A missing translation must not take the viewer down.
        tify.ready.catch(err => console.warn("[iiif-viewer] TIFY failed to initialise:", err));
        return () => tify.destroy();
    }, [manifestUrl, page, lang]);

    if (!row) return h("p", null, "Row not found.");
    if (!manifestUrl) return h("p", null, "No IIIF manifest for this row.");

    return h("div", { class: "iiif-detail-view fill-height", ref: container });
}
