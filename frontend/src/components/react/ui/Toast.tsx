import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import './toast.css';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id: string;
    variant: ToastVariant;
    title: string;
    message?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
}

export interface ToastProps extends ToastItem {
    onClose: () => void;
}

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
    success: CheckCircle2,
    error: CircleX,
    warning: TriangleAlert,
    info: Info,
};

const VARIANT_CLASS: Record<ToastVariant, string> = {
    success: 'toast--success',
    error: 'toast--error',
    warning: 'toast--warning',
    info: 'toast--info',
};

export default function Toast({
    variant,
    title,
    message,
    duration = 3000,
    action,
    onClose,
}: ToastProps): React.JSX.Element {
    const Icon = VARIANT_ICON[variant];
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [hiding, setHiding] = useState<boolean>(false);

    useEffect(() => {
        if (duration <= 0) return;
        timerRef.current = setTimeout((): void => setHiding(true), duration);
        return (): void => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [duration]);

    useEffect(() => {
        if (!hiding) return;
        const t = setTimeout(onClose, 220);
        return (): void => clearTimeout(t);
    }, [hiding, onClose]);

    const handleAction = (): void => { action?.onClick(); setHiding(true); };

    return (
        <div
            className={`toast ${VARIANT_CLASS[variant]} ${hiding ? 'is-hiding' : ''}`}
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
                <button type="button" className="toast-action" onClick={handleAction}>
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

export interface ToastContainerProps {
    toasts: ToastItem[];
    onClose: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastContainer({
    toasts,
    onClose,
    position = 'bottom-right',
}: ToastContainerProps): React.JSX.Element | null {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <div className={`toast-stack toast-stack--${position}`} aria-label="Notifications">
            {toasts.map((t) => (
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

export function useToast(options: UseToastOptions = {}): ToastHandle {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counter = useRef(0);

    const push = useCallback((item: Omit<ToastItem, 'id'>): string => {
        counter.current += 1;
        const id = `t-${Date.now()}-${counter.current}`;
        setToasts((prev): ToastItem[] => [...prev, { ...item, id }].slice(-5));
        return id;
    }, []);

    const dismiss = useCallback((id: string): void => {
        setToasts((prev): ToastItem[] => prev.filter((t) => t.id !== id));
    }, []);

    const clear = useCallback((): void => setToasts([]), []);

    const Container = useCallback(
        (): ReactElement => (
            <ToastContainer toasts={toasts} onClose={dismiss} position={options.position} />
        ),
        [toasts, dismiss, options.position],
    );

    return { toasts, push, dismiss, clear, Container };
}
