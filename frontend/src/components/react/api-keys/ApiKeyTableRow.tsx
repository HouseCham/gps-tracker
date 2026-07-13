//-- React
import type { JSX } from 'react';
//-- Types
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
//-- Components
import { Button } from '@/components/ui';
//-- Icons
import { Trash } from 'lucide-react';
//-- Utils
import { formatDate } from '@/lib';
import { truncateId } from '@/lib/api-keys-utils';

/**
 * One API key row in the desktop table. Mirrors the structure of
 * `ApiKeyMobileCard` so the parent can swap between them via CSS.
 * @interface ApiKeyTableRowProps
 * @param {Language} locale - Current locale (for date formatting).
 * @param {string} keyId - The key UUID.
 * @param {string} deviceName - Display name of the owning device.
 * @param {string} vehicleType - Localized vehicle type label.
 * @param {string} createdAt - ISO timestamp of issue time.
 * @param {string | null} lastUsedAt - ISO timestamp of last use, or `null`.
 * @param {string | null} expiresAt - ISO expiration timestamp, or `null`.
 * @param {Translation['apiKeys']['table']} labels - Localized table labels.
 * @param {() => void} onRevoke - Opens the revoke modal.
 * @param {boolean} isLoading - Disables the revoke button.
 */
export interface ApiKeyTableRowProps {
    locale: Language;
    keyId: string;
    deviceName: string;
    vehicleType: string;
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    labels: Translation['apiKeys']['table'];
    onRevoke: () => void;
    isLoading: boolean;
}

/**
 * Renders one `<tr>` for an API key inside the `<DataTable>`.
 * @param {ApiKeyTableRowProps} props - Component props.
 * @returns {JSX.Element} The rendered row.
 */
export function ApiKeyTableRow({
    locale,
    keyId,
    deviceName,
    vehicleType,
    createdAt,
    lastUsedAt,
    expiresAt,
    labels,
    onRevoke,
    isLoading,
}: ApiKeyTableRowProps): JSX.Element {
    return (
        <tr className="data-table__row api-key-table__row">
            <td className="data-table__cell">
                <div className="api-key-table__device">{deviceName}</div>
                <div className="api-key-table__device-meta">{vehicleType}</div>
            </td>
            <td className="data-table__cell">
                <span className="api-key-table__key-id" title={keyId}>
                    {truncateId(keyId)}
                </span>
            </td>
            <td className="data-table__cell">
                <span className="api-key-table__time">
                    {formatDate(locale, createdAt)}
                </span>
            </td>
            <td className="data-table__cell">
                {lastUsedAt ? (
                    <span className="api-key-table__time">
                        {formatDate(locale, lastUsedAt)}
                    </span>
                ) : (
                    <span className="api-key-table__time-muted">
                        {labels.neverUsed}
                    </span>
                )}
            </td>
            <td className="data-table__cell">
                {expiresAt ? (
                    <span className="api-key-table__time">
                        {formatDate(locale, expiresAt)}
                    </span>
                ) : (
                    <span className="api-key-table__time-muted">
                        {labels.noExpiry}
                    </span>
                )}
            </td>
            <td className="data-table__cell api-key-table__cell--actions">
                <Button
                    variant="danger"
                    size="sm"
                    onClick={onRevoke}
                    disabled={isLoading}
                    aria-label={labels.revoke}
                >
                    <Trash size={14} strokeWidth={1.75} aria-hidden="true" />
                    {labels.revoke}
                </Button>
            </td>
        </tr>
    );
}
