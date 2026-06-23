import { createFetch } from '@better-fetch/fetch';

/**
 * The HTTP client used to talk to the Authula authentication API.
 *
 * The backend mounts the Authula handler under `/api/auth`, so all
 * email-password and JWT routes are reachable through this base URL.
 *
 * Session state is stored in an HTTP-only cookie that the backend sets
 * on a successful sign-in, so the browser handles the cookie
 * automatically and we never read or write tokens from JavaScript.
 *
 * @type {typeof import('@better-fetch/fetch').createFetch}
 */
export const authClient = createFetch({
    baseURL: `${import.meta.env.PUBLIC_API_URL}/api/auth` || '/api/auth',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
});
