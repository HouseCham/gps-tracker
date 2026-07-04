//-- React
import type { JSX } from 'react';
//-- Types
import type { Language } from '@/types';
import type { DeviceAccessListItem } from '@/types/api';
import type { Translation } from '@/i18n';
//-- Components
import { Button } from '@/components/ui';
import { MobileCardMetaItem } from '@/components/react/shared/MobileCard/MobileCardMetaItem';
//-- Icons
import { Trash2 } from 'lucide-react';
//-- Utils
import { formatDate, getInitials } from '@/lib';

/**
 * Interface for the AccessMobileCard component.
 * @interface AccessMobileCardProps
 * @property {Language} locale - Current locale (for date formatting).
 * @property {DeviceAccessListItem} user - The user whose row to render.
 * @property {Translation['device']['detail']['accessTable']} labels - Localized strings for the access list (label "Access granted", "Remove" copy).
 * @property {() => void} onRevoke - Click handler for the remove button.
 * @property {boolean} [isLoading=false] - Disables the action button.
 */
interface AccessMobileCardProps {
    locale: Language;
    user: DeviceAccessListItem;
    labels: Translation['device']['detail']['accessTable'];
    onRevoke: () => void;
    isLoading?: boolean;
}
/**
 * Mobile (≤ 767.98px) row for a single {@link DeviceAccessListItem}.
 * Mirrors the access table row rendered by `DeviceUserAccessTable.tsx`.
 * @param {AccessMobileCardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered card.
 */
export function AccessMobileCard({
    locale,
    user,
    labels,
    onRevoke,
    isLoading = false,
}: AccessMobileCardProps): JSX.Element {
    return (
        <li className="access-card">
            <header className="access-card__header">
                <div className="access-card__identity">
                    <div className="access-card__avatar" aria-hidden="true">
                        {getInitials(user.name)}
                    </div>
                    <div className="access-card__name-block">
                        <div className="access-card__name">{user.name}</div>
                        <div className="access-card__email">{user.email}</div>
                    </div>
                </div>
            </header>
            <dl className="access-card__meta">
                <MobileCardMetaItem
                    variant="access"
                    label={labels.accessGranted}
                    mono
                    muted
                    value={formatDate(locale, user.access_granted_at)}
                />
            </dl>
            {user.role !== 'owner' && (
                <footer className="access-card__actions">
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={onRevoke}
                        disabled={isLoading}
                        aria-label={labels.remove}
                    >
                        <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                        {labels.remove}
                    </Button>
                </footer>
            )}
        </li>
    );
}
