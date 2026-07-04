import '@/styles/components/device-detail.css';
import '@/styles/components/mobile-cards.css';
//-- React
import { Suspense, lazy, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
import type { DeviceAccessListItem, DeviceVehicleType } from '@/types/api';
//-- Components
import { Badge, Button, Input } from '@/components/ui';
import { TableStatus } from '@/components/ui/DataTable';
import Modal from '@/components/react/ui/Modal';
import { GrantAccessForm } from '@/components/react/form';
import { NotFoundUI } from '@/components/react/ui';
import {
    AccessMobileCard,
    MobileCardList,
} from '@/components/react/shared';
//-- Icons
import { Plus } from 'lucide-react';
//-- Utils
import {
    formatDate,
    getDeviceAccessTableColumns,
    readDeviceIdFromUrl,
} from '@/lib';
import { asApiError } from '@/lib/api/api-utils';
//-- Constants
import {
    MAP_LIVE_DEMO_LOCATION,
    MAP_LIVE_DEMO_ROUTE,
} from '@/constants/components/map';
//-- Services
import { useDeviceService } from '@/lib/api/services';
import { DeviceUserAccessTable } from './DeviceUserAccessTable';
//-- Lazy components
const DeviceMapLive = lazy(() => import('@/components/react/map/DeviceMapLive'));

/**
 * Interface for the DeviceDetail island.
 * @interface DeviceDetailProps
 * @param {Language} locale - Current locale.
 * @param {Translation} translation - Localized strings.
 * @param {string} [className] - Extra class appended to the class list.
 */
interface DeviceDetailProps {
    locale: Language;
    translation: Translation;
    className?: string;
}
/**
 * Renders the device-detail page (React island).
 * @function DeviceDetail
 * @param {DeviceDetailProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function DeviceDetail({
    locale,
    translation,
    className,
}: DeviceDetailProps): JSX.Element {
    const {
        //-- state
        error,
        isLoading,
        device,
        //-- actions
        getDeviceById,
        grantAccess,
        revokeAccess,
    } = useDeviceService();

    const t = translation.device.detail;
    const fields = t.fields;
    const columns = getDeviceAccessTableColumns(t.accessTable);
    const vehicleLabels = t.vehicleTypes;
    const mapStrings = translation.section.deviceDetail;

    const [grantOpen, setGrantOpen] = useState(false);

    // ─── Revoke-confirmation modal state ────────────────────────────────────
    const [revokeTarget, setRevokeTarget] =
        useState<DeviceAccessListItem | null>(null);
    const [revokeConfirmText, setRevokeConfirmText] = useState('');
    const [revokeError, setRevokeError] = useState<string | null>(null);
    
    const wrapperClass = `device-detail ${className ?? ''}`;

    //*  note: The device id comes from the URL query string so the page
    //*  itself can be fully prerendered with no build-time enumeration.
    const deviceId = readDeviceIdFromUrl();

    /**
     * Loads the device detail on mount and whenever the URL id changes.
     */
    useEffect(() => {
        if (deviceId) getDeviceById(deviceId);
    }, [deviceId]);

    /**
     * Submits the grant-access form and closes the modal on success.
     * Errors propagate so the form can display them inline.
     * @param {string} userId - The id typed into the form.
     */
    async function handleGrant(userId: string): Promise<void> {
        await grantAccess(deviceId ?? '', userId);
        setGrantOpen(false);
    }

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
     * @returns {void}
     */
    function handleCancelRevoke(): void {
        setRevokeTarget(null);
        setRevokeConfirmText('');
        setRevokeError(null);
    };

    /**
     * Stable change handler for the revoke-confirmation input.
     * @param {ChangeEvent<HTMLInputElement>} e - The change event.
     * @returns {void}
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
        const strings = translation.device.detail.accessTable.revokeConfirm;
        if (!revokeTarget) return;
        if (revokeConfirmText.trim() !== strings.confirmPhrase) {
            setRevokeError(strings.mismatch);
            return;
        }
        try {
            await revokeAccess(deviceId ?? '', revokeTarget.user_id);
            handleCancelRevoke();
        } catch (err) {
            const apiErr = asApiError(err);
            setRevokeError(apiErr.message ?? strings.revokeFailed);
        }
    };

    // Esc cancels the revoke modal (single-mode means at most one).
    useEffect(() => {
        if (revokeTarget === null) return;
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                setRevokeTarget(null);
                setRevokeConfirmText('');
                setRevokeError(null);
            }
        };
        document.addEventListener('keydown', onKey);
        return (): void => document.removeEventListener('keydown', onKey);
    }, [revokeTarget]);

    // Return loading UI
    if (isLoading && !device) {
        return (
            <section className={wrapperClass}>
                <TableStatus mode="loading" />
                <p className="device-detail__loading">{t.loading}</p>
            </section>
        );
    }
    // Return error UI
    if (error && deviceId) {
        return (
            <section className={wrapperClass}>
                <TableStatus
                    mode="empty"
                    title={t.loadFailed}
                    message={error.message}
                />
                <div className="device-detail__retry">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => getDeviceById(deviceId)}
                    >
                        {t.retry}
                    </Button>
                </div>
            </section>
        );
    }
    // Return missing id UI
    if (!deviceId || !device) {
        return (
            <section className={wrapperClass}>
                <NotFoundUI
                    title={t.missingId}
                    message={t.missingIdMessage}
                    backHref={`/${locale}/devices`}
                    backLabel={t.backToList}
                />
            </section>
        );
    }

    const isOwner = device.access_role === 'owner';
    const users = device.users ?? [];

    /**
     * Per-user click callbacks for the access list. The mobile `.map`
     * below reads from this Map instead of allocating inline arrows;
     * entries stay stable until `users` (or `askRevoke`) changes.
     */
    const accessHandlersById = new Map<string, { onRevoke: () => void }>();
    for (const user of users) {
        accessHandlersById.set(user.user_id, {
            onRevoke: (): void => askRevoke(user),
        });
    }

    //* note: API serializes vehicle_type as a generic string; the
    //   lookup table only covers the known DeviceVehicleType union, so the
    //   fallback (`?? device.vehicle_type`) handles unknown values safely.
    const vtLabel =
        // device.vehicle_type arrives as string from the API, narrow for the label lookup
        vehicleLabels[device.vehicle_type as DeviceVehicleType] ??
        device.vehicle_type;

    const revokeStrings = t.accessTable.revokeConfirm;
    const canRevoke =
        revokeTarget !== null &&
        revokeConfirmText.trim() === revokeStrings.confirmPhrase;

    return (
        <section className={wrapperClass}>
            {/* Header */}
            <header className="device-detail__head">
                <div className="device-detail__head-left">
                    <h1 className="device-detail__name">{device?.name}</h1>
                    <Badge
                        variant={isOwner ? 'accent' : 'default'}
                        size="sm"
                        label={t.roles[device.access_role]}
                    />
                </div>
            </header>
            <div className="device-detail__layout">
                {/* Device Detail Section */}
                <div className="device-detail__main">
                    {/* Main Section */}
                    <section className="device-detail__card">
                        <h2 className="device-detail__card-title">
                            {t.sections.overview}
                        </h2>
                        {/* Main Card */}
                        <dl className="device-detail__grid">
                            {/* Name */}
                            <div className="device-detail__field">
                                <dt className="device-detail__label">
                                    {fields.name}
                                </dt>
                                <dd className="device-detail__value">
                                    {device.name}
                                </dd>
                            </div>
                            {/* UUID */}
                            <div className="device-detail__field">
                                <dt className="device-detail__label">
                                    {fields.uuid}
                                </dt>
                                <dd className="device-detail__value device-detail__value--mono">
                                    {device.uuid_firmware}
                                </dd>
                            </div>
                            {/* Vehicle Type */}
                            <div className="device-detail__field">
                                <dt className="device-detail__label">
                                    {fields.vehicleType}
                                </dt>
                                <dd className="device-detail__value">
                                    {vtLabel}
                                </dd>
                            </div>
                            {/* Created At */}
                            <div className="device-detail__field">
                                <dt className="device-detail__label">
                                    {fields.createdAt}
                                </dt>
                                <dd className="device-detail__value device-detail__value--mono">
                                    {formatDate(locale, device.created_at)}
                                </dd>
                            </div>
                            {/* Last Seen At */}
                            <div className="device-detail__field">
                                <dt className="device-detail__label">
                                    {fields.lastSeen}
                                </dt>
                                <dd className="device-detail__value device-detail__value--mono">
                                    {device.last_seen_at
                                        ? formatDate(
                                            locale,
                                            device.last_seen_at
                                        )
                                        : t.notAvailable}
                                </dd>
                            </div>
                            {/* Access Role */}
                            <div className="device-detail__field">
                                <dt className="device-detail__label">
                                    {fields.accessRole}
                                </dt>
                                <dd className="device-detail__value">
                                    {t.roles[device.access_role]}
                                </dd>
                            </div>
                        </dl>
                    </section>
                    {/* Access Section | Admin only */}
                    {isOwner && (
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
                                    const handlers = accessHandlersById.get(
                                        user.user_id
                                    );
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
                                            disabled={
                                                !canRevoke || isLoading
                                            }
                                            loading={isLoading && canRevoke}
                                        >
                                            {t.accessTable.revokeConfirm.confirm}
                                        </Button>
                                    </>
                                }
                            >
                                {/** note: reuses the device-delete-confirm
                                     BEM block (visually identical destructive
                                     dialog; same warning + typed-confirmation
                                     pattern). Split if a third caller arrives. */}
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
                                            t.accessTable.revokeConfirm
                                                .typeConfirmLabel
                                        }
                                        placeholder={
                                            t.accessTable.revokeConfirm
                                                .typeConfirmPlaceholder
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
                    )}
                </div>
                {/* Map Section */}
                <aside
                    className="device-detail__map"
                    aria-label={mapStrings.map}
                >
                    <Suspense fallback={null}>
                        <DeviceMapLive
                            location={MAP_LIVE_DEMO_LOCATION}
                            route={MAP_LIVE_DEMO_ROUTE}
                            deviceName={device.name}
                        />
                    </Suspense>
                </aside>
            </div>
        </section>
    );
}
