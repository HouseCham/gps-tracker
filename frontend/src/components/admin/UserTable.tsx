import '@/styles/components/mobile-cards.css';
//-- React
import type { JSX } from 'react/jsx-runtime';
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
} from 'react';
//-- Types
import type { CreateUserDto, User } from '@/types/api';
import type { Language } from '@/types';
import type { DataTableColumn } from '@/types/components/ui';
import type { Translation } from '@/i18n';
//-- Components
import { DataTable, TableStatus } from '@/components/ui/DataTable';
import { Badge, Button, Input } from '@/components/ui';
import Modal from '@/components/react/ui/Modal';
import { CreateUserForm } from '@/components/react/form';
import {
    MobileCardList,
    UserMobileCard,
} from '@/components/react/shared';
//-- Icons
import { Plus } from 'lucide-react';
//-- Utils
import { formatDate } from '@/lib';
import { asApiError } from '@/lib/api/api-utils';
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
        error,
        isLoading,
        users,
        //-- actions
        getAllUsers,
        createUser,
        updateUser,
        deleteUser,
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

    // ─── Edit / Delete modal state ──────────────────────────────────────────
    const [editTarget, setEditTarget] = useState<User | null>(null);
    const [editName, setEditName] = useState('');
    const [editLastname, setEditLastname] = useState('');
    const [editError, setEditError] = useState<string | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

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
    const handleCreateUser = useCallback(
        async (dto: CreateUserDto): Promise<void> => {
            await createUser(dto);
            setCreateOpen(false);
        },
        [createUser]
    );

    /**
     * Opens the edit modal for the given user.
     * @param {User} user - User being edited.
     */
    const handleStartEdit = useCallback((user: User): void => {
        setEditTarget(user);
        setEditName(user.name);
        setEditLastname(user.lastname);
        setEditError(null);
    }, []);

    const handleCancelEdit = useCallback((): void => {
        setEditTarget(null);
        setEditName('');
        setEditLastname('');
        setEditError(null);
    }, []);

    /**
     * Persists the inline-edit payload via the service.
     * @returns {Promise<void>}
     */
    const handleSaveEdit = useCallback(async (): Promise<void> => {
        if (!editTarget) return;
        try {
            await updateUser(editTarget.id, {
                name: editName.trim(),
                lastname: editLastname.trim(),
            });
            handleCancelEdit();
        } catch (err) {
            const apiErr = asApiError(err);
            setEditError(
                apiErr.message ?? t.inlineEdit.updateFailed
            );
        }
    }, [editTarget, editName, editLastname, updateUser, t.inlineEdit, handleCancelEdit]);

    const onEditNameChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>): void => {
            setEditName(e.target.value);
            setEditError(null);
        },
        []
    );
    const onEditLastnameChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>): void => {
            setEditLastname(e.target.value);
            setEditError(null);
        },
        []
    );

    /**
     * Opens the delete-confirmation modal for the given user.
     * @param {User} user - User targeted for deletion.
     */
    const handleStartDelete = useCallback((user: User): void => {
        setDeleteTarget(user);
        setDeleteError(null);
    }, []);

    const handleCancelDelete = useCallback((): void => {
        setDeleteTarget(null);
        setDeleteError(null);
    }, []);

    /**
     * Confirms the deletion of the targeted user. Backend soft-deletes
     * (`204 No Content`); the service filters the row out of state.
     */
    const handleConfirmDelete = useCallback(async (): Promise<void> => {
        if (!deleteTarget) return;
        try {
            await deleteUser(deleteTarget.id);
            handleCancelDelete();
        } catch (err) {
            const apiErr = asApiError(err);
            setDeleteError(
                apiErr.message ?? t.deleteConfirm.deleteFailed
            );
        }
    }, [deleteTarget, deleteUser, handleCancelDelete, t.deleteConfirm]);

    // Esc cancels whichever modal is open (only one at a time).
    useEffect(() => {
        const hasOpen = editTarget !== null || deleteTarget !== null;
        if (!hasOpen) return;
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                handleCancelEdit();
                handleCancelDelete();
            }
        };
        document.addEventListener('keydown', onKey);
        return (): void => document.removeEventListener('keydown', onKey);
    }, [editTarget, deleteTarget, handleCancelEdit, handleCancelDelete]);

    /**
     * Per-user click callbacks for the row actions. Same shape as
     * {@link DeviceTable.rowHandlersById} — the `.map` below reads from
     * this Map instead of allocating inline arrows; entries stay stable
     * until `users` (or the underlying handlers) change.
     */
    const rowHandlersById = useMemo(() => {
        const map = new Map<string, { onEdit: () => void; onDelete: () => void }>();
        for (const user of users) {
            map.set(user.id, {
                onEdit: (): void => handleStartEdit(user),
                onDelete: (): void => handleStartDelete(user),
            });
        }
        return map;
    }, [users, handleStartEdit, handleStartDelete]);

    if (isLoading && users.length === 0)
        return <TableStatus mode="loading" className={className} />;

    if (error && users.length === 0) {
        return (
            <TableStatus
                mode="empty"
                className={className}
                title={t.failedToLoad}
                message={error.message}
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
                {users.map(user => {
                    const handlers = rowHandlersById.get(user.id);
                    if (!handlers) return null;
                    return (
                    <tr
                        key={user.id}
                        className="data-table__row user-table__row"
                    >
                        <td className="data-table__cell">
                            <span className="user-table__name">
                                {user.name}
                            </span>
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
                                variant={
                                    user.email_verified ? 'success' : 'warning'
                                }
                                size="sm"
                                label={
                                    user.email_verified
                                        ? t.verified
                                        : t.unverified
                                }
                            />
                        </td>
                        <td
                            className="data-table__cell user-table__time is-align-center"
                            data-align="center"
                        >
                            {formatDate(locale, user.created_at)}
                        </td>
                        <td
                            className="data-table__cell is-align-center"
                            data-align="center"
                        >
                            {0}
                        </td>
                        <td className="data-table__cell" data-align="center">
                            <div className="user-table__actions">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handlers.onEdit}
                                    aria-label={t.editUser}
                                >
                                    {t.editUser}
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={handlers.onDelete}
                                    aria-label={t.deleteUser}
                                >
                                    {t.deleteUser}
                                </Button>
                            </div>
                        </td>
                    </tr>
                    );
                })}
            </DataTable>
            {/* Mobile cards (≤ 767.98px) — mirrors the table rows above. */}
            <MobileCardList variant="user" label={t.name}>
                {users.map(user => {
                    const handlers = rowHandlersById.get(user.id);
                    if (!handlers) return null;
                    return (
                    <UserMobileCard
                        key={user.id}
                        locale={locale}
                        user={user}
                        labels={t}
                        roles={translation.admin.roles}
                        onEdit={handlers.onEdit}
                        onDelete={handlers.onDelete}
                    />
                    );
                })}
            </MobileCardList>
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
            {/* Edit User Modal */}
            <Modal
                open={editTarget !== null}
                onClose={handleCancelEdit}
                title={t.inlineEdit.title}
            >
                <form
                    className="user-edit-form"
                    onSubmit={e => {
                        e.preventDefault();
                        void handleSaveEdit();
                    }}
                    noValidate
                >
                    {editError && (
                        <p
                            className="user-edit-form__banner"
                            role="alert"
                        >
                            {editError}
                        </p>
                    )}
                    <Input
                        name="edit-name"
                        label={t.inlineEdit.nameLabel}
                        placeholder={t.inlineEdit.namePlaceholder}
                        value={editName}
                        onChange={onEditNameChange}
                        disabled={isLoading}
                        autocomplete="given-name"
                    />
                    <Input
                        name="edit-lastname"
                        label={t.inlineEdit.lastnameLabel}
                        placeholder={t.inlineEdit.lastnamePlaceholder}
                        value={editLastname}
                        onChange={onEditLastnameChange}
                        disabled={isLoading}
                        autocomplete="family-name"
                    />
                    <div className="user-edit-form__actions">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={isLoading}
                        >
                            {t.inlineEdit.cancel}
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            loading={isLoading}
                        >
                            {t.inlineEdit.save}
                        </Button>
                    </div>
                </form>
            </Modal>
            {/* Delete User Confirmation Modal */}
            <Modal
                open={deleteTarget !== null}
                onClose={handleCancelDelete}
                title={t.deleteConfirm.title}
                variant="danger"
                size="md"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelDelete}
                            disabled={isLoading}
                        >
                            {t.deleteConfirm.cancel}
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => void handleConfirmDelete()}
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            {t.deleteConfirm.confirm}
                        </Button>
                    </>
                }
            >
                <div className="user-delete-confirm">
                    <p
                        className="user-delete-confirm__warning"
                        role="alert"
                    >
                        {t.deleteConfirm.warning.replace(
                            '{name}',
                            deleteTarget?.name ?? ''
                        )}
                    </p>
                    {deleteError && (
                        <p
                            className="user-delete-confirm__error"
                            role="alert"
                        >
                            {deleteError}
                        </p>
                    )}
                </div>
            </Modal>
        </>
    );
}
