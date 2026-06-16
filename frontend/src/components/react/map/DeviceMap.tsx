import '@/styles/map/device-map.css'
//-- React
import type { JSX, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
//-- Types
import type { DeviceMapPin, DeviceMapRoutePoint, MapPopoverDevice } from '@/types/components';
//-- Icons
import { MapPin, Plus, Minus, Locate } from 'lucide-react';
//-- Components
import MapMarker from './MapMarker';
import MapPopover from './MapPopover';
import { formatCoords, getPathFromRoute, projectCoordinate } from '@/lib/map-utils';
/**
 * @interface DeviceMapProps
 * @param {DeviceMapPin[]} pins - The pins to render on the map.
 * @param {DeviceMapRoutePoint[]} [route] - The route to render on the map.
 * @param {string | null} [selectedId] - The ID of the selected pin.
 * @param {function} [onSelect] - The function to call when a pin is selected.
 * @param {{ lat: number; lng: number; label?: string }} [center] - The center of the map.
 * @param {'default' | 'satellite'} [variant] - The variant of the map.
 * @param {boolean} [showLabels] - Whether to show labels on the map.
 * @param {boolean} [showRoute] - Whether to show the route on the map.
 * @param {function} [onZoomIn] - The function to call when the zoom in button is clicked.
 * @param {function} [onZoomOut] - The function to call when the zoom out button is clicked.
 * @param {function} [onLocate] - The function to call when the locate button is clicked.
 * @param {ReactNode} [bottomRightSlot] - The slot to render at the bottom right of the map.
 */
interface DeviceMapProps {
    pins: DeviceMapPin[];
    route?: DeviceMapRoutePoint[];
    selectedId?: string | null;
    onSelect?: (id: string) => void;
    center?: { lat: number; lng: number; label?: string };
    variant?: 'default' | 'satellite';
    showLabels?: boolean;
    showRoute?: boolean;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onLocate?: () => void;
    bottomRightSlot?: ReactNode;
}
/**
 * @function DeviceMap
 * @description A component for rendering a map with pins and routes.
 * @param {DeviceMapProps} props - The props for the DeviceMap component.
 * @returns {JSX.Element} The rendered DeviceMap component.
 */
export default function DeviceMap({
    pins,
    route,
    selectedId: controlledSelectedId,
    onSelect,
    center,
    variant = 'default',
    showLabels = true,
    showRoute = true,
    onZoomIn,
    onZoomOut,
    onLocate,
    bottomRightSlot,
}: DeviceMapProps): JSX.Element {
    const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
    const isControlled = controlledSelectedId !== undefined;
    const selectedId = isControlled ? controlledSelectedId : internalSelectedId;
    /**
     * Handles the selection of a pin.
     * @param {string} id - The ID of the pin to select.
     */
    const handleSelect = useCallback(
        (id: string): void => {
            if (!isControlled) setInternalSelectedId(id);
            onSelect?.(id);
        },
        [isControlled, onSelect],
    );
    /**
     * Handles the closing of the popover.
     * @returns {void}
     */
    const handleClose = useCallback((): void => {
        if (!isControlled) setInternalSelectedId(null);
    }, [isControlled]);
    /**
     * Current pin selected.
     * @returns {DeviceMapPin | null} The selected pin.
     */
    const selectedPin = useMemo(
        () => pins.find((p) => p.id === selectedId) ?? null,
        [pins, selectedId],
    );
    /**
     * Array of projected coordinates.
     * @returns {Array} An array of coordinates pins.
     */
    const pinsProjected = useMemo(
        () => pins.map((pin) => ({ pin, ...projectCoordinate(pin.lat, pin.lng) })),
        [pins],
    );
    /**
     * Center of the map.
     * @returns {{ lat: number; lng: number; text: string }} The center of the map.
     */
    const coords = useMemo(() => {
        const c = center ?? (selectedPin
            ? { lat: selectedPin.lat, lng: selectedPin.lng }
            : pins[0]
                ? { lat: pins[0].lat, lng: pins[0].lng }
                : null);
        if (!c) return null;
        return {
            ...c,
            text: formatCoords(c.lat, c.lng),
        };
    }, [center, selectedPin, pins]);
    /**
     * Route path of the map.
     * @returns {string} The route path.
     */
    const routePath = useMemo(
        () => (showRoute && route && route.length > 1 ? getPathFromRoute(route) : ''),
        [route, showRoute],
    );
    /**
     * Popover device information.
     * @returns {MapPopoverDevice | null} The popover device.
     */
    const popoverDevice: MapPopoverDevice | null = selectedPin
        ? {
            id: selectedPin.id,
            name: selectedPin.name,
            status: selectedPin.status,
            lat: selectedPin.lat,
            lng: selectedPin.lng,
            lastSeen: selectedPin.lastSeen,
        }
        : null;
    /**
     * Coordinates of the selected pin.
     * @returns {MapPopoverProjection | null} The popover projection.
     */
    const popoverProjection = selectedPin ? projectCoordinate(selectedPin.lat, selectedPin.lng) : null;

    return (
        <div
            className={`device-map device-map--${variant}`}
            role="region"
            aria-label="Device map"
        >
            <div className="device-map__placeholder">
                <div className="device-map__overlay">
                    {routePath && (
                        <svg
                            className="device-map__route"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <path
                                d={routePath}
                                fill="none"
                                stroke="var(--accent)"
                                strokeWidth="0.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                                className="device-map__route-path"
                            />
                        </svg>
                    )}

                    {pinsProjected.map(({ pin, x, y }) => (
                        <div
                            key={pin.id}
                            className="device-map__pin-pos"
                            style={{ top: `${y}%`, left: `${x}%` }}
                        >
                            <MapMarker
                                id={pin.id}
                                name={pin.name}
                                status={pin.status}
                                lat={pin.lat}
                                lng={pin.lng}
                                selected={pin.id === selectedId}
                                showLabel={showLabels}
                                onClick={handleSelect}
                            />
                        </div>
                    ))}

                    {popoverDevice && popoverProjection && (
                        <div
                            className="device-map__popover-pos"
                            style={{
                                top: `${popoverProjection.y}%`,
                                left: `${popoverProjection.x}%`,
                            }}
                        >
                            <MapPopover
                                device={popoverDevice}
                                href={`/devices/${popoverDevice.id}`}
                                onClose={handleClose}
                            />
                        </div>
                    )}
                </div>

                <div className="device-map__controls" role="toolbar" aria-label="Map controls">
                    <button
                        type="button"
                        className="device-map__control"
                        onClick={onZoomIn}
                        aria-label="Zoom in"
                    >
                        <Plus size={16} strokeWidth={2} />
                    </button>
                    <button
                        type="button"
                        className="device-map__control"
                        onClick={onZoomOut}
                        aria-label="Zoom out"
                    >
                        <Minus size={16} strokeWidth={2} />
                    </button>
                    <button
                        type="button"
                        className="device-map__control"
                        onClick={onLocate}
                        aria-label="Center on my location"
                    >
                        <Locate size={16} strokeWidth={2} />
                    </button>
                </div>

                {coords && (
                    <div className="device-map__coords" aria-live="polite">
                        <MapPin size={12} strokeWidth={2} aria-hidden="true" />
                        <span className="device-map__coords-text">{coords.text}</span>
                        {coords.label && (
                            <span className="device-map__coords-label">· {coords.label}</span>
                        )}
                    </div>
                )}

                {bottomRightSlot && (
                    <div className="device-map__bottom-right">{bottomRightSlot}</div>
                )}

                <div className="device-map__attribution" aria-hidden="true">
                    Map placeholder · GPS Tracker
                </div>
            </div>
        </div>
    );
}
