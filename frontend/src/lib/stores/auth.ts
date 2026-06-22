import { atom, computed } from 'nanostores';
import type { AuthUser } from '@/types/api';

/**
 * The currently authenticated user, or `null` when nobody is signed in.
 * Hydrated by `authService.getSession()` on app startup and updated by
 * `authService.signIn()` / `authService.signOut()`.
 * @type {import('nanostores').Atom<AuthUser | null>}
 */
export const $user = atom<AuthUser | null>(null);

/**
 * `true` whenever `$user` holds a non-null value. Components subscribe
 * to this to render authenticated vs unauthenticated states without
 * re-checking the user object themselves.
 * @type {import('nanostores').ReadonlyAtom<boolean>}
 */
export const $isAuthenticated = computed($user, user => user !== null);

/**
 * `true` while a sign-in, sign-up, sign-out, or session refresh is in
 * flight. UI components read this to disable buttons and show spinners.
 * @type {import('nanostores').Atom<boolean>}
 */
export const $isAuthLoading = atom<boolean>(false);

/**
 * Replace the currently held user with a new one. Use after a
 * successful sign-in or session refresh.
 * @param {AuthUser} user - The authenticated user.
 * @returns {void}
 */
export function setUser(user: AuthUser): void {
    $user.set(user);
}

/**
 * Forget the currently held user. Use after sign-out or when a session
 * refresh fails.
 * @returns {void}
 */
export function clearUser(): void {
    $user.set(null);
}

/**
 * Toggle the loading flag that gates buttons and spinners in the
 * auth UI.
 * @param {boolean} loading - Whether an auth operation is in progress.
 * @returns {void}
 */
export function setAuthLoading(loading: boolean): void {
    $isAuthLoading.set(loading);
}
