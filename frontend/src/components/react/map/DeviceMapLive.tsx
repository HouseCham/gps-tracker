//-- React
import { type JSX } from 'react';
//-- Types
import type { DeviceLocationPoint, MarkerStatus } from '@/types/components';
//-- Constants
import {
    MAP_ONLINE_THRESHOLD_MS,
    MAP_ROUTE_LINE_COLOR,
    MAP_STYLE_URL,
} from '@/constants/components';
//-- Components
import { MapPin } from 'lucide-react';
import Map, {
    Layer,
    Marker,
    NavigationControl,
    ScaleControl,
    Source,
} from 'react-map-gl/maplibre';
import MapMarker from './MapMarker';

/**
 * @interface DeviceMapLiveProps
 * @param {DeviceLocationPoint | null} location - Latest device location (null renders an empty state).
 * @param {DeviceLocationPoint[]} [route] - Recent route history drawn as a polyline.
 * @param {string} [deviceName] - Optional device name rendered in the marker label.
 * @param {string} [className] - Extra class appended to the wrapper.
 */
interface DeviceMapLiveProps {
    location: DeviceLocationPoint | null;
    route?: DeviceLocationPoint[];
    deviceName?: string;
    className?: string;
}

/**
 * @function statusFromRecordedAt
 * @description Derives a MarkerStatus from how long ago the reading was taken.
 */
function statusFromRecordedAt(recordedAt: string | undefined): MarkerStatus {
    if (!recordedAt) return 'never-seen';
    const age = Date.now() - new Date(recordedAt).getTime();
    if (Number.isNaN(age) || age < 0) return 'unknown';
    return age <= MAP_ONLINE_THRESHOLD_MS ? 'online' : 'offline';
}

/**
 * DeviceMapLive — MapLibre-backed map for the device-detail page.
 * Renders the device's latest location as an HTML marker and the recent
 * route as a GeoJSON LineString layer. Stub data until the backend
 * exposes location endpoints.
 * @param {DeviceMapLiveProps} props - The props for the component.
 * @returns {JSX.Element} The rendered map.
 */
export default function DeviceMapLive({
    location,
    route,
    deviceName,
    className,
}: DeviceMapLiveProps): JSX.Element {
    const hasLocation = location !== null;
    const initialCenter = location
        ? { longitude: location.lng, latitude: location.lat }
        : { longitude: -99.1332, latitude: 19.4326 };

    const markerStatus = statusFromRecordedAt(location?.recordedAt);

    /**
     * @function routeGeoJson
     * @description Renders the route as a GeoJSON LineString layer.
     */
    const routeGeoJson = (() => {
        const points = route ?? [];
        if (points.length < 2) return null;
        return {
            type: 'FeatureCollection' as const,
            features: [
                {
                    type: 'Feature' as const,
                    geometry: {
                        type: 'LineString' as const,
                        coordinates: points.map(p => [p.lng, p.lat]),
                    },
                    properties: {},
                },
            ],
        };
    })();

    const wrapperClass = ['device-map-live', className]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={wrapperClass}
            role="region"
            aria-label="Device location"
        >
            <Map
                mapStyle={MAP_STYLE_URL}
                initialViewState={{
                    ...initialCenter,
                    zoom: 14,
                    pitch: 0,
                    bearing: 0,
                }}
                dragRotate={false}
                pitchWithRotate={false}
                touchPitch={false}
                boxZoom={false}
                attributionControl={{ compact: true }}
            >
                <NavigationControl
                    position="top-right"
                    visualizePitch={false}
                />
                <ScaleControl position="bottom-left" unit="metric" />

                {routeGeoJson && (
                    <Source id="route" type="geojson" data={routeGeoJson}>
                        <Layer
                            id="route-line"
                            type="line"
                            paint={{
                                'line-color': MAP_ROUTE_LINE_COLOR,
                                'line-width': [
                                    'interpolate',
                                    ['linear'],
                                    ['zoom'],
                                    10,
                                    3,
                                    16,
                                    6,
                                    19,
                                    10,
                                ],
                                'line-opacity': 0.9,
                            }}
                            layout={{
                                'line-cap': 'round',
                                'line-join': 'round',
                            }}
                        />
                    </Source>
                )}

                {location && (
                    <Marker
                        longitude={location.lng}
                        latitude={location.lat}
                        anchor="center"
                    >
                        <MapMarker
                            id="live"
                            name={deviceName}
                            status={markerStatus}
                            lat={location.lat}
                            lng={location.lng}
                            selected
                            showLabel={Boolean(deviceName)}
                        />
                    </Marker>
                )}
            </Map>

            {!hasLocation && (
                <div className="device-map-live__empty">
                    <MapPin size={28} strokeWidth={1.5} aria-hidden="true" />
                    <p className="device-map-live__empty-text">
                        No location data yet
                    </p>
                </div>
            )}
        </div>
    );
}
