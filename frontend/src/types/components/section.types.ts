import type { KpiIcon, KpiTrend, KpiVariant } from './ui';

export interface KpiBarItem {
    label: string;
    value: string | number;
    icon: KpiIcon;
    trend?: KpiTrend;
    trendValue?: string;
    variant?: KpiVariant;
}

export type ActivityType =
    | 'device-online'
    | 'device-offline'
    | 'location-update'
    | 'device-added'
    | 'alert'
    | 'user-login'
    | 'role-change';

export interface ActivityItem {
    id: string;
    type: ActivityType;
    message: string;
    timestamp: string;
    user?: string;
    deviceId?: string;
}
