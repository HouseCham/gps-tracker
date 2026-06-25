import { useEffect, type PropsWithChildren, type ReactNode } from 'react';
//-- Hooks
import { useAuth } from '@/lib/hooks/useAuth';
//-- Constants
import { LOGIN_PATH } from '@/constants/auth';
import { redirectTo } from '@/lib';
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
 * - When loading settles and the user is not authenticated, sends
 *   the browser to the sign-in page via `LOGIN_PATH`. We use a full
 *   navigation rather than the History API so the protected HTML
 *   is not cached in the back/forward stack.
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

    useEffect(() => {
        if (isAuthLoading) return;
        if (!isAuthenticated) {
            redirectTo(LOGIN_PATH);
        }
    }, [isAuthLoading, isAuthenticated]);

    if (isAuthLoading) {
        return <>{fallback ?? <RouteFallback />}</>;
    }

    if (!isAuthenticated) {
        return <></>;
    }

    return <>{children}</>;
}