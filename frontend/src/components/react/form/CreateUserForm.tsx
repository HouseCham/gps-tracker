import '@/styles/components/create-user-form.css';
//-- React
import { useId, useState } from 'react';
import type { ReactElement, SyntheticEvent } from 'react';
//-- Types
import type { CreateUserDto } from '@/types/api';
import type { CreateUserFormStrings } from '@/types/components';
//-- Constants
import { EMAIL_REGEX } from '@/constants';
//-- UI
import { Button, Input } from '@/components/ui';
//-- Utils
import { isApiError } from '@/lib/api';
/**
 * @interface CreateUserFormProps
 * @param {CreateUserFormStrings} strings - The strings to use in the form.
 * @param {Function} onSubmit - The function to call when the form is submitted.
 * @param {Function} onCancel - The function to call when the form is canceled.
 * @param {boolean} [saving=false] - Whether the form is currently submitting.
 */
export interface CreateUserFormProps {
    strings: CreateUserFormStrings;
    onSubmit: (data: CreateUserDto) => Promise<void> | void;
    onCancel: () => void;
    saving?: boolean;
}
/**
 * @function CreateUserForm
 * @param {CreateUserFormProps} props - The props for the component.
 * @returns {ReactElement} The rendered component.
 */
export function CreateUserForm({
    strings: s,
    onSubmit,
    onCancel,
    saving = false,
}: CreateUserFormProps): ReactElement {
    const emailId = useId();
    const nameId = useId();
    const lastnameId = useId();

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [errors, setErrors] = useState<{
        email?: string;
        role?: string;
    }>({});
    const [submitError, setSubmitError] = useState<string | undefined>();

    /**
     * Validates the form data.
     * @returns {boolean} Whether the form is valid.
     */
    function validate(): boolean {
        const next: { email?: string; role?: string } = {};
        if (!email.trim()) next.email = s.emailRequired;
        else if (!EMAIL_REGEX.test(email.trim())) next.email = s.emailInvalid;
        setErrors(next);
        return Object.keys(next).length === 0;
    }
    /**
     * Handles the form submission.
     * @param {SyntheticEvent<HTMLFormElement>} e - The event.
     */
    async function handleSubmit(
        e: SyntheticEvent<HTMLFormElement>
    ): Promise<void> {
        e.preventDefault();
        if (!validate()) return;
        setSubmitError(undefined);
        const dto: CreateUserDto = {
            email: email.trim(),
            role: 'user',
        };
        if (name.trim()) dto.name = name.trim();
        if (lastname.trim()) dto.lastname = lastname.trim();
        try {
            await onSubmit(dto);
        } catch (err) {
            const apiError = isApiError(err)
                ? err
                : { message: 'Create user failed' };
            setSubmitError(apiError.message);
        }
    }

    return (
        <form className="create-user-form" onSubmit={handleSubmit} noValidate>
            {submitError && (
                <p className="create-user-form__banner" role="alert">
                    {submitError}
                </p>
            )}

            <Input
                id={emailId}
                name="email"
                type="email"
                label={s.email}
                value={email}
                placeholder={s.emailPlaceholder}
                error={errors.email}
                disabled={saving}
                autocomplete="email"
                required
                onChange={e => {
                    setEmail(e.target.value);
                    setErrors(p => ({ ...p, email: undefined }));
                }}
            />

            <div className="create-user-form__grid">
                <Input
                    id={nameId}
                    name="name"
                    label={s.name}
                    value={name}
                    placeholder={s.namePlaceholder}
                    disabled={saving}
                    autocomplete="given-name"
                    onChange={e => setName(e.target.value)}
                />
                <Input
                    id={lastnameId}
                    name="lastname"
                    label={s.lastname}
                    value={lastname}
                    placeholder={s.lastnamePlaceholder}
                    disabled={saving}
                    autocomplete="family-name"
                    onChange={e => setLastname(e.target.value)}
                />
            </div>

            <div className="create-user-form__actions">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={saving}
                >
                    {s.cancel}
                </Button>
                <Button type="submit" variant="primary" loading={saving}>
                    {saving ? s.creating : s.create}
                </Button>
            </div>
        </form>
    );
}
