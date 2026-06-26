import type { Language } from "@/types";

/**
 * @constant DATE_FORMAT_MONTHS
 * @description Months in a locale-specific way
 */
export const DATE_FORMAT_MONTHS: Record<Language, readonly string[]> = {
    en: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ],
    es: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ],
};