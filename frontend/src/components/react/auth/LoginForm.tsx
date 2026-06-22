import '@/styles/components/login-form.css';
//-- React
import { useState } from 'react';
//-- Types
import type { ReactElement, SyntheticEvent } from 'react';
import type { LoginFormStrings } from '@/types/components';
import type { ApiError } from '@/lib/api/helpers/handle-api-error';
//-- Auth
import { authService } from '@/lib/auth/service';
//-- Constants
import { EMAIL_REGEX } from '@/constants';
//-- UI
import { Button, Input } from '@/components/ui';
/**
 * @interface LoginFormProps
 * @param {Function} onSwitchToSignup - The function to call when the user wants to switch to the signup form.
 * @param {LoginFormStrings} [strings] - The strings to use in the form.
 */
interface LoginFormProps {
    strings?: LoginFormStrings;
}
/**
 * @component LoginForm
 * @param {LoginFormProps} props - The props for the component.
 * @returns {ReactElement} The rendered component.
 */
export default function LoginForm({
    strings,
}: LoginFormProps): ReactElement {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>(
        {}
    );
    const [authError, setAuthError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const s = strings ?? ({} as LoginFormStrings);

    /**
     * Validates the form data.
     * @returns {boolean} Whether the form is valid.
     */
    function validate(): boolean {
        const next: { email?: string; password?: string } = {};
        if (!email.trim()) next.email = s.emailRequired;
        else if (!EMAIL_REGEX.test(email.trim())) next.email = s.emailInvalid;
        if (!password) next.password = s.passwordRequired;
        setErrors(next);
        return Object.keys(next).length === 0;
    }
    /**
     * Handles the form submission by calling authService.signIn().
     * On success the service triggers a full-page redirect; on failure
     * the API error message is shown to the user.
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
            await authService.signIn({ email: email.trim(), password });
        } catch (err) {
            const apiError = err as Partial<ApiError>;
            setAuthError(apiError?.message ?? 'Sign-in failed');
            setLoading(false);
        }
    }

    return (
        <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-form__head">
                <h1 className="login-form__title">{s.loginTitle}</h1>
                <p className="login-form__subtitle">{s.loginSubtitle}</p>
            </div>

            {authError && (
                <p className="login-form__banner" role="alert">
                    {authError}
                </p>
            )}

            <Input
                type="email"
                label={s.email}
                value={email}
                onChange={e => {
                    setEmail(e.target.value);
                    setErrors(p => ({ ...p, email: undefined }));
                }}
                placeholder={s.emailPlaceholder}
                disabled={loading}
                autocomplete="email"
                error={errors.email}
                required
            />

            <Input
                type="password"
                label={s.password}
                value={password}
                onChange={e => {
                    setPassword(e.target.value);
                    setErrors(p => ({ ...p, password: undefined }));
                }}
                placeholder={s.passwordPlaceholder}
                disabled={loading}
                autocomplete="current-password"
                error={errors.password}
                required
            />

            <Button
                type="submit"
                className="login-form__btn"
                disabled={loading}
            >
                {loading ? s.loggingIn : s.login}
            </Button>
        </form>
    );
}