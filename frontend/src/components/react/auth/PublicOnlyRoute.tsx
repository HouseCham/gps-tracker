import { useEffect, useState, type ReactNode } from 'react';
//-- Hooks
import { useAuth } from '@/lib/hooks/useAuth';
//-- Constants
import { DASHBOARD_PATH, LOGIN_PATH, SIGNUP_PATH } from '@/constants/auth';
//-- Utils
import { redirectTo } from '@/lib';
//-- Services
import { bootstrapService } from '@/lib/api/services';
//-- Types
import type { BootstrapStatus } from '@/types/api';
//-- Components
import { RouteFallback } from './RouteFallback';

/**
 * @interface PublicOnlyRouteProps
 * @property {ReactNode} children - The public tree (sign-in form,
 *   sign-up form, etc.). Rendered only when the user is NOT
 *   authenticated.
 * @property {ReactNode} [fallback] - Optional custom loading UI.
 *   Defaults to `<RouteFallback />`, mirroring `<ProtectedRoute />`.
 * @property {boolean} [isLoginPage] - `true` when this gate wraps the
 *   `/login` screen. Combined with the bootstrap status, it decides
 *   whether `/login` should bounce the visitor to `/signup`
 *   (first-run) or stay put (setup done). Defaults to `false`,
 *   meaning the wrapped page is `/signup`.
 */
interface PublicOnlyRouteProps {
    children: ReactNode;
    fallback?: ReactNode;
    isLoginPage?: boolean;
}

/**
 * React island that gates its children to **unauthenticated** users.
 *
 * The inverse of `<ProtectedRoute />`. Use it on pages that should
 * only be reachable while signed out — typically the sign-in and
 * sign-up screens — so that an already-authenticated visitor is
 * bounced to the dashboard instead of being shown the form again.
 *
 * The gate also enforces the first-run invariant: a visitor who
 * reaches `/login` before the bootstrap user exists is sent to
 * `/signup` instead, and a visitor who reaches `/signup` after
 * setup is done is sent back to `/login`. This mirrors the redirect
 * logic in `<FirstRunGate />` so manual URL entry cannot bypass it.
 *
 * - While `$isAuthLoading` is `true` or the bootstrap status is
 *   still being resolved, renders `fallback` (or
 *   `<RouteFallback />`) so the user never sees a sign-in form
 *   flash before either check settles.
 * - When loading settles and the user **is** authenticated, sends
 *   the browser to `DASHBOARD_PATH` via a full navigation. That
 *   prevents the public page from being cached in the back/forward
 *   stack.
 * - When the user is not authenticated, decides between rendering
 *   `children` and redirecting based on `isLoginPage` and
 *   `bootstrapStatus.needsSetup`. A failed bootstrap query falls
 *   back to `needsSetup = false` so a transient backend error
 *   surfaces the login screen rather than the signup form (which
 *   would itself 409 once submitted).
 *
 * This component assumes it lives inside an `<AuthProvider />`
 * higher in the tree. Without the provider, `isAuthLoading` is
 * stuck at `false` and the gate evaluates against the initial
 * `user = null` state.
 *
 * @param {PublicOnlyRouteProps} props - The component props.
 * @returns {JSX.Element} The fallback, an empty fragment during
 *   redirect, or the public children.
 */
export function PublicOnlyRoute({
    children,
    fallback,
    isLoginPage = false,
}: PublicOnlyRouteProps): React.JSX.Element {
    const { isAuthenticated, isAuthLoading } = useAuth();
    const [bootstrapStatus, setBootstrapStatus] =
        useState<BootstrapStatus | null>(null);

    useEffect(() => {
        if (isAuthenticated || bootstrapStatus !== null) return;
        bootstrapService
            .getStatus()
            .then(status => setBootstrapStatus(status))
            .catch(() => setBootstrapStatus({ needsSetup: false }));
    }, [isAuthenticated, bootstrapStatus]);

    useEffect(() => {
        if (isAuthLoading || isAuthenticated) return;
        if (bootstrapStatus === null) return;
        if (isLoginPage && bootstrapStatus.needsSetup) {
            redirectTo(SIGNUP_PATH);
            return;
        }
        if (!isLoginPage && !bootstrapStatus.needsSetup) {
            redirectTo(LOGIN_PATH);
            return;
        }
    }, [isAuthLoading, isAuthenticated, bootstrapStatus, isLoginPage]);

    if (isAuthLoading) {
        return <>{fallback ?? <RouteFallback />}</>;
    }

    if (isAuthenticated) {
        redirectTo(DASHBOARD_PATH);
        return <></>;
    }

    if (bootstrapStatus === null) {
        return <>{fallback ?? <RouteFallback />}</>;
    }

    if (isLoginPage && bootstrapStatus.needsSetup) {
        return <></>;
    }

    if (!isLoginPage && !bootstrapStatus.needsSetup) {
        return <></>;
    }

    return <>{children}</>;
}
