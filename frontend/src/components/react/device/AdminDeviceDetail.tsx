import '@/styles/components/device-detail.css';
import '@/styles/components/mobile-cards.css';
//-- React
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
import type { DeviceAccessListItem } from '@/types/api';
//-- Components
import { Button, Input } from '@/components/ui';
import Modal from '@/components/react/ui/Modal';
import { GrantAccessForm } from '@/components/react/form';
import {
    AccessMobileCard,
    MobileCardList,
} from '@/components/react/shared';
//-- Icons
import { Plus } from 'lucide-react';
//-- Utils
import { getDeviceAccessTableColumns } from '@/lib';
import { asApiError } from '@/lib/api/api-utils';
//-- Services
import { DeviceUserAccessTable } from './DeviceUserAccessTable';

/**
 * Interface for the AdminDeviceDetail island.
 * @interface AdminDeviceDetailProps
 * @param {DeviceAccessListItem[]} users - Users with access to the device.
 * @param {Language} locale - Current locale.
 * @param {Translation} translation - Localized strings.
 * @param {boolean} isLoading - Whether a grant/revoke action is in flight.
 * @param {Function} onGrant - Submits the grant-access form for the given user id.
 * @param {Function} onRevoke - Revokes access for the given user id.
 */
interface AdminDeviceDetailProps {
    users: DeviceAccessListItem[];
    locale: Language;
    translation: Translation;
    isLoading: boolean;
    onGrant: (userId: string) => Promise<void>;
    onRevoke: (userId: string) => Promise<void>;
}
/**
 * Renders the device-access management section (admin only).
 * @function AdminDeviceDetail
 * @param {AdminDeviceDetailProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function AdminDeviceDetail({
    users,
    locale,
    translation,
    isLoading,
    onGrant,
    onRevoke,
}: AdminDeviceDetailProps): JSX.Element {
    const t = translation.device.detail;
    const columns = getDeviceAccessTableColumns(t.accessTable);
    const revokeStrings = t.accessTable.revokeConfirm;

    const [grantOpen, setGrantOpen] = useState(false);
    const [revokeTarget, setRevokeTarget] =
        useState<DeviceAccessListItem | null>(null);
    const [revokeConfirmText, setRevokeConfirmText] = useState('');
    const [revokeError, setRevokeError] = useState<string | null>(null);

    /**
     * Submits the grant-access form and closes the modal on success.
     * Errors propagate so the form can display them inline.
     * @param {string} userId - The id typed into the form.
     * @returns {Promise<void>}
     */
    async function handleGrant(userId: string): Promise<void> {
        await onGrant(userId);
        setGrantOpen(false);
    };

    /**
     * Opens the revoke-access confirmation modal for the given user.
     * @param {DeviceAccessListItem} user - The user pending revocation.
     */
    function askRevoke(user: DeviceAccessListItem): void {
        setRevokeTarget(user);
        setRevokeConfirmText('');
        setRevokeError(null);
    };

    /**
     * Closes the revoke-access modal and clears its state.
     */
    function handleCancelRevoke(): void {
        setRevokeTarget(null);
        setRevokeConfirmText('');
        setRevokeError(null);
    };

    /**
     * Stable change handler for the revoke-confirmation input.
     * @param {ChangeEvent<HTMLInputElement>} e - The change event.
     */
    function onRevokeConfirmChange(e: ChangeEvent<HTMLInputElement>): void {
        setRevokeConfirmText(e.target.value);
        setRevokeError(null);
    };

    /**
     * Confirms the pending revocation.
     * @returns {Promise<void>}
     */
    async function confirmRevoke(): Promise<void> {
        if (!revokeTarget) return;
        if (revokeConfirmText.trim() !== revokeStrings.confirmPhrase) {
            setRevokeError(revokeStrings.mismatch);
            return;
        }
        try {
            await onRevoke(revokeTarget.user_id);
            handleCancelRevoke();
        } catch (err) {
            const apiErr = asApiError(err);
            setRevokeError(apiErr.message ?? revokeStrings.revokeFailed);
        }
    };

    // Esc cancels the revoke modal (single-mode means at most one).
    useEffect(() => {
        if (revokeTarget === null) return;
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                handleCancelRevoke();
            }
        };
        document.addEventListener('keydown', onKey);
        return (): void => document.removeEventListener('keydown', onKey);
    }, [revokeTarget]);

    /**
     * Per-user revoke callbacks for the mobile card list. Stored in a
     * Map so the `.map` below looks them up by id instead of allocating
     * inline arrows per row.
     */
    const accessHandlersById = new Map<string, { onRevoke: () => void }>();
    for (const user of users) {
        accessHandlersById.set(user.user_id, {
            onRevoke: (): void => askRevoke(user),
        });
    }

    const canRevoke =
        revokeTarget !== null &&
        revokeConfirmText.trim() === revokeStrings.confirmPhrase;

    return (
        <section className="device-detail__card device-detail__access">
            {/* Access Section & Add User Button */}
            <div className="device-detail__access-head">
                <h2 className="device-detail__card-title">
                    {t.sections.access}
                </h2>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setGrantOpen(true)}
                >
                    <Plus
                        size={14}
                        strokeWidth={2}
                        aria-hidden="true"
                    />
                    {t.accessTable.addUser}
                </Button>
            </div>
            {/* Access Table */}
            <DeviceUserAccessTable
                columns={columns}
                users={users}
                locale={locale}
                t={t.accessTable}
                isLoading={isLoading}
                onClickRemoveAccess={askRevoke}
            />
            {/* Mobile cards (≤ 767.98px) — mirrors the table rows above. */}
            <MobileCardList
                variant="access"
                label={t.accessTable.name}
            >
                {users.map(user => {
                    const handlers = accessHandlersById.get(user.user_id);
                    if (!handlers) return null;
                    return (
                        <AccessMobileCard
                            key={user.user_id}
                            locale={locale}
                            user={user}
                            labels={t.accessTable}
                            onRevoke={handlers.onRevoke}
                            isLoading={isLoading}
                        />
                    );
                })}
            </MobileCardList>
            {/* Empty state */}
            {users.length === 0 && (
                <p className="device-detail__empty">
                    {t.accessTable.noUsers}
                </p>
            )}
            {/* Grant modal */}
            <Modal
                open={grantOpen}
                onClose={() => setGrantOpen(false)}
                title={t.grantAccess.title}
            >
                <GrantAccessForm
                    strings={t.grantAccess}
                    onSubmit={handleGrant}
                    onCancel={() => setGrantOpen(false)}
                    saving={isLoading}
                />
            </Modal>
            {/* Revoke modal */}
            <Modal
                open={revokeTarget !== null}
                onClose={handleCancelRevoke}
                title={t.accessTable.removeTitle}
                variant="danger"
                size="md"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelRevoke}
                            disabled={isLoading}
                        >
                            {t.accessTable.revokeConfirm.cancel}
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => void confirmRevoke()}
                            disabled={!canRevoke || isLoading}
                            loading={isLoading && canRevoke}
                        >
                            {t.accessTable.revokeConfirm.confirm}
                        </Button>
                    </>
                }
            >
                <div className="device-delete-confirm">
                    <p
                        className="device-delete-confirm__warning"
                        role="alert"
                    >
                        {t.accessTable.revokeConfirm.warning.replace(
                            '{name}',
                            revokeTarget?.name ?? ''
                        )}
                    </p>
                    <Input
                        name="revoke-confirm-phrase"
                        label={
                            t.accessTable.revokeConfirm.typeConfirmLabel
                        }
                        placeholder={
                            t.accessTable.revokeConfirm.typeConfirmPlaceholder
                        }
                        value={revokeConfirmText}
                        onChange={onRevokeConfirmChange}
                        disabled={isLoading}
                        autocomplete="off"
                    />
                    {revokeError && (
                        <p
                            className="device-delete-confirm__error"
                            role="alert"
                        >
                            {revokeError}
                        </p>
                    )}
                </div>
            </Modal>
        </section>
    );
}