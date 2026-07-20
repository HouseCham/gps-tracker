/**
 * Navigation icon.
 * @type {ShellNavIcon}
 */
export type ShellNavIcon =
    | 'dashboard'
    | 'devices'
    | 'users'
    | 'settings'
    | 'reports'
    | 'access';
/**
 * Navigation item.
 * @interface ShellNavItem
 * @prop {ShellNavIcon} id - Navigation icon.
 * @prop {string} href - Navigation link.
 * @prop {'dashboard' | 'devices' | 'usersRoles' | 'settings' | 'reports' | 'access'} labelKey - Navigation label.
 * @prop {ShellNavIcon} icon - Navigation icon.
 * @prop {number} [count] - Notification count.
 */
export interface ShellNavItem {
    id: ShellNavIcon;
    href: string;
    labelKey:
        | 'dashboard'
        | 'devices'
        | 'usersRoles'
        | 'settings'
        | 'reports'
        | 'access';
    icon: ShellNavIcon;
    count?: number;
}
