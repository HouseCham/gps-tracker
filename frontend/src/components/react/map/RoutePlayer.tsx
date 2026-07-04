import '@/styles/map/route-player.css';
//-- React
import { type JSX } from 'react';
//-- Icons
import { Pause, Play, Rewind, FastForward } from 'lucide-react';
//-- Types
import type { RouteSpeed } from '@/types/components';
import { MAP_SPEED_OPTIONS } from '@/constants/components';
/**
 * @interface RoutePlayerProps
 * @param {boolean} playing - Whether the route is currently playing.
 * @param {number} progress - The current progress of the route.
 * @param {string} [currentLabel] - The label of the current location.
 * @param {string} [endLabel] - The label of the end location.
 * @param {RouteSpeed} speed - The speed of the route.
 * @param {function} [onTogglePlay] - The function to call when the play button is clicked.
 * @param {function} [onSeek] - The function to call when the scrubber is moved.
 * @param {function} [onSpeedChange] - The function to call when the speed is changed.
 * @param {function} [onStepBack] - The function to call when the step back button is clicked.
 * @param {function} [onStepForward] - The function to call when the step forward button is clicked.
 * @param {boolean} [disabled] - Whether the player is disabled.
 */
interface RoutePlayerProps {
    playing: boolean;
    progress: number;
    currentLabel?: string;
    endLabel?: string;
    speed: RouteSpeed;
    onTogglePlay?: () => void;
    onSeek?: (progress: number) => void;
    onSpeedChange?: (speed: RouteSpeed) => void;
    onStepBack?: () => void;
    onStepForward?: () => void;
    disabled?: boolean;
}
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
}: RoutePlayerProps): JSX.Element {
    /**
     * Handles scrubbing through the route.
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    function handleScrub(e: React.ChangeEvent<HTMLInputElement>): void {
        onSeek?.(Number(e.target.value) / 1000);
    }
    /**
     * Handles changing the speed.
     * @param {React.MouseEvent<HTMLButtonElement>} e
     */
    function handleSpeedClick(e: React.MouseEvent<HTMLButtonElement>): void {
        // ponytail: `data-speed` is set from MAP_SPEED_OPTIONS (typed RouteSpeed)
        // at the call site below, so the runtime value is always 1 | 2 | 4 even
        // though `dataset.speed` widens to `string | undefined`. The cast narrows
        // the result of `Number(...)` to the RouteSpeed literal union.
        const speed = Number(e.currentTarget.dataset.speed) as RouteSpeed;
        onSpeedChange?.(speed);
    }
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

            <div
                className="route-player__speed"
                role="group"
                aria-label="Playback speed"
            >
                {MAP_SPEED_OPTIONS.map(option => (
                    <button
                        key={option}
                        type="button"
                        className={`route-player__speed-btn ${speed === option ? 'is-active' : ''}`}
                        data-speed={option}
                        onClick={handleSpeedClick}
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
