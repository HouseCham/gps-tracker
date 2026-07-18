//-- Types
import type { JSX, MouseEvent } from "react";
import type { DeviceWithAccess } from "@/types/api";
import type { Translation } from "@/i18n";
//-- Utils
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { deriveDeviceStatus, formatRelativeTime } from "@/lib";
//-- Icons
import { Copy, Pencil, Trash2 } from "lucide-react";
//-- Components
import { VehicleIcon } from "./VehicleIcon";
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
    const vehicleLabels = t.table.vehicleTypes;
    const roleLabels = t.roles;
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
                        <th className="col-firmware">UUID</th>
                        <th>{t.table.vehicleType}</th>
                        <th>{t.table.actions}</th>
                        <th>{t.table.status}</th>
                        <th>{t.table.lastSeen}</th>
                        <th className="col-actions" aria-label={t.table.actions}></th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map(d => {
                        const status = deriveDeviceStatus(d.last_seen_at, t);
                        return (
                            <tr key={d.id}>
                                <td>
                                    <div className="dev-cell-device">
                                        <span className={`dev-cell-icon dev-cell-icon-${d.vehicle_type}`}>
                                            <VehicleIcon type={d.vehicle_type} />
                                        </span>
                                        <div className="dev-cell-device-text">
                                            <div className="dev-cell-name">{d.name}</div>
                                            <div className="dev-cell-id">#{d.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="col-firmware">
                                    <div className="col-firmware-wrap">
                                        <code className="dev-firmware">{d.uuid_firmware}</code>
                                        <button
                                            type="button"
                                            className="copy-btn"
                                            onClick={() => void copyToClipboard(d.uuid_firmware)}
                                            aria-label={`Copy ${d.uuid_firmware}`}
                                            title="Copy"
                                        >
                                            <Copy size={11} strokeWidth={1.6} />
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <span className="dev-vehicle-tag">
                                        {vehicleLabels[d.vehicle_type]}
                                    </span>
                                </td>
                                <td>
                                    <span className={`dev-role dev-role-${d.access_role}`}>
                                        {roleLabels[d.access_role]}
                                    </span>
                                </td>
                                <td>
                                    <span className={`dev-status dev-status-${status.dot}`}>
                                        <span className="dev-status-dot" />
                                        {status.label}
                                    </span>
                                </td>
                                <td
                                    className={`dev-cell-time${d.last_seen_at ? '' : ' never'}`}
                                >
                                    {formatRelativeTime(d.last_seen_at)}
                                </td>
                                <td className="col-actions">
                                    <div className="dev-row-actions">
                                        <button
                                            type="button"
                                            className="dev-action-btn"
                                            data-id={d.id}
                                            data-action="edit"
                                            onClick={handleAction}
                                            aria-label={`${t.table.edit} ${d.name}`}
                                            title={t.table.edit}
                                        >
                                            <Pencil size={14} strokeWidth={1.6} />
                                        </button>
                                        <button
                                            type="button"
                                            className="dev-action-btn is-danger"
                                            data-id={d.id}
                                            data-action="delete"
                                            onClick={handleAction}
                                            aria-label={`${t.table.delete} ${d.name}`}
                                            title={t.table.delete}
                                        >
                                            <Trash2 size={14} strokeWidth={1.6} />
                                        </button>
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