import '@/styles/components/not-found-ui.css';
//-- React
import type { JSX } from 'react/jsx-runtime';
//-- Icons
import { AlertCircle } from 'lucide-react';

/**
 * Interface for the NotFoundUI island.
 * @interface NotFoundUIProps
 * @property {string} title - Headline shown to the user.
 * @property {string} [message] - Optional supporting copy.
 * @property {string} [backHref] - Link target for the back action.
 * @property {string} [backLabel] - Label for the back action.
 * @property {string} [className] - Extra class appended to the class list.
 */
interface NotFoundUIProps {
    title: string;
    message?: string;
    backHref?: string;
    backLabel?: string;
    className?: string;
}

/**
 * Renders a reusable "not found / wrong id" placeholder. Use whenever a
 * resource cannot be resolved (missing id, 404 from the backend, etc.).
 * @param {NotFoundUIProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function NotFoundUI({
    title,
    message,
    backHref,
    backLabel,
    className,
}: NotFoundUIProps): JSX.Element {
    return (
        <div className={`not-found-ui ${className ?? ''}`.trim()}>
            <div className="not-found-ui__icon" aria-hidden="true">
                <AlertCircle size={48} strokeWidth={1.5} />
            </div>
            <h2 className="not-found-ui__title">{title}</h2>
            {message && <p className="not-found-ui__message">{message}</p>}
            {backHref && backLabel && (
                <div className="not-found-ui__action">
                    <a className="btn btn-primary btn-sm" href={backHref}>
                        {backLabel}
                    </a>
                </div>
            )}
        </div>
    );
}
