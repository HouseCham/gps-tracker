export interface User {
    id: string;
    email: string;
    email_verified: boolean;
    image: string | null;
    name: string;
    lastname: string;
    role: 'user' | 'super_admin';
    must_change_password: boolean;
    created_at: string;
}

export interface UserWithDevices extends User {
    devices: Array<{
        id: string;
        uuid_firmware: string;
        name: string;
    }>;
    pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
    };
}

export interface CreateUserDto {
    email: string;
    name?: string;
    lastname?: string;
    role: 'user' | 'super_admin';
}

export interface UpdateUserDto {
    name?: string;
    lastname?: string;
}

/**
 * Response shape returned by GET /api/v1/users/me. Carries the full local
 * user projection (role, lastname, image, created_at, …) the profile page
 * needs beyond the minimal AuthUser shape. Distinct from
 * `AuthSession`/`MeResponse` in `auth.types.ts`, which only carry the
 * Authula projection used by the auth gate.
 * @interface ProfileResponse
 * @property {User} user - The currently authenticated user with every
 *   field the local users table exposes.
 */
export interface ProfileResponse {
    user: User;
}
