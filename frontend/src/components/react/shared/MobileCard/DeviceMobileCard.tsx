//-- React
import type { ChangeEvent, JSX } from 'react';
//-- Types
import type { Language } from '@/types';
import type { DeviceVehicleType, DeviceWithAccess } from '@/types/api';
import type { Translation } from '@/i18n';
//-- Components
import { Badge, Button, Input } from '@/components/ui';
import { DeviceTypeIcon, VehicleTypeSelector } from '@/components/react/device';
import { MobileCardMetaItem } from '@/components/react/shared/MobileCard/MobileCardMetaItem';
//-- Icons
import { Check, Pencil, Trash, X } from 'lucide-react';
//-- Utils
import { formatDate } from '@/lib';

/**
 * Stable row callbacks shared by the matching row above and this card.
 * Same shape as `DeviceTable.rowHandlersById`.
 * @interface DeviceCardHandlers
 */
interface DeviceCardHandlers {
    onEdit: () => void;
    onSave: () => void;
    onDelete: () => void;
}

/**
 * Online/offline status derived from `last_seen_at`. The parent computes it
 * once per device and forwards it here so both the `<tr>` and the
 * `<li>` agree on the badge.
 * @typedef {'online' | 'offline'} DeviceCardStatus
 */
export type DeviceCardStatus = 'online' | 'offline';

/**
 * Interface for the DeviceMobileCard component.
 * @interface DeviceMobileCardProps
 * @property {Language} locale - Current locale (for date formatting).
 * @property {DeviceWithAccess} device - The device whose row to render.
 * @property {Translation['device']['table']} labels - Table strings (meta
 *   labels + `inlineEdit` save/cancel copy).
 * @property {Translation['device']} deviceStrings - Top-level device
 *   strings (online/offline/neverSeen/edit/delete labels).
 * @property {DeviceCardStatus} status - Online/offline flag for this row.
 * @property {string | null} editingId - Currently editing device id, or
 *   `null` when no row is in edit mode. Matches this device ⇒ `is-editing`.
 * @property {DeviceCardHandlers | undefined} handlers - Per-row click
 *   callbacks (edit / save / delete). `undefined` is treated as "not
 *   ready" and the card renders nothing — same contract as the existing
 *   row code in DeviceTable.tsx.
 * @property {string} editName - Live value of the inline name input.
 * @property {DeviceVehicleType} editType - Live value of the inline vehicle
 *   type selector.
 * @property {string | null} editError - Live inline-edit error message.
 * @property {string} namePlaceholder - Placeholder for the inline name `<Input>`.
 * @property {ChangeEventHandler<HTMLInputElement>} onEditNameChange - Stable
 *   change handler for the inline name input.
 * @property {(next: DeviceVehicleType) => void} onEditTypeChange - Stable
 *   change handler for the inline vehicle-type selector.
 * @property {() => void} onCancelEdit - Stable handler for the cancel button.
 * @property {boolean} isLoading - Disables the action buttons.
 */
interface DeviceMobileCardProps {
    locale: Language;
    device: DeviceWithAccess;
    labels: Translation['device']['table'];
    deviceStrings: Translation['device'];
    status: DeviceCardStatus;
    editingId: string | null;
    handlers: DeviceCardHandlers | undefined;
    editName: string;
    editType: DeviceVehicleType;
    editError: string | null;
    namePlaceholder: string;
    onEditNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onEditTypeChange: (next: DeviceVehicleType) => void;
    onCancelEdit: () => void;
    isLoading: boolean;
}

/**
 * Mobile (≤ 767.98px) row for a single {@link DeviceWithAccess}. Mirrors
 * the `<DataTable>` row rendered by `DeviceTable.tsx`, including the
 * inline-edit swap controlled by the parent's `editingId` state.
 * @param {DeviceMobileCardProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered card, or `null` if no
 *   handlers were passed (caller hasn't initialised them yet).
 */
export function DeviceMobileCard({
    locale,
    device,
    labels,
    deviceStrings,
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
}: DeviceMobileCardProps): JSX.Element | null {
    if (!handlers) return null;

    const isEditing = editingId === device.id;
    //* note: API serializes vehicle_type as a generic string;
    //*   the lookup table only covers the known DeviceVehicleType
    //*   union, so the fallback (`?? device.vehicle_type`) handles
    //*   unknown values safely.
    const vtLabel =
        labels.vehicleTypes[device.vehicle_type as DeviceVehicleType] ??
        device.vehicle_type;

    return (
        <li className={`mobile-device-card ${isEditing ? 'is-editing' : ''}`}>
            <header className="mobile-device-card__header">
                <div className="mobile-device-card__identity">
                    <div
                        className="mobile-device-card__icon"
                        aria-hidden="true"
                    >
                        {isEditing ? null : (
                            <DeviceTypeIcon type={device.vehicle_type} />
                        )}
                    </div>
                    {isEditing ? (
                        <div className="device-table__inline-field">
                            <Input
                                name="edit-name-mobile"
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
                            className="mobile-device-card__name"
                        >
                            {device.name}
                        </a>
                    )}
                </div>
                <Badge
                    variant={status === 'online' ? 'success' : 'danger'}
                    size="sm"
                    label={
                        status === 'online'
                            ? deviceStrings.online
                            : deviceStrings.offline
                    }
                />
            </header>
            <dl className="mobile-device-card__meta">
                <div className="mobile-device-card__meta-item">
                    <dt className="mobile-device-card__meta-label">
                        {labels.vehicleType}
                    </dt>
                    <dd className="mobile-device-card__meta-value">
                        {isEditing ? (
                            <VehicleTypeSelector
                                value={editType}
                                onChange={onEditTypeChange}
                                vehicleTypes={labels.vehicleTypes}
                                label={labels.vehicleType}
                            />
                        ) : (
                            vtLabel
                        )}
                    </dd>
                </div>
                <MobileCardMetaItem
                    variant="device"
                    label={labels.lastSeen}
                    mono
                    muted
                    value={
                        device.last_seen_at
                            ? formatDate(locale, device.last_seen_at)
                            : deviceStrings.neverSeen
                    }
                />
            </dl>
            <footer className="mobile-device-card__actions">
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
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlers.onEdit}
                            aria-label={deviceStrings.editDevice}
                        >
                            <Pencil />
                        </Button>
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
            </footer>
        </li>
    );
}
