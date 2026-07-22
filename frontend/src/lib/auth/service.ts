//-- API
import { apiClient, authClient } from './client';
//-- Types
import type {
    AuthSession,
    AuthUser,
    Envelope,
    MeResponse,
    OAuthAuthorizeResponse,
    OAuthProvider,
    ProfileResponse,
    SignInCredentials,
    SignUpCredentials,
    UserRole,
} from '@/types/api';
//-- Utils
import { handleApiError, withApiErrorToast } from '@/lib/api/api-utils';
import {
    clearUser,
    setAuthLoading,
    setRoleLoaded,
    setUser,
    setUserRole,
} from '@/lib/stores/auth';
import { redirectTo } from '@/lib';
//-- Constants
import { REDIRECT_AFTER_AUTH, REDIRECT_AFTER_SIGNOUT } from '@/constants/auth';

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
async function postSignIn(
    credentials: SignInCredentials
): Promise<AuthSession> {
    const { data } = await withApiErrorToast(() =>
        authClient<AuthSession | null>('/email-password/sign-in', {
            method: 'POST',
            body: credentials,
        })
    );
    if (!data) {
        handleApiError(new Error('sign-in returned an empty response'));
    }
    return data;
}

/**
 * Calls POST /email-password/sign-up on the Authula backend and
 * returns the resulting session.
 * @param {SignUpCredentials} credentials - Email, password, and name.
 * @returns {Promise<AuthSession>} The session payload from the backend.
 * @throws {ApiError} When the backend rejects the credentials.
 */
async function postSignUp(
    credentials: SignUpCredentials
): Promise<AuthSession> {
    const { data } = await withApiErrorToast(() =>
        authClient<AuthSession | null>('/email-password/sign-up', {
            method: 'POST',
            body: credentials,
        })
    );
    if (!data) {
        handleApiError(new Error('sign-up returned an empty response'));
    }
    return data;
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
        const { data } = await withApiErrorToast(() =>
            authClient<MeResponse | null>('/me', { method: 'GET' })
        );
        return data?.user ?? null;
    } catch {
        return null;
    }
}

/**
 * Calls GET /api/v1/users/me and stores the user's role. Fires as a
 * side-effect of `getSession()` so the role lands alongside the session
 * without an extra round trip from the auth gate. Errors are swallowed
 * and the role stays `null`; `OnlyAdminRoute` treats a failed fetch
 * as "deny" (fails closed) so an unverified role can never unlock the
 * admin page.
 *
 * ponytail: best-effort, no retry, no cache. Add a retry / memo when
 * the admin gate becomes a hotspot (it won't).
 *
 * @returns {Promise<UserRole | null>} The resolved role, or `null` on failure.
 */
async function fetchRole(): Promise<UserRole | null> {
    try {
        const { data } = await apiClient<
            Envelope<ProfileResponse['user']> | null
        >('/users/me', { method: 'GET' });
        const role = data?.data?.role;
        if (role === 'user' || role === 'super_admin') {
            setUserRole(role);
            return role;
        }
        return null;
    } catch {
        return null;
    } finally {
        setRoleLoaded();
    }
}

/**
 * Asks Authula for the provider's authorization URL. The backend
 * also sets the state/redirect cookies needed to validate the
 * callback. Throws via `handleApiError` on any non-2xx response.
 * @param {OAuthProvider} provider - The provider identifier (e.g. "google").
 * @param {string} callbackUrl - Absolute URL the backend should redirect to after the callback.
 * @returns {Promise<string>} The authorization URL to send the browser to.
 */
async function fetchOAuthAuthorizeUrl(
    provider: OAuthProvider,
    callbackUrl: string
): Promise<string> {
    const { data } = await withApiErrorToast(() =>
        authClient<OAuthAuthorizeResponse | null>(
            `/oauth2/authorize/${provider}?redirect_to=${encodeURIComponent(callbackUrl)}`,
            { method: 'GET' }
        )
    );
    if (!data?.authUrl) {
        handleApiError(new Error('oauth authorize returned an empty response'));
    }
    return data.authUrl;
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
            redirectTo(REDIRECT_AFTER_AUTH);
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
            redirectTo(REDIRECT_AFTER_AUTH);
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
     * Calls Authula's POST /api/auth/sign-out, which deletes the
     * session row and clears the `authula.session_token` cookie
     * via the session plugin's after-hook, then clears the local
     * store and redirects to `REDIRECT_AFTER_SIGNOUT`. The endpoint
     * is idempotent so a second call is a no-op.
     * @returns {Promise<void>}
     */
    async signOut(): Promise<void> {
        setAuthLoading(true);
        try {
            // ponytail: sign-out is best-effort. Backend failures must not
            // block local sign-out — the `finally` block clears the user
            // and redirects regardless. Bind the error so the catch is
            // not empty (lint rule) and we have it if logging is added.
            await authClient('/sign-out', { method: 'POST' });
        } catch (error) {
            void error;
        } finally {
            clearUser();
            redirectTo(REDIRECT_AFTER_SIGNOUT);
            setAuthLoading(false);
        }
    },

    /**
     * Restore the session on app startup. Calls GET /me and hydrates
     * `$user` when the cookie is still valid, otherwise clears the
     * store. On a successful user hydration, also kicks off the role
     * fetch (non-blocking) so role-gated routes can resolve on their
     * first render. Safe to call multiple times.
     * @returns {Promise<AuthUser | null>} The authenticated user, or null.
     */
    async getSession(): Promise<AuthUser | null> {
        setAuthLoading(true);
        try {
            const user = await fetchMe();
            if (user) {
                setUser(user);
                void fetchRole();
            } else {
                clearUser();
            }
            return user;
        } finally {
            setAuthLoading(false);
        }
    },
};
