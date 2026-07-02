//-- React
import type { ChangeEvent, JSX } from 'react';
//-- Types
import type { Language } from '@/types';
import type {
    DeviceVehicleType,
    DeviceWithAccess,
} from '@/types/api';
import type { Translation } from '@/i18n';
//-- Components
import { Badge, Button, Input } from '@/components/ui';
import {
    DeviceTypeIcon,
    VehicleTypeSelector,
} from '@/components/react/device';
//-- Icons
import { Check, Pencil, Trash, X } from 'lucide-react';
//-- Utils
import { formatDate } from '@/lib';

/**
 * Stable row callbacks shared by this row and the matching mobile card.
 * Same shape as `DeviceTable.rowHandlersById` and `DeviceMobileCard`.
 * @interface DeviceRowHandlers
 * @param {() => void} onEdit - Enter inline-edit mode for this device.
 * @param {() => void} onSave - Persist the inline edit.
 * @param {() => void} onDelete - Open the delete-confirmation modal.
 */
interface DeviceRowHandlers {
    onEdit: () => void;
    onSave: () => void;
    onDelete: () => void;
}

/**
 * Online/offline status derived from `last_seen_at`. The parent computes it
 * once per device and forwards it here so both the `<tr>` and the
 * matching mobile card agree on the badge.
 * @typedef {'online' | 'offline'} DeviceRowStatus
 */
export type DeviceRowStatus = 'online' | 'offline';

/**
 * Interface for DeviceTableRow component
 * @interface DeviceTableRowProps
 * @param {Language} locale - Current locale (for date formatting + detail link).
 * @param {DeviceWithAccess} device - The device whose row to render.
 * @param {DeviceRowStatus} status - Online/offline flag for this row.
 * @param {string | null} editingId - Currently editing device id, or
 *   `null` when no row is in edit mode. Matches this device ⇒ `is-editing`.
 * @param {DeviceRowHandlers | undefined} handlers - Per-row click callbacks
 *   (edit / save / delete). `undefined` is treated as "not ready" and the
 *   row renders nothing — same contract as the inline code it replaces.
 * @param {string} editName - Live value of the inline name input.
 * @param {DeviceVehicleType} editType - Live value of the inline vehicle
 *   type selector.
 * @param {string | null} editError - Live inline-edit error message.
 * @param {string} namePlaceholder - Placeholder for the inline name `<Input>`.
 * @param {(e: ChangeEvent<HTMLInputElement>) => void} onEditNameChange -
 *   Stable change handler for the inline name input.
 * @param {(next: DeviceVehicleType) => void} onEditTypeChange - Stable
 *   change handler for the inline vehicle-type selector.
 * @param {() => void} onCancelEdit - Stable handler for the cancel button.
 * @param {boolean} isLoading - Disables the action buttons.
 * @param {Translation['device']['table']} labels - Table strings (meta
 *   labels + `inlineEdit` save/cancel copy).
 * @param {Translation['device']} deviceStrings - Top-level device strings
 *   (online/offline/neverSeen/edit/delete labels).
 */
interface DeviceTableRowProps {
    locale: Language;
    device: DeviceWithAccess;
    status: DeviceRowStatus;
    editingId: string | null;
    handlers: DeviceRowHandlers | undefined;
    editName: string;
    editType: DeviceVehicleType;
    editError: string | null;
    namePlaceholder: string;
    onEditNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onEditTypeChange: (next: DeviceVehicleType) => void;
    onCancelEdit: () => void;
    isLoading: boolean;
    labels: Translation['device']['table'];
    deviceStrings: Translation['device'];
}

/**
 * DeviceTableRow component. Single `<tr>` for one {@link DeviceWithAccess}
 * inside the `<DataTable>` rendered by `DeviceTable`. Mirrors the mobile
 * card on small screens and shares its inline-edit state with the parent.
 * @function DeviceTableRow
 * @param {DeviceTableRowProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered table row, or `null` if no
 *   handlers were passed (caller hasn't initialised them yet).
 */
export function DeviceTableRow({
    locale,
    device,
    status,
    editingId,
    handlers,
    editName,
    editType,
    editError,
    namePlaceholder,
    onEditNameChange,
    onEditTypeChange,
    onCancelEdit,
    isLoading,
    labels,
    deviceStrings,
}: DeviceTableRowProps): JSX.Element | null {
    if (!handlers) return null;

    const isEditing = editingId === device.id;

    return (
        <tr
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
                            placeholder={namePlaceholder}
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
                        vehicleTypes={labels.vehicleTypes}
                        label={labels.vehicleType}
                    />
                ) : (
                    <DeviceTypeIcon type={device.vehicle_type} />
                )}
            </td>
            {/* Device status */}
            <td className="data-table__cell">
                <Badge
                    variant={status === 'online' ? 'success' : 'danger'}
                    size="sm"
                    label={
                        status === 'online'
                            ? deviceStrings.online
                            : deviceStrings.offline
                    }
                />
            </td>
            {/* Device last seen */}
            <td className="data-table__cell device-table__time">
                {device.last_seen_at
                    ? formatDate(locale, device.last_seen_at)
                    : deviceStrings.neverSeen}
            </td>
            {/* Actions */}
            <td className="data-table__cell is-align-right">
                <div className="device-table__actions">
                    {isEditing ? (
                        <>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handlers.onSave}
                                disabled={isLoading}
                                aria-label={labels.inlineEdit.save}
                            >
                                <Check size={14} strokeWidth={2} />
                                {labels.inlineEdit.save}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onCancelEdit}
                                disabled={isLoading}
                                aria-label={labels.inlineEdit.cancel}
                            >
                                <X size={14} strokeWidth={2} />
                                {labels.inlineEdit.cancel}
                            </Button>
                        </>
                    ) : (
                        <>
                            {/* Edit button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlers.onEdit}
                                aria-label={deviceStrings.editDevice}
                            >
                                <Pencil />
                            </Button>
                            {/* Delete button */}
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handlers.onDelete}
                                aria-label={deviceStrings.deleteDevice}
                            >
                                <Trash />
                            </Button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}