import '@/styles/components/signup-form.css';
//-- React
import { useState, type ReactElement, type SyntheticEvent } from 'react';
//-- Types
import type { SignupFormStrings } from '@/types/components';
//-- Auth
import { authService } from '@/lib/auth/service';
//-- Constants
import { EMAIL_REGEX } from '@/constants';
//-- UI
import { Button, Input } from '@/components/ui';
import { isApiError } from '@/lib/api';
/**
 * @interface SignupFormProps
 * @param {SignupFormStrings} strings - The strings to use in the form.
 * @param {string} [error] - The error message to display.
 * @param {boolean} [loading=false] - Whether the form is loading.
 */
export interface SignupFormProps {
    strings: SignupFormStrings;
    error?: string;
    loading?: boolean;
}
/**
 * The signup form component.
 * @param {SignupFormProps} props - The props for the component.
 * @returns {ReactElement} The rendered component.
 */
export function SignupForm({ strings: s }: SignupFormProps): ReactElement {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [authError, setAuthError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    /**
     * Validates the form data.
     * @returns {boolean} Whether the form is valid.
     */
    function validate(): boolean {
        const next: Record<string, string> = {};
        if (!email.trim()) next.email = s.emailRequired;
        else if (!EMAIL_REGEX.test(email.trim())) next.email = s.emailInvalid;
        if (!name.trim()) next.name = s.nameRequired;
        if (!password) next.password = s.passwordRequired;
        else if (password.length < 8) next.password = s.passwordMin;
        setErrors(next);
        return Object.keys(next).length === 0;
    }
    /**
     * Handles the form submission by calling authService.signUp().
     * On success the service triggers a full-page redirect; on
     * failure the API error message is shown to the user.
     * @param {SyntheticEvent<HTMLFormElement>} e - The event.
     * @returns {Promise<void>}
     */
    async function handleSubmit(
        e: SyntheticEvent<HTMLFormElement>
    ): Promise<void> {
        e.preventDefault();
        if (!validate()) return;
        setAuthError(undefined);
        setLoading(true);
        try {
            await authService.signUp({
                email: email.trim(),
                name: name.trim(),
                password,
            });
        } catch (err) {
            const apiError = isApiError(err)
                ? err
                : { message: 'Sign-up failed' };
            setAuthError(apiError.message);
            setLoading(false);
        }
    }
    /**
     * Clears the error for a specific field.
     * @param {string} field - The field to clear the error for.
     * @returns {void}
     */
    function clearError(field: string): void {
        setErrors(p => {
            const n = { ...p };
            delete n[field];
            return n;
        });
    }

    return (
        <form className="signup-form" onSubmit={handleSubmit} noValidate>
            <div className="signup-form__head">
                <h1 className="signup-form__title">{s.signupTitle}</h1>
                <p className="signup-form__subtitle">{s.signupSubtitle}</p>
            </div>

            {authError && (
                <p className="signup-form__banner" role="alert">
                    {authError}
                </p>
            )}

            <div className="signup-form__field">
                <Input
                    name="name"
                    label={s.name}
                    value={name}
                    placeholder={s.namePlaceholder}
                    error={errors.name}
                    disabled={loading}
                    required
                    autocomplete="name"
                    onChange={e => {
                        setName(e.target.value);
                        clearError('name');
                    }}
                />
            </div>

            <div className="signup-form__field">
                <Input
                    name="email"
                    type="email"
                    label={s.email}
                    value={email}
                    placeholder={s.emailPlaceholder}
                    error={errors.email}
                    disabled={loading}
                    required
                    autocomplete="email"
                    onChange={e => {
                        setEmail(e.target.value);
                        clearError('email');
                    }}
                />
            </div>

            <div className="signup-form__field">
                <Input
                    name="password"
                    type="password"
                    label={s.password}
                    value={password}
                    placeholder={s.passwordPlaceholder}
                    error={errors.password}
                    disabled={loading}
                    required
                    autocomplete="new-password"
                    onChange={e => {
                        setPassword(e.target.value);
                        clearError('password');
                    }}
                />
            </div>

            <Button type="submit" variant="primary" block loading={loading}>
                {loading ? s.signingUp : s.signup}
            </Button>
        </form>
    );
}
