import '@/styles/ui/modal.css';

import { X } from 'lucide-react';
import { useEffect, type JSX, type ReactNode } from 'react';

/**
 * Size presets for the modal dialog.
 * - `sm` — confirmation prompts and short forms (420px)
 * - `md` — default; Add/Edit forms (480px)
 * - `lg` — multi-field forms and rich content (560px)
 */
export type ModalSize = 'sm' | 'md' | 'lg';

const SIZE_TO_MAX_WIDTH: Record<ModalSize, number> = {
    sm: 420,
    md: 480,
    lg: 560,
};

/**
 * Props for the Modal component.
 * @interface ModalProps
 * @prop {boolean} open - Whether the modal is visible. When `false`, returns null and frees focus.
 * @prop {() => void} onClose - Called on backdrop click, close-button click, or Escape key.
 * @prop {string} title - Heading text; also used for `aria-label`.
 * @prop {string} [subtitle] - Optional supporting copy under the title.
 * @prop {ReactNode} [footer] - Optional footer area (typically Cancel + primary action buttons).
 * @prop {ModalSize} [size='md'] - Width preset.
 * @prop {ReactNode} children - Modal body content.
 */
export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    footer?: ReactNode;
    size?: ModalSize;
    children: ReactNode;
}

/**
 * Modal — accessible dialog with backdrop click + Escape dismiss.
 * Locks body scroll while open, restores focus behavior on close.
 * @param {ModalProps} props
 * @returns {JSX.Element | null}
 */
export function Modal({
    open,
    onClose,
    title,
    subtitle,
    footer,
    size = 'md',
    children,
}: ModalProps): JSX.Element | null {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return (): void => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="gp-modal-backdrop"
            onClick={onClose}
            role="presentation"
        >
            <div
                className={`gp-modal ${size === 'sm' ? 'is-sm' : size === 'lg' ? 'is-lg' : ''}`}
                style={{ maxWidth: SIZE_TO_MAX_WIDTH[size] }}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <header className="gp-modal-head">
                    <div className="gp-modal-head-text">
                        <div className="gp-modal-title">{title}</div>
                        {subtitle && (
                            <div className="gp-modal-sub">{subtitle}</div>
                        )}
                    </div>
                    <button
                        type="button"
                        className="gp-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                </header>
                <div className="gp-modal-body">{children}</div>
                {footer && <footer className="gp-modal-foot">{footer}</footer>}
            </div>
        </div>
    );
}
