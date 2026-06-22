import type { BetterFetchOption } from '@better-fetch/fetch';
import type {
    AuthSession,
    AuthUser,
    MeResponse,
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
import { REDIRECT_AFTER_AUTH, REDIRECT_AFTER_SIGNOUT } from '@/constants/auth';

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
        return data;
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
        return data;
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
     * Forget the local session. Authula does not expose a sign-out
     * endpoint in this version, so the server-side cookie stays valid
     * until it expires per `cookie_max_age`. The next sign-in replaces
     * the cookie anyway, so the impact is bounded by the session TTL.
     * @returns {void}
     */
    signOut(): void {
        clearUser();
        window.location.href = REDIRECT_AFTER_SIGNOUT;
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