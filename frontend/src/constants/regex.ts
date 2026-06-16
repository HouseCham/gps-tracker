/**
 * @constant UUID_REGEX
 * @description Regular expression for validating UUIDv4
 * @type {RegExp}
 */
export const UUID_REGEX: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * @constant EMAIL_RE
 * @description Regular expression for validating email
 * @type {RegExp}
 */
export const EMAIL_REGEX: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;