import '@/styles/components/mobile-cards.css';
//-- React
import type { JSX } from 'react/jsx-runtime';
import type { ChangeEvent } from 'react';
import { lazy, Suspense, useEffect, useState } from 'react';
//-- Types
import type { CreateUserDto, User } from '@/types/api';
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
//-- Components
import { TableStatus } from '@/components/ui/DataTable';
import { Button } from '@/components/ui';
//-- Icons
import { Plus } from 'lucide-react';
//-- Utils
import { getUserTableColumns } from '@/lib';
import { asApiError } from '@/lib/api/api-utils';
//-- Services
import { useUserService } from '@/lib/api/services';
//-- Toast bus
import { toastBus } from '@/lib/stores/toast.store';
//-- Lazy components
const Modal = lazy(() => import('@/components/react/ui/Modal'));
const ConfirmActionModal = lazy(() =>
    import('@/components/react/shared/ConfirmActionModal').then(m => ({
        default: m.ConfirmActionModal,
    }))
);
const CreateUserForm = lazy(() =>
    import('@/components/react/form/CreateUserForm').then(m => ({
        default: m.CreateUserForm,
    }))
);
const EmptyTable = lazy(() =>
    import('@/components/react/table/EmptyTable').then(m => ({
        default: m.EmptyTable,
    }))
);
const DataTable = lazy(() =>
    import('@/components/ui/DataTable').then(m => ({
        default: m.DataTable,
    }))
);
const UserTableRow = lazy(() =>
    import('@/components/react/table/UserTableRow').then(m => ({
        default: m.UserTableRow,
    }))
);
const MobileCardList = lazy(() =>
    import('@/components/react/shared/MobileCard/MobileCardList').then(m => ({
        default: m.MobileCardList,
    }))
);
const UserMobileCard = lazy(() =>
    import('@/components/react/shared/MobileCard/UserMobileCard').then(m => ({
        default: m.UserMobileCard,
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
    const toastStrings = translation.toast;

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
    async function handleCreateUser(dto: CreateUserDto): Promise<void> {
        try {
            await createUser(dto);
            toastBus.push({
                variant: 'success',
                title: toastStrings.userCreated.title,
                message: toastStrings.userCreated.message,
            });
            setCreateOpen(false);
        } catch (err) {
            const apiErr = asApiError(err);
            toastBus.push({
                variant: 'error',
                title: 'Error',
                message: apiErr.message ?? 'Could not create the user.',
            });
            throw err;
        }
    }
    /**
     * Opens the delete-confirmation modal for the given user.
     * @param {User} user - User targeted for deletion.
     */
    function handleStartDelete(user: User): void {
        setDeleteTarget(user);
        setDeleteConfirmName('');
        setDeleteError(null);
    }
    /**
     * Cancels the deletion of the targeted user.
     * @Returns {void}
     */
    function handleCancelDelete(): void {
        setDeleteTarget(null);
        setDeleteConfirmName('');
        setDeleteError(null);
    }

    /**
     * Confirms the deletion of the targeted user. Delete is only enabled
     * in the UI when the typed full name matches exactly, so this is a
     * final guard, not the primary check. Backend soft-deletes (`204 No
     * Content`); the service filters the row out of state.
     */
    async function handleConfirmDelete(): Promise<void> {
        if (!deleteTarget) return;
        const targetFullName = `${deleteTarget.name} ${deleteTarget.lastname}`;
        if (deleteConfirmName.trim() !== targetFullName) {
            setDeleteError(t.deleteConfirm.mismatch);
            return;
        }
        try {
            await deleteUser(deleteTarget.id);
            toastBus.push({
                variant: 'success',
                title: toastStrings.userDeleted.title,
                message: toastStrings.userDeleted.message,
            });
            handleCancelDelete();
        } catch (err) {
            const apiErr = asApiError(err);
            setDeleteError(apiErr.message ?? t.deleteConfirm.deleteFailed);
        }
    }

    /**
     * Stable onChange handler for the delete-confirmation input.
     */
    function onDeleteNameChange(e: ChangeEvent<HTMLInputElement>): void {
        setDeleteConfirmName(e.target.value);
        setDeleteError(null);
    }

    /**
     * Per-user click callbacks for the row actions. Same shape as
     * {@link DeviceTable.rowHandlersById} — the `.map` below reads from
     * this Map instead of allocating inline arrows.
     */
    const rowHandlersById = ((): Map<string, { onDelete: () => void }> => {
        const map = new Map<string, { onDelete: () => void }>();
        for (const user of users) {
            map.set(user.id, {
                onDelete: (): void => handleStartDelete(user),
            });
        }
        return map;
    })();

    /**
     * Fetches all users on mount.
     */
    useEffect(() => {
        getAllUsers();
    }, []);

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
            {users.length === 0 ? (
                <Suspense
                    fallback={
                        <TableStatus mode="loading" className={className} />
                    }
                >
                    <EmptyTable
                        columns={columns}
                        emptyTitle={translation.user.noUsersTitle}
                        emptyMessage={translation.user.noUsersMessage}
                    />
                </Suspense>
            ) : (
                <Suspense
                    fallback={
                        <TableStatus mode="loading" className={className} />
                    }
                >
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
                </Suspense>
            )}
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
                <ConfirmActionModal
                    open={deleteTarget !== null}
                    onClose={handleCancelDelete}
                    title={t.deleteConfirm.title}
                    warning={t.deleteConfirm.warning.replace(
                        '{name}',
                        deleteTargetFullName
                    )}
                    rootClassName="user-delete-confirm"
                    warningClassName="user-delete-confirm__warning"
                    errorClassName="user-delete-confirm__error"
                    confirmLabel={t.deleteConfirm.confirm}
                    cancelLabel={t.deleteConfirm.cancel}
                    isLoading={isLoading}
                    errorMessage={deleteError}
                    onConfirm={(): void => {
                        void handleConfirmDelete();
                    }}
                    confirmNameLabel={t.deleteConfirm.typeNameLabel}
                    confirmNamePlaceholder={
                        deleteTarget
                            ? deleteTargetFullName
                            : t.deleteConfirm.typeNamePlaceholder
                    }
                    confirmName={deleteConfirmName}
                    expectedName={deleteTargetFullName}
                    onConfirmNameChange={onDeleteNameChange}
                />
            </Suspense>
        </>
    );
}
