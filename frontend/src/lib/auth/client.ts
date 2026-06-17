import { betterAuth } from 'better-auth';

/**
 * The HTTP client used to interact with the API.
 * @type {typeof import('better-auth').betterAuth}
 */
export const authClient = betterAuth({
    baseURL: import.meta.env.PUBLIC_API_URL || '/api/v1',
    credentials: 'include',
});
