import { describe, expect, it } from 'vitest';
import { DATE_FORMAT_MONTHS } from '@/constants/date';
import { formatDate } from './date-utils';

describe('formatDate', () => {
    it('formats an English date with the UTC day, month, and year', () => {
        expect(formatDate('en', '2026-01-05T00:00:00Z')).toBe('5 January 2026');
    });

    it('formats a Spanish date using the localized month name', () => {
        expect(formatDate('es', '2026-01-05T00:00:00Z')).toBe('5 Enero 2026');
    });

    it('switches month name with the locale but keeps the day/year identical', () => {
        const day = 14;
        const year = 2030;
        const input = `${year}-03-${String(day).padStart(2, '0')}T12:00:00Z`;
        expect(formatDate('en', input)).toBe(
            `${day} ${DATE_FORMAT_MONTHS.en[2]} ${year}`
        );
        expect(formatDate('es', input)).toBe(
            `${day} ${DATE_FORMAT_MONTHS.es[2]} ${year}`
        );
    });
});
