import '@/styles/components/device-detail.css';
//-- React
import { Suspense, lazy, useEffect, useMemo } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
import type { ConnectionState, DeviceVehicleType } from '@/types/api';
import type { DeviceLocationPoint } from '@/types/components';
//-- Components
import { Badge, Button } from '@/components/ui';
import { TableStatus } from '@/components/ui/DataTable';
import { NotFoundUI } from '@/components/react/ui';
//-- Utils
import { formatDate, readDeviceIdFromUrl } from '@/lib';
//-- Services
import { useDeviceService, useLocationService } from '@/lib/api/services';
import { AdminDeviceDetail } from './AdminDeviceDetail';
//-- Toast bus
import { toastBus } from '@/lib/stores/toast.store';
import { getConnectionStateFrom, getConnectionVariant } from '@/lib/locations';
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

    const { latest, getLatestLocation } = useLocationService();

    const t = translation.device.detail;
    const fields = t.fields;
    const vehicleLabels = t.vehicleTypes;
    const connectionLabels = t.connection;
    const mapStrings = translation.section.deviceDetail;
    const toastStrings = translation.toast;

    const wrapperClass = `device-detail ${className ?? ''}`;

    //*  note: The device id comes from the URL query string so the page
    //*  itself can be fully prerendered with no build-time enumeration.
    const deviceId = readDeviceIdFromUrl();

    /**
     * Loads the device detail and the latest location on mount and
     * whenever the URL id changes. Both requests fire in parallel;
     * the map renders as soon as `latest` arrives, independent of
     * the device metadata fetch.
     */
    useEffect(() => {
        if (deviceId) {
            getDeviceById(deviceId);
            getLatestLocation(deviceId);
        }
    }, [deviceId]);

    // Connection state is derived from the latest reported location.
    // Recomputed each render — the 1-minute threshold means a single
    // render is fine, no setInterval needed for this slice (LivePreview
    // adds polling; DeviceDetail stays static after mount).
    const connection = useMemo<ConnectionState>(
        () => getConnectionStateFrom(latest?.recorded_at),
        [latest?.recorded_at]
    );

    // Project the snake_case API shape onto the camelCase shape the
    // map island expects. No util — one call site, two fields.
    const mapLocation: DeviceLocationPoint | null = latest
        ? {
            lat: latest.latitude,
            lng: latest.longitude,
            recordedAt: latest.recorded_at,
            speed: latest.speed ?? undefined,
        }
        : null;

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
                    <div className="device-detail__badges">
                        <Badge
                            variant={getConnectionVariant(connection)}
                            size="sm"
                            label={connectionLabels[connection]}
                        />
                        <Badge
                            variant={isOwner ? 'accent' : 'default'}
                            size="sm"
                            label={t.roles[device.access_role]}
                        />
                    </div>
                </div>
            </header>
            {/* Detail Layout */}
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
                <Suspense fallback={null}>
                    <aside
                        className="device-detail__map"
                        aria-label={mapStrings.map}
                    >
                        <DeviceMapLive
                            location={mapLocation}
                            route={[]}
                            deviceName={device.name}
                        />
                    </aside>
                </Suspense>
            </div>
        </section>
    );
}
