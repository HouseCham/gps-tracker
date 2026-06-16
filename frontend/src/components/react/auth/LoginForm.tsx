import '@/styles/components/login-form.css';
//-- React
import { useId, useState } from 'react';
//-- Types
import type { ReactElement, SyntheticEvent } from 'react';
import type { LoginFormData, LoginFormStrings } from '@/types/components';
import { EMAIL_REGEX } from '@/constants';
/**
 * @interface LoginFormProps
 * @param {Function} onSubmit - The function to call when the form is submitted.
 * @param {Function} onSwitchToSignup - The function to call when the user wants to switch to the signup form.
 * @param {string} [error] - The error message to display.
 * @param {boolean} [loading] - Whether the form is loading.
 * @param {LoginFormStrings} [strings] - The strings to use in the form.
 */
interface LoginFormProps {
    onSubmit: (data: LoginFormData) => void;
    onSwitchToSignup: () => void;
    error?: string;
    loading?: boolean;
    strings?: LoginFormStrings;
}
/**
 * @component LoginForm
 * @param {LoginFormProps} props - The props for the component.
 * @returns {ReactElement} The rendered component.
 */
export default function LoginForm({
    onSubmit,
    onSwitchToSignup,
    error,
    loading = false,
    strings,
}: LoginFormProps): ReactElement {
    const emailId = useId();
    const passId = useId();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const s = {
        email: 'Email address',
        emailPlaceholder: 'you@example.com',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        loggingIn: 'Logging in...',
        login: 'Log in',
        noAccount: "Don't have an account?",
        signupLink: 'Sign up',
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email format',
        passwordRequired: 'Password is required',
        loginTitle: 'Welcome back',
        loginSubtitle: 'Sign in to your GPS Tracker account',
        ...strings,
    };
    
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
     * Handles the form submission.
     * @param {SyntheticEvent<HTMLFormElement>} e - The event
     * @returns {void}
     */
    function handleSubmit(e: SyntheticEvent<HTMLFormElement>): void {
        e.preventDefault();
        if (!validate()) return;
        onSubmit({ email: email.trim(), password });
    }

    return (
        <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-form__head">
                <h1 className="login-form__title">{s.loginTitle}</h1>
                <p className="login-form__subtitle">{s.loginSubtitle}</p>
            </div>

            {error && <p className="login-form__banner" role="alert">{error}</p>}

            <div className={`login-form__field ${errors.email ? 'login-form__field--error' : ''}`}>
                <label className="login-form__label" htmlFor={emailId}>{s.email}</label>
                <input
                    id={emailId}
                    className="login-form__input"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                    placeholder={s.emailPlaceholder}
                    disabled={loading}
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? `${emailId}-err` : undefined}
                />
                {errors.email && <p id={`${emailId}-err`} className="login-form__error" role="alert">{errors.email}</p>}
            </div>

            <div className={`login-form__field ${errors.password ? 'login-form__field--error' : ''}`}>
                <label className="login-form__label" htmlFor={passId}>{s.password}</label>
                <input
                    id={passId}
                    className="login-form__input"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    placeholder={s.passwordPlaceholder}
                    disabled={loading}
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? `${passId}-err` : undefined}
                />
                {errors.password && <p id={`${passId}-err`} className="login-form__error" role="alert">{errors.password}</p>}
            </div>

            <button
                type="submit"
                className="login-form__btn"
                disabled={loading}
            >
                {loading ? s.loggingIn : s.login}
            </button>

            <p className="login-form__switch">
                {s.noAccount}{' '}
                <button type="button" className="login-form__link" onClick={onSwitchToSignup} disabled={loading}>
                    {s.signupLink}
                </button>
            </p>
        </form>
    );
}
