//-- React
import type { JSX } from 'react';
//-- Types
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
//-- Components
import { Button } from '@/components/ui';
import { MobileCardMetaItem } from '@/components/react/shared/MobileCard/MobileCardMetaItem';
//-- Icons
import { Trash } from 'lucide-react';
//-- Utils
import { formatDate } from '@/lib';
import { truncateId } from '@/lib/api-keys-utils';

/**
 * Mobile (≤ 767.98px) card for a single API key row. Mirrors the
 * columns of `ApiKeyTableRow` in vertical layout using the shared
 * `MobileCardMetaItem` primitive so the BEM structure matches the
 * other card variants (`user-card`, `mobile-device-card`, `access-card`).
 * @interface ApiKeyMobileCardProps
 * @param {Language} locale - Current locale.
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
export interface ApiKeyMobileCardProps {
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
 * Renders one mobile card for an API key.
 * @param {ApiKeyMobileCardProps} props - Component props.
 * @returns {JSX.Element} The rendered card.
 */
export function ApiKeyMobileCard({
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
}: ApiKeyMobileCardProps): JSX.Element {
    return (
        <li className="api-key-card">
            <header className="api-key-card__header">
                <div className="api-key-card__title-block">
                    <span className="api-key-card__name">{deviceName}</span>
                    <span className="api-key-card__subtitle">
                        {vehicleType}
                    </span>
                </div>
            </header>
            <dl className="api-key-card__meta">
                <MobileCardMetaItem
                    variant="api-key"
                    label={labels.keyId}
                    mono
                    muted
                    value={truncateId(keyId)}
                />
                <MobileCardMetaItem
                    variant="api-key"
                    label={labels.created}
                    value={formatDate(locale, createdAt)}
                />
                <MobileCardMetaItem
                    variant="api-key"
                    label={labels.lastUsed}
                    muted={!lastUsedAt}
                    value={
                        lastUsedAt
                            ? formatDate(locale, lastUsedAt)
                            : labels.neverUsed
                    }
                />
                <MobileCardMetaItem
                    variant="api-key"
                    label={labels.expires}
                    muted={!expiresAt}
                    value={
                        expiresAt
                            ? formatDate(locale, expiresAt)
                            : labels.noExpiry
                    }
                />
            </dl>
            <footer className="api-key-card__actions">
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
            </footer>
        </li>
    );
}
