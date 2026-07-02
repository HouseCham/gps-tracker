//-- React
import type { JSX } from 'react';
//-- Types
import type { Language } from '@/types';
import type { User } from '@/types/api';
import type { Translation } from '@/i18n';
//-- Components
import { Badge, Button } from '@/components/ui';
//-- Utils
import { formatDate } from '@/lib';
import { USER_ROLE_BADGE_VARIANT, USER_ROLE_LABEL_KEY } from '@/constants/components/admin';

/**
 * Interface for the UserTableRow component.
 * @interface UserTableRowProps
 * @property {User} user - The user whose row to render.
 * @property {Language} locale - Current locale (for date formatting).
 * @property {Translation['admin']['userTable']} labels - Localized strings for the user table.
 * @property {Translation['admin']['roles']} roles - Localized role labels.
 * @property {() => void} onDelete - Click handler for the delete button.
 */
interface UserTableRowProps {
    user: User;
    locale: Language;
    labels: Translation['admin']['userTable'];
    roles: Translation['admin']['roles'];
    onDelete: () => void;
}

/**
 * Single `<tr>` row for the {@link UserTable} `<DataTable>`.
 * Mirrors the data shown by {@link UserMobileCard} on small screens.
 * @param {UserTableRowProps} props - The props for the component.
 * @returns {JSX.Element} The rendered table row.
 */
export function UserTableRow({
    user,
    locale,
    labels,
    roles,
    onDelete,
}: UserTableRowProps): JSX.Element {
    return (
        <tr className="data-table__row user-table__row">
            <td className="data-table__cell">
                <span className="user-table__name">{user.name}</span>
            </td>
            <td className="data-table__cell user-table__email">
                {user.email}
            </td>
            <td className="data-table__cell">
                <Badge
                    variant={USER_ROLE_BADGE_VARIANT[user.role]}
                    size="sm"
                    label={roles[USER_ROLE_LABEL_KEY[user.role]]}
                />
            </td>
            <td className="data-table__cell">
                <Badge
                    variant={user.email_verified ? 'success' : 'warning'}
                    size="sm"
                    label={user.email_verified ? labels.verified : labels.unverified}
                />
            </td>
            <td className="data-table__cell user-table__time is-align-center">
                {formatDate(locale, user.created_at)}
            </td>
            <td className="data-table__cell is-align-center">{0}</td>
            <td className="data-table__cell is-align-center">
                <div className="user-table__actions">
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={onDelete}
                        aria-label={labels.deleteUser}
                    >
                        {labels.deleteUser}
                    </Button>
                </div>
            </td>
        </tr>
    );
}