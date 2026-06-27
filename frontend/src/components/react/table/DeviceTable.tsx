import '@/styles/components/table.css';
//-- React
import { useEffect, useState } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type { CreateDeviceDto, DeviceWithAccess } from '@/types/api';
import type { Language } from '@/types';
import type { DataTableColumn } from '@/types/components/ui';
import type { Translation } from '@/i18n';
//-- Components
import { DataTable, TableStatus } from '@/components/ui/DataTable';
import { Badge, Button } from '@/components/ui';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import Modal from '@/components/react/ui/Modal';
import DeviceForm from '@/components/react/device/DeviceForm';
//-- Icons
import { Plus } from 'lucide-react';
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
function statusFromLastSeen(lastSeenAt: string | null): 'online' | 'offline' | 'never-seen' {
    if (!lastSeenAt) return 'never-seen';
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
        error, isLoading, devices,
        //-- actions
        getAllDevices, createDevice,
    } = useDeviceService();
    const t = translation.device.table;
    const formStrings = translation.device.form;
    const columns: DataTableColumn[] = getDeviceTableColumns(translation);

    const [createOpen, setCreateOpen] = useState(false);

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
        setCreateOpen(false);
    }

    // -- Loading state: built-in DataTable skeleton
    if (isLoading) return <TableStatus mode="loading" className={className} />;

    // -- Error state: empty DataTable with error copy
    if (error) {
        return (
            <TableStatus
                mode="empty"
                className={className}
                title={t.failedToLoad}
                message={error.message}
            />
        );
    }

    // -- Populated or empty state
    return (
        <>
            <div className="device-table__toolbar">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus size={14} strokeWidth={2} aria-hidden="true" />
                    {t.addDevice}
                </Button>
            </div>

            {devices.length === 0 ? (
                <TableStatus
                    mode="empty"
                    className={className}
                    title={translation.device.noDevices}
                    message={translation.device.noDevicesMessage}
                />
            ) : (
                <DataTable columns={columns} className={className}>
                    {devices.map((device: DeviceWithAccess) => {
                        const status = statusFromLastSeen(device.last_seen_at);
                        return (
                            <tr
                                key={device.id}
                                className="data-table__row device-table__row"
                            >
                                <td className="data-table__cell">
                                    <span className="device-table__name">{device.name}</span>
                                </td>
                                <td className="data-table__cell">
                                    <Badge
                                        variant="default"
                                        size="sm"
                                        label={t.vehicleTypes[device.vehicle_type]}
                                    />
                                </td>
                                <td className="data-table__cell">
                                    <StatusIndicator status={status} />
                                </td>
                                <td
                                    className="data-table__cell device-table__time"
                                    data-align="left"
                                >
                                    {device.last_seen_at
                                        ? formatDate(locale, device.last_seen_at)
                                        : translation.device.neverSeen}
                                </td>
                                <td
                                    className="data-table__cell is-align-center"
                                    data-align="center"
                                >
                                    {t.notAvailable}
                                </td>
                                <td
                                    className="data-table__cell is-align-center"
                                    data-align="center"
                                >
                                    {t.notAvailable}
                                </td>
                                <td className="data-table__cell" data-align="right">
                                    <div className="device-table__actions">
                                        <Button variant="ghost" size="sm">
                                            {translation.device.editDevice}
                                        </Button>
                                        <Button variant="danger" size="sm">
                                            {translation.device.deleteDevice}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </DataTable>
            )}

            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
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
                    onCancel={() => setCreateOpen(false)}
                    saving={isLoading}
                />
            </Modal>
        </>
    );
}
