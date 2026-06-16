import { ToastContainer, type ToastContainerProps } from "@/components/react/ui";
import type { ToastHandle, ToastItem } from "@/types/components";
import { useState, useRef, useCallback, type ReactElement } from "react";
/**
 * @interface UseToastOptions
 * @param {string} [position='bottom-right'] - The position of the toasts.
 * @returns {ToastHandle}
 */
interface UseToastOptions {
    position?: ToastContainerProps['position'];
}
/**
 * Use the toast hook.
 * @param {UseToastOptions} options - The options of the toast hook.
 * @returns {ToastHandle} The toast handle.
 */
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
        setToasts((prev): ToastItem[] => prev.filter(t => t.id !== id));
    }, []);

    const clear = useCallback((): void => setToasts([]), []);

    const Container = useCallback(
        (): ReactElement => (
            <ToastContainer
                toasts={toasts}
                onClose={dismiss}
                position={options.position}
            />
        ),
        [toasts, dismiss, options.position]
    );

    return { toasts, push, dismiss, clear, Container };
}