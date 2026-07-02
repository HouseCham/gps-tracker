import type { Translation } from '@/i18n';
import type { AdminStatItem, DataTableColumn } from '@/types/components';
/**
 * Get the columns for the device table.
 * @param {Translation} t - The translation object.
 * @returns {DataTableColumn[]} The columns for the device table.
 */
export function getDeviceTableColumns(t: Translation): DataTableColumn[] {
    return [
        { key: 'name', label: t.device.table.name, sortable: true },
        { key: 'vehicleType', label: t.device.table.vehicleType },
        { key: 'status', label: t.device.table.status },
        { key: 'lastSeen', label: t.device.table.lastSeen },
        { key: 'actions', label: t.device.table.actions, align: 'right' },
    ];
}

/**
 * Get the demo KPI items for the admin dashboard.
 * @param {Translation} t - The translation object.
 * @returns {AdminStatItem[]} The demo KPI items for the admin dashboard.
 */
export function getDemoKpiItems(t: Translation): Array<AdminStatItem> {
    // ponytail: narrow literals for AdminStatItem discriminated union
    return [
        {
            label: t.admin.totalDevices,
            value: 24,
            icon: 'cpu' as const,
            trend: 'up' as const,
            trendValue: '+3 today',
            variant: 'neutral' as const,
        },
        {
            label: t.admin.onlineNow,
            value: 18,
            icon: 'wifi' as const,
            trend: 'up' as const,
            trendValue: '+2',
            variant: 'success' as const,
        },
        {
            label: t.device.offline,
            value: 5,
            icon: 'wifi-off' as const,
            trend: 'down' as const,
            trendValue: '-1',
            variant: 'warning' as const,
        },
        {
            label: t.admin.alerts,
            value: 1,
            icon: 'alert' as const,
            trend: 'flat' as const,
            trendValue: '0',
            variant: 'danger' as const,
        },
    ];
}

/**
 * Returns the columns for the device-access table.
 * @param {Translation['device']['detail']['accessTable']} t - Localized column labels.
 * @returns {DataTableColumn[]} Column definitions.
 */
export function getDeviceAccessTableColumns(
    t: Translation['device']['detail']['accessTable']
): DataTableColumn[] {
    return [
        { key: 'name', label: t.name },
        { key: 'email', label: t.email },
        { key: 'access_granted_at', label: t.accessGranted },
        { key: 'actions', label: t.actions, align: 'right' },
    ];
}
