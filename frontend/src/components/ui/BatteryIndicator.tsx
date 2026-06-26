import type { JSX } from 'react/jsx-runtime';
import '@/styles/components/ui.css';
/**
 * Interface for BatteryIndicator component
 * @interface BatteryIndicatorProps
 * @param {number} level - The level of the battery.
 * @param {boolean} [showIcon] - Whether to show the battery icon.
 * @param {string} [className] - Extra class appended to the class list.
 */
interface BatteryIndicatorProps {
    level: number;
    showIcon?: boolean;
    className?: string;
}
/**
 * BatteryIndicator component
 * @function BatteryIndicator
 * @param {BatteryIndicatorProps} props - The props for the BatteryIndicator component.
 * @returns {JSX.Element} The rendered component
 */
export function BatteryIndicator({
    level,
    showIcon = false,
    className,
}: BatteryIndicatorProps): JSX.Element {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    const colorClass =
        clamped === 0
            ? 'red battery-bar--empty'
            : clamped < 20
              ? 'red'
              : clamped <= 50
                ? 'amber'
                : 'green';
    const ariaLabel = `Battery level ${clamped}%`;
    const classes = ['battery', 'battery-indicator', className]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={classes}
            role="meter"
            aria-label={ariaLabel}
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div className="battery-bar" aria-hidden="true">
                <div className={colorClass} style={{ width: `${clamped}%` }} />
            </div>
            <span className="battery-text">{clamped}%</span>
            {showIcon && <span className="battery-indicator__label">Battery</span>}
        </div>
    );
}
