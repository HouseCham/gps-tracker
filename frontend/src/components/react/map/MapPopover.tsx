import '@/styles/map/map-popover.css';
//-- React
import type { JSX, MouseEvent } from 'react';
//-- Translations
import { en } from '@/i18n';
//-- Types
import type { MapPopoverDevice, MarkerStatus } from '@/types/components';
//-- Constants
import { MAP_STATUS_CLASS } from '@/constants/components/map';
//-- Icons
import { ArrowRight, X } from 'lucide-react';
//-- Utils
import { getMapStatusLabels, formatCoords } from '@/lib';
/**
 * @interface MapPopoverProps
 * @param {MapPopoverDevice} device - The device to display.
 * @param {string} href - The href to use for the link.
 * @param {function} onClose - The function to call when the popover is closed.
 * @param {function} onView - The function to call when the view button is clicked.
 * @param {string} lastSeenLabel - The label to use for the last seen date.
 * @param {Record<MarkerStatus, string>} statusLabels - The labels to use for the status.
 * @returns {JSX.Element} The MapPopover component.
 */
interface MapPopoverProps {
    device: MapPopoverDevice;
    href?: string;
    onClose?: () => void;
    onView?: (id: string) => void;
    lastSeenLabel?: string;
    statusLabels?: Record<MarkerStatus, string>;
}
/**
 * Renders a popover for a device on the map.
 * @param {MapPopoverProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export default function MapPopover({
    device,
    href,
    onClose,
    onView,
    lastSeenLabel,
    statusLabels,
}: MapPopoverProps): JSX.Element {
    /**
     * Handles the view button click.
     * @param {MouseEvent} e - The click event.
     * @returns {void}
     */
    const handleView = (e: MouseEvent): void => {
        e.preventDefault();
        onView?.(device.id);
    };
    /**
     * Formats the coordinates into a human-readable string.
     * @returns {string} The formatted coordinates.
     */
    const formattedCoords = formatCoords(device.lat, device.lng);
    /**
     * Get the labels for the map status markers.
     * @returns {Record<MarkerStatus, string>} The labels for the map status markers.
     */
    const labels = statusLabels ?? getMapStatusLabels(en);
    /**
     * Get the label for the last seen date.
     * @returns {string} The label for the last seen date.
     */
    const lastSeen =
        lastSeenLabel ??
        (device.lastSeen
            ? new Date(device.lastSeen).toLocaleString()
            : 'Never');
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
                    {labels[device.status]}
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
                {device.extra?.map(row => (
                    <div className="map-popover__field" key={row.label}>
                        <span className="map-popover__label">{row.label}</span>
                        <span
                            className={`map-popover__value map-popover__value--mono ${
                                row.tone === 'warning'
                                    ? 'map-popover__value--warn'
                                    : ''
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
