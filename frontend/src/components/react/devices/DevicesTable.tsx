//-- Types
import { useEffect, useRef, useState } from 'react';
import type { JSX, MouseEvent } from 'react';
import type { DeviceWithAccess } from '@/types/api';
import type { Translation } from '@/i18n';
//-- Utils
import { copyToClipboard } from '@/lib/copy-to-clipboard';
import { deriveDeviceStatus, formatRelativeTime } from '@/lib';
//-- Icons
import { Check, Copy, Pencil, Trash2 } from 'lucide-react';
//-- Components
import { Button } from '@/components/react/ui/Button';
import { VehicleIcon } from './VehicleIcon';

const COPIED_FEEDBACK_DURATION_MS = 1500;
/**
 * Props for the DevicesTable component.
 * @interface DevicesTableProps
 * @prop {Translation['device']} t - Translation strings.
 * @prop {DeviceWithAccess[]} devices - List of devices.
 * @prop {(d: DeviceWithAccess) => void} onEdit - Callback for editing a device.
 * @prop {(d: DeviceWithAccess) => void} onDelete - Callback for deleting a device.
 */
interface DevicesTableProps {
    t: Translation['device'];
    devices: DeviceWithAccess[];
    onEdit: (d: DeviceWithAccess) => void;
    onDelete: (d: DeviceWithAccess) => void;
}
/**
 * The DevicesTable component.
 * @param {DevicesTableProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function DevicesTable({
    t,
    devices,
    onEdit,
    onDelete,
}: DevicesTableProps): JSX.Element {
    const [copiedDeviceId, setCopiedDeviceId] = useState<string | null>(null);
    const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const vehicleLabels = t.table.vehicleTypes;
    const roleLabels = t.roles;

    /**
     * Clear the copied device ID after a short delay.
     */
    useEffect(() => {
        if (!copiedDeviceId) return;
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = setTimeout(
            () => setCopiedDeviceId(null),
            COPIED_FEEDBACK_DURATION_MS
        );
        return (): void => {
            if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        };
    }, [copiedDeviceId]);
    /**
     * Copy the UUID to the clipboard.
     * @param {MouseEvent<HTMLButtonElement>} e - The copy button click event.
     * @returns {Promise<void>} A promise that resolves when the UUID is copied.
     */
    const handleCopy = async (
        e: MouseEvent<HTMLButtonElement>
    ): Promise<void> => {
        const deviceId = e.currentTarget.dataset.id;
        const uuid = e.currentTarget.dataset.uuid;
        if (!deviceId || !uuid) return;
        const copied = await copyToClipboard(uuid);
        setCopiedDeviceId(copied ? deviceId : null);
    };
    /**
     * Handle an action on a device row.
     * @param {MouseEvent<HTMLButtonElement>} e - The click event.
     * @returns {void}
     */
    const handleAction = (e: MouseEvent<HTMLButtonElement>): void => {
        const id = e.currentTarget.dataset.id;
        const action = e.currentTarget.dataset.action;
        if (!id) return;
        const row = devices.find(d => d.id === id);
        if (!row) return;
        if (action === 'delete') onDelete(row);
        else onEdit(row);
    };
    return (
        <div className="dev-table-wrap">
            <table className="dev-table">
                <thead>
                    <tr>
                        <th>{t.table.name}</th>
                        <th className="col-firmware">{t.table.firmwareUuid}</th>
                        <th>{t.table.vehicleType}</th>
                        <th>{t.table.status}</th>
                        <th>{t.table.lastSeen}</th>
                        <th
                            className="col-actions"
                            aria-label={t.table.actions}
                        >
                            {t.table.actions}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map(d => {
                        const status = deriveDeviceStatus(d.last_seen_at, t);
                        const isCopied = copiedDeviceId === d.id;
                        return (
                            <tr key={d.id}>
                                {/* Device name and ID */}
                                <td>
                                    <div className="dev-cell-device">
                                        <span
                                            className={`dev-cell-icon dev-cell-icon-${d.vehicle_type}`}
                                        >
                                            <VehicleIcon
                                                type={d.vehicle_type}
                                            />
                                        </span>
                                        <div className="dev-cell-device-text">
                                            <div className="dev-cell-name">
                                                {d.name}
                                            </div>
                                            <div className="dev-cell-id">
                                                {roleLabels[d.access_role]}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                {/* UUID */}
                                <td className="col-firmware">
                                    <div className="col-firmware-wrap">
                                        <code className="dev-firmware">
                                            {d.uuid_firmware}
                                        </code>
                                        <Button
                                            type="button"
                                            className="copy-btn"
                                            iconOnly
                                            data-id={d.id}
                                            data-uuid={d.uuid_firmware}
                                            onClick={handleCopy}
                                            aria-label={`${
                                                isCopied
                                                    ? t.table.copied
                                                    : t.table.copy
                                            } ${d.uuid_firmware}`}
                                            title={
                                                isCopied
                                                    ? t.table.copied
                                                    : t.table.copy
                                            }
                                            icon={
                                                isCopied ? (
                                                    <Check
                                                        size={11}
                                                        strokeWidth={1.6}
                                                    />
                                                ) : (
                                                    <Copy
                                                        size={11}
                                                        strokeWidth={1.6}
                                                    />
                                                )
                                            }
                                        />
                                    </div>
                                </td>
                                {/* Vehicle type */}
                                <td>
                                    <span className="dev-vehicle-tag">
                                        {vehicleLabels[d.vehicle_type]}
                                    </span>
                                </td>
                                {/* Status */}
                                <td>
                                    <span
                                        className={`dev-status dev-status-${status.dot}`}
                                    >
                                        <span className="dev-status-dot" />
                                        {status.label}
                                    </span>
                                </td>
                                {/* Last seen */}
                                <td
                                    className={`dev-cell-time${d.last_seen_at ? '' : ' never'}`}
                                >
                                    {formatRelativeTime(d.last_seen_at)}
                                </td>
                                {/* Actions */}
                                <td className="col-actions">
                                    <div className="dev-row-actions">
                                        <Button
                                            type="button"
                                            className="dev-action-btn"
                                            iconOnly
                                            data-id={d.id}
                                            data-action="edit"
                                            onClick={handleAction}
                                            aria-label={`${t.table.edit} ${d.name}`}
                                            title={t.table.edit}
                                            icon={
                                                <Pencil
                                                    size={14}
                                                    strokeWidth={1.6}
                                                />
                                            }
                                        />
                                        <Button
                                            type="button"
                                            className="dev-action-btn is-danger"
                                            iconOnly
                                            data-id={d.id}
                                            data-action="delete"
                                            onClick={handleAction}
                                            aria-label={`${t.table.delete} ${d.name}`}
                                            title={t.table.delete}
                                            icon={
                                                <Trash2
                                                    size={14}
                                                    strokeWidth={1.6}
                                                />
                                            }
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
