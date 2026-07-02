//-- React
import type { JSX } from 'react';
//-- Types
import type { Language } from '@/types';
import type { User } from '@/types/api';
import type { Translation } from '@/i18n';
//-- Components
import { Badge, Button } from '@/components/ui';
import { MobileCardMetaItem } from '@/components/react/shared/MobileCard/MobileCardMetaItem';
//-- Icons
import { Pencil, Trash } from 'lucide-react';
//-- Utils
import { formatDate, getInitials } from '@/lib';
import { USER_MOBILE_CARD_ROLE_BADGE_VARIANT, USER_MOBILE_CARD_ROLE_LABEL_KEY } from '@/constants';

/**
 * Interface for the UserMobileCard component.
 * @interface UserMobileCardProps
 * @property {Language} locale - Current locale (for date formatting).
 * @property {User} user - The user whose row to render.
 * @property {Translation['admin']['userTable']} labels - Localized strings.
 * @property {Translation['admin']['roles']} roles - Localized role labels.
 * @property {() => void} [onEdit] - Click handler for the edit button.
 * @property {() => void} [onDelete] - Click handler for the delete button.
 */
interface UserMobileCardProps {
    locale: Language;
    user: User;
    labels: Translation['admin']['userTable'];
    roles: Translation['admin']['roles'];
    onEdit?: () => void;
    onDelete?: () => void;
}

/**
 * Mobile (≤ 767.98px) row for a single {@link User}. Mirrors the
 * `<DataTable>` row rendered by `UserTable.tsx` on larger screens.
 * @param {UserMobileCardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered card.
 */
export function UserMobileCard({
    locale,
    user,
    labels,
    roles,
    onEdit,
    onDelete,
}: UserMobileCardProps): JSX.Element {
    return (
        <li className="user-card">
            <header className="user-card__header">
                <div className="user-card__identity">
                    <div className="user-card__avatar" aria-hidden="true">
                        {getInitials(user.name)}
                    </div>
                    <div className="user-card__name-block">
                        <div className="user-card__name">{user.name}</div>
                        <div className="user-card__chips">
                            <Badge
                                variant={
                                    USER_MOBILE_CARD_ROLE_BADGE_VARIANT[user.role] ?? 'default'
                                }
                                size="sm"
                                label={roles[USER_MOBILE_CARD_ROLE_LABEL_KEY[user.role]]}
                            />
                            <Badge
                                variant={
                                    user.email_verified ? 'success' : 'warning'
                                }
                                size="sm"
                                label={
                                    user.email_verified
                                        ? labels.verified
                                        : labels.unverified
                                }
                            />
                        </div>
                    </div>
                </div>
            </header>
            <dl className="user-card__meta">
                <MobileCardMetaItem
                    variant="user"
                    label={labels.email}
                    value={user.email}
                />
                <MobileCardMetaItem
                    variant="user"
                    label={labels.created}
                    value={formatDate(locale, user.created_at)}
                    mono
                />
                <MobileCardMetaItem
                    variant="user"
                    label={labels.devices}
                    value={0}
                />
            </dl>
            <footer className="user-card__actions">
                <Button variant="ghost" size="sm" onClick={onEdit}>
                    <Pencil />
                    {labels.editUser}
                </Button>
                <Button variant="danger" size="sm" onClick={onDelete}>
                    <Trash />
                    {labels.deleteUser}
                </Button>
            </footer>
        </li>
    );
}
