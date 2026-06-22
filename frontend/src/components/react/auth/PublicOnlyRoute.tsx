import { useEffect, type ReactNode } from 'react';
//-- Hooks
import { useAuth } from '@/lib/hooks/useAuth';
//-- Constants
import { DASHBOARD_PATH } from '@/constants/auth';

/**
 * @interface PublicOnlyRouteProps
 * @property {ReactNode} children - The public tree (sign-in form,
 *   sign-up form, etc.). Rendered only when the user is NOT
 *   authenticated.
 * @property {ReactNode} [fallback] - Optional custom loading UI.
 *   Defaults to a minimal centered spinner, mirroring
 *   `<ProtectedRoute />`.
 */
interface PublicOnlyRouteProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Default loading UI. Matches `<ProtectedRoute />`'s default so the
 * transition between guarded and public pages is consistent.
 * @returns {JSX.Element} A simple spinner.
 */
function DefaultFallback(): React.JSX.Element {
    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100dvh',
            }}
        >
            <span>Loading…</span>
        </div>
    );
}

/**
 * React island that gates its children to **unauthenticated** users.
 *
 * The inverse of `<ProtectedRoute />`. Use it on pages that should
 * only be reachable while signed out — typically the sign-in and
 * sign-up screens — so that an already-authenticated visitor is
 * bounced to the dashboard instead of being shown the form again.
 *
 * - While `$isAuthLoading` is `true`, renders `fallback` (or the
 *   default spinner) so the user never sees a sign-in form flash
 *   before the session check resolves.
 * - When loading settles and the user **is** authenticated, sends
 *   the browser to `DASHBOARD_PATH` via `window.location.assign`.
 *   Using a full navigation (rather than the History API) prevents
 *   the public page from being cached in the back/forward stack.
 * - When the user is not authenticated, renders `children`.
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
}: PublicOnlyRouteProps): React.JSX.Element {
    const { isAuthenticated, isAuthLoading } = useAuth();

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (isAuthenticated) {
            window.location.assign(DASHBOARD_PATH);
        }
    }, [isAuthLoading, isAuthenticated]);

    if (isAuthLoading) {
        return <>{fallback ?? <DefaultFallback />}</>;
    }

    if (isAuthenticated) {
        return <></>;
    }

    return <>{children}</>;
}
