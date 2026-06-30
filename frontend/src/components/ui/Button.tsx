import type { ButtonSize, ButtonVariant } from '@/types/components/ui';
import type { JSX, ReactNode } from 'react';
/**
 * @interface ButtonProps
 * @param {ButtonVariant} [variant='primary'] - The variant of the button.
 * @param {ButtonSize} [size='md'] - The size of the button.
 * @param {boolean} [disabled=false] - Whether the button is disabled.
 * @param {boolean} [loading=false] - Whether the button is loading.
 * @param {string} [type='button'] - The type of the button.
 * @param {boolean} [block=false] - Whether the button is block.
 * @param {string} [id] - The id of the button.
 * @param {string} [name] - The name of the button.
 * @param {string} [value] - The value of the button.
 * @param {string} [aria-label] - The aria-label of the button.
 * @param {string} [className] - The class of the button.
 * @param {ReactNode} [children] - The children of the button.
 * @param {React.MouseEventHandler<HTMLButtonElement>} [onClick] - The onClick of the button.
 */
interface ButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
    block?: boolean;
    id?: string;
    name?: string;
    value?: string;
    'aria-label'?: string;
    className?: string;
    children?: ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}
/**
 * Button component.
 * @param {ButtonProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function Button({
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    block = false,
    id,
    name,
    value,
    className: className,
    'aria-label': ariaLabel,
    children,
    onClick,
}: ButtonProps): JSX.Element {
    const classes = [
        'btn',
        `btn-${variant}`,
        size === 'sm' && 'btn-sm',
        size === 'lg' && 'btn-lg',
        block && 'btn-block',
        loading && 'loading',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            id={id}
            name={name}
            value={value}
            type={type}
            className={classes}
            disabled={disabled || loading || undefined}
            aria-busy={loading || undefined}
            aria-label={ariaLabel}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
