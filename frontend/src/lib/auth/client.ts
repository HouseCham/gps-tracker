import { createFetch } from '@better-fetch/fetch';

/**
 * The HTTP client used to talk to the Authula authentication API.
 *
 * The backend mounts the Authula handler under `/api/auth`, so all
 * email-password and OAuth routes are reachable through this base
 * URL. Session state lives in an HTTP-only `authula.session_token`
 * cookie that the backend sets on a successful sign-in / sign-up;
 * `credentials: 'include'` makes the browser send it back on every
 * subsequent request so JS never touches the cookie.
 *
 * @type {typeof import('@better-fetch/fetch').createFetch}
 */
export const authClient = createFetch({
    baseURL: `${import.meta.env.PUBLIC_API_URL}/api/auth` || '/api/auth',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
});
/**
 * The HTTP client used to interact with the API.
 * 
 * @type {typeof import('@better-fetch/fetch').createFetch}
 */
export const apiClient = createFetch({
    baseURL: `${import.meta.env.PUBLIC_API_URL}/api/v1` || '/api/v1',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
});
