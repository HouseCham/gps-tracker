import type { BetterFetchOption } from '@better-fetch/fetch';
import type {
    AuthSession,
    AuthUser,
    MeResponse,
    OAuthAuthorizeResponse,
    OAuthProvider,
    SignInCredentials,
    SignUpCredentials,
} from '@/types/api';
import { handleApiError } from '@/lib/api/helpers/handle-api-error';
import { authClient } from './client';
import {
    clearUser,
    setAuthLoading,
    setUser,
} from '@/lib/stores/auth';
import {
    REDIRECT_AFTER_AUTH,
    REDIRECT_AFTER_SIGNOUT,
} from '@/constants/auth';

/**
 * Path the browser lands on after the OAuth2 provider redirects back
 * to the frontend. The page at this path hydrates the session and
 * forwards the user to the dashboard.
 * @constant {string}
 */
const OAUTH_CALLBACK_PATH = '/callback/google';

/**
 * Calls POST /email-password/sign-in on the Authula backend and
 * returns the resulting session.
 * @param {SignInCredentials} credentials - Email and password.
 * @returns {Promise<AuthSession>} The session payload from the backend.
 * @throws {ApiError} When the backend rejects the credentials.
 */
async function postSignIn(credentials: SignInCredentials): Promise<AuthSession> {
    try {
        const { data } = await authClient<AuthSession | null>(
            '/email-password/sign-in',
            {
                method: 'POST',
                body: credentials,
            } as BetterFetchOption,
        );
        if (!data) {
            handleApiError(new Error('sign-in returned an empty response'));
        }
        // handleApiError throws, data is non-null here
        return data!;
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * Calls POST /email-password/sign-up on the Authula backend and
 * returns the resulting session.
 * @param {SignUpCredentials} credentials - Email, password, and name.
 * @returns {Promise<AuthSession>} The session payload from the backend.
 * @throws {ApiError} When the backend rejects the credentials.
 */
async function postSignUp(credentials: SignUpCredentials): Promise<AuthSession> {
    try {
        const { data } = await authClient<AuthSession | null>(
            '/email-password/sign-up',
            {
                method: 'POST',
                body: credentials,
            } as BetterFetchOption,
        );
        if (!data) {
            handleApiError(new Error('sign-up returned an empty response'));
        }
        // handleApiError throws, data is non-null here
        return data!;
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * Calls GET /me on the Authula backend. Returns the authenticated
 * user or `null` when there is no valid session. A 401 (or any other
 * failure) is treated as "not signed in" rather than thrown, because
 * the only legitimate caller is `authService.getSession()` on app load.
 * @returns {Promise<AuthUser | null>} The authenticated user, or null.
 */
async function fetchMe(): Promise<AuthUser | null> {
    try {
        const { data } = await authClient<MeResponse | null>('/me', {
            method: 'GET',
        } as BetterFetchOption);
        return data?.user ?? null;
    } catch {
        return null;
    }
}

/**
 * Asks Authula for the provider's authorization URL. The backend
 * also sets the state/redirect cookies needed to validate the
 * callback. Throws via `handleApiError` on any non-2xx response.
 * @param {OAuthProvider} provider - The provider identifier (e.g. "google").
 * @param {string} redirectTo - Absolute URL the backend should redirect to after the callback.
 * @returns {Promise<string>} The authorization URL to send the browser to.
 */
async function fetchOAuthAuthorizeUrl(
    provider: OAuthProvider,
    redirectTo: string
): Promise<string> {
    try {
        const { data } = await authClient<OAuthAuthorizeResponse | null>(
            `/oauth2/authorize/${provider}?redirect_to=${encodeURIComponent(redirectTo)}`,
            {
                method: 'GET',
            } as BetterFetchOption
        );
        if (!data?.authUrl) {
            handleApiError(new Error('oauth authorize returned an empty response'));
        }
        return data.authUrl;
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * The auth service. Wraps the Authula HTTP client and keeps the
 * `$user`, `$isAuthenticated`, and `$isAuthLoading` atoms in sync
 * with the backend session state.
 * @namespace authService
 */
export const authService = {
    /**
     * Sign the user in with email + password. On success, populates
     * `$user` and redirects to `REDIRECT_AFTER_AUTH`.
     * @param {SignInCredentials} credentials - Email and password.
     * @returns {Promise<void>} Resolves once the redirect has been issued.
     * @throws {ApiError} When the backend rejects the credentials.
     */
    async signIn(credentials: SignInCredentials): Promise<void> {
        setAuthLoading(true);
        try {
            const session = await postSignIn(credentials);
            setUser(session.user);
            window.location.href = REDIRECT_AFTER_AUTH;
        } finally {
            setAuthLoading(false);
        }
    },

    /**
     * Register a new account. On success, populates `$user` and
     * redirects to `REDIRECT_AFTER_AUTH`.
     * @param {SignUpCredentials} credentials - Email, password, and name.
     * @returns {Promise<void>} Resolves once the redirect has been issued.
     * @throws {ApiError} When the backend rejects the credentials.
     */
    async signUp(credentials: SignUpCredentials): Promise<void> {
        setAuthLoading(true);
        try {
            const session = await postSignUp(credentials);
            setUser(session.user);
            window.location.href = REDIRECT_AFTER_AUTH;
        } finally {
            setAuthLoading(false);
        }
    },

    /**
     * Begin the OAuth2 sign-in flow and immediately redirect the
     * browser to the provider's authorization page. This is the
     * common path: after the provider authenticates the user it
     * returns to the backend, which sets the session cookie and
     * 302-redirects to `OAUTH_CALLBACK_PATH` on the frontend.
     * @param {OAuthProvider} provider - The provider to use (e.g. "google").
     * @returns {Promise<void>}
     * @throws {ApiError} When the backend refuses the authorize call.
     */
    async signInOAuth(provider: OAuthProvider): Promise<void> {
        setAuthLoading(true);
        try {
            const authUrl = await fetchOAuthAuthorizeUrl(
                provider,
                `${window.location.origin}${OAUTH_CALLBACK_PATH}`
            );
            window.location.href = authUrl;
        } catch (error) {
            setAuthLoading(false);
            throw error;
        }
    },

    /**
     * Invalidate the server-side session and forget the local user.
     * Calls Authula's POST /sign-out, which clears the session
     * cookie via the session plugin's after-hook, then clears the
     * local store and redirects to `REDIRECT_AFTER_SIGNOUT`.
     * @returns {Promise<void>}
     */
    async signOut(): Promise<void> {
        setAuthLoading(true);
        try {
            await authClient('/sign-out', {
                method: 'POST',
            } as BetterFetchOption);
        } catch {
            // Sign-out is best-effort: a network failure here
            // shouldn't prevent us from clearing the local
            // store. The server-side session will expire on its
            // own per its TTL.
        }
        clearUser();
        window.location.href = REDIRECT_AFTER_SIGNOUT;
        setAuthLoading(false);
    },

    /**
     * Restore the session on app startup. Calls GET /me and hydrates
     * `$user` when the cookie is still valid, otherwise clears the
     * store. Safe to call multiple times.
     * @returns {Promise<AuthUser | null>} The authenticated user, or null.
     */
    async getSession(): Promise<AuthUser | null> {
        setAuthLoading(true);
        try {
            const user = await fetchMe();
            if (user) {
                setUser(user);
            } else {
                clearUser();
            }
            return user;
        } finally {
            setAuthLoading(false);
        }
    },
};