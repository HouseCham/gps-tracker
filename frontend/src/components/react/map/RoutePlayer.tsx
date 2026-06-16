import '@/styles/map/route-player.css';
//-- React
import { useCallback } from 'react';
//-- Icons
import { Pause, Play, Rewind, FastForward } from 'lucide-react';
//-- Types
import type { RouteSpeed } from '@/types/components';

export interface RoutePlayerProps {
    playing: boolean;
    /** 0–1 progress through the route. */
    progress: number;
    /** Display label for the current playhead time, e.g. "Jan 12, 14:32:05". */
    currentLabel?: string;
    /** Display label for the end of the route. */
    endLabel?: string;
    speed: RouteSpeed;
    onTogglePlay?: () => void;
    onSeek?: (progress: number) => void;
    onSpeedChange?: (speed: RouteSpeed) => void;
    onStepBack?: () => void;
    onStepForward?: () => void;
    disabled?: boolean;
}

const SPEED_OPTIONS: RouteSpeed[] = [1, 2, 4];

/**
 * RoutePlayer — control bar for scrubbing through a device's location history.
 *
 * Pure controlled component. The parent owns `playing` / `progress` / `speed`
 * and is responsible for the actual time-based animation. The player just
 * surfaces the controls.
 */
export default function RoutePlayer({
    playing,
    progress,
    currentLabel,
    endLabel,
    speed,
    onTogglePlay,
    onSeek,
    onSpeedChange,
    onStepBack,
    onStepForward,
    disabled = false,
}: RoutePlayerProps): React.JSX.Element {
    const handleScrub = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>): void => {
            onSeek?.(Number(e.target.value) / 1000);
        },
        [onSeek],
    );

    const handleSpeed = useCallback(
        (next: RouteSpeed): void => {
            onSpeedChange?.(next);
        },
        [onSpeedChange],
    );

    return (
        <div
            className={`route-player ${disabled ? 'is-disabled' : ''}`}
            role="group"
            aria-label="Route player"
        >
            <div className="route-player__main">
                <button
                    type="button"
                    className="route-player__btn"
                    onClick={onStepBack}
                    disabled={disabled}
                    aria-label="Step backward"
                >
                    <Rewind size={16} strokeWidth={2} />
                </button>
                <button
                    type="button"
                    className={`route-player__btn route-player__btn--primary ${playing ? 'is-playing' : ''}`}
                    onClick={onTogglePlay}
                    disabled={disabled}
                    aria-label={playing ? 'Pause' : 'Play'}
                    aria-pressed={playing}
                >
                    {playing ? (
                        <Pause size={16} strokeWidth={2} />
                    ) : (
                        <Play size={16} strokeWidth={2} />
                    )}
                </button>
                <button
                    type="button"
                    className="route-player__btn"
                    onClick={onStepForward}
                    disabled={disabled}
                    aria-label="Step forward"
                >
                    <FastForward size={16} strokeWidth={2} />
                </button>

                <div className="route-player__scrub">
                    <span className="route-player__time route-player__time--mono">
                        {currentLabel ?? '00:00:00'}
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={1000}
                        step={1}
                        value={Math.round(progress * 1000)}
                        onChange={handleScrub}
                        disabled={disabled}
                        className="route-player__range"
                        aria-label="Scrub through route"
                        aria-valuemin={0}
                        aria-valuemax={1000}
                        aria-valuenow={Math.round(progress * 1000)}
                    />
                    <span className="route-player__time route-player__time--mono">
                        {endLabel ?? '00:00:00'}
                    </span>
                </div>
            </div>

            <div className="route-player__speed" role="group" aria-label="Playback speed">
                {SPEED_OPTIONS.map((option) => (
                    <button
                        key={option}
                        type="button"
                        className={`route-player__speed-btn ${speed === option ? 'is-active' : ''}`}
                        onClick={(): void => handleSpeed(option)}
                        disabled={disabled}
                        aria-pressed={speed === option}
                    >
                        {option}×
                    </button>
                ))}
            </div>
        </div>
    );
}
