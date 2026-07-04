import { DATE_FORMAT_MONTHS } from '@/constants';
import type { Language } from '@/types/i18n';

/**
 * Formats a date in a locale-specific way.
 * @param {Language} locale - The locale to use.
 * @param {string} date - The date to format.
 * @returns {string} The formatted date.
 */
export function formatDate(locale: Language, date: string): string {
    const d = new Date(date);
    const day = d.getUTCDate();
    const month = DATE_FORMAT_MONTHS[locale][d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
}
