import '@/styles/components/table.css';
import '@/styles/components/mobile-cards.css';
//-- React
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, JSX } from 'react';
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
import { DataTable, TableStatus } from '@/components/ui/DataTable';
import { Badge, Button, Input } from '@/components/ui';
import {
    DeviceForm,
    DeviceTypeIcon,
    VehicleTypeSelector,
} from '@/components/react/device';
import Modal from '@/components/react/ui/Modal';
//-- Icons
import { Check, Inbox, Pencil, Plus, Trash, X } from 'lucide-react';
//-- Utils
import { formatDate } from '@/lib';
import { getDeviceTableColumns } from '@/lib/device-utils';
//-- Services
import { useDeviceService } from '@/lib/api/services';

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
 * Narrows an unknown thrown value (typically from `handleApiError`) into a
 * partial {@link ApiError} shape so we can pluck its `message` for inline UI.
 * @param {unknown} err - Whatever the rejected promise gave us.
 * @returns {{ message?: string }} A safe subset of fields for rendering.
 */
function asApiError(err: unknown): { message?: string } {
    if (typeof err === 'object' && err !== null) {
        // ponytail: at this point `err` is `object & not null`. The narrowed
        //   shape is consumed defensively (only `?.message` is read) so a
        //   stray `message` field is the worst-case we accept.
        return err as { message?: string };
    }
    return {};
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
    const handleCreateDevice = useCallback(
        async (dto: CreateDeviceDto): Promise<void> => {
            await createDevice(dto);
            setCreateOpen(false);
        },
        [createDevice]
    );

    /**
     * Enters inline-edit mode for the given device.
     * @param {DeviceWithAccess} device - Device being edited.
     */
    const handleStartEdit = useCallback((device: DeviceWithAccess): void => {
        setEditingId(device.id);
        setEditName(device.name);
        setEditType(device.vehicle_type);
        setEditError(null);
    }, []);

    /**
     * Exits inline-edit mode without persisting changes.
     */
    const handleCancelEdit = useCallback((): void => {
        setEditingId(null);
        setEditName('');
        setEditType('other');
        setEditError(null);
    }, []);

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
    const handleSaveEdit = useCallback(
        async (device: DeviceWithAccess): Promise<void> => {
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
                setEditingId(null);
                setEditError(null);
            } catch (err) {
                const apiErr = asApiError(err);
                setEditError(apiErr.message ?? t.inlineEdit.updateFailed);
            }
        },
        [editName, editType, t.inlineEdit, updateDevice]
    );

    /**
     * Opens the delete-confirmation modal for the given device.
     * @param {DeviceWithAccess} device - Device targeted for deletion.
     */
    const handleStartDelete = useCallback((device: DeviceWithAccess): void => {
        setDeleteTarget(device);
        setDeleteConfirmName('');
        setDeleteError(null);
    }, []);

    /**
     * Closes the delete-confirmation modal and clears its state.
     */
    const handleCloseDeleteModal = useCallback((): void => {
        setDeleteTarget(null);
        setDeleteConfirmName('');
        setDeleteError(null);
    }, []);

    /**
     * Confirms the deletion of the targeted device. Delete is only enabled in
     * the UI when the typed name matches exactly, so this is a final guard,
     * not the primary check.
     */
    const handleConfirmDelete = useCallback(async (): Promise<void> => {
        if (!deleteTarget) return;
        if (deleteConfirmName.trim() !== deleteTarget.name) {
            setDeleteError(t.deleteConfirm.mismatch);
            return;
        }
        try {
            await deleteDevice(deleteTarget.id);
            handleCloseDeleteModal();
        } catch (err) {
            const apiErr = asApiError(err);
            setDeleteError(apiErr.message ?? t.deleteConfirm.deleteFailed);
        }
    }, [
        deleteTarget,
        deleteConfirmName,
        t.deleteConfirm,
        deleteDevice,
        handleCloseDeleteModal,
    ]);

    /**
     * Stable onChange handler for the row's edit-name input. Edit state is
     * shared across the list, so a single callback is reused by every row
     * — no inline arrow inside the `.map` is needed.
     */
    const onEditNameChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>): void => {
            setEditName(e.target.value);
            setEditError(null);
        },
        []
    );

    /**
     * Stable change handler for the row's vehicle-type selector. See
     * {@link onEditNameChange} for the rationale on sharing one callback.
     */
    const onEditTypeChange = useCallback((next: DeviceVehicleType): void => {
        setEditType(next);
        setEditError(null);
    }, []);

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
     * Stable handler for the create-device modal's close button.
     */
    const handleCloseCreate = useCallback((): void => {
        setCreateOpen(false);
    }, []);

    /**
     * Stable handler for the toolbar's add-device button.
     */
    const handleOpenCreate = useCallback((): void => {
        setCreateOpen(true);
    }, []);

    /**
     * Per-device click callbacks for the row actions. The `.map` below reads
     * from this Map instead of allocating inline arrows; the entries are
     * referentially stable until `devices` (or one of the underlying
     * handlers) changes.
     */
    const rowHandlersById = useMemo(() => {
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
    }, [devices, handleStartEdit, handleSaveEdit, handleStartDelete]);

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

    const canDelete =
        deleteTarget !== null && deleteConfirmName.trim() === deleteTarget.name;

    return (
        <>
            <div className="device-table__toolbar">
                <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                    <Plus size={14} strokeWidth={2} aria-hidden="true" />
                    {t.addDevice}
                </Button>
            </div>

            {devices.length === 0 ? (
                <>
                    <TableStatus
                        mode="empty"
                        className={className}
                        title={translation.device.noDevices}
                        message={translation.device.noDevicesMessage}
                    />
                    {/* Mobile empty state (≤ 767.98px) — mirrors the
                        TableStatus above; CSS shows the right one. */}
                    <div className="mobile-empty">
                        <div className="mobile-empty__icon" aria-hidden="true">
                            <Inbox />
                        </div>
                        <h3 className="mobile-empty__title">
                            {translation.device.noDevices}
                        </h3>
                        <p className="mobile-empty__message">
                            {translation.device.noDevicesMessage}
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <DataTable columns={columns} className={className}>
                        {devices.map((device: DeviceWithAccess) => {
                            const status = statusFromLastSeen(
                                device.last_seen_at
                            );
                            const isEditing = editingId === device.id;
                            const handlers = rowHandlersById.get(device.id);
                            if (!handlers) return null;
                            return (
                                <tr
                                    key={device.id}
                                    className={`data-table__row device-table__row ${
                                        isEditing ? 'is-editing' : ''
                                    }`}
                                >
                                    {/* Device name */}
                                    <td className="data-table__cell">
                                        {isEditing ? (
                                            <div className="device-table__inline-field">
                                                <Input
                                                    name="edit-name"
                                                    value={editName}
                                                    onChange={onEditNameChange}
                                                    placeholder={
                                                        formStrings.namePlaceholder
                                                    }
                                                    disabled={isLoading}
                                                />
                                                {editError && (
                                                    <p
                                                        className="device-table__inline-error"
                                                        role="alert"
                                                    >
                                                        {editError}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <a
                                                href={`/${locale}/devices/detail?id=${device.id}`}
                                                className="device-table__name"
                                            >
                                                {device.name}
                                            </a>
                                        )}
                                    </td>
                                    {/* Device type */}
                                    <td className="data-table__cell">
                                        {isEditing ? (
                                            <VehicleTypeSelector
                                                value={editType}
                                                onChange={onEditTypeChange}
                                                vehicleTypes={t.vehicleTypes}
                                                label={t.vehicleType}
                                            />
                                        ) : (
                                            <DeviceTypeIcon
                                                type={device.vehicle_type}
                                            />
                                        )}
                                    </td>
                                    {/* Device status */}
                                    <td className="data-table__cell">
                                        <Badge
                                            variant={
                                                status === 'online'
                                                    ? 'success'
                                                    : 'danger'
                                            }
                                            size="sm"
                                            label={
                                                status === 'online'
                                                    ? translation.device.online
                                                    : translation.device.offline
                                            }
                                        />
                                    </td>
                                    {/* Device last seen */}
                                    <td className="data-table__cell device-table__time">
                                        {device.last_seen_at
                                            ? formatDate(
                                                  locale,
                                                  device.last_seen_at
                                              )
                                            : translation.device.neverSeen}
                                    </td>
                                    {/* Actions */}
                                    <td className="data-table__cell is-align-right">
                                        <div className="device-table__actions">
                                            {isEditing ? (
                                                <>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={
                                                            handlers.onSave
                                                        }
                                                        disabled={isLoading}
                                                        aria-label={
                                                            t.inlineEdit.save
                                                        }
                                                    >
                                                        <Check
                                                            size={14}
                                                            strokeWidth={2}
                                                        />
                                                        {t.inlineEdit.save}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={
                                                            handleCancelEdit
                                                        }
                                                        disabled={isLoading}
                                                        aria-label={
                                                            t.inlineEdit.cancel
                                                        }
                                                    >
                                                        <X
                                                            size={14}
                                                            strokeWidth={2}
                                                        />
                                                        {t.inlineEdit.cancel}
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Edit button */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={
                                                            handlers.onEdit
                                                        }
                                                        aria-label={
                                                            translation.device
                                                                .editDevice
                                                        }
                                                    >
                                                        <Pencil />
                                                    </Button>
                                                    {/* Delete button */}
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={
                                                            handlers.onDelete
                                                        }
                                                        aria-label={
                                                            translation.device
                                                                .deleteDevice
                                                        }
                                                    >
                                                        <Trash />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </DataTable>
                    {/* Mobile cards (≤ 767.98px) — mirrors the table rows above. */}
                    <ul
                        className="mobile-cards device-cards"
                        aria-label={t.name}
                    >
                        {devices.map((device: DeviceWithAccess) => {
                            const status = statusFromLastSeen(
                                device.last_seen_at
                            );
                            // ponytail: API serializes vehicle_type as a generic string;
                            //   the lookup table only covers the known
                            //   DeviceVehicleType union, so the fallback
                            //   (`?? device.vehicle_type`) handles unknown values safely.
                            const vtLabel =
                                t.vehicleTypes[
                                    device.vehicle_type as DeviceVehicleType
                                ] ?? device.vehicle_type;
                            const isEditing = editingId === device.id;
                            const handlers = rowHandlersById.get(device.id);
                            if (!handlers) return null;
                            return (
                                <li
                                    key={device.id}
                                    className={`device-card ${
                                        isEditing ? 'is-editing' : ''
                                    }`}
                                >
                                    <header className="device-card__header">
                                        <div className="device-card__identity">
                                            <div
                                                className="device-card__icon"
                                                aria-hidden="true"
                                            >
                                                {isEditing ? null : (
                                                    <DeviceTypeIcon
                                                        type={
                                                            device.vehicle_type
                                                        }
                                                    />
                                                )}
                                            </div>
                                            {isEditing ? (
                                                <div className="device-table__inline-field">
                                                    <Input
                                                        name="edit-name-mobile"
                                                        value={editName}
                                                        onChange={
                                                            onEditNameChange
                                                        }
                                                        placeholder={
                                                            formStrings.namePlaceholder
                                                        }
                                                        disabled={isLoading}
                                                    />
                                                    {editError && (
                                                        <p
                                                            className="device-table__inline-error"
                                                            role="alert"
                                                        >
                                                            {editError}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <a
                                                    href={`/${locale}/devices/detail?id=${device.id}`}
                                                    className="device-card__name"
                                                >
                                                    {device.name}
                                                </a>
                                            )}
                                        </div>
                                        <Badge
                                            variant={
                                                status === 'online'
                                                    ? 'success'
                                                    : 'danger'
                                            }
                                            size="sm"
                                            label={
                                                status === 'online'
                                                    ? translation.device.online
                                                    : translation.device.offline
                                            }
                                        />
                                    </header>
                                    <dl className="device-card__meta">
                                        <div className="device-card__meta-item">
                                            <dt className="device-card__meta-label">
                                                {t.vehicleType}
                                            </dt>
                                            <dd className="device-card__meta-value">
                                                {isEditing ? (
                                                    <VehicleTypeSelector
                                                        value={editType}
                                                        onChange={
                                                            onEditTypeChange
                                                        }
                                                        vehicleTypes={
                                                            t.vehicleTypes
                                                        }
                                                        label={t.vehicleType}
                                                    />
                                                ) : (
                                                    vtLabel
                                                )}
                                            </dd>
                                        </div>
                                        <div className="device-card__meta-item">
                                            <dt className="device-card__meta-label">
                                                {t.lastSeen}
                                            </dt>
                                            <dd className="device-card__meta-value device-card__meta-value--mono device-card__meta-value--muted">
                                                {device.last_seen_at
                                                    ? formatDate(
                                                          locale,
                                                          device.last_seen_at
                                                      )
                                                    : translation.device
                                                          .neverSeen}
                                            </dd>
                                        </div>
                                    </dl>
                                    <footer className="device-card__actions">
                                        {isEditing ? (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={handlers.onSave}
                                                    disabled={isLoading}
                                                    aria-label={
                                                        t.inlineEdit.save
                                                    }
                                                >
                                                    <Check
                                                        size={14}
                                                        strokeWidth={2}
                                                    />
                                                    {t.inlineEdit.save}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleCancelEdit}
                                                    disabled={isLoading}
                                                    aria-label={
                                                        t.inlineEdit.cancel
                                                    }
                                                >
                                                    <X
                                                        size={14}
                                                        strokeWidth={2}
                                                    />
                                                    {t.inlineEdit.cancel}
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                {/* Edit */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handlers.onEdit}
                                                    aria-label={
                                                        translation.device
                                                            .editDevice
                                                    }
                                                >
                                                    <Pencil />
                                                </Button>
                                                {/* Delete */}
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={handlers.onDelete}
                                                    aria-label={
                                                        translation.device
                                                            .deleteDevice
                                                    }
                                                >
                                                    <Trash />
                                                </Button>
                                            </>
                                        )}
                                    </footer>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}

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

            <Modal
                open={deleteTarget !== null}
                onClose={handleCloseDeleteModal}
                title={translation.device.deleteDevice}
                variant="danger"
                size="md"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCloseDeleteModal}
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
                <div className="device-delete-confirm">
                    <p className="device-delete-confirm__warning" role="alert">
                        {t.deleteConfirm.warning.replace(
                            '{name}',
                            deleteTarget?.name ?? ''
                        )}
                    </p>
                    <Input
                        name="delete-confirm-name"
                        label={t.deleteConfirm.typeNameLabel}
                        placeholder={
                            deleteTarget
                                ? deleteTarget.name
                                : t.deleteConfirm.typeNamePlaceholder
                        }
                        value={deleteConfirmName}
                        onChange={onDeleteNameChange}
                        disabled={isLoading}
                        autocomplete="off"
                    />
                    {deleteError && (
                        <p
                            className="device-delete-confirm__error"
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
