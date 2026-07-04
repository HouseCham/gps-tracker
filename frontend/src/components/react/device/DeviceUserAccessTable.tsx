//-- React
//-- Types
import type { JSX } from 'react/jsx-runtime';
import type { Language } from '@/types';
import type { DeviceAccessListItem } from '@/types/api';
import type { DeviceUserAccessTableStrings } from '@/types/components';
import type { DataTableColumn } from '@/types/components/ui';
//-- Components
import { Button } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
//-- Icons
import { Trash2 } from 'lucide-react';
//-- Utils
import { formatDate } from '@/lib';
/**
 * Interface for DeviceUserAccessTable component
 * @interface DeviceUserAccessTableProps
 * @param {Language} locale - The current locale.
 * @param {string} [className] - Extra class appended to the class list.
 * @param {DataTableColumn[]} columns - The columns of the table.
 * @param {DeviceAccessListItem[]} users - The users with access to the device.
 * @param {DeviceUserAccessTableStrings} t - The translation object.
 * @param {boolean} [isLoading] - Whether the table is loading.
 * @param {(userId: DeviceAccessListItem) => void} onClickRemoveAccess - Callback function when the remove access button is clicked.
 */
interface DeviceUserAccessTableProps {
    columns: DataTableColumn[];
    users: DeviceAccessListItem[];
    locale: Language;
    t: DeviceUserAccessTableStrings;
    isLoading?: boolean;
    onClickRemoveAccess: (user: DeviceAccessListItem) => void;
}
/**
 * @function DeviceUserAccessTable
 * @param {DeviceUserAccessTableProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 * @description Renders a table of users with access to a device, including their name, email, and the date access was granted. Each row includes a button to remove access for that user.
 */
export function DeviceUserAccessTable({
    columns,
    users,
    locale,
    t,
    isLoading = false,
    onClickRemoveAccess,
}: DeviceUserAccessTableProps): JSX.Element {
    const rowHandlersById = new Map<string, { onRemove: () => void }>();
    for (const user of users) {
        rowHandlersById.set(user.user_id, {
            onRemove: (): void => onClickRemoveAccess(user),
        });
    }

    return (
        <DataTable columns={columns}>
            {users.map(user => {
                const handlers = rowHandlersById.get(user.user_id);
                if (!handlers) return null;
                return (
                    <tr
                        key={user.user_id}
                        className="data-table__row device-detail__access-row"
                    >
                        {/* Name */}
                        <td className="data-table__cell">
                            <span className="device-detail__access-name">
                                {user.name}
                            </span>
                        </td>
                        {/* Email */}
                        <td className="data-table__cell device-detail__access-email">
                            {user.email}
                        </td>
                        {/* Access Granted At */}
                        <td className="data-table__cell device-detail__access-granted">
                            {formatDate(locale, user.access_granted_at)}
                        </td>
                        {/* Actions */}
                        <td className="data-table__cell" data-align="center">
                            <div className="device-detail__access-actions">
                                {user.role !== 'owner' && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={handlers.onRemove}
                                        disabled={isLoading}
                                        aria-label={t.remove}
                                    >
                                        <Trash2
                                            size={14}
                                            strokeWidth={2}
                                            aria-hidden="true"
                                        />
                                        {t.remove}
                                    </Button>
                                )}
                            </div>
                        </td>
                    </tr>
                );
            })}
        </DataTable>
    );
}
