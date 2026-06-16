import type { ToastVariant } from '@/types/components/ui';
import {
    CheckCircle2,
    CircleX,
    Info,
    TriangleAlert,
} from 'lucide-react';
/**
 * @constant
 * @description Icon for each toast variant
 * @type {Record<ToastVariant, typeof CheckCircle2>}
 */
export const MODAL_VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
    success: CheckCircle2,
    error: CircleX,
    warning: TriangleAlert,
    info: Info,
};
/**
 * @constant
 * @description Class for each toast variant
 * @type {Record<ToastVariant, string>}
 */
export const MODAL_VARIANT_CLASS: Record<ToastVariant, string> = {
    success: 'toast--success',
    error: 'toast--error',
    warning: 'toast--warning',
    info: 'toast--info',
};