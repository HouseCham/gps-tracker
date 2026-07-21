import { useEffect, useState, type JSX } from 'react';
//-- Types
import type { DeviceAccessListItem } from '@/types/api';
import type { Translation } from '@/i18n';
//-- Components
import { Modal } from '@/components/react/ui';
import { Button } from '@/components/react/ui/button';
import { Field, Input } from '@/components/react/form/ui';
//-- Utils
import { interpolateTemplate } from '@/lib';
/**
 * Props for the RevokeAccessModal component
 * @interface RevokeAccessModalProps
 * @prop {DeviceAccessListItem | null} user - User to revoke access for.
 * @prop {() => void} onClose - Callback for closing the modal.
 * @prop {() => Promise<void>} onConfirm - Callback for confirming the revocation.
 * @prop {boolean} loading - Loading state.
 * @prop {Translation['device']['detail']['accessTable']} t - Translation strings.
 */
interface RevokeAccessModalProps {
    user: DeviceAccessListItem | null;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    loading: boolean;
    t: Translation['device']['detail']['accessTable'];
}
/**
 * Renders a modal for revoking access to a device.
 * @param {RevokeAccessModalProps} props - Props for the component.
 * @returns {JSX.Element | null} The rendered component.
 */
export function RevokeAccessModal({
    user,
    onClose,
    onConfirm,
    loading,
    t,
}: RevokeAccessModalProps): JSX.Element | null {
    const [confirmation, setConfirmation] = useState('');

    useEffect(() => {
        if (user) setConfirmation('');
    }, [user]);

    if (!user) return null;

    const canConfirm = confirmation.trim() === t.revokeConfirm.confirmPhrase;

    return (
        <Modal
            open={user !== null}
            onClose={onClose}
            title={t.revokeConfirm.title}
            subtitle={interpolateTemplate(t.revokeConfirm.warning, {
                name: user.name,
            })}
            size="sm"
            footer={
                <>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        {t.revokeConfirm.cancel}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        loading={loading}
                        disabled={!canConfirm}
                        onClick={() => void onConfirm()}
                    >
                        {loading
                            ? t.revokeConfirm.removing
                            : t.revokeConfirm.confirm}
                    </Button>
                </>
            }
        >
            <div className="dd-revoke-user">
                <span className="dd-avatar">
                    {user.name.slice(0, 2).toUpperCase()}
                </span>
                <span>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                </span>
            </div>
            <Field
                label={t.revokeConfirm.typeConfirmLabel}
                error={
                    !canConfirm && confirmation
                        ? t.revokeConfirm.mismatch
                        : undefined
                }
            >
                <Input
                    value={confirmation}
                    placeholder={t.revokeConfirm.typeConfirmPlaceholder}
                    invalid={!canConfirm && !!confirmation}
                    autoFocus
                    onChange={event => setConfirmation(event.target.value)}
                />
            </Field>
        </Modal>
    );
}
