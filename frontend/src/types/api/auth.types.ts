/**
 * Minimal user shape returned by Authula on its endpoints. The auth
 * store tracks just enough identity to render "who is logged in"; the
 * detailed local projection (role, lastname, etc.) is fetched
 * separately from `/api/v1/users/me` when needed.
 * @interface AuthUser
 * @property {string} id - The Authula-assigned user id.
 * @property {string} email - The user's email address.
 * @property {string} name - The user's display name.
 */
export interface AuthUser {
    id: string;
    email: string;
    name: string;
}

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
 * The `accessToken` and `refreshToken` are JWTs we ignore on the client
 * because the session is established via an HTTP-only cookie.
 * @interface AuthSession
 * @property {AuthUser} user - The authenticated Authula user.
 * @property {string} accessToken - JWT access token (server-set as cookie).
 * @property {string} refreshToken - JWT refresh token (server-set as cookie).
 */
export interface AuthSession {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
}

/**
 * Response shape returned by GET /me. Only the user is relevant on the
 * client; session metadata stays server-side.
 * @interface MeResponse
 * @property {AuthUser} user - The currently authenticated user.
 */
export interface MeResponse {
    user: AuthUser;
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
