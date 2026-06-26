import type { JSX } from 'react';
import type { Translation } from '@/i18n';
import type { Language } from '@/types';
import type { DeviceTableItem } from '@/types/components/device.types';
import { getDeviceTableColumns } from '@/lib/device-utils';
import { DataTable } from '@/components/ui/DataTable';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { BatteryIndicator } from '@/components/ui/BatteryIndicator';
import { SignalIndicator } from '@/components/ui/SignalIndicator';
import { Button } from '@/components/ui';

interface DeviceTableProps {
    devices: DeviceTableItem[];
    locale: Language;
    translation: Translation;
    loading?: boolean;
    empty?: boolean;
    emptyTitle?: string;
    emptyMessage?: string;
    className?: string;
}

export function DeviceTable({
    devices,
    locale,
    translation,
    loading = false,
    empty = false,
    emptyTitle,
    emptyMessage,
    className,
}: DeviceTableProps): JSX.Element {
    const columns = getDeviceTableColumns(translation);
    const resolvedEmptyTitle = emptyTitle ?? translation.device.noDevices;
    const resolvedEmptyMessage = emptyMessage ?? translation.device.noDevicesMessage;

    return (
        <DataTable
            columns={columns}
            loading={loading}
            empty={empty}
            emptyTitle={resolvedEmptyTitle}
            emptyMessage={resolvedEmptyMessage}
            className={className}
        >
            {devices.map((device) => (
                <tr key={device.id} className="data-table__row device-table__row">
                    <td className="data-table__cell">
                        <a
                            href={`/${locale}/devices/${device.id}`}
                            className="device-table__name"
                        >
                            {device.name}
                        </a>
                    </td>
                    <td className="data-table__cell">
                        <StatusIndicator status={device.status} />
                    </td>
                    <td className="data-table__cell device-table__time">
                        {device.lastSeen ?? '—'}
                    </td>
                    <td className="data-table__cell" data-align="center">
                        <BatteryIndicator level={device.battery} />
                    </td>
                    <td className="data-table__cell" data-align="center">
                        <SignalIndicator strength={device.signal} />
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
            ))}
        </DataTable>
    );
}
