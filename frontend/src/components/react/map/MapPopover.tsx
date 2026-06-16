import '@/styles/map/map-popover.css';
//-- Constants
import { MAP_STATUS_CLASS, MAP_STATUS_LABEL } from '@/constants/components/map';
//-- Components
import type { MapPopoverDevice } from '@/types/components';
import { ArrowRight, X } from 'lucide-react';
/**
 * @interface MapPopoverProps
 * @param {MapPopoverDevice} device - The device to display info for.
 * @param {string} [href] - Optional link to open in a new tab.
 * @param {function} [onClose] - Optional function to call when the popover is closed.
 * @param {function} [onView] - Optional function to call when the view button is clicked.
 * @param {string} [lastSeenLabel] - Optional label to use for the last seen time.
 */
interface MapPopoverProps {
    device: MapPopoverDevice;
    href?: string;
    onClose?: () => void;
    onView?: (id: string) => void;
    lastSeenLabel?: string;
}
/**
 * Render a popover for a device on the map.
 * @param {MapPopoverProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
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
