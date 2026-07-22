import { useState } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type { User } from '@/types/api';
import type { Translation } from '@/i18n';
//-- Utils
import { copyToClipboard } from '@/lib';
import { interpolateTemplate } from '@/lib';
//-- Components
import { Modal } from '@/components/react/ui';
import { Button } from '@/components/react/ui/button';
//-- Icons
import { AlertTriangle, Check, Copy } from 'lucide-react';

/**
 * Local extension of {@link User} that recognises the optional
 * `_temporary_password` field the mock data carried. Real backends do
 * not return it (the password is emailed) so it's optional everywhere.
 */
type CreatedUser = User & { _temporary_password?: string };

/**
 * Props for the TempPasswordModal component.
 * @interface TempPasswordModalProps
 * @prop {User | null} user - The just-created user, or null when the modal is closed.
 * @prop {() => void} onClose - Callback for closing the modal.
 * @prop {Translation['user']['tempPassword']} t - Translation strings.
 */
interface TempPasswordModalProps {
    user: User | null;
    onClose: () => void;
    t: Translation['user']['tempPassword'];
}

/**
 * TempPasswordModal — confirmation dialog shown right after a user is
 * created. When the backend supplies a temporary password (mock data)
 * it surfaces it for the admin to copy; otherwise it tells the admin
 * that a password was emailed to the user.
 * @param {TempPasswordModalProps} props
 * @returns {JSX.Element | null}
 */
export function TempPasswordModal({
    user,
    onClose,
    t,
}: TempPasswordModalProps): JSX.Element | null {
    const [copied, setCopied] = useState(false);

    if (!user) return null;

    const created = user as CreatedUser;
    const tempPassword = created._temporary_password;

    /**
     * Copy the temporary password to the clipboard.
     * @returns {Promise<void>}
     */
    const copy = async (): Promise<void> => {
        if (!tempPassword) return;
        if (await copyToClipboard(tempPassword)) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        }
    };

    return (
        <Modal
            open={user !== null}
            onClose={onClose}
            title={t.title}
            size="md"
            footer={
                <Button type="button" variant="primary" onClick={onClose}>
                    {t.saved}
                </Button>
            }
        >
            <div className="temp-pwd-banner">
                <AlertTriangle size={14} strokeWidth={1.8} />
                <div>
                    {interpolateTemplate(t.banner, {
                        name: `${user.name} ${user.lastname}`.trim(),
                    })}
                </div>
            </div>
            {tempPassword ? (
                <div className="temp-pwd-display">
                    <code className="temp-pwd-value">{tempPassword}</code>
                    <div className="temp-pwd-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            icon={
                                copied ? (
                                    <Check size={14} strokeWidth={1.6} />
                                ) : (
                                    <Copy size={14} strokeWidth={1.6} />
                                )
                            }
                            onClick={() => void copy()}
                        >
                            {copied ? t.copied : t.copy}
                        </Button>
                    </div>
                </div>
            ) : null}
            <p className="temp-pwd-meta">{t.meta}</p>
        </Modal>
    );
}