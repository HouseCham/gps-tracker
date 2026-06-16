import type { ReactElement } from "react";

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
/**
 * @interface ToastItem
 * @property {string} id - The unique identifier of the toast.
 * @property {ToastVariant} variant - The variant of the toast.
 * @property {string} title - The title of the toast.
 * @property {string | undefined} message - The message of the toast.
 * @property {number | undefined} duration - The duration of the toast in milliseconds.
 * @property {{ label: string; onClick: () => void } | undefined} action - The action of the toast.
 */
export interface ToastItem {
    id: string;
    variant: ToastVariant;
    title: string;
    message?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
}
/**
 * @interface ToastHandle
 * @property {ToastItem[]} toasts - The toasts.
 * @property {function} push - The function to push a toast.
 * @property {function} dismiss - The function to dismiss a toast.
 * @property {function} clear - The function to clear all toasts.
 * @property {function} Container - The function to render the toast container.
 */
export interface ToastHandle {
    toasts: ToastItem[];
    push: (item: Omit<ToastItem, 'id'>) => string;
    dismiss: (id: string) => void;
    clear: () => void;
    Container: () => ReactElement;
}