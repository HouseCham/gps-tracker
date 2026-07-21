import '@/styles/components/form/login-form.css';

import { useState } from 'react';
import type { ChangeEvent, JSX } from 'react';
import { AlertCircle, ArrowRight, Mail } from 'lucide-react';
//-- API
import { isApiError } from '@/lib/api/api-utils';
//-- Services
import { authService } from '@/lib/auth/service';
//-- Components
import { Alert } from '@/components/react/ui/Alert';
import { Badge } from '@/components/react/ui/Badge';
import { Button } from '@/components/react/ui/button';
import { Checkbox, Field, Input } from '@/components/react/form/ui';
import {
    ApiInspector,
    GoogleLogo,
    OrDivider,
    PasswordField,
} from '@/components/react/form/shared';
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

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
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
        } catch (error) {
            const apiError = isApiError(error)
                ? error
                : { status: 0, message: strings.loginFailed };
            setErr(apiError.message);
            setLoading(false);
        }
    }

    return (
        <>
            <div className="heading">
                {firstUser ? (
                    <Badge tone="accent">{strings.firstAdminBadge}</Badge>
                ) : null}
                <h1>{strings.loginTitle}</h1>
                <div className="sub">{strings.loginSubtitle}</div>
            </div>

            {err && (
                <Alert
                    tone="danger"
                    title={err}
                    icon={<AlertCircle size={14} aria-hidden="true" />}
                />
            )}

            <form onSubmit={handleSubmit} noValidate>
                <Field label={strings.email} htmlFor="login-email" required>
                    <div className="input-with-prefix">
                        <Input
                            id="login-email"
                            type="email"
                            placeholder={strings.emailPlaceholder}
                            autoComplete="email"
                            value={email}
                            invalid={!!err && !email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setEmail(e.target.value)
                            }
                            aria-label={strings.email}
                        />
                        <Mail className="icon-16 prefix" />
                    </div>
                </Field>

                <Field
                    label={strings.password}
                    htmlFor="login-password"
                    required
                >
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

                <div className="form-action-row">
                    <Checkbox
                        id="remember"
                        label={strings.rememberDevice}
                        checked={remember}
                        onChange={setRemember}
                    />
                    <a href="#" className="mono forgot-link">
                        {strings.forgotPassword}
                    </a>
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    iconRight={
                        loading ? undefined : (
                            <ArrowRight size={14} strokeWidth={1.6} />
                        )
                    }
                    className="btn-block"
                >
                    {loading ? strings.loggingIn : strings.login}
                </Button>

                <OrDivider label={strings.orContinueWith} />

                <button
                    type="button"
                    className="btn btn-google btn-block"
                    onClick={() => {
                        window.location.assign(
                            '/api/auth/oauth2/authorize/google'
                        );
                    }}
                >
                    <GoogleLogo />
                    {strings.signInWithGoogle}
                </button>

                <div className="alt">
                    {strings.noAccount}{' '}
                    <a href="#" onClick={e => e.preventDefault()}>
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