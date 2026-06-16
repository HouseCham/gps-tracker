import type { User } from "@/types/api";
import type { AdminStatItem, DataTableColumn, UserTableItem } from "@/types/components";
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
    { key: 'created', label: 'Created' },
    { key: 'devices', label: 'Devices', align: 'center' },
    { key: 'actions', label: 'Actions', align: 'right' },
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
 * @constant ADMIN_GALLERY_DEMO_STATS
 * @description Demo stats for the admin gallery
 * @type {AdminStatItem[]}
 */
export const ADMIN_GALLERY_DEMO_STATS: Array<AdminStatItem> = [
    { label: 'Total Users', value: 128, icon: 'users' as const, trend: 'up' as const, trendValue: '+12 this month', variant: 'accent' as const },
    { label: 'Total Devices', value: 342, icon: 'cpu' as const, trend: 'up' as const, trendValue: '+24 this week', variant: 'neutral' as const },
    { label: 'Active Today', value: 87, icon: 'activity' as const, trend: 'up' as const, trendValue: '+5% vs yesterday', variant: 'success' as const },
    { label: 'Alerts', value: 3, icon: 'alert' as const, trend: 'down' as const, trendValue: '-2 vs yesterday', variant: 'warning' as const },
];
/**
 * @constant ADMIN_GALLERY_DEMO_USERS
 * @description Demo users for the admin gallery
 * @type {UserTableItem[]}
 */
export const ADMIN_GALLERY_DEMO_USERS: Array<UserTableItem> = [
    { id: 'U-001', name: 'Alex Chen',       email: 'alex@meridian.io',          role: 'super_admin', active: true,  createdAt: '2026-01-15', deviceCount: 12 },
    { id: 'U-002', name: 'Maya Okafor',     email: 'm.okafor@meridian.io',       role: 'user',         active: true,  createdAt: '2026-02-03', deviceCount: 8 },
    { id: 'U-003', name: 'Diego Ruiz',      email: 'd.ruiz@meridian.io',        role: 'user',         active: false, createdAt: '2026-03-20', deviceCount: 4 },
    { id: 'U-004', name: 'Sarah Kim',       email: 's.kim@meridian.io',         role: 'user',         active: true,  createdAt: '2026-04-11', deviceCount: 15 },
    { id: 'U-005', name: 'James Wilson',     email: 'j.wilson@meridian.io',      role: 'user',         active: true,  createdAt: '2026-05-08', deviceCount: 6 },
    { id: 'U-006', name: 'Elena Vasquez',    email: 'e.vasquez@meridian.io',     role: 'super_admin', active: true,  createdAt: '2026-01-02', deviceCount: 22 },
];