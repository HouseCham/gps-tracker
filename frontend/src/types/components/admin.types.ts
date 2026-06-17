import type { KpiIcon, KpiTrend, KpiVariant } from './ui';

export interface UserTableItem {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'super_admin';
    active: boolean;
    createdAt: string;
    deviceCount?: number;
}

export interface AdminStatItem {
    label: string;
    value: string | number;
    icon: KpiIcon;
    trend?: KpiTrend;
    trendValue?: string;
    variant?: KpiVariant;
}
