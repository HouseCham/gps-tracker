import '@/styles/map/map-popover.css';
//-- React
import type { ReactNode } from 'react';
//-- Constants
import { MAP_STATUS_CLASS, MAP_STATUS_LABEL } from '@/constants/components/map';
//-- Components
import type { MarkerStatus } from '@/types/components';
import { ArrowRight, X } from 'lucide-react';

export interface MapPopoverDevice {
    id: string;
    name: string;
    status: MarkerStatus;
    lat: number;
    lng: number;
    lastSeen: string | null;
    speed?: number | string;
    battery?: number;
    heading?: string;
    extra?: { label: string; value: ReactNode; tone?: 'default' | 'warning' | 'danger' }[];
}

export interface MapPopoverProps {
    device: MapPopoverDevice;
    href?: string;
    onClose?: () => void;
    onView?: (id: string) => void;
    /**
     * Optional relative timestamp string. If omitted, falls back to lastSeen.
     */
    lastSeenLabel?: string;
}
/**
 * MapPopover — info card anchored above an active MapMarker.
 * Renders inside the map overlay (sibling to MapMarker), positioned by parent.
 */
export default function MapPopover({
    device,
    href,
    onClose,
    onView,
    lastSeenLabel,
}: MapPopoverProps): React.JSX.Element {
    const handleView = (e: React.MouseEvent): void => {
        e.preventDefault();
        onView?.(device.id);
    };

    const formattedCoords = `${device.lat.toFixed(4)}° ${device.lat >= 0 ? 'N' : 'S'}, ${device.lng.toFixed(4)}° ${device.lng >= 0 ? 'E' : 'W'}`;

    const lastSeen = lastSeenLabel ??
        (device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never');

    return (
        <div
            className="map-popover"
            role="dialog"
            aria-label={`Details for ${device.name}`}
        >
            <div className="map-popover__header">
                <span className="map-popover__id">{device.id}</span>
                <span
                    className={`map-popover__badge ${MAP_STATUS_CLASS[device.status]}`}
                >
                    {MAP_STATUS_LABEL[device.status]}
                </span>
            </div>
            <div className="map-popover__name">{device.name}</div>

            <div className="map-popover__grid">
                <div className="map-popover__field">
                    <span className="map-popover__label">Coords</span>
                    <span className="map-popover__value map-popover__value--mono">
                        {formattedCoords}
                    </span>
                </div>
                <div className="map-popover__field">
                    <span className="map-popover__label">Last seen</span>
                    <span className="map-popover__value">{lastSeen}</span>
                </div>
                {device.speed !== undefined && (
                    <div className="map-popover__field">
                        <span className="map-popover__label">Speed</span>
                        <span className="map-popover__value map-popover__value--mono">
                            {device.speed}
                        </span>
                    </div>
                )}
                {device.battery !== undefined && (
                    <div className="map-popover__field">
                        <span className="map-popover__label">Battery</span>
                        <span className="map-popover__value map-popover__value--mono">
                            {device.battery}%
                        </span>
                    </div>
                )}
                {device.heading !== undefined && (
                    <div className="map-popover__field">
                        <span className="map-popover__label">Heading</span>
                        <span className="map-popover__value map-popover__value--mono">
                            {device.heading}
                        </span>
                    </div>
                )}
                {device.extra?.map((row) => (
                    <div className="map-popover__field" key={row.label}>
                        <span className="map-popover__label">{row.label}</span>
                        <span
                            className={`map-popover__value map-popover__value--mono ${
                                row.tone === 'warning' ? 'map-popover__value--warn' : ''
                            }${row.tone === 'danger' ? ' map-popover__value--danger' : ''}`}
                        >
                            {row.value}
                        </span>
                    </div>
                ))}
            </div>

            <div className="map-popover__footer">
                {onClose ? (
                    <button
                        type="button"
                        className="map-popover__close"
                        onClick={onClose}
                        aria-label="Close popover"
                    >
                        <X size={14} strokeWidth={2} />
                    </button>
                ) : (
                    <span className="map-popover__hint">{lastSeen}</span>
                )}
                <a
                    className="map-popover__action"
                    href={href ?? '#'}
                    onClick={handleView}
                >
                    View device
                    <ArrowRight size={12} strokeWidth={2} />
                </a>
            </div>
        </div>
    );
}
