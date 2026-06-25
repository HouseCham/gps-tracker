import { useEffect, type ReactElement } from 'react';
//-- Hooks
import { useAuth } from '@/lib/hooks/useAuth';
//-- Constants
import { LOGIN_PATH } from '@/constants/auth';

/**
 * Transient landing page reached after the OAuth2 provider redirects
 * back to the frontend. By the time this component mounts the
 * backend has already set the session cookie, so the only work left
 * is to hydrate the local auth state and forward the user to the
 * dashboard.
 *
 * - While the session is being fetched, shows a minimal "Signing
 *   you in…" message so the page never looks broken.
 * - On success, redirects to `/`. The root page's inline script
 *   resolves the active locale (`/en/`, `/es/`) and forwards.
 * - If the session check resolves with no user (the provider
 *   rejected the flow or the cookie wasn't set), falls back to the
 *   sign-in page so the user can retry.
 *
 * @returns {ReactElement} The page content.
 */
export function OAuthCallback(): ReactElement {
    const { isAuthenticated, isAuthLoading } = useAuth();

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (isAuthenticated) {
            window.location.assign('/');
            return;
        }
        window.location.assign(LOGIN_PATH);
    }, [isAuthLoading, isAuthenticated]);

    return (
        <div
            role="status"
            aria-live="polite"
            className="oauth-callback"
        >
            <span>Signing you in…</span>
        </div>
    );
}
