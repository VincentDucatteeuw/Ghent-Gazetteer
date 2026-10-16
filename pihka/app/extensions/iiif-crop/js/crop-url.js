// @ts-check
/**
 * The URL of a crop: the scan's IIIF Image API service, the region and size the entry stores
 * ("pct:0,0,52,100/!1000,1000"), then rotation, quality and format. Null without a service or a crop.
 * The same as visualise.image_url.
 *
 * @param {unknown} service
 * @param {unknown} image
 * @returns {string|null}
 */
export function cropUrl(service, image) {
    if (!service || !image) return null;
    return `${service}/${image}/0/default.jpg`;
}
