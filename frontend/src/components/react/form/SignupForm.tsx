import '@/styles/components/form/signup-form.css';

import { useMemo, useState } from 'react';
import type { ChangeEvent, JSX } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Info, Lock, Mail, User } from 'lucide-react';
//-- Components
import { Alert } from '@/components/react/ui/Alert';
import { Badge } from '@/components/react/ui/Badge';
import { Button } from '@/components/react/ui/Button';
import { Checkbox, Field, Input } from '@/components/react/form/ui';
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
            <Input
                id={id}
                type={show ? 'text' : 'password'}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                invalid={invalid}
                autoComplete={autoComplete}
                required={required}
            />
            <button
                type="button"
                className="suffix"
                onClick={() => setShow(s => !s)}
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
    extra?: React.ReactNode;
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

    function submit(e: React.FormEvent<HTMLFormElement>): void {
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
        setLoading(true);
        window.setTimeout(() => {
            setLoading(false);
            setErr(strings.signupFailed);
        }, 900);
    }

    return (
        <>
            <div className="heading">
                {firstUser ? (
                    <Badge tone="accent">{strings.firstAdminWelcome}</Badge>
                ) : (
                    <Badge>{strings.createAccountBadge}</Badge>
                )}
                <h1>{strings.signupTitle}</h1>
                <div className="sub">{strings.signupSubtitle}</div>
            </div>

            {err && (
                <Alert
                    tone="danger"
                    title={err}
                    icon={<AlertCircle size={14} aria-hidden="true" />}
                />
            )}

            <form onSubmit={submit} noValidate>
                <Field label={strings.name} htmlFor="su-name" help={strings.nameHelp}>
                    <div className="input-with-prefix">
                        <Input
                            id="su-name"
                            placeholder={strings.namePlaceholder}
                            autoComplete="name"
                            value={name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        />
                        <User className="icon-16 prefix" />
                    </div>
                </Field>

                <Field label={strings.email} htmlFor="su-email" required>
                    <div className="input-with-prefix">
                        <Input
                            id="su-email"
                            type="email"
                            placeholder={strings.emailPlaceholder}
                            autoComplete="email"
                            required
                            value={email}
                            invalid={!!err && !email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        />
                        <Mail className="icon-16 prefix" />
                    </div>
                </Field>

                <Field
                    label={strings.password}
                    htmlFor="su-pw"
                    required
                    help={pw ? undefined : strings.passwordHelp}
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
                    error={mismatch ? strings.passwordsDoNotMatch : undefined}
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

                <div className="form-check-row">
                    <Checkbox
                        id="terms"
                        checked={terms}
                        onChange={setTerms}
                        label={
                            <>
                                {strings.termsAgree}{' '}
                                <a href="#" onClick={e => e.preventDefault()}>
                                    {strings.termsLabel}
                                </a>{' '}
                                and{' '}
                                <a href="#" onClick={e => e.preventDefault()}>
                                    {strings.privacyLabel}
                                </a>
                                .
                            </>
                        }
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    iconRight={loading ? undefined : <ArrowRight size={14} strokeWidth={1.6} />}
                    className="btn-block"
                >
                    {loading ? strings.creatingAccount : strings.signup}
                </Button>

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
                    <a href="#" onClick={e => e.preventDefault()}>
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