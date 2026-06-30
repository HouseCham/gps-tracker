import '@/styles/components/device-detail.css';
//-- React
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
import type { DataTableColumn } from '@/types/components/ui';
import type { DeviceAccessListItem, DeviceVehicleType } from '@/types/api';
//-- UI
import { Badge, Button } from '@/components/ui';
import { DataTable, TableStatus } from '@/components/ui/DataTable';
import Modal from '@/components/react/ui/Modal';
//-- Components
import { GrantAccessForm } from '@/components/react/form';
import { EmptyDeviceState } from '@/components/react/device/EmptyDeviceState';
//-- Icons
import { Plus, Trash2 } from 'lucide-react';
//-- Utils
import { formatDate, readDeviceIdFromUrl } from '@/lib';
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
 * Returns the columns for the device-access table.
 * @param {Translation['device']['detail']['accessTable']} t - Localized column labels.
 * @returns {DataTableColumn[]} Column definitions.
 */
function getColumns(
    t: Translation['device']['detail']['accessTable']
): DataTableColumn[] {
    return [
        { key: 'name', label: t.name },
        { key: 'email', label: t.email },
        { key: 'access_granted_at', label: t.accessGranted },
        { key: 'actions', label: t.actions, align: 'right' },
    ];
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
    const columns = useMemo(() => getColumns(t.accessTable), [t.accessTable]);
    const vehicleLabels = t.vehicleTypes;

    const [grantOpen, setGrantOpen] = useState(false);

    //-- ponytail: device id comes from the URL query string so the page
    //   itself can be fully prerendered with no build-time enumeration.
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
        await grantAccess(deviceId, userId);
        setGrantOpen(false);
    }

    /**
     * Revokes a user's access after a confirm prompt.
     * @param {DeviceAccessListItem} user - The user to revoke.
     */
    const handleRevoke = useCallback(
        async (user: DeviceAccessListItem): Promise<void> => {
            if (!window.confirm(t.accessTable.removeConfirm)) return;
            await revokeAccess(deviceId, user.user_id);
        },
        [revokeAccess, deviceId, t.accessTable.removeConfirm]
    );

    /**
     * Returns a stable click handler for a given row.
     * @param {DeviceAccessListItem} user - The row's user.
     */
    const revokeHandlerFor = useCallback(
        (user: DeviceAccessListItem) => () => handleRevoke(user),
        [handleRevoke]
    );

    if (isLoading && !device) {
        return (
            <section className={`device-detail ${className ?? ''}`}>
                <TableStatus mode="loading" />
                <p className="device-detail__loading">{t.loading}</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className={`device-detail ${className ?? ''}`}>
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

    if (!deviceId) {
        return (
            <section className={`device-detail ${className ?? ''}`}>
                <EmptyDeviceState
                    title={t.missingId}
                    message={t.missingIdMessage}
                    backHref={`/${locale}/devices`}
                    backLabel={t.backToList}
                />
            </section>
        );
    }

    if (!device && !isLoading && !error) {
        return (
            <section className={`device-detail ${className ?? ''}`}>
                <EmptyDeviceState
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
        vehicleLabels[device.vehicle_type as DeviceVehicleType] ??
        device.vehicle_type;

    return (
        <section className={`device-detail ${className ?? ''}`}>
            <header className="device-detail__head">
                <div className="device-detail__head-left">
                    <h1 className="device-detail__name">{device.name}</h1>
                    <Badge
                        variant={isOwner ? 'accent' : 'default'}
                        size="sm"
                        label={t.roles[device.access_role]}
                    />
                </div>
            </header>

            <section className="device-detail__card">
                <h2 className="device-detail__card-title">
                    {t.sections.overview}
                </h2>
                <dl className="device-detail__grid">
                    <div className="device-detail__field">
                        <dt className="device-detail__label">
                            {fields.name}
                        </dt>
                        <dd className="device-detail__value">
                            {device.name}
                        </dd>
                    </div>
                    <div className="device-detail__field">
                        <dt className="device-detail__label">
                            {fields.uuid}
                        </dt>
                        <dd className="device-detail__value device-detail__value--mono">
                            {device.uuid_firmware}
                        </dd>
                    </div>
                    <div className="device-detail__field">
                        <dt className="device-detail__label">
                            {fields.vehicleType}
                        </dt>
                        <dd className="device-detail__value">{vtLabel}</dd>
                    </div>
                    <div className="device-detail__field">
                        <dt className="device-detail__label">
                            {fields.createdAt}
                        </dt>
                        <dd className="device-detail__value device-detail__value--mono">
                            {formatDate(locale, device.created_at)}
                        </dd>
                    </div>
                    <div className="device-detail__field">
                        <dt className="device-detail__label">
                            {fields.lastSeen}
                        </dt>
                        <dd className="device-detail__value device-detail__value--mono">
                            {device.last_seen_at
                                ? formatDate(locale, device.last_seen_at)
                                : t.notAvailable}
                        </dd>
                    </div>
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
                    <DataTable columns={columns}>
                        {users.map(user => (
                            <tr
                                key={user.user_id}
                                className="data-table__row device-detail__access-row"
                            >
                                <td className="data-table__cell">
                                    <span className="device-detail__access-name">
                                        {user.name || user.email}
                                    </span>
                                </td>
                                <td className="data-table__cell device-detail__access-email">
                                    {user.email}
                                </td>
                                <td className="data-table__cell device-detail__access-granted">
                                    {formatDate(
                                        locale,
                                        user.access_granted_at
                                    )}
                                </td>
                                <td
                                    className="data-table__cell"
                                    data-align="center"
                                >
                                    <div className="device-detail__access-actions">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={revokeHandlerFor(user)}
                                            disabled={isLoading}
                                            aria-label={t.accessTable.remove}
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
                    {users.length === 0 && (
                        <p className="device-detail__empty">
                            {t.accessTable.noUsers}
                        </p>
                    )}

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
                </section>
            )}
        </section>
    );
}
