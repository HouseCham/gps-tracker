export type SidebarNavItem = 'dashboard' | 'devices' | 'admin' | 'profile';
/**
 * User information to be displayed in the sidebar
 * @interface SidebarUser
 * @property {string} name - The user's name.
 * @property {string} role - The user's role.
 * @property {string | undefined} [email] - The user's email.
 */
export interface SidebarUser {
    name: string;
    role: string;
    email?: string;
}