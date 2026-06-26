//-- Types
import type { JSX } from 'react/jsx-runtime';
import type { StatusVariant } from '@/types/components/ui';
//-- Constants
import { STATUS_INDICATOR_DEFAULT_LABEL, STATUS_INDICATOR_DOT_COLOR } from '@/constants';

/**
 * Interface for StatusIndicator component
 * @interface StatusIndicatorProps
 * @param {StatusVariant} [status] - The status of the device.
 * @param {string} [label] - The label to use for the status.
 * @param {string} [className] - Extra class appended to the class list.
 */
interface StatusIndicatorProps {
    status?: StatusVariant;
    label?: string;
    className?: string;
}
/**
 * StatusIndicator component
 * @function StatusIndicator
 * @param {StatusIndicatorProps} props - The props for the StatusIndicator component.
 * @returns {JSX.Element} The rendered component
 */
export function StatusIndicator({
    status = 'unknown',
    label,
    className,
}: StatusIndicatorProps): JSX.Element {
    const textLabel = label ?? STATUS_INDICATOR_DEFAULT_LABEL[status];
    const dotColor = STATUS_INDICATOR_DOT_COLOR[status];

    const dotClasses = [
        'status-indicator__dot',
        'status-dot',
        dotColor,
        status === 'online' && 'pulse',
    ]
        .filter(Boolean)
        .join(' ');

    const classes = ['status-indicator', className].filter(Boolean).join(' ');

    return (
        <span
            className={classes}
            data-status={status}
            role="status"
            aria-label={textLabel}
        >
            <span className={dotClasses} aria-hidden="true" />
            <span className="status-indicator__label">{textLabel}</span>
        </span>
    );
}
