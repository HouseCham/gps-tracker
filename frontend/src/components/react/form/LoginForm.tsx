import '@/styles/components/form/login-form.css';

import { useState } from 'react';
import type { ChangeEvent, FormEvent, JSX, ReactNode } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react';
//-- API
import { isApiError } from '@/lib/api/api-utils';
//-- Services
import { authService } from '@/lib/auth/service';
//-- Types
import type { LoginFormStrings } from '@/types/components';

/**
 * Props for the LoginForm component.
 * @interface LoginFormProps
 * @prop {LoginFormStrings} strings - i18n strings.
 * @prop {boolean} [firstUser] - Renders the "first admin" badge when true.
 */
export interface LoginFormProps {
    strings: LoginFormStrings;
    firstUser?: boolean;
}

// ponytail: local helpers keep the form self-contained and avoid class collisions
// between main-layout.css (.field/.input) and the global ui tokens.

function Field({
    label,
    htmlFor,
    required,
    help,
    error,
    children,
}: {
    label?: string;
    htmlFor?: string;
    required?: boolean;
    help?: string;
    error?: string | null;
    children: ReactNode;
}): JSX.Element {
    return (
        <div className="field">
            {label && (
                <label className="field-label" htmlFor={htmlFor}>
                    {label}
                    {required && (
                        <span className="req" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>
            )}
            {children}
            {error ? (
                <span className="field-error" role="alert">
                    <AlertCircle className="icon-14" />
                    {error}
                </span>
            ) : help ? (
                <span className="field-help">{help}</span>
            ) : null}
        </div>
    );
}

function GoogleLogo(): JSX.Element {
    return (
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13 4.5 4.5 13 4.5 24S13 43.5 24 43.5c11 0 19.5-8.5 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"
            />
            <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.3 4.5 9.7 9.1 6.3 14.7z"
            />
            <path
                fill="#4CAF50"
                d="M24 43.5c5 0 9.5-1.9 12.8-5l-5.9-5c-2 1.4-4.5 2.2-6.9 2.2-5.3 0-9.7-3.5-11.3-8.4l-6.5 5C9.5 38.9 16.2 43.5 24 43.5z"
            />
            <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l5.9 5c-.4.4 6.4-4.7 6.4-14.5 0-1.2-.1-2.3-.4-3.5z"
            />
        </svg>
    );
}

function OrDivider({ label }: { label: string }): JSX.Element {
    return (
        <div className="or-divider" role="separator">
            <span>{label}</span>
        </div>
    );
}

function ApiInspector({
    method,
    path,
    body,
    title,
    cookieNote,
}: {
    method: string;
    path: string;
    body?: Record<string, unknown>;
    title: string;
    cookieNote: string;
}): JSX.Element {
    return (
        <div className="api-inspector">
            <div className="head">
                <span className="pulse" />
                {title}
            </div>
            <div className="row">
                <span className="k">method</span>
                <span className="v">
                    <span className="method">{method}</span>
                </span>
            </div>
            <div className="row">
                <span className="k">path</span>
                <span className="v mono">{path}</span>
            </div>
            {body && (
                <div className="row">
                    <span className="k">body</span>
                    <span className="v">
                        <pre>{JSON.stringify(body, null, 2)}</pre>
                    </span>
                </div>
            )}
            <div className="row">
                <span className="k">creds</span>
                <span className="v mono">credentials: 'include'</span>
            </div>
            <div className="note">
                <Lock className="icon-14" />
                {cookieNote}
            </div>
        </div>
    );
}

function PasswordField({
    id,
    value,
    onChange,
    invalid,
    autoComplete,
    placeholder,
    showLabel,
    hideLabel,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    invalid?: boolean;
    autoComplete?: string;
    placeholder?: string;
    showLabel: string;
    hideLabel: string;
}): JSX.Element {
    const [show, setShow] = useState(false);
    return (
        <div className="input-with-suffix">
            <input
                id={id}
                type={show ? 'text' : 'password'}
                className="input"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={invalid ? 'true' : 'false'}
                autoComplete={autoComplete}
            />
            <button
                type="button"
                className="suffix"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? hideLabel : showLabel}
                aria-pressed={show}
            >
                {show ? <EyeOff className="icon-16" /> : <Eye className="icon-16" />}
            </button>
        </div>
    );
}

// ponytail: useState was moved to the top import group.

/**
 * LoginForm — email + password sign-in with remember me and Google OAuth.
 * @param {LoginFormProps} props
 * @returns {JSX.Element}
 */
export function LoginForm({ strings, firstUser }: LoginFormProps): JSX.Element {
    const [email, setEmail] = useState(firstUser ? 'admin@open-gps.local' : '');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    /**
     * Handle form submission.
     * @param {FormEvent<HTMLFormElement>} e
     * @returns {Promise<void>}
     */
    async function handleSubmit(
        e: FormEvent<HTMLFormElement>
    ): Promise<void> {
        e.preventDefault();
        setErr(null);
        if (!email || !password) {
            setErr(strings.emailPasswordRequired);
            return;
        }
        setLoading(true);
        try {
            await authService.signIn({ email: email.trim(), password });
        } catch (err) {
            const apiError = isApiError(err)
                ? err
                : { status: 0, message: strings.loginFailed };
            setErr(apiError.message);
            setLoading(false);
        }
    }

    return (
        <>
            <div className="heading">
                {firstUser ? (
                    <span className="badge badge-accent">
                        {strings.firstAdminBadge}
                    </span>
                ) : null}
                <h1>{strings.loginTitle}</h1>
                <div className="sub">{strings.loginSubtitle}</div>
            </div>

            {err && (
                <div className="alert alert-danger" role="alert">
                    <AlertCircle className="icon-16" />
                    <span>{err}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
                <Field label={strings.email} htmlFor="login-email" required>
                    <div className="input-with-prefix">
                        <input
                            id="login-email"
                            type="email"
                            className="input"
                            placeholder={strings.emailPlaceholder}
                            autoComplete="email"
                            value={email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            aria-invalid={!!err && !email ? 'true' : 'false'}
                            aria-label={strings.email}
                        />
                        <Mail className="icon-16 prefix" />
                    </div>
                </Field>

                <Field label={strings.password} htmlFor="login-password" required>
                    <PasswordField
                        id="login-password"
                        autoComplete="current-password"
                        placeholder={strings.passwordPlaceholder}
                        value={password}
                        onChange={setPassword}
                        invalid={!!err && !password}
                        showLabel={strings.showPassword}
                        hideLabel={strings.hidePassword}
                    />
                </Field>

                <div className="check-row">
                    <label className="check" htmlFor="remember">
                        <input
                            id="remember"
                            type="checkbox"
                            checked={remember}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setRemember(e.target.checked)
                            }
                        />
                        <span>{strings.rememberDevice}</span>
                    </label>
                    <a href="#" className="mono forgot-link">
                        {strings.forgotPassword}
                    </a>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner" />
                            {strings.loggingIn}
                        </>
                    ) : (
                        <>
                            {strings.login}
                            <ArrowRight className="icon-14" />
                        </>
                    )}
                </button>

                <OrDivider label={strings.orContinueWith} />

                <button
                    type="button"
                    className="btn btn-google btn-block"
                    onClick={() => {
                        window.location.assign('/api/auth/oauth2/authorize/google');
                    }}
                >
                    <GoogleLogo />
                    {strings.signInWithGoogle}
                </button>

                <div className="alt">
                    {strings.noAccount}{' '}
                    <a href="#" onClick={(e) => e.preventDefault()}>
                        {strings.createOne}
                    </a>
                </div>
            </form>

            <ApiInspector
                method="POST"
                path="/api/auth/email-password/sign-in"
                body={{
                    email: email || strings.emailPlaceholder,
                    password: password ? '••••••••' : '…',
                }}
                title={strings.apiInspectorTitle}
                cookieNote={strings.apiInspectorCookieNote}
            />
        </>
    );
}
