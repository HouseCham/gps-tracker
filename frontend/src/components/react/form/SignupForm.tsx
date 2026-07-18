import '@/styles/components/form/signup-form.css';

import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, JSX, ReactNode } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Info, Lock, Mail, User } from 'lucide-react';
//-- Types
import type { SignupFormStrings } from '@/types/components';

/**
 * Props for the SignupForm component.
 * @interface SignupFormProps
 * @prop {SignupFormStrings} strings - i18n strings.
 * @prop {boolean} [firstUser] - Renders the "first admin" badge when true.
 */
export interface SignupFormProps {
    strings: SignupFormStrings;
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
    help?: string | null;
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

function PasswordField({
    id,
    value,
    onChange,
    invalid,
    autoComplete,
    placeholder,
    required,
    showLabel,
    hideLabel,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    invalid?: boolean;
    autoComplete?: string;
    placeholder?: string;
    required?: boolean;
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
                required={required}
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

function strengthScore(pw: string): number {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^\w]/.test(pw)) s++;
    if (pw.length >= 12) s++;
    return Math.min(s, 4);
}

function PasswordStrength({
    value,
    strengthLabel,
    labels,
}: {
    value: string;
    strengthLabel: string;
    labels: [string, string, string, string, string];
}): JSX.Element {
    const lvl = useMemo(() => strengthScore(value), [value]);
    return (
        <div className="pw-strength" data-level={lvl} aria-live="polite">
            <div className="bars">
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
            </div>
            <div className="legend">
                <span className="mono">{strengthLabel}</span>
                <span className="label" data-active="true">
                    {labels[lvl]}
                </span>
            </div>
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
    extra,
    title,
    cookieNote,
}: {
    method: string;
    path: string;
    body?: Record<string, unknown>;
    extra?: ReactNode;
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
            {extra}
        </div>
    );
}

/**
 * SignupForm — name + email + password + confirm with strength meter and terms.
 * @param {SignupFormProps} props
 * @returns {JSX.Element}
 */
export function SignupForm({ strings, firstUser }: SignupFormProps): JSX.Element {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [terms, setTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const mismatch = !!pw2 && pw !== pw2;

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErr(null);
        if (!email || !pw) {
            setErr(strings.emailPasswordRequired);
            return;
        }
        if (mismatch) {
            setErr(strings.passwordsDoNotMatch);
            return;
        }
        if (!terms) {
            setErr(strings.acceptTerms);
            return;
        }
        if (strengthScore(pw) < 2) {
            setErr(strings.pickStrongerPassword);
            return;
        }
        // ponytail: submit handler is a stub — wire to auth service later.
        setLoading(true);
        window.setTimeout(() => {
            setLoading(false);
            setErr(strings.signupFailed);
        }, 900);
    };

    return (
        <>
            <div className="heading">
                {firstUser ? (
                    <span className="badge badge-accent">{strings.firstAdminWelcome}</span>
                ) : (
                    <span className="badge">{strings.createAccountBadge}</span>
                )}
                <h1>{strings.signupTitle}</h1>
                <div className="sub">{strings.signupSubtitle}</div>
            </div>

            {err && (
                <div className="alert alert-danger" role="alert">
                    <AlertCircle className="icon-16" />
                    <span>{err}</span>
                </div>
            )}

            <form onSubmit={submit} noValidate>
                <Field label={strings.name} htmlFor="su-name" help={strings.nameHelp}>
                    <div className="input-with-suffix">
                        <input
                            id="su-name"
                            className="input"
                            placeholder={strings.namePlaceholder}
                            autoComplete="name"
                            value={name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            style={{ paddingLeft: 38 }}
                        />
                        <User
                            className="icon-16"
                            style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--gp-text-faint)',
                                pointerEvents: 'none',
                            }}
                        />
                    </div>
                </Field>

                <Field label={strings.email} htmlFor="su-email" required>
                    <div className="input-with-suffix">
                        <input
                            id="su-email"
                            type="email"
                            className="input"
                            placeholder={strings.emailPlaceholder}
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            aria-invalid={!!err && !email ? 'true' : 'false'}
                            style={{ paddingLeft: 38 }}
                        />
                        <Mail
                            className="icon-16"
                            style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--gp-text-faint)',
                                pointerEvents: 'none',
                            }}
                        />
                    </div>
                </Field>

                <Field
                    label={strings.password}
                    htmlFor="su-pw"
                    required
                    help={pw ? null : strings.passwordHelp}
                >
                    <PasswordField
                        id="su-pw"
                        autoComplete="new-password"
                        placeholder={strings.passwordPlaceholder}
                        value={pw}
                        onChange={setPw}
                        required
                        showLabel={strings.showPassword}
                        hideLabel={strings.hidePassword}
                    />
                    <PasswordStrength
                        value={pw}
                        strengthLabel={strings.strengthLabel}
                        labels={[
                            strings.strengthTooShort,
                            strings.strengthWeak,
                            strings.strengthFair,
                            strings.strengthGood,
                            strings.strengthStrong,
                        ]}
                    />
                </Field>

                <Field
                    label={strings.confirmPassword}
                    htmlFor="su-pw2"
                    required
                    error={mismatch ? strings.passwordsDoNotMatch : null}
                >
                    <PasswordField
                        id="su-pw2"
                        autoComplete="new-password"
                        placeholder={strings.passwordPlaceholder}
                        value={pw2}
                        onChange={setPw2}
                        invalid={mismatch}
                        showLabel={strings.showPassword}
                        hideLabel={strings.hidePassword}
                    />
                </Field>

                <div className="check-row">
                    <label className="check" htmlFor="terms">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={terms}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setTerms(e.target.checked)}
                        />
                        <span>
                            {strings.termsAgree}{' '}
                            <a href="#" onClick={(e) => e.preventDefault()}>
                                {strings.termsLabel}
                            </a>{' '}
                            and{' '}
                            <a href="#" onClick={(e) => e.preventDefault()}>
                                {strings.privacyLabel}
                            </a>
                            .
                        </span>
                    </label>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner" />
                            {strings.creatingAccount}
                        </>
                    ) : (
                        <>
                            {strings.signup}
                            <ArrowRight className="icon-14" />
                        </>
                    )}
                </button>

                <OrDivider label={strings.orDivider} />

                <button
                    type="button"
                    className="btn btn-google btn-block"
                    onClick={() => {
                        window.location.assign('/api/auth/oauth2/authorize/google');
                    }}
                >
                    <GoogleLogo />
                    {strings.continueWithGoogle}
                </button>

                <div className="alt">
                    {strings.haveAccount}{' '}
                    <a href="#" onClick={(e) => e.preventDefault()}>
                        {strings.loginLink}
                    </a>
                </div>
            </form>

            <ApiInspector
                method="POST"
                path="/api/auth/email-password/sign-up"
                body={{
                    email: email || strings.emailPlaceholder,
                    password: pw ? '••••••••' : '…',
                }}
                title={strings.apiInspectorTitle}
                cookieNote={strings.apiInspectorCookieNote}
                extra={
                    <div className="note">
                        <Info className="icon-14" />
                        {strings.autoSignInNote}
                    </div>
                }
            />
        </>
    );
}
