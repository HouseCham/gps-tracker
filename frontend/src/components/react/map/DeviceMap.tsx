import '@/styles/map/device-map.css'
//-- React
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
//-- Icons
import { MapPin, Plus, Minus, Locate } from 'lucide-react';
//-- Components
import MapMarker from './MapMarker';
import MapPopover, { type MapPopoverDevice } from './MapPopover';
import type { DeviceMapRoutePoint } from '@/types/components';

interface DeviceMapProps {
    pins: DeviceMapPin[];
    /**
     * Optional route polyline as normalized [0..1] coordinates. Rendered
     * as an SVG path inside the map overlay.
     */
    route?: DeviceMapRoutePoint[];
    selectedId?: string | null;
    onSelect?: (id: string) => void;
    /**
     * Optional center for the coord display. If omitted, the first pin's
     * coordinates are used.
     */
    center?: { lat: number; lng: number; label?: string };
    /**
     * Map variant: 'default' (grid + radial) or 'satellite' (no grid, darker).
     */
    variant?: 'default' | 'satellite';
    showLabels?: boolean;
    showRoute?: boolean;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onLocate?: () => void;
    bottomRightSlot?: ReactNode;
}

/**
 * Project lat/lng to 0..1 percent coordinates inside the map placeholder.
 * Uses a simple equirectangular projection; the visible viewport is set
 * to lat ∈ [-60, 75] and the full lng range.
 */
function project(lat: number, lng: number): { x: number; y: number } {
    const LAT_MIN = -60;
    const LAT_MAX = 75;
    const x = ((lng + 180) / 360) * 100;
    const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100;
    return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
    };
}

function formatCoords(lat: number, lng: number): string {
    return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
}

function getPathFromRoute(route: DeviceMapRoutePoint[]): string {
    if (route.length === 0) return '';
    return route
        .map((p, i) => {
            const { x, y } = project(p.lat, p.lng);
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
}

/**
 * DeviceMap — placeholder map surface (no real Leaflet integration).
 * Renders a grid + radial gradient surface, optional route polyline,
 * device pins, controls (zoom, locate), and a coords badge.
 *
 * Selecting a pin shows a MapPopover anchored to its lat/lng.
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
}: DeviceMapProps): React.JSX.Element {
    const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
    const isControlled = controlledSelectedId !== undefined;
    const selectedId = isControlled ? controlledSelectedId : internalSelectedId;

    const handleSelect = useCallback(
        (id: string): void => {
            if (!isControlled) setInternalSelectedId(id);
            onSelect?.(id);
        },
        [isControlled, onSelect],
    );

    const handleClose = useCallback((): void => {
        if (!isControlled) setInternalSelectedId(null);
    }, [isControlled]);

    const selectedPin = useMemo(
        () => pins.find((p) => p.id === selectedId) ?? null,
        [pins, selectedId],
    );

    const projected = useMemo(
        () => pins.map((pin) => ({ pin, ...project(pin.lat, pin.lng) })),
        [pins],
    );

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

    const routePath = useMemo(
        () => (showRoute && route && route.length > 1 ? getPathFromRoute(route) : ''),
        [route, showRoute],
    );

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

    const popoverProjection = selectedPin ? project(selectedPin.lat, selectedPin.lng) : null;

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

                    {projected.map(({ pin, x, y }) => (
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
