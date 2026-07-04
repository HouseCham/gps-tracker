import type { Translation } from '@/i18n';
import type { DataTableColumn } from '@/types/components';

/**
 * Two-letter initials from a display name for the avatar fallback.
 * @param {string} name - Full display name.
 * @returns {string} Uppercase initials (1–2 chars).
 */
export function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0] ?? '').slice(0, 2).toUpperCase();
}

/**
 * Returns the user's first name followed by the initial of the second name
 * (if it exists), with a trailing period.
 * @param {string} name - The full name of the user.
 * @returns {string} The first name and the initial of the second name.
 */
export function getFirstNameWithInitial(name: string): string {
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? '';
    const secondName = nameParts[1];
    if (!secondName) return firstName;
    return `${firstName} ${secondName.charAt(0).toUpperCase()}.`;
}

/**
 * Returns the columns for the user table.
 * @param {Translation['admin']['userTable']} t - The translation object.
 * @returns {DataTableColumn[]} The columns for the user table.
 */
export function getUserTableColumns(
    t: Translation['admin']['userTable']
): DataTableColumn[] {
    return [
        { key: 'name', label: t.name, sortable: true },
        { key: 'email', label: t.email },
        { key: 'role', label: t.role },
        { key: 'status', label: t.status },
        { key: 'created', label: t.created, align: 'center' },
        { key: 'devices', label: t.devices, align: 'center' },
        { key: 'actions', label: t.actions, align: 'center' },
    ];
}
