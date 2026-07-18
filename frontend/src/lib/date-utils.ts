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

/**
 * Formats an ISO timestamp as a short relative phrase ("just now",
 * "5m ago", "2h ago", "3d ago", or a locale-specific absolute date for
 * anything older than 30 days). Used by the devices table for the
 * "Last seen" column and by the activity feed.
 * @param {string | null} iso - ISO timestamp, or null for "never".
 * @returns {string} The relative phrase, or `'—'` when `iso` is null.
 */
export function formatRelativeTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '—';
    const ageMin = (Date.now() - t) / 60000;
    if (ageMin < 1) return 'just now';
    if (ageMin < 60) return `${Math.round(ageMin)}m ago`;
    const ageHr = ageMin / 60;
    if (ageHr < 24) return `${Math.round(ageHr)}h ago`;
    const ageDay = ageHr / 24;
    if (ageDay < 30) return `${Math.round(ageDay)}d ago`;
    return new Date(iso).toLocaleDateString();
}