import '@/styles/ui/toast.css';
//-- React
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
//-- Icons
import { X } from 'lucide-react';
//-- Types
import type { ToastItem } from '@/types/components/ui';
//-- Constants
import { 
    MODAL_VARIANT_CLASS,
    MODAL_VARIANT_ICON
} from '@/constants/components/ui';
/**
 * @interface ToastProps
 * @extends ToastItem
 * @property {string} id - The unique identifier of the toast.
 * @property {ToastVariant} variant - The variant of the toast.
 * @property {string} title - The title of the toast.
 * @property {string | undefined} message - The message of the toast.
 * @property {number | undefined} duration - The duration of the toast in milliseconds.
 * @property {{ label: string; onClick: () => void } | undefined} action - The action of the toast.
 * @property {() => void} onClose - The function to call when the toast is closed.
 */
interface ToastProps extends ToastItem {
    onClose: () => void;
}
/**
 * Single Toast. Auto-dismisses after `duration` ms (default 3000).
 * If `duration` is 0 or negative, the toast is sticky and must be closed manually.
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
    const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isHiding, setIsHiding] = useState<boolean>(false);

    useEffect(() => {
        if (duration <= 0) return;
        dismissTimerRef.current = setTimeout((): void => {
            setIsHiding(true);
        }, duration);
        return (): void => {
            if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        };
    }, [duration]);

    useEffect(() => {
        if (!isHiding) return;
        const t = setTimeout(onClose, 220);
        return (): void => clearTimeout(t);
    }, [isHiding, onClose]);

    const handleAction = (): void => {
        action?.onClick();
        setIsHiding(true);
    };

    return (
        <div
            className={`toast ${MODAL_VARIANT_CLASS[variant]} ${isHiding ? 'is-hiding' : ''}`}
            role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
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
                onClick={() => setIsHiding(true)}
                aria-label="Dismiss notification"
            >
                <X size={14} strokeWidth={2} />
            </button>
        </div>
    );
}

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
 * ToastContainer — render a stack of toasts in a fixed position.
 * Mount once per page and push new ToastItem objects into `toasts`.
 * Use the `useToast()` hook for ergonomic push/dismiss.
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
            {toasts.map((t) => (
                <Toast
                    key={t.id}
                    id={t.id}
                    variant={t.variant}
                    title={t.title}
                    message={t.message}
                    duration={t.duration}
                    action={t.action}
                    onClose={() => onClose(t.id)}
                />
            ))}
        </div>,
        document.body,
    );
}

interface UseToastOptions {
    position?: ToastContainerProps['position'];
}

export interface ToastHandle {
    toasts: ToastItem[];
    push: (item: Omit<ToastItem, 'id'>) => string;
    dismiss: (id: string) => void;
    clear: () => void;
    Container: () => ReactElement;
}

/**
 * useToast — small hook for managing a toast stack.
 * Returns the current list, a `push` function, and a `Container`
 * component to render once at the page root.
 *
 * @example
 *   const toast = useToast();
 *   <toast.Container />
 *   <Button onClick={() => toast.push({ variant: 'success', title: 'Saved' })}>Save</Button>
 */
export function useToast(options: UseToastOptions = {}): ToastHandle {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counterRef = useRef(0);

    const push = useCallback((item: Omit<ToastItem, 'id'>): string => {
        counterRef.current += 1;
        const id = `t-${Date.now()}-${counterRef.current}`;
        setToasts((prev): ToastItem[] => {
            const next = [...prev, { ...item, id }];
            return next.slice(-5);
        });
        return id;
    }, []);

    const dismiss = useCallback((id: string): void => {
        setToasts((prev): ToastItem[] => prev.filter((t) => t.id !== id));
    }, []);

    const clear = useCallback((): void => setToasts([]), []);

    const Container = useCallback((): ReactElement => {
        return (
            <ToastContainer
                toasts={toasts}
                onClose={dismiss}
                position={options.position}
            />
        );
    }, [toasts, dismiss, options.position]);

    return { toasts, push, dismiss, clear, Container };
}
