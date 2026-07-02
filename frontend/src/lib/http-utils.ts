/**
 * Reads the device id from the `?id=` query string.
 * @returns {string | null} The id, or `null` if absent.
 */
export function readDeviceIdFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id && id.length > 0 ? id : null;
}
