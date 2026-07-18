import { useEffect, useState, type ReactElement } from 'react';
//-- Types
import type { Language } from '@/types';
//-- Services
import { bootstrapService } from '@/lib/api/services';

/**
 * @interface FirstRunGateProps
 * @property {Language[]} [supportedLocales=['en','es']] - Locales the
 *   redirect targets must be limited to. Anything outside the list
 *   falls back to the first entry.
 */
interface FirstRunGateProps {
    supportedLocales?: Language[];
}

const DEFAULT_LOCALES: Language[] = ['en', 'es'];

/**
 * Default loading UI while the bootstrap request is in flight. Renders
 * nothing visually meaningful — `index.astro` is the entry point of
 * the app and the user should never stay on it.
 * @returns {JSX.Element} A bare status node for accessibility tools.
 */
function DefaultFallback(): React.JSX.Element {
    return (
        <div role="status" aria-live="polite" className="loading-fallback">
            <span>Loading…</span>
        </div>
    );
}

/**
 * Resolves the preferred locale from the browser, defaulting to the
 * first entry of `supported` when the language tag is unknown.
 * @param {Language[]} supported - Locales allowed by the build.
 * @returns {Language} The locale to redirect to.
 */
function resolveLocale(supported: Language[]): Language {
    const fallback = supported[0];
    const raw = (navigator.language || '').split('-')[0];
    return (supported.find(l => l === raw) ?? fallback) as Language;
}

/**
 * React island mounted on the entry `/` page. It performs the
 * first-run redirect in two hops:
 *
 *  1. Resolve the browser's preferred locale.
 *  2. Ask the backend whether the app still needs its first user.
 *  3. Redirect to `/{lan}/signup` when the table is empty, otherwise
 *     to `/{lan}/login`.
 *
 * The previous implementation was a synchronous `<script is:inline>`
 * that hard-coded the locale detection. This island replaces it so
 * the locale and the bootstrap state can be reconciled in a single
 * place, and so the redirect target can react to the answer rather
 * than always landing on the locale-prefixed dashboard.
 *
 * @param {FirstRunGateProps} props - The component props.
 * @returns {ReactElement} The fallback (or nothing during the redirect).
 */
export function FirstRunGate({
    supportedLocales = DEFAULT_LOCALES,
}: FirstRunGateProps): ReactElement {
    const [decided, setDecided] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const locale = resolveLocale(supportedLocales);

        bootstrapService
            .getStatus()
            .then(status => {
                if (cancelled) return;
                const target = status.needsSetup ? 'signup' : 'login';
                window.location.replace(`/${locale}/${target}`);
                setDecided(true);
            })
            .catch(() => {
                if (cancelled) return;
                window.location.replace(`/${locale}/error`);
                setDecided(true);
            });

        return (): void => {
            cancelled = true;
        };
    }, [supportedLocales]);

    if (decided) return <></>;
    return <DefaultFallback />;
}