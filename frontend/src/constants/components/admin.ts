import type { User } from '@/types/api';
import type { Translation } from '@/i18n';
import type { AdminStatItem, DataTableColumn } from '@/types/components';
/**
 * @constant DEMO_USER
 * @description Demo user for the admin gallery
 * @type {User}
 */
export const DEMO_USER: User = {
    id: '03b0b79d-083f-4d8b-b84e-64df6ce5fcaf',
    email: 'john.doe@example.com',
    name: 'John',
    lastname: 'Doe',
    role: 'super_admin',
    created_at: '2022-01-01T00:00:00.000Z',
    email_verified: true,
    image: null,
    must_change_password: false,
};
/**
 * @constant USER_TABLE_COLUMNS
 * @description Columns for the user table
 * @type {DataTableColumn[]}
 */
export const USER_TABLE_COLUMNS: DataTableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created', align: 'center' },
    { key: 'devices', label: 'Devices', align: 'center' },
    { key: 'actions', label: 'Actions', align: 'center' },
];
/**
 * @constant USER_ROLE_VARIANT
 * @description Variant for user role
 * @type {Record<string, 'accent' | 'default'>}
 */
export const USER_ROLE_VARIANT: Record<string, 'accent' | 'default'> = {
    super_admin: 'accent',
    user: 'default',
};
/**
 * @constant USER_ROLE_LABEL
 * @description Label for user role
 * @type {Record<string, string>}
 */
export const USER_ROLE_LABEL: Record<string, string> = {
    super_admin: 'Super Admin',
    user: 'User',
};
/**
 * @constant USER_ROLE_BADGE_VARIANT
 * @description Maps the {@link User.role} enum to the BEM variant used by the
 *   role badge. Shared by `UserTable.tsx` and `UserMobileCard.tsx`.
 * @type {Record<User['role'], 'accent' | 'default'>}
 */
export const USER_ROLE_BADGE_VARIANT: Record<User['role'], 'accent' | 'default'> = {
    super_admin: 'accent',
    user: 'default',
};
/**
 * @constant USER_ROLE_LABEL_KEY
 * @description Maps the {@link User.role} enum to the localized role label key.
 *   Necessary because the translation keys are camelCase (`superAdmin`,
 *   `user`) while the API role enum is snake_case (`super_admin`, `user`).
 * @type {Record<User['role'], keyof Translation['admin']['roles']>}
 */
export const USER_ROLE_LABEL_KEY: Record<User['role'], keyof Translation['admin']['roles']> = {
    super_admin: 'superAdmin',
    user: 'user',
};
/**
 * @constant ADMIN_GALLERY_DEMO_STATS
 * @description Demo stats for the admin gallery
 * @type {AdminStatItem[]}
 */
export const ADMIN_GALLERY_DEMO_STATS: Array<AdminStatItem> = [
    {
        label: 'Total Users',
        value: 128,
        icon: 'users' as const,
        trend: 'up' as const,
        trendValue: '+12 this month',
        variant: 'accent' as const,
    },
    {
        label: 'Total Devices',
        value: 342,
        icon: 'cpu' as const,
        trend: 'up' as const,
        trendValue: '+24 this week',
        variant: 'neutral' as const,
    },
    {
        label: 'Active Today',
        value: 87,
        icon: 'activity' as const,
        trend: 'up' as const,
        trendValue: '+5% vs yesterday',
        variant: 'success' as const,
    },
    {
        label: 'Alerts',
        value: 3,
        icon: 'alert' as const,
        trend: 'down' as const,
        trendValue: '-2 vs yesterday',
        variant: 'warning' as const,
    },
];
