import { useState, type JSX } from 'react';
import { Eye, Search } from 'lucide-react';
import type { InputType } from '@/types/components/ui';
/**
 * @interface InputProps
 * @param {InputType} [type='text'] - The type of the input.
 * @param {string} [label] - The label of the input.
 * @param {string} [name] - The name of the input.
 * @param {string} [id] - The id of the input.
 * @param {string} [value] - The value of the input.
 * @param {string} [placeholder] - The placeholder of the input.
 * @param {string} [hint] - The hint of the input.
 * @param {string} [error] - The error of the input.
 * @param {boolean} [disabled=false] - Whether the input is disabled.
 * @param {boolean} [required=false] - Whether the input is required.
 * @param {string} [autocomplete] - The autocomplete of the input.
 * @param {string} [class] - The class of the input.
 * @param {function} [onChange] - The onChange of the input.
 */
interface InputProps {
    type?: InputType;
    label?: string;
    name?: string;
    id?: string;
    value?: string;
    placeholder?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    autocomplete?: string;
    class?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
}
/**
 * Input component.
 * @param {InputProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function Input({
    type = 'text',
    label,
    name,
    id,
    value,
    placeholder,
    hint,
    error,
    disabled = false,
    required = false,
    autocomplete,
    class: className,
    onChange,
}: InputProps): JSX.Element {
    const [showPassword, setShowPassword] = useState(false);

    const inputId = id ?? (name ? `input-${name}` : undefined);
    const describedBy = [hint && 'hint', error && 'error'].filter(Boolean).join(' ') || undefined;
    const inputClasses = [
        'input',
        type === 'search' && 'with-icon',
        error && 'input-error-state',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const isPassword = type === 'password';
    const isSearch = type === 'search';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="input-group">
            {label && (
                <label className="input-label" htmlFor={inputId}>
                    {label}
                    {required && (
                        <span className="input-required" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>
            )}

            <div className="input-wrap">
                {isSearch && (
                    <span className="input-icon" aria-hidden="true">
                        <Search size={16} strokeWidth={1.75} />
                    </span>
                )}

                <input
                    id={inputId}
                    name={name}
                    type={inputType}
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    autoComplete={autocomplete}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={describedBy}
                    className={inputClasses}
                    data-password={isPassword || undefined}
                    onChange={onChange}
                />

                {isPassword && (
                    <span className="input-suffix">
                        <button
                            type="button"
                            className="input-eye"
                            aria-label="Toggle password visibility"
                            data-password-toggle
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <Eye size={16} strokeWidth={1.75} />
                        </button>
                    </span>
                )}
            </div>

            {hint && !error && (
                <p id="hint" className="input-hint">
                    {hint}
                </p>
            )}
            {error && (
                <p id="error" className="input-error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}