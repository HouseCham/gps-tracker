import {
    useEffect,
    useState,
    type PropsWithChildren,
    type ReactNode,
} from 'react';
//-- Hooks
import { useAuth } from '@/lib/hooks/useAuth';
//-- Constants
import { LOGIN_PATH, SIGNUP_PATH } from '@/constants/auth';
import { redirectTo } from '@/lib';
//-- Services
import { bootstrapService } from '@/lib/api/services';
//-- Types
import type { BootstrapStatus } from '@/types/api';
//-- Components
import { RouteFallback } from './RouteFallback';

/**
 * @interface ProtectedRouteProps
 * @property {ReactNode} children - The protected tree. Rendered only when the user is authenticated.
 * @property {ReactNode} [fallback] - Optional custom loading UI. Defaults to `<RouteFallback />`.
 */
interface ProtectedRouteProps extends PropsWithChildren {
    fallback?: ReactNode;
}

/**
 * React island that gates its children behind the auth state.
 *
 * - While `$isAuthLoading` is `true`, renders `fallback` (or
 *   `<RouteFallback />`). The session hydration launched by
 *   `<AuthProvider />` is the only legitimate source of this state.
 * - When loading settles and the user is not authenticated, asks the
 *   backend whether the app still needs its first user
 *   (`GET /api/v1/system/bootstrap`) and redirects accordingly:
 *   `SIGNUP_PATH` when the table is empty, `LOGIN_PATH` otherwise.
 *   This mirrors the redirect that `FirstRunGate` already performs
 *   on the entry `/` page so an unauthenticated visitor who lands
 *   directly on a protected page is sent to the correct screen.
 *   A failed bootstrap query falls back to `LOGIN_PATH` so a
 *   transient backend error does not strand the user on a blank
 *   page.
 * - When the user is authenticated, renders `children`.
 *
 * This component assumes it lives inside an `<AuthProvider />`
 * higher in the tree. Mounting it standalone will leave
 * `isAuthLoading` at its initial `false` value and may incorrectly
 * redirect on the first render before `getSession()` has run.
 *
 * @param {ProtectedRouteProps} props - The component props.
 * @returns {JSX.Element} The fallback, an empty fragment during redirect, or the protected children.
 */
export function ProtectedRoute({
    children,
    fallback,
}: ProtectedRouteProps): React.JSX.Element {
    const { isAuthenticated, isAuthLoading } = useAuth();
    const [bootstrapStatus, setBootstrapStatus] =
        useState<BootstrapStatus | null>(null);

    useEffect(() => {
        if (isAuthLoading || isAuthenticated || bootstrapStatus !== null)
            return;
        bootstrapService
            .getStatus()
            .then(status => setBootstrapStatus(status))
            .catch(() => setBootstrapStatus({ needsSetup: false }));
    }, [isAuthLoading, isAuthenticated, bootstrapStatus]);

    useEffect(() => {
        if (isAuthLoading || isAuthenticated) return;
        if (bootstrapStatus === null) return;
        redirectTo(bootstrapStatus.needsSetup ? SIGNUP_PATH : LOGIN_PATH);
    }, [isAuthLoading, isAuthenticated, bootstrapStatus]);

    if (isAuthLoading) {
        return <>{fallback ?? <RouteFallback />}</>;
    }

    if (!isAuthenticated && bootstrapStatus === null) {
        return <>{fallback ?? <RouteFallback />}</>;
    }

    if (!isAuthenticated) {
        return <></>;
    }

    return <>{children}</>;
}