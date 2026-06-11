/**
 * i18n entry point. Re-exports locale objects and provides a helper to
 * resolve the correct translation based on the current URL search param.
 * @module i18n
 */

import { en } from './en';
import { es } from './es';
import type { Translation } from './en';

export { en, es };
export type { Translation };

/** Supported locale codes. */
export type Locale = 'en' | 'es';

/**
 * Returns the translation object for the given locale, falling back to English.
 * @function getTranslation
 * @param {string} locale - BCP 47 locale string (e.g. "en", "en-US", "es", "es-MX").
 * @returns {Translation} The matching translation object.
 */
export function getTranslation(locale: string): Translation {
    return locale.startsWith('es') ? es : en;
}
