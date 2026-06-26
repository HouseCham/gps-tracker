import type { BadgeVariant, BadgeSize } from '@/types/components/ui';
import type { ReactNode } from 'react';

/**
 * @interface BadgeProps
 * @property {BadgeVariant} [variant='default'] - Badge variant.
 * @property {BadgeSize} [size='md'] - Badge size.
 * @property {string} [label] - Badge label (displayed as text).
 * @property {ReactNode} [children] - Alternative to label; rendered as child of the span.
 * @property {string} [className] - Extra classes appended to the class list.
 */
interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    label?: string;
    children?: ReactNode;
    className?: string;
}
/**
 * @constant VARIANT_CLASS
 * @description Class names for each badge variant 
 */
const VARIANT_CLASS: Record<BadgeVariant, string> = {
    default: '',
    success: 'green',
    warning: 'amber',
    danger: 'red',
    info: '',
    accent: 'indigo',
};
/**
 * @function Badge
 * @description Badge component.
 * @returns {React.JSX.Element} - Badge component.
 */
export function Badge({
    variant = 'default',
    size = 'md',
    label,
    children,
    className,
}: BadgeProps): React.JSX.Element {
    const classes = [
        'badge',
        'chip',
        variant !== 'default' && VARIANT_CLASS[variant],
        size === 'sm' && 'badge--sm',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return <span className={classes}>{label ?? children}</span>;
}