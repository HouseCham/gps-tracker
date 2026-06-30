import '@/styles/components/device-detail.css';
//-- React
import { useEffect, useState } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
import type { DeviceAccessListItem, DeviceVehicleType } from '@/types/api';
//-- Components
import { Badge, Button } from '@/components/ui';
import { DataTable, TableStatus } from '@/components/ui/DataTable';
import Modal from '@/components/react/ui/Modal';
import { GrantAccessForm } from '@/components/react/form';
import { NotFoundUI } from '@/components/react/ui';
import DeviceMap from '@/components/react/map/DeviceMap';
//-- Icons
import { MapPin, Plus, Trash2 } from 'lucide-react';
//-- Utils
import { formatDate, getDeviceAccessTableColumns, readDeviceIdFromUrl } from '@/lib';
//-- Services
import { useDeviceService } from '@/lib/api/services';

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
    const [revokeTarget, setRevokeTarget] = useState<DeviceAccessListItem | null>(
        null
    );
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
    }

    /**
     * Confirms the pending revocation, calls the service, then closes the modal.
     */
    async function confirmRevoke(): Promise<void> {
        if (!revokeTarget) return;
        const target = revokeTarget;
        setRevokeTarget(null);
        await revokeAccess(deviceId ?? '', target.user_id);
    }

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
    // Return not found UI
    if (!device && !isLoading && !error) {
        return (
            <section className={wrapperClass}>
                <NotFoundUI
                    title={t.notFound}
                    message={t.notFoundMessage}
                    backHref={`/${locale}/devices`}
                    backLabel={t.backToList}
                />
            </section>
        );
    }

    const isOwner = device.access_role === 'owner';
    const users = device.users ?? [];
    // ponytail: API serializes vehicle_type as a generic string; the
    //   lookup table only covers the known DeviceVehicleType union, so the
    //   fallback (`?? device.vehicle_type`) handles unknown values safely.
    const vtLabel =
        // device.vehicle_type arrives as string from the API, narrow for the label lookup
        vehicleLabels[device.vehicle_type as DeviceVehicleType] ??
        device.vehicle_type;

    return (
        <section className={wrapperClass}>
            <div className="device-detail__layout">
                {/* Device Detail Section */}
                <div className="device-detail__main">
                    {/* Header */}
                    <header className="device-detail__head">
                        <div className="device-detail__head-left">
                            <h1 className="device-detail__name">
                                {device?.name}
                            </h1>
                            <Badge
                                variant={isOwner ? 'accent' : 'default'}
                                size="sm"
                                label={t.roles[device.access_role]}
                            />
                        </div>
                    </header>
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
                            <DataTable columns={columns}>
                                {users.map(user => (
                                    <tr
                                        key={user.user_id}
                                        className="data-table__row device-detail__access-row"
                                    >
                                        {/* Name */}
                                        <td className="data-table__cell">
                                            <span className="device-detail__access-name">
                                                {user.name}
                                            </span>
                                        </td>
                                        {/* Email */}
                                        <td className="data-table__cell device-detail__access-email">
                                            {user.email}
                                        </td>
                                        {/* Access Granted At */}
                                        <td className="data-table__cell device-detail__access-granted">
                                            {formatDate(
                                                locale,
                                                user.access_granted_at
                                            )}
                                        </td>
                                        {/* Actions */}
                                        <td
                                            className="data-table__cell"
                                            data-align="center"
                                        >
                                            <div className="device-detail__access-actions">
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => askRevoke(user)}
                                                    disabled={isLoading}
                                                    aria-label={
                                                        t.accessTable.remove
                                                    }
                                                >
                                                    <Trash2
                                                        size={14}
                                                        strokeWidth={2}
                                                        aria-hidden="true"
                                                    />
                                                    {t.accessTable.remove}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </DataTable>
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
                                onClose={() => setRevokeTarget(null)}
                                title={t.accessTable.removeTitle}
                            >
                                <p className="device-detail__modal-message">
                                    {t.accessTable.removeConfirm}
                                </p>
                                <div className="device-detail__modal-actions">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setRevokeTarget(null)}
                                        disabled={isLoading}
                                    >
                                        {t.grantAccess.cancel}
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={confirmRevoke}
                                        disabled={isLoading}
                                        loading={isLoading}
                                    >
                                        {t.accessTable.remove}
                                    </Button>
                                </div>
                            </Modal>
                        </section>
                    )}
                </div>
                {/* Map Section */}
                <aside className="device-detail__map" aria-label={mapStrings.map}>
                    <DeviceMap pins={[]} variant="default" />
                    <div className="device-detail__map-overlay">
                        <MapPin
                            size={32}
                            strokeWidth={1.5}
                            aria-hidden="true"
                        />
                        <h3 className="device-detail__map-overlay-title">
                            {mapStrings.mapComingSoon}
                        </h3>
                        <p className="device-detail__map-overlay-message">
                            {mapStrings.mapComingSoonMessage}
                        </p>
                    </div>
                </aside>
            </div>
        </section>
    );
}
