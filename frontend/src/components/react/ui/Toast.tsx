import '@/styles/ui//toast.css';
//-- React
import {
    useEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
//-- Types
import type { ToastItem } from '@/types/components';
//-- Constants
import { MODAL_VARIANT_CLASS, MODAL_VARIANT_ICON } from '@/constants/components/ui';
//-- Icons
import { X } from 'lucide-react';
/**
 * @interface ToastProps
 * @param {string} variant - The variant of the toast.
 * @param {string} title - The title of the toast.
 * @param {string} message - The message of the toast.
 * @param {number} [duration=3000] - The duration of the toast.
 * @param {ToastAction} [action] - The action of the toast.
 * @param {function} onClose - The function to call when the toast is closed.
 */
export interface ToastProps extends ToastItem {
    onClose: () => void;
}
/**
 * Render a toast.
 * @param {ToastProps} props - The props of the toast.
 * @returns {React.JSX.Element} The toast.
 */
export default function Toast({
    variant,
    title,
    message,
    duration = 3000,
    action,
    onClose,
}: ToastProps): React.JSX.Element {
    const Icon = MODAL_VARIANT_ICON[variant];
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [hiding, setHiding] = useState<boolean>(false);

    useEffect(() => {
        if (duration <= 0) return;
        timerRef.current = setTimeout((): void => setHiding(true), duration);
        return (): void => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [duration]);

    useEffect(() => {
        if (!hiding) return;
        const t = setTimeout(onClose, 220);
        return (): void => clearTimeout(t);
    }, [hiding, onClose]);

    const handleAction = (): void => {
        action?.onClick();
        setHiding(true);
    };

    return (
        <div
            className={`toast ${MODAL_VARIANT_CLASS[variant]} ${hiding ? 'is-hiding' : ''}`}
            role={
                variant === 'error' || variant === 'warning'
                    ? 'alert'
                    : 'status'
            }
            aria-live={variant === 'error' ? 'assertive' : 'polite'}
        >
            <span className="toast-icon" aria-hidden="true">
                <Icon size={16} strokeWidth={2} />
            </span>
            <div className="toast-body">
                <div className="toast-title">{title}</div>
                {message && <div className="toast-desc">{message}</div>}
                {duration > 0 && (
                    <div
                        className="toast-progress"
                        style={{ animationDuration: `${duration}ms` }}
                        aria-hidden="true"
                    />
                )}
            </div>
            {action && (
                <button
                    type="button"
                    className="toast-action"
                    onClick={handleAction}
                >
                    {action.label}
                </button>
            )}
            <button
                type="button"
                className="toast-x"
                onClick={(): void => setHiding(true)}
                aria-label="Dismiss notification"
            >
                <X size={14} strokeWidth={2} />
            </button>
        </div>
    );
}
/**
 * @interface ToastContainerProps
 * @param {ToastItem[]} toasts - The toasts to render.
 * @param {function} onClose - The function to call when a toast is closed.
 * @param {string} [position='bottom-right'] - The position of the toasts.
 */
export interface ToastContainerProps {
    toasts: ToastItem[];
    onClose: (id: string) => void;
    position?:
        | 'top-right'
        | 'top-left'
        | 'bottom-right'
        | 'bottom-left'
        | 'top-center'
        | 'bottom-center';
}
/**
 * Render a toast container.
 * @param {ToastContainerProps} props - The props of the toast container.
 * @returns {React.JSX.Element | null} The toast container.
 */
export function ToastContainer({
    toasts,
    onClose,
    position = 'bottom-right',
}: ToastContainerProps): React.JSX.Element | null {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <div
            className={`toast-stack toast-stack--${position}`}
            aria-label="Notifications"
        >
            {toasts.map(t => (
                <Toast
                    key={t.id}
                    id={t.id}
                    variant={t.variant}
                    title={t.title}
                    message={t.message}
                    duration={t.duration}
                    action={t.action}
                    onClose={(): void => onClose(t.id)}
                />
            ))}
        </div>,
        document.body
    );
}
