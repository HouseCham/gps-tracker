import '@/styles/components/table.css';
import '@/styles/components/mobile-cards.css';
//-- React
import { useEffect, useState } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type {
    CreateDeviceDto,
    DeviceVehicleType,
    DeviceWithAccess,
} from '@/types/api';
import type { Language } from '@/types';
import type { DataTableColumn } from '@/types/components/ui';
import type { Translation } from '@/i18n';
//-- Components
import { DataTable, TableStatus } from '@/components/ui/DataTable';
import { Badge, Button } from '@/components/ui';
import { DeviceTypeIcon, DeviceForm } from '@/components/react/device';
import Modal from '@/components/react/ui/Modal';
//-- Icons
import { Inbox, Pencil, Plus, Trash } from 'lucide-react';
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
                            const status =
                                statusFromLastSeen(device.last_seen_at);
                            return (
                                <tr
                                    key={device.id}
                                    className="data-table__row device-table__row"
                                >
                                    {/* Device name */}
                                    <td className="data-table__cell">
                                        <a
                                            href={`/${locale}/devices/detail?id=${device.id}`}
                                            className="device-table__name"
                                        >
                                            {device.name}
                                        </a>
                                    </td>
                                    {/* Device type */}
                                    <td className="data-table__cell">
                                        <DeviceTypeIcon
                                            type={device.vehicle_type}
                                        />
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
                                                    ? translation.device
                                                          .online
                                                    : translation.device
                                                          .offline
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
                                            <Button variant="ghost" size="sm">
                                                <Pencil />
                                            </Button>
                                            <Button variant="danger" size="sm">
                                                <Trash />
                                            </Button>
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
                            const status =
                                statusFromLastSeen(device.last_seen_at);
                            // ponytail: API serializes vehicle_type as a generic string;
                            //   the lookup table only covers the known
                            //   DeviceVehicleType union, so the fallback
                            //   (`?? device.vehicle_type`) handles unknown values safely.
                            const vtLabel =
                                t.vehicleTypes[
                                    device.vehicle_type as DeviceVehicleType
                                ] ?? device.vehicle_type;
                            return (
                                <li key={device.id} className="device-card">
                                    <header className="device-card__header">
                                        <div className="device-card__identity">
                                            <div
                                                className="device-card__icon"
                                                aria-hidden="true"
                                            >
                                                <DeviceTypeIcon
                                                    type={device.vehicle_type}
                                                />
                                            </div>
                                            <a
                                                href={`/${locale}/devices/detail?id=${device.id}`}
                                                className="device-card__name"
                                            >
                                                {device.name}
                                            </a>
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
                                                {vtLabel}
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
                                                    : translation.device.neverSeen}
                                            </dd>
                                        </div>
                                    </dl>
                                    <footer className="device-card__actions">
                                        <Button variant="ghost" size="sm">
                                            <Pencil />
                                        </Button>
                                        <Button variant="danger" size="sm">
                                            <Trash />
                                        </Button>
                                    </footer>
                                </li>
                            );
                        })}
                    </ul>
                </>
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
