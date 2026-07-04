import '@/styles/components/mobile-cards.css';
//-- React
import type { JSX } from 'react/jsx-runtime';
import type { ChangeEvent } from 'react';
import {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
//-- Types
import type { CreateUserDto, User } from '@/types/api';
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
//-- Components
import { DataTable, TableStatus } from '@/components/ui/DataTable';
import { Button, Input } from '@/components/ui';
import { MobileCardList, UserMobileCard } from '@/components/react/shared';
import { UserTableRow } from '@/components/react/table';
//-- Icons
import { Plus } from 'lucide-react';
//-- Utils
import { getUserTableColumns } from '@/lib';
import { asApiError } from '@/lib/api/api-utils';
//-- Services
import { useUserService } from '@/lib/api/services';
//-- Lazy components
const Modal = lazy(() => import('@/components/react/ui/Modal'));
const CreateUserForm = lazy(() =>
    import('@/components/react/form/CreateUserForm').then(m => ({
        default: m.CreateUserForm,
    }))
);
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
        deleteUser,
    } = useUserService();
    const t = translation.admin.userTable;
    const createStrings = translation.admin.createUser;

    const columns = getUserTableColumns(t);
    const [createOpen, setCreateOpen] = useState(false);

    // ─── Delete modal state ──────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);

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
     * Opens the delete-confirmation modal for the given user.
     * @param {User} user - User targeted for deletion.
     */
    const handleStartDelete = useCallback((user: User): void => {
        setDeleteTarget(user);
        setDeleteConfirmName('');
        setDeleteError(null);
    }, []);
    /**
     * Cancels the deletion of the targeted user.
     * @Returns {void}
     */
    const handleCancelDelete = useCallback((): void => {
        setDeleteTarget(null);
        setDeleteConfirmName('');
        setDeleteError(null);
    }, []);

    /**
     * Confirms the deletion of the targeted user. Delete is only enabled
     * in the UI when the typed full name matches exactly, so this is a
     * final guard, not the primary check. Backend soft-deletes (`204 No
     * Content`); the service filters the row out of state.
     */
    const handleConfirmDelete = useCallback(async (): Promise<void> => {
        if (!deleteTarget) return;
        const targetFullName = `${deleteTarget.name} ${deleteTarget.lastname}`;
        if (deleteConfirmName.trim() !== targetFullName) {
            setDeleteError(t.deleteConfirm.mismatch);
            return;
        }
        try {
            await deleteUser(deleteTarget.id);
            handleCancelDelete();
        } catch (err) {
            const apiErr = asApiError(err);
            setDeleteError(apiErr.message ?? t.deleteConfirm.deleteFailed);
        }
    }, [
        deleteTarget,
        deleteConfirmName,
        deleteUser,
        handleCancelDelete,
        t.deleteConfirm,
    ]);

    /**
     * Stable onChange handler for the delete-confirmation input.
     */
    const onDeleteNameChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>): void => {
            setDeleteConfirmName(e.target.value);
            setDeleteError(null);
        },
        []
    );

    /**
     * Per-user click callbacks for the row actions. Same shape as
     * {@link DeviceTable.rowHandlersById} — the `.map` below reads from
     * this Map instead of allocating inline arrows; entries stay stable
     * until `users` (or the underlying handlers) change.
     */
    const rowHandlersById = useMemo(() => {
        const map = new Map<string, { onDelete: () => void }>();
        for (const user of users) {
            map.set(user.id, {
                onDelete: (): void => handleStartDelete(user),
            });
        }
        return map;
    }, [users, handleStartDelete]);

    /**
     * Fetches all users on mount.
     */
    useEffect(() => {
        getAllUsers();
    }, []);

    // Esc cancels whichever modal is open (only one at a time).
    useEffect(() => {
        const hasOpen = deleteTarget !== null;
        if (!hasOpen) return;
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                handleCancelDelete();
            }
        };
        document.addEventListener('keydown', onKey);
        return (): void => document.removeEventListener('keydown', onKey);
    }, [deleteTarget, handleCancelDelete]);

    // ---- Return early if loading or user list is empty (with or without error) ----
    if (isLoading && users.length === 0)
        return <TableStatus mode="loading" className={className} />;

    // ---- Return early if error and user list is empty ----
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

    const deleteTargetFullName = deleteTarget
        ? `${deleteTarget.name} ${deleteTarget.lastname}`
        : '';
    const canDelete =
        deleteTarget !== null &&
        deleteConfirmName.trim() === deleteTargetFullName;

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
                        <UserTableRow
                            key={user.id}
                            user={user}
                            locale={locale}
                            labels={t}
                            roles={translation.admin.roles}
                            onDelete={handlers.onDelete}
                        />
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
                            onDelete={handlers.onDelete}
                        />
                    );
                })}
            </MobileCardList>
            {/* Create User Modal */}
            <Suspense fallback={null}>
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
            </Suspense>
            {/* Delete User Confirmation Modal */}
            <Suspense fallback={null}>
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
                                onClick={handleConfirmDelete}
                                disabled={!canDelete || isLoading}
                                loading={isLoading && canDelete}
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
                                deleteTargetFullName
                            )}
                        </p>
                        <Input
                            name="delete-confirm-name"
                            label={t.deleteConfirm.typeNameLabel}
                            placeholder={
                                deleteTarget
                                    ? deleteTargetFullName
                                    : t.deleteConfirm.typeNamePlaceholder
                            }
                            value={deleteConfirmName}
                            onChange={onDeleteNameChange}
                            disabled={isLoading}
                            autocomplete="off"
                        />
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
            </Suspense>
        </>
    );
}
