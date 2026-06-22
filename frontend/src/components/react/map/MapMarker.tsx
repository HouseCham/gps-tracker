import '@/styles/map/marker.css';
//-- React
import type { ReactNode, JSX } from 'react';
//-- Components
import type { MarkerStatus } from '@/types/components';
/**
 * @interface MapMarkerProps
 * @param {string} id - The ID of the device.
 * @param {MarkerStatus} status - The status of the device.
 * @param {string} name - The name of the device.
 * @param {number} lat - The latitude of the device.
 * @param {number} lng - The longitude of the device.
 * @param {boolean} selected - Whether the device is selected.
 * @param {function} onClick - The function to call when the device is clicked.
 * @param {ReactNode} children - The children to render inside the marker.
 * @param {boolean} showLabel - Whether to show the label.
 */
export interface MapMarkerProps {
    id: string;
    status: MarkerStatus;
    name?: string;
    lat: number;
    lng: number;
    selected?: boolean;
    onClick?: (id: string) => void;
    children?: ReactNode;
    showLabel?: boolean;
}
/**
 * MapMarker component
 * @prop {MapMarkerProps} props - The props for the MapMarker component.
 */
export default function MapMarker({
    id,
    status,
    name,
    selected = false,
    onClick,
    showLabel = true,
}: MapMarkerProps): JSX.Element {
    /**
     * The function to call when the marker is clicked.
     * @returns {void}
     */
    const handleClick = (): void => onClick?.(id);
    /**
     * The class to apply to the marker.
     * @type {string}
     */
    const statusClass = `map-marker--${status}`;
    /**
     * The classes to apply to the marker.
     * @type {string}
     */
    const classes = ['map-marker', statusClass, selected && 'is-selected']
        .filter(Boolean)
        .join(' ');

    return (
        <button
            type="button"
            className={classes}
            onClick={handleClick}
            aria-label={
                name ? `${name} — ${status}` : `Device ${id} — ${status}`
            }
            aria-pressed={selected}
            data-marker-id={id}
        >
            <span className="map-marker__pulse" aria-hidden="true" />
            <span className="map-marker__dot" aria-hidden="true" />
            {showLabel && name && (
                <span className="map-marker__label">{name}</span>
            )}
        </button>
    );
}
