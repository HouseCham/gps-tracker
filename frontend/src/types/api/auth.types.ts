import type { User } from './users.types';

/**
 * Credentials sent to POST /email-password/sign-in.
 * @interface SignInCredentials
 * @property {string} email - The email address of the user.
 * @property {string} password - The user's plaintext password.
 */
export interface SignInCredentials {
    email: string;
    password: string;
}

/**
 * Payload sent to POST /email-password/sign-up.
 * @interface SignUpCredentials
 * @property {string} email - The email address of the new user.
 * @property {string} password - The user's plaintext password.
 * @property {string} name - The display name of the new user.
 */
export interface SignUpCredentials {
    email: string;
    password: string;
    name: string;
}

/**
 * Response shape returned by Authula's email-password sign-in and
 * sign-up routes when the `jwt.respond_json` route mapping is active.
 * The `user.id` is the Authula-assigned id, while the `accessToken`
 * and `refreshToken` are JWTs we ignore on the client because the
 * session is established via an HTTP-only cookie.
 * @interface AuthSession
 * @property {User} user - The authenticated Authula user.
 * @property {string} accessToken - JWT access token (server-set as cookie).
 * @property {string} refreshToken - JWT refresh token (server-set as cookie).
 */
export interface AuthSession {
    user: User;
    accessToken: string;
    refreshToken: string;
}

/**
 * Error shape returned by Authula on a failed sign-in or sign-up.
 * @interface AuthErrorBody
 * @property {string} message - Human-readable error message.
 * @property {string} [code] - Optional machine-readable error code.
 */
export interface AuthErrorBody {
    message: string;
    code?: string;
}
