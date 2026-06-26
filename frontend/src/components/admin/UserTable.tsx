//-- React
import type { JSX } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
//-- Types
import type { CreateUserDto } from '@/types/api';
import type { Language } from '@/types';
import type { DataTableColumn } from '@/types/components/ui';
import type { Translation } from '@/i18n';
//-- Components
import { DataTable } from '@/components/ui/DataTable';
import { Badge, Button } from '@/components/ui';
import Modal from '@/components/react/ui/Modal';
import { CreateUserForm } from '@/components/react/form';
//-- Icons
import { Plus } from 'lucide-react';
//-- Utils
import { formatDate } from '@/lib';
//-- Services
import { useUserService } from '@/lib/api/services';
/**
 * Interface for UserTable component
 * @interface UserTableProps
 * @param {Language} locale - The current locale.
 * @param {Translation} translation - The translation object.
 * @param {string} [className] - Extra class appended to the class list.
 */
interface UserTableProps {
    locale: Language;
    translation: Translation;
    className?: string;
}
/**
 * Returns the columns for the user table.
 * @param {Translation['admin']['userTable']} t - The translation object.
 * @returns {DataTableColumn[]} The columns for the user table.
 */
function getColumns(t: Translation['admin']['userTable']): DataTableColumn[] {
    return [
        { key: 'name', label: t.name, sortable: true },
        { key: 'email', label: t.email },
        { key: 'role', label: t.role },
        { key: 'status', label: t.status },
        { key: 'created', label: t.created },
        { key: 'devices', label: t.devices, align: 'center' },
        { key: 'actions', label: t.actions, align: 'right' },
    ];
}
/**
 * UserTable component
 * @function UserTable
 * @param {UserTableProps} props - The props for the UserTable component.
 * @returns {JSX.Element} The rendered component
 */
export function UserTable({
    locale,
    translation,
    className,
}: UserTableProps): JSX.Element {
    const {
        //-- state
        error, isLoading, users,
        //-- actions
        getAllUsers, createUser
    } = useUserService();
    const t = translation.admin.userTable;
    const createStrings = translation.admin.createUser;
    /**
     * Role labels
     * @type {Record<string, string>}
     */
    const roleLabel: Record<string, string> = {
        super_admin: translation.admin.roles.superAdmin,
        user: translation.admin.roles.user,
    };
    /**
     * Role variants
     * @type {Record<string, 'accent' | 'default'>}
     */
    const roleVariant: Record<string, 'accent' | 'default'> = {
        super_admin: 'accent',
        user: 'default',
    };

    const columns = getColumns(t);
    const [createOpen, setCreateOpen] = useState(false);

    /**
     * Fetches all users on mount.
     */
    useEffect(() => {
        getAllUsers();
    }, []);
    /**
     * Submits the create-user payload and closes the modal on success.
     * Errors propagate so the form can display the API message.
     * @param {CreateUserDto} dto - The user payload from the form.
     */
    async function handleCreateUser(dto: CreateUserDto): Promise<void> {
        await createUser(dto);
        setCreateOpen(false);
    }

    if (isLoading) {
        return <DataTable columns={columns} className={className} loading />;
    }

    if (error) {
        return (
            <DataTable
                columns={columns}
                className={className}
                empty
                emptyTitle={t.failedToLoad}
                emptyMessage={error.message}
            />
        );
    }

    return (
        <>
            {/* Add User Button */}
            <div className="user-table__toolbar">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus size={14} strokeWidth={2} aria-hidden="true" />
                    {t.addUser}
                </Button>
            </div>
            {/* Users Table */}
            <DataTable columns={columns} className={className}>
                {users.map((user) => (
                    <tr key={user.id} className="data-table__row user-table__row">
                        <td className="data-table__cell">
                            <span className="user-table__name">{user.name}</span>
                        </td>
                        <td className="data-table__cell user-table__email">
                            {user.email}
                        </td>
                        <td className="data-table__cell">
                            <Badge
                                variant={roleVariant[user.role] ?? 'default'}
                                size="sm"
                                label={roleLabel[user.role] ?? user.role}
                            />
                        </td>
                        <td className="data-table__cell">
                            <Badge
                                variant={user.email_verified ? 'success' : 'warning'}
                                size="sm"
                                label={user.email_verified ? t.verified : t.unverified}
                            />
                        </td>
                        <td className="data-table__cell user-table__time is-align-center" data-align="center">
                            {formatDate(locale, user.created_at)}
                        </td>
                        <td className="data-table__cell is-align-center" data-align="center">
                            {0}
                        </td>
                        <td className="data-table__cell" data-align="center">
                            <div className="user-table__actions">
                                <Button variant="ghost" size="sm">
                                    {t.editUser}
                                </Button>
                                <Button variant="danger" size="sm">
                                    {t.deleteUser}
                                </Button>
                            </div>
                        </td>
                    </tr>
                ))}
            </DataTable>
            {/* Create User Modal */}
            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title={createStrings.title}
            >
                <CreateUserForm
                    strings={createStrings}
                    onSubmit={handleCreateUser}
                    onCancel={() => setCreateOpen(false)}
                    saving={isLoading}
                />
            </Modal>
        </>
    );
}
