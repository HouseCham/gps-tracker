import '@/styles/components/table.css';
import '@/styles/components/mobile-cards.css';
//-- React
import { lazy, Suspense, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type {
    CreateDeviceDto,
    DeviceVehicleType,
    DeviceWithAccess,
    UpdateDeviceDto,
} from '@/types/api';
import type { Language } from '@/types';
import type { DataTableColumn } from '@/types/components/ui';
import type { Translation } from '@/i18n';
//-- Components
import { TableStatus } from '@/components/ui/DataTable';
import { Button } from '@/components/ui';
import { ConfirmActionModal } from '@/components/react/shared';
//-- Icons
import { Plus } from 'lucide-react';
//-- Utils
import { getDeviceTableColumns } from '@/lib/device-utils';
//-- Services
import { useDeviceService } from '@/lib/api/services';
import { asApiError } from '@/lib/api/api-utils';
//-- Toast bus
import { toastBus } from '@/lib/stores/toast.store';
//-- Lazy components
const Modal = lazy(() => import('@/components/react/ui/Modal'));
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
const MobileCardList = lazy(() =>
    import('@/components/react/shared/MobileCard/MobileCardList').then(m => ({
        default: m.MobileCardList,
    }))
);
const DeviceMobileCard = lazy(() =>
    import('@/components/react/shared/MobileCard/DeviceMobileCard').then(m => ({
        default: m.DeviceMobileCard,
    }))
);
const DeviceForm = lazy(() =>
    import('@/components/react/device/DeviceForm').then(m => ({
        default: m.DeviceForm,
    }))
);
const DeviceTableRow = lazy(() =>
    import('@/components/react/table/DeviceTableRow').then(m => ({
        default: m.DeviceTableRow,
    }))
);
/**
 * The window after which a device is considered offline. Anything newer
 * counts as online; anything older (or null) falls back to offline / never-seen.
 * @constant ONLINE_THRESHOLD_MS
 */
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Maps a `last_seen_at` timestamp to a `StatusVariant`.
 * @param {string | null} lastSeenAt - ISO timestamp of the last IoT ping.
 * @returns {StatusVariant} 'online' | 'offline' | 'never-seen'.
 */
function statusFromLastSeen(lastSeenAt: string | null): 'online' | 'offline' {
    if (!lastSeenAt) return 'offline';
    const last = new Date(lastSeenAt).getTime();
    if (Number.isNaN(last)) return 'offline';
    return Date.now() - last <= ONLINE_THRESHOLD_MS ? 'online' : 'offline';
}

/**
 * Interface for DeviceTable component
 * @interface DeviceTableProps
 * @param {Language} locale - The current locale.
 * @param {Translation} translation - The translation object.
 * @param {string} [className] - Extra class appended to the class list.
 */
interface DeviceTableProps {
    locale: Language;
    translation: Translation;
    className?: string;
}

/**
 * DeviceTable component
 * @function DeviceTable
 * @param {DeviceTableProps} props - The props for the DeviceTable component.
 * @returns {JSX.Element} The rendered component
 */
export function DeviceTable({
    locale,
    translation,
    className,
}: DeviceTableProps): JSX.Element {
    const {
        //-- state
        error,
        isLoading,
        devices,
        //-- actions
        getAllDevices,
        createDevice,
        updateDevice,
        deleteDevice,
    } = useDeviceService();
    const t = translation.device.table;
    const formStrings = translation.device.form;
    const toastStrings = translation.toast;
    const columns: DataTableColumn[] = getDeviceTableColumns(translation);

    const [createOpen, setCreateOpen] = useState(false);

    // ─── Inline edit state ──────────────────────────────────────────────────
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState<DeviceVehicleType>('other');
    const [editError, setEditError] = useState<string | null>(null);

    // ─── Delete-confirmation modal state ────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<DeviceWithAccess | null>(
        null
    );
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);

    /**
     * Fetches all devices on mount.
     */
    useEffect(() => {
        getAllDevices();
    }, []);

    /**
     * Submits the create-device payload and closes the modal on success.
     * @param {CreateDeviceDto} dto - The device payload from the form.
     */
    async function handleCreateDevice(dto: CreateDeviceDto): Promise<void> {
        await createDevice(dto);
        toastBus.push({
            variant: 'success',
            title: toastStrings.deviceCreated.title,
            message: toastStrings.deviceCreated.message,
        });
        setCreateOpen(false);
    }

    /**
     * Enters inline-edit mode for the given device.
     * @param {DeviceWithAccess} device - Device being edited.
     */
    function handleStartEdit(device: DeviceWithAccess): void {
        setEditingId(device.id);
        setEditName(device.name);
        setEditType(device.vehicle_type);
        setEditError(null);
    }

    /**
     * Exits inline-edit mode without persisting changes.
     */
    function handleCancelEdit(): void {
        setEditingId(null);
        setEditName('');
        setEditType('other');
        setEditError(null);
    }

    /**
     * Esc cancels the inline edit (single-row mode means at most one).
     */
    useEffect(() => {
        if (editingId === null) return;
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') handleCancelEdit();
        };
        document.addEventListener('keydown', onKey);
        return (): void => document.removeEventListener('keydown', onKey);
    }, [editingId, handleCancelEdit]);

    /**
     * Validates the inline-edit payload and persists it via the service.
     * @param {DeviceWithAccess} device - Device being saved.
     */
    async function handleSaveEdit(device: DeviceWithAccess): Promise<void> {
        const trimmed = editName.trim();
        if (!trimmed) {
            setEditError(t.inlineEdit.nameRequired);
            return;
        }
        const payload: UpdateDeviceDto =
            trimmed === device.name && editType === device.vehicle_type
                ? { name: trimmed }
                : { name: trimmed, vehicle_type: editType };
        try {
            await updateDevice(device.id, payload);
            toastBus.push({
                variant: 'success',
                title: toastStrings.deviceUpdated.title,
                message: toastStrings.deviceUpdated.message,
            });
            setEditingId(null);
            setEditError(null);
        } catch (err) {
            const apiErr = asApiError(err);
            setEditError(apiErr.message ?? t.inlineEdit.updateFailed);
        }
    }

    /**
     * Opens the delete-confirmation modal for the given device.
     * @param {DeviceWithAccess} device - Device targeted for deletion.
     */
    function handleStartDelete(device: DeviceWithAccess): void {
        setDeleteTarget(device);
        setDeleteConfirmName('');
        setDeleteError(null);
    }

    /**
     * Closes the delete-confirmation modal and clears its state.
     */
    function handleCloseDeleteModal(): void {
        setDeleteTarget(null);
        setDeleteConfirmName('');
        setDeleteError(null);
    }

    /**
     * Confirms the deletion of the targeted device. Delete is only enabled in
     * the UI when the typed name matches exactly, so this is a final guard,
     * not the primary check.
     */
    async function handleConfirmDelete(): Promise<void> {
        if (!deleteTarget) return;
        if (deleteConfirmName.trim() !== deleteTarget.name) {
            setDeleteError(t.deleteConfirm.mismatch);
            return;
        }
        try {
            await deleteDevice(deleteTarget.id);
            toastBus.push({
                variant: 'success',
                title: toastStrings.deviceDeleted.title,
                message: toastStrings.deviceDeleted.message,
            });
            handleCloseDeleteModal();
        } catch (err) {
            const apiErr = asApiError(err);
            setDeleteError(apiErr.message ?? t.deleteConfirm.deleteFailed);
        }
    }

    /**
     * Stable onChange handler for the row's edit-name input. Edit state is
     * shared across the list, so a single callback is reused by every row
     * — no inline arrow inside the `.map` is needed.
     */
    function onEditNameChange(e: ChangeEvent<HTMLInputElement>): void {
        setEditName(e.target.value);
        setEditError(null);
    }

    /**
     * Stable change handler for the row's vehicle-type selector. See
     * {@link onEditNameChange} for the rationale on sharing one callback.
     */
    function onEditTypeChange(next: DeviceVehicleType): void {
        setEditType(next);
        setEditError(null);
    }

    /**
     * Stable onChange handler for the delete-confirmation input.
     */
    function onDeleteNameChange(e: ChangeEvent<HTMLInputElement>): void {
        setDeleteConfirmName(e.target.value);
        setDeleteError(null);
    }

    /**
     * Stable handler for the create-device modal's close button.
     */
    function handleCloseCreate(): void {
        setCreateOpen(false);
    }

    /**
     * Stable handler for the toolbar's add-device button.
     */
    function handleOpenCreate(): void {
        setCreateOpen(true);
    }

    /**
     * Per-device click callbacks for the row actions. The `.map` below reads
     * from this Map instead of allocating inline arrows.
     */
    const rowHandlersById = ((): Map<
        string,
        { onEdit: () => void; onSave: () => void; onDelete: () => void }
    > => {
        const map = new Map<
            string,
            { onEdit: () => void; onSave: () => void; onDelete: () => void }
        >();
        for (const device of devices) {
            map.set(device.id, {
                onEdit: (): void => handleStartEdit(device),
                onSave: (): void => {
                    void handleSaveEdit(device);
                },
                onDelete: (): void => handleStartDelete(device),
            });
        }
        return map;
    })();

    // -- Loading state: built-in DataTable skeleton
    if (isLoading && devices.length === 0)
        return <TableStatus mode="loading" className={className} />;

    // -- Error state: empty DataTable with error copy
    if (error && devices.length === 0) {
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
            <div className="device-table__toolbar">
                <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                    <Plus size={14} strokeWidth={2} aria-hidden="true" />
                    {t.addDevice}
                </Button>
            </div>

            {devices.length === 0 ? (
                <Suspense fallback={<TableStatus mode="loading" className={className} />}>
                    <EmptyTable
                        columns={columns}
                        emptyTitle={translation.device.noDevices}
                        emptyMessage={translation.device.noDevicesMessage}
                    />
                </Suspense>
            ) : (
                <Suspense fallback={<TableStatus mode="loading" className={className} />}>
                    <DataTable columns={columns} className={className}>
                        {devices.map((device: DeviceWithAccess) => {
                            const status = statusFromLastSeen(
                                device.last_seen_at
                            );
                            return (
                                <DeviceTableRow
                                    key={device.id}
                                    locale={locale}
                                    device={device}
                                    status={status}
                                    editingId={editingId}
                                    handlers={rowHandlersById.get(device.id)}
                                    editName={editName}
                                    editType={editType}
                                    editError={editError}
                                    namePlaceholder={
                                        formStrings.namePlaceholder
                                    }
                                    onEditNameChange={onEditNameChange}
                                    onEditTypeChange={onEditTypeChange}
                                    onCancelEdit={handleCancelEdit}
                                    isLoading={isLoading}
                                    labels={t}
                                    deviceStrings={translation.device}
                                />
                            );
                        })}
                    </DataTable>
                    {/* Mobile cards (≤ 767.98px) — mirrors the table rows above. */}
                    <MobileCardList variant="device" label={t.name}>
                        {devices.map((device: DeviceWithAccess) => (
                            <DeviceMobileCard
                                key={device.id}
                                locale={locale}
                                device={device}
                                labels={t}
                                deviceStrings={translation.device}
                                status={statusFromLastSeen(device.last_seen_at)}
                                editingId={editingId}
                                handlers={rowHandlersById.get(device.id)}
                                editName={editName}
                                editType={editType}
                                editError={editError}
                                namePlaceholder={formStrings.namePlaceholder}
                                onEditNameChange={onEditNameChange}
                                onEditTypeChange={onEditTypeChange}
                                onCancelEdit={handleCancelEdit}
                                isLoading={isLoading}
                            />
                        ))}
                    </MobileCardList>
                </Suspense>
            )}

            {/* Create device modal */}
            <Suspense fallback={null}>
                <Modal
                    open={createOpen}
                    onClose={handleCloseCreate}
                    title={translation.device.addDevice}
                >
                    <DeviceForm
                        strings={{
                            title: translation.device.addDevice,
                            nameLabel: formStrings.nameLabel,
                            namePlaceholder: formStrings.namePlaceholder,
                            uuidLabel: formStrings.uuidLabel,
                            uuidPlaceholder: formStrings.uuidPlaceholder,
                            vehicleTypeLabel: formStrings.vehicleTypeLabel,
                            vehicleTypeRequired: formStrings.vehicleTypeRequired,
                            nameRequired: formStrings.nameRequired,
                            uuidRequired: formStrings.uuidRequired,
                            uuidInvalid: formStrings.uuidInvalid,
                            generateUuid: formStrings.generateUuid,
                            save: formStrings.save,
                            saving: formStrings.saving,
                            cancel: formStrings.cancel,
                        }}
                        vehicleTypes={t.vehicleTypes}
                        onSubmit={handleCreateDevice}
                        onCancel={handleCloseCreate}
                        saving={isLoading}
                    />
                </Modal>
            </Suspense>

            {/* Delete device modal */}
            <ConfirmActionModal
                open={deleteTarget !== null}
                onClose={handleCloseDeleteModal}
                title={translation.device.deleteDevice}
                warning={t.deleteConfirm.warning.replace(
                    '{name}',
                    deleteTarget?.name ?? ''
                )}
                rootClassName="device-delete-confirm"
                warningClassName="device-delete-confirm__warning"
                errorClassName="device-delete-confirm__error"
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
                        ? deleteTarget.name
                        : t.deleteConfirm.typeNamePlaceholder
                }
                confirmName={deleteConfirmName}
                expectedName={deleteTarget?.name ?? ''}
                onConfirmNameChange={onDeleteNameChange}
            />
        </>
    );
}
