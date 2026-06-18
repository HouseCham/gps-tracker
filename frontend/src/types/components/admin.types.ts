import type { KpiIcon, KpiTrend, KpiVariant } from './ui';
/**
 * @interface UserTableItem
 * @param {string} id - The id of the user.
 * @param {string} name - The name of the user.
 * @param {string} email - The email of the user.
 * @param {'user' | 'super_admin'} role - The role of the user.
 * @param {boolean} active - The active status of the user.
 * @param {string} createdAt - The creation date of the user.
 * @param {number | undefined} deviceCount - The number of devices associated with the user.
 */
export interface UserTableItem {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'super_admin';
    active: boolean;
    createdAt: string;
    deviceCount?: number;
}
/**
 * @interface AdminStatItem
 * @param {string} label - The label of the stat item.
 * @param {string | number} value - The value of the stat item.
 * @param {KpiIcon} icon - The icon of the stat item.
 * @param {KpiTrend | undefined} trend - The trend of the stat item.
 * @param {string | undefined} trendValue - The trend value of the stat item.
 * @param {KpiVariant | undefined} variant - The variant of the stat item.
 */
export interface AdminStatItem {
    label: string;
    value: string | number;
    icon: KpiIcon;
    trend?: KpiTrend;
    trendValue?: string;
    variant?: KpiVariant;
}
