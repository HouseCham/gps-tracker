import type { LayoutDashboard } from 'lucide-react';

/**
 * Allowed values for the `active` nav item prop on `Sidebar` /
 * `TabBar`. Drives the `.active` highlight and `aria-current`.
 * @typedef {'dashboard' | 'devices' | 'admin' | 'profile'} SidebarNavItem
 */
export type SidebarNavItemType = 'dashboard' | 'devices' | 'admin' | 'profile';
/**
 * Interface for a sidebar navigation item, used in the `Sidebar` and `TabBar` components.
 * @interface SidebarNavItem
 * @property {SidebarNavItemType} key - Unique identifier for the nav item.
 * @property {string} href - The URL path the nav item links to.
 * @property {string} label - The display label for the nav item.
 * @property {typeof LayoutDashboard} Icon - The icon component associated with the nav item.
 */
export interface SidebarNavItem {
    key: SidebarNavItemType;
    href: string;
    label: string;
    Icon: typeof LayoutDashboard;
}
