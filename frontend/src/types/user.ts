/**
 * @interface User
 * @property {number} id - Unique identifier for the user.
 * @property {string} name - Full name of the user, used for display and personalization.
 * @property {string} email - Email address of the user, used for communication and login.
 * @property {UserRole} role - The role of the user (e.g., admin, user), which determines access permissions.
 * @property {string} createdAt - Timestamp of when the user account was created, useful for auditing and account management.
 * @property {string} updatedAt - Timestamp of the last update to the user account, useful for tracking changes and activity.
 */
export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}
/** Role of a {@link User}. Determines access permissions. */
export type UserRole = "admin" | "user";