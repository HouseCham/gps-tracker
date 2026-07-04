//-- store
import { useStore } from '@nanostores/react';
import { $isAuthenticated, $isAuthLoading, $user } from '@/lib/stores/auth';
//-- types
import type { UseAuthResult } from '@/types/api';
//-- services
import { authService } from '@/lib/auth/service';
/**
 * React hook for reading and acting on the auth state.
 *
 * Subscribes to `$user`, `$isAuthenticated`, and `$isAuthLoading` so
 * the component re-renders whenever any of them change. Returns the
 * current snapshot plus the `authService` actions bound to the same
 * store, which guarantees a single source of truth across the app.
 *
 * @returns {UseAuthResult} The current auth snapshot and actions.
 */
export function useAuth(): UseAuthResult {
    const user = useStore($user);
    const isAuthenticated = useStore($isAuthenticated);
    const isAuthLoading = useStore($isAuthLoading);

    return {
        user,
        isAuthenticated,
        isAuthLoading,
        signIn: authService.signIn,
        signUp: authService.signUp,
        signInOAuth: authService.signInOAuth,
        signOut: authService.signOut,
    };
}
