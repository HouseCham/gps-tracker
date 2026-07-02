import '@/styles/components/create-user-form.css';
//-- React
import { useId, useState } from 'react';
import type { ReactElement, SyntheticEvent } from 'react';
//-- Types
import type { GrantAccessFormStrings } from '@/types/components';
//-- Constants
import { UUID_REGEX } from '@/constants';
//-- UI
import { Button, Input } from '@/components/ui';
//-- Utils
import { isApiError } from '@/lib/api';
/**
 * @interface GrantAccessFormProps
 * @param {GrantAccessFormStrings} strings - Localized strings for the form.
 * @param {Function} onSubmit - Called with the validated user_id on submit.
 * @param {Function} onCancel - Called when the user dismisses the form.
 * @param {boolean} [saving=false] - Whether the form is currently submitting.
 */
export interface GrantAccessFormProps {
    strings: GrantAccessFormStrings;
    onSubmit: (userId: string) => Promise<void> | void;
    onCancel: () => void;
    saving?: boolean;
}
/**
 * @function GrantAccessForm
 * @description Inline form for granting a user `viewer` access to a device.
 * The grant always lands on the `viewer` role on the backend, so the form
 * only asks for the target user's UUID.
 * @param {GrantAccessFormProps} props - The props for the component.
 * @returns {ReactElement} The rendered form.
 */
export function GrantAccessForm({
    strings: s,
    onSubmit,
    onCancel,
    saving = false,
}: GrantAccessFormProps): ReactElement {
    const userIdFieldId = useId();

    const [userId, setUserId] = useState('');
    const [error, setError] = useState<string | undefined>();
    const [submitError, setSubmitError] = useState<string | undefined>();

    /**
     * Validates the form data.
     * @returns {boolean} Whether the form is valid.
     */
    function validate(): boolean {
        const trimmed = userId.trim();
        if (!trimmed) {
            setError(s.userIdRequired);
            return false;
        }
        if (!UUID_REGEX.test(trimmed)) {
            setError(s.userIdInvalid);
            return false;
        }
        setError(undefined);
        return true;
    }

    /**
     * Handles the form submission.
     * @param {SyntheticEvent<HTMLFormElement>} e - The submit event.
     */
    async function handleSubmit(
        e: SyntheticEvent<HTMLFormElement>
    ): Promise<void> {
        e.preventDefault();
        if (!validate()) return;
        setSubmitError(undefined);
        try {
            await onSubmit(userId.trim());
        } catch (err) {
            const apiError = isApiError(err)
                ? err
                : { message: 'Grant access failed' };
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
                id={userIdFieldId}
                name="user_id"
                type="text"
                label={s.userId}
                value={userId}
                placeholder={s.userIdPlaceholder}
                error={error}
                disabled={saving}
                required
                onChange={e => {
                    setUserId(e.target.value);
                    setError(undefined);
                }}
            />

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
                    {saving ? s.granting : s.grant}
                </Button>
            </div>
        </form>
    );
}
