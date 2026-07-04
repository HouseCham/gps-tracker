import '@/styles/components/ui.css';
import type { JSX } from 'react/jsx-runtime';
/**
 * Interface for SignalIndicator component
 * @interface SignalIndicatorProps
 * @param {number} strength - The strength of the signal.
 * @param {string} [className] - Extra class appended to the class list.
 */
interface SignalIndicatorProps {
    strength: number;
    className?: string;
}
/**
 * Signal indicator component
 * @function SignalIndicator
 * @param {SignalIndicatorProps} props - The props for the SignalIndicator component.
 * @returns {JSX.Element} The rendered component
 */
export function SignalIndicator({
    strength,
    className,
}: SignalIndicatorProps): JSX.Element {
    const clamped = Math.max(0, Math.min(5, Math.round(strength)));
    const ariaLabel = `Signal strength ${clamped} of 5`;
    const classes = ['signal', 'signal-indicator', className]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={classes}
            role="meter"
            aria-label={ariaLabel}
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={5}
        >
            {Array.from({ length: 5 }).map((_, i) => (
                <span
                    key={i}
                    className={['signal-bar', i < clamped && 'active']
                        .filter(Boolean)
                        .join(' ')}
                    aria-hidden="true"
                />
            ))}
        </div>
    );
}
