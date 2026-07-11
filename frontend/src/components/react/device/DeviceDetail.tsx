import '@/styles/components/device-detail.css';
//-- React
import { Suspense, lazy, useEffect } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
import type { DeviceVehicleType } from '@/types/api';
//-- Components
import { Badge, Button } from '@/components/ui';
import { TableStatus } from '@/components/ui/DataTable';
import { NotFoundUI } from '@/components/react/ui';
//-- Utils
import { formatDate, readDeviceIdFromUrl } from '@/lib';
//-- Constants
import {
    MAP_LIVE_DEMO_LOCATION,
    MAP_LIVE_DEMO_ROUTE,
} from '@/constants/components/map';
//-- Services
import { useDeviceService } from '@/lib/api/services';
import { AdminDeviceDetail } from './AdminDeviceDetail';
//-- Toast bus
import { toastBus } from '@/lib/stores/toast.store';
//-- Lazy components
const DeviceMapLive = lazy(
    () => import('@/components/react/map/DeviceMapLive')
);

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
    const vehicleLabels = t.vehicleTypes;
    const mapStrings = translation.section.deviceDetail;
    const toastStrings = translation.toast;

    const wrapperClass = `device-detail ${className ?? ''}`;

    //*  note: The device id comes from the URL query string so the page
    //*  itself can be fully prerendered with no build-time enumeration.
    const deviceId = readDeviceIdFromUrl();

    /**
     * Loads the device detail on mount and whenever the URL id changes.
     */
    useEffect(() => {
        if (deviceId) getDeviceById(deviceId);
    }, [deviceId, getDeviceById]);

    // Return loading UI
    if (isLoading) {
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

    //* note: API serializes vehicle_type as a generic string; the
    //   lookup table only covers the known DeviceVehicleType union, so the
    //   fallback (`?? device.vehicle_type`) handles unknown values safely.
    const vtLabel =
        // device.vehicle_type arrives as string from the API, narrow for the label lookup
        vehicleLabels[device.vehicle_type as DeviceVehicleType] ??
        device.vehicle_type;

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
                        <AdminDeviceDetail
                            users={users}
                            locale={locale}
                            translation={translation}
                            isLoading={isLoading}
                            onGrant={async userId => {
                                await grantAccess(deviceId, userId);
                                toastBus.push({
                                    variant: 'success',
                                    title: toastStrings.accessGranted.title,
                                    message: toastStrings.accessGranted.message,
                                });
                            }}
                            onRevoke={async userId => {
                                await revokeAccess(deviceId, userId);
                                toastBus.push({
                                    variant: 'success',
                                    title: toastStrings.accessRevoked.title,
                                    message: toastStrings.accessRevoked.message,
                                });
                            }}
                        />
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
