import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
//-- Types
import type { Language } from '@/types';
//-- Services
import { bootstrapService } from '@/lib/api/services';

/**
 * @interface BootstrapGateProps
 * @property {ReactNode} children - The tree to render once we know
 *   the app still needs its first user (typically the `SignupForm`).
 * @property {Language} locale - Active locale, used to build the
 *   fallback redirect to `/{locale}/login`.
 */
interface BootstrapGateProps {
    children: ReactNode;
    locale: Language;
}

/**
 * Default loading UI while the bootstrap request is in flight.
 * @returns {JSX.Element} A centered "Loading…" placeholder.
 */
function DefaultFallback(): React.JSX.Element {
    return (
        <div role="status" aria-live="polite" className="loading-fallback">
            <span>Loading…</span>
        </div>
    );
}

/**
 * React island that gates the sign-up page behind the "app is
 * empty" check.
 *
 * - While the bootstrap request is in flight: render a centered
 *   spinner so the page doesn't flash the sign-up form before the
 *   answer arrives.
 * - When the bootstrap status resolves to `needsSetup = false`,
 *   redirect to `/{locale}/login`. Sign-up is closed once any user
 *   exists in the local table.
 * - When the bootstrap status resolves to `needsSetup = true`,
 *   render the children — the sign-up form.
 *
 * On a hard failure (backend unreachable), the safest default is to
 * redirect to the login page rather than render the form: the next
 * API call from `SignupForm` would fail anyway, and we avoid
 * trapping the user on a screen that will reject their submission.
 *
 * @param {BootstrapGateProps} props - The component props.
 * @returns {ReactElement} The fallback, an empty fragment during
 *   redirect, or the sign-up form.
 */
export function BootstrapGate({
    children,
    locale,
}: BootstrapGateProps): ReactElement {
    const [ready, setReady] = useState(false);
    const [allow, setAllow] = useState(false);

    useEffect(() => {
        let cancelled = false;
        bootstrapService
            .getStatus()
            .then(status => {
                if (cancelled) return;
                if (status.needsSetup) {
                    setAllow(true);
                } else {
                    window.location.replace(`/${locale}/login`);
                }
                setReady(true);
            })
            .catch(() => {
                if (cancelled) return;
                window.location.replace(`/${locale}/login`);
                setReady(true);
            });
        return (): void => {
            cancelled = true;
        };
    }, [locale]);

    if (!ready) return <>{<DefaultFallback />}</>;
    if (!allow) return <></>;
    return <>{children}</>;
}
