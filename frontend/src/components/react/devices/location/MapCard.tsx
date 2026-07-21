//-- Types
import type { Translation } from "@/i18n";
import type { LocationPoint } from "@/types/api";
import type { Language } from "@/types/i18n";
import type { JSX } from "react/jsx-runtime";
//-- Components
import { Button } from "@/components/react/ui";
//-- Icons
import { MapPin, RefreshCw } from "lucide-react";
//-- Utils
import { formatRelativeTime } from "@/lib";
/**
 * Props for the MapCard component
 * @interface MapCardProps
 * @prop {LocationPoint | null} location - Location details.
 * @prop {Language} locale - Locale.
 * @prop {Translation['device']} translations - Translations.
 * @prop {boolean} loading - Loading state.
 * @prop {() => void} onRefresh - Callback for the refresh button.
 */
interface MapCardProps {
    location: LocationPoint | null;
    locale: Language;
    translations: Translation['device'];
    loading: boolean;
    onRefresh: () => void;
}
/**
 * MapCard component
 * @param {MapCardProps} props - Props for the MapCard component
 * @returns {JSX.Element} The rendered MapCard component
 */
export function MapCard({
    location,
    locale,
    translations,
    loading,
    onRefresh,
}: MapCardProps): JSX.Element {
    const t = translations.detail;
    return (
        <div className="dd-card">
            <div className="dd-card-head">
                <div>
                    <h3>{t.liveGps}</h3>
                    <div className="dd-card-sub">
                        {location
                            ? `${t.latestReading} · ${formatRelativeTime(location.recorded_at, locale)}`
                            : t.noLocation}
                    </div>
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={loading}
                    icon={<RefreshCw size={13} />}
                    onClick={onRefresh}
                >
                    {t.refresh}
                </Button>
            </div>
            <div className="dd-map" aria-label={t.mapLabel}>
                <div className="dd-map-canvas" />
                <svg
                    className="dd-map-road"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <path
                        d="M 0 40 Q 30 40 50 50 T 100 60"
                        fill="none"
                        stroke="var(--border-strong)"
                        strokeWidth="0.4"
                        strokeDasharray="2 2"
                    />
                    <path
                        d="M 30 0 Q 30 30 50 50 T 70 100"
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="0.4"
                        strokeDasharray="1 3"
                    />
                </svg>
                {location ? (
                    <>
                        <div className="dd-map-pulse" aria-hidden="true" />
                        <div className="dd-map-pin" aria-hidden="true">
                            <MapPin size={32} strokeWidth={1.8} />
                        </div>
                        <div className="dd-map-live">
                            <span className="dd-map-live-dot" />
                            {t.liveTracking}
                        </div>
                        <div className="dd-map-coords">
                            {location.latitude.toFixed(4)}°,{' '}
                            {location.longitude.toFixed(4)}°
                        </div>
                    </>
                ) : (
                    <div className="dd-map-empty">
                        <MapPin size={26} />
                        <span>{t.noLocation}</span>
                    </div>
                )}
            </div>
        </div>
    );
}