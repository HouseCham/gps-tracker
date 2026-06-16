
import '@/styles/components/signup-form.css';
//-- React
import { useId, useState } from 'react';
//-- Types
import type { ReactElement, SyntheticEvent } from 'react';
import type { SignupFormData, SignupFormStrings } from '@/types/components';
//-- Constants
import { EMAIL_REGEX } from '@/constants';
/**
 * @interface SignupFormProps
 * @param {Function} onSubmit - The function to call when the form is submitted.
 * @param {Function} onSwitchToLogin - The function to call when the user wants to switch to the login form.
 * @param {string} [error] - The error message to display.
 * @param {boolean} [loading] - Whether the form is loading.
 * @param {SignupFormStrings} [strings] - The strings to use in the form.
 */
export interface SignupFormProps {
    onSubmit: (data: SignupFormData) => void;
    onSwitchToLogin: () => void;
    error?: string;
    loading?: boolean;
    strings?: SignupFormStrings;
}
/**
 * @component SignupForm
 * @param {SignupFormProps} props - The props for the component.
 * @returns {ReactElement} The rendered component.
 */
export default function SignupForm({
    onSubmit,
    onSwitchToLogin,
    error,
    loading = false,
    strings,
}: SignupFormProps): ReactElement {
    const emailId = useId();
    const nameId = useId();
    const lastnameId = useId();
    const passId = useId();

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const s = {
        email: 'Email address',
        emailPlaceholder: 'you@example.com',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        name: 'Name',
        namePlaceholder: 'Your name',
        lastname: 'Last name',
        lastnamePlaceholder: 'Your last name',
        signingUp: 'Creating account...',
        signup: 'Sign up',
        haveAccount: 'Already have an account?',
        loginLink: 'Log in',
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email format',
        passwordRequired: 'Password is required',
        passwordMin: 'Password must be at least 8 characters',
        nameRequired: 'Name is required',
        signupTitle: 'Create an account',
        signupSubtitle: 'Start tracking your fleet in minutes',
        ...strings,
    };
    /**
     * Validates the form data.
     * @returns {boolean} Whether the form data is valid.
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
     * Handles the form submission.
     * @param {SyntheticEvent<HTMLFormElement>} e - The event
     * @returns {void}
     */
    function handleSubmit(e: SyntheticEvent<HTMLFormElement>): void {
        e.preventDefault();
        if (!validate()) return;
        onSubmit({ email: email.trim(), name: name.trim(), lastname: lastname.trim(), password });
    }
    /**
     * Clears the error for a specific field.
     * @param {string} field - The field to clear the error for.
     */
    function clearError(field: string): void {
        setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
    }

    return (
        <form className="signup-form" onSubmit={handleSubmit} noValidate>
            <div className="signup-form__head">
                <h1 className="signup-form__title">{s.signupTitle}</h1>
                <p className="signup-form__subtitle">{s.signupSubtitle}</p>
            </div>

            {error && <p className="signup-form__banner" role="alert">{error}</p>}

            <div className={`signup-form__row`}>
                <div className={`signup-form__field ${errors.name ? 'signup-form__field--error' : ''}`}>
                    <label className="signup-form__label" htmlFor={nameId}>{s.name}</label>
                    <input
                        id={nameId}
                        className="signup-form__input"
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); clearError('name'); }}
                        placeholder={s.namePlaceholder}
                        disabled={loading}
                        aria-invalid={!!errors.name}
                    />
                    {errors.name && <p className="signup-form__error" role="alert">{errors.name}</p>}
                </div>

                <div className={`signup-form__field ${errors.lastname ? 'signup-form__field--error' : ''}`}>
                    <label className="signup-form__label" htmlFor={lastnameId}>{s.lastname}</label>
                    <input
                        id={lastnameId}
                        className="signup-form__input"
                        type="text"
                        value={lastname}
                        onChange={(e) => { setLastname(e.target.value); clearError('lastname'); }}
                        placeholder={s.lastnamePlaceholder}
                        disabled={loading}
                    />
                </div>
            </div>

            <div className={`signup-form__field ${errors.email ? 'signup-form__field--error' : ''}`}>
                <label className="signup-form__label" htmlFor={emailId}>{s.email}</label>
                <input
                    id={emailId}
                    className="signup-form__input"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                    placeholder={s.emailPlaceholder}
                    disabled={loading}
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                />
                {errors.email && <p className="signup-form__error" role="alert">{errors.email}</p>}
            </div>

            <div className={`signup-form__field ${errors.password ? 'signup-form__field--error' : ''}`}>
                <label className="signup-form__label" htmlFor={passId}>{s.password}</label>
                <input
                    id={passId}
                    className="signup-form__input"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                    placeholder={s.passwordPlaceholder}
                    disabled={loading}
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                />
                {errors.password && <p className="signup-form__error" role="alert">{errors.password}</p>}
            </div>

            <button
                type="submit"
                className="signup-form__btn"
                disabled={loading}
            >
                {loading ? s.signingUp : s.signup}
            </button>

            <p className="signup-form__switch">
                {s.haveAccount}{' '}
                <button type="button" className="signup-form__link" onClick={onSwitchToLogin} disabled={loading}>
                    {s.loginLink}
                </button>
            </p>
        </form>
    );
}
