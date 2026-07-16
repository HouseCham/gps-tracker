import type { Translation } from '@/i18n';
import type { DataTableColumn } from '@/types/components';

/**
 * Returns the column definitions for the API keys table. The `keyId`
 * column carries a monospace override via the `mono` modifier.
 * @param {Translation['apiKeys']['table']} t - Localized column labels.
 * @returns {DataTableColumn[]} Column definitions.
 */
export function getApiKeyTableColumns(
    t: Translation['apiKeys']['table']
): DataTableColumn[] {
    return [
        { key: 'device', label: t.device },
        { key: 'keyId', label: t.keyId },
        { key: 'created', label: t.created },
        { key: 'lastUsed', label: t.lastUsed },
        { key: 'expires', label: t.expires },
        { key: 'actions', label: t.actions, align: 'right' },
    ];
}

/**
 * Returns the first 8 characters of a UUID-like string, prefixed with
 * an ellipsis when truncation occurred. Used to keep the key id column
 * visually narrow without losing identity.
 * @param {string} id - Full UUID.
 * @returns {string} Truncated id, e.g. `ae0a8d4f…`.
 */
export function truncateId(id: string): string {
    if (id.length <= 8) return id;
    return `${id.slice(0, 8)}…`;
}
