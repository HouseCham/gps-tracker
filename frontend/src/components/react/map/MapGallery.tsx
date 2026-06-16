//-- React
import { useState, type JSX } from 'react';
//-- Types
import type { RouteSpeed } from '@/types/components';
//-- Constants
import { MAP_DEMO_PINS, MAP_DEMO_ROUTE } from '@/constants/components/map';
//-- Components
import DeviceMap from './DeviceMap';
import RoutePlayer from './RoutePlayer';

export default function MapGallery(): JSX.Element {
    const [selectedId, setSelectedId] = useState<string | null>('D-001');
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0.38);
    const [speed, setSpeed] = useState<RouteSpeed>(1);
    const [variant, setVariant] = useState<'default' | 'satellite'>('default');

    return (
        <div className="map-gallery">
            {/* Controls strip */}
            <div className="map-gallery__strip">
                <button
                    type="button"
                    className={`btn btn-sm ${variant === 'default' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setVariant('default')}
                >
                    Street
                </button>
                <button
                    type="button"
                    className={`btn btn-sm ${variant === 'satellite' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setVariant('satellite')}
                >
                    Satellite
                </button>
                <span className="map-gallery__hint">
                    {selectedId
                        ? `Selected: ${MAP_DEMO_PINS.find((p) => p.id === selectedId)?.name ?? selectedId}`
                        : 'Click a pin'}
                </span>
            </div>

            {/* Map */}
            <DeviceMap
                pins={MAP_DEMO_PINS}
                route={MAP_DEMO_ROUTE}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
                variant={variant}
                showLabels={true}
                showRoute={true}
                onZoomIn={() => { }}
                onZoomOut={() => { }}
                onLocate={() => setSelectedId('D-001')}
            />

            {/* Route player */}
            <div style={{ marginTop: '12px' }}>
                <RoutePlayer
                    playing={playing}
                    progress={progress}
                    currentLabel="Jan 12 · 14:32:05"
                    endLabel="Jan 12 · 18:47:22"
                    speed={speed}
                    onTogglePlay={() => setPlaying((p) => !p)}
                    onSeek={(p) => setProgress(p)}
                    onSpeedChange={(s) => setSpeed(s)}
                    onStepBack={() => setProgress((p) => Math.max(0, p - 0.05))}
                    onStepForward={() => setProgress((p) => Math.min(1, p + 0.05))}
                />
            </div>

            {/* Pin legend */}
            <div className="map-gallery__legend">
                {MAP_DEMO_PINS.map((pin) => (
                    <button
                        key={pin.id}
                        type="button"
                        className={`map-gallery__leg-item ${selectedId === pin.id ? 'is-active' : ''}`}
                        onClick={() => setSelectedId(selectedId === pin.id ? null : pin.id)}
                    >
                        <span className={`map-gallery__leg-dot map-gallery__leg-dot--${pin.status}`} />
                        <span className="map-gallery__leg-name">{pin.name}</span>
                        <span className="map-gallery__leg-status">{pin.status}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
