/**
 * @constant {string}
 * @description Default map style URL
 */
const DEFAULT_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
/**
 * @constant {string}
 * @description Map style URL
 */
export const MAP_STYLE_URL: string =
    (import.meta.env.PUBLIC_MAP_STYLE_URL as string | undefined) ??
    DEFAULT_MAP_STYLE;
/**
 * @constant {number}
 * @description Online threshold in milliseconds
 */
export const MAP_ONLINE_THRESHOLD_MS = 5 * 60 * 1000;