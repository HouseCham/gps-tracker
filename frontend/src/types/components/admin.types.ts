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
/**
 * @interface CreateUserFormStrings
 * @param {string} title - The title of the form.
 * @param {string} email - The label for the email field.
 * @param {string} emailPlaceholder - The placeholder for the email field.
 * @param {string} name - The label for the name field.
 * @param {string} namePlaceholder - The placeholder for the name field.
 * @param {string} lastname - The label for the lastname field.
 * @param {string} lastnamePlaceholder - The placeholder for the lastname field.
 * @param {string} role - The label for the role field.
 * @param {string} roleUser - The label for the "User" role option.
 * @param {string} roleSuperAdmin - The label for the "Super Admin" role option.
 * @param {string} emailRequired - The error message when email is empty.
 * @param {string} emailInvalid - The error message when email format is invalid.
 * @param {string} roleRequired - The error message when role is empty.
 * @param {string} create - The label for the submit button.
 * @param {string} creating - The label for the submit button while loading.
 * @param {string} cancel - The label for the cancel button.
 */
export interface CreateUserFormStrings {
    title: string;
    email: string;
    emailPlaceholder: string;
    name: string;
    namePlaceholder: string;
    lastname: string;
    lastnamePlaceholder: string;
    role: string;
    roleUser: string;
    roleSuperAdmin: string;
    emailRequired: string;
    emailInvalid: string;
    roleRequired: string;
    create: string;
    creating: string;
    cancel: string;
}
export interface AdminStatItem {
    label: string;
    value: string | number;
    icon: KpiIcon;
    trend?: KpiTrend;
    trendValue?: string;
    variant?: KpiVariant;
}
