/**
 * Interface for the EmptyDeviceState island.
 * @interface EmptyDeviceStateProps
 * @property {string} title - Headline shown to the user.
 * @property {string} [message] - Optional supporting copy.
 * @property {string} backHref - Link to the device list.
 * @property {string} backLabel - Localized label for the back link.
 */
interface EmptyDeviceStateProps {
    title: string;
    message?: string;
    backHref: string;
    backLabel: string;
}

/**
 * Renders the placeholder shown when a device cannot be resolved
 * (missing id, not found, forbidden).
 * @param {EmptyDeviceStateProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function EmptyDeviceState({
    title,
    message,
    backHref,
    backLabel,
}: EmptyDeviceStateProps): JSX.Element {
    return (
        <div className="empty-state">
            <h3 className="empty-state__title">{title}</h3>
            {message && <p className="empty-state__message">{message}</p>}
            <div className="empty-state__action">
                <a className="btn btn-primary btn-sm" href={backHref}>
                    {backLabel}
                </a>
            </div>
        </div>
    );
}