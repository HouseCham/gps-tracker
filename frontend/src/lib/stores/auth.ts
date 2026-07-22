import { atom, computed } from 'nanostores';
import type { AuthUser, UserRole } from '@/types/api';

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
 * The authenticated user's role. `null` means "not yet resolved" —
 * the role is fetched on demand from `/api/v1/users/me` after the
 * session hydrates, so a freshly signed-in user will see `null` for
 * the few hundred milliseconds the request takes. Read
 * {@link $isRoleLoaded} for the "fetch settled" signal.
 * @type {import('nanostores').Atom<UserRole | null>}
 */
export const $userRole = atom<UserRole | null>(null);

/**
 * `true` once `authService.fetchRole()` has settled — either with a
 * role or with an error. Used by `OnlyAdminRoute` to know when the
 * "deny" decision is final vs. still in flight. Never `true` while the
 * user is signed out (role fetches only run after a successful
 * `getSession()`).
 * @type {import('nanostores').Atom<boolean>}
 */
export const $isRoleLoaded = atom<boolean>(false);

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
 * Forget the currently held user and any resolved role. Use after
 * sign-out or when a session refresh fails.
 * @returns {void}
 */
export function clearUser(): void {
    $user.set(null);
    $userRole.set(null);
    $isRoleLoaded.set(false);
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

/**
 * Replace the resolved role. Caller is responsible for also flipping
 * {@link $isRoleLoaded} to `true` — the split lets services decide
 * whether the failure path leaves the role at `null`.
 * @param {UserRole} role - The authenticated user's role.
 * @returns {void}
 */
export function setUserRole(role: UserRole): void {
    $userRole.set(role);
}

/**
 * Mark the role fetch as settled. Always called after `fetchRole()`
 * resolves (success or failure) so consumers can distinguish "not yet
 * tried" from "tried and got nothing back".
 * @returns {void}
 */
export function setRoleLoaded(): void {
    $isRoleLoaded.set(true);
}
