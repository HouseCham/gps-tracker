import type { Translation } from '@/i18n';
import type { Coordinate, DeviceMapRoutePoint, MarkerStatus } from '@/types/components';
/**
 * Project a latitude and longitude onto a 100x100 grid
 * @param {number} lat - The latitude to project.
 * @param {number} lng - The longitude to project.
 * @returns {{x: number, y: number}} The projected coordinates.
 */
export function projectCoordinate(lat: number, lng: number): Coordinate {
    const LAT_MIN = -60;
    const LAT_MAX = 75;
    const x = ((lng + 180) / 360) * 100;
    const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100;
    return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
    };
}
/**
 * Format a latitude and longitude into a human-readable string.
 * @param {number} lat - The latitude to format.
 * @param {number} lng - The longitude to format.
 * @returns {string} The formatted coordinates.
 */
export function formatCoords(lat: number, lng: number): string {
    return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
}
/**
 * Convert a route into a SVG path string.
 * @param {DeviceMapRoutePoint[]} route - The route to convert.
 * @returns {string} The SVG path string.
 */
export function getPathFromRoute(route: DeviceMapRoutePoint[]): string {
    if (route.length === 0) return '';
    return route
        .map((p, i) => {
            const { x, y } = projectCoordinate(p.lat, p.lng);
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
}
/**
 * Get the labels for the map status markers.
 * @param {Translation} t - The translation object.
 * @returns {Record<MarkerStatus, string>} The labels for the map status markers.
 */
export function getMapStatusLabels(t: Translation): Record<MarkerStatus, string> {
    return {
        online: t.device.online,
        offline: t.device.offline,
        'never-seen': t.device.neverSeen,
        unknown: t.device.unknown,
    };
}