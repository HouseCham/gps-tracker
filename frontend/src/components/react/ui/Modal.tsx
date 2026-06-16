import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import './modal.css';

export type ModalVariant = 'default' | 'danger';
export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    variant?: ModalVariant;
    size?: ModalSize;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    initialFocusRef?: React.RefObject<HTMLElement>;
}

export default function Modal({
    open,
    onClose,
    title,
    children,
    footer,
    variant = 'default',
    size = 'md',
    closeOnBackdrop = true,
    closeOnEscape = true,
    initialFocusRef,
}: ModalProps): React.JSX.Element | null {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const startSentinelRef = useRef<HTMLButtonElement>(null);
    const endSentinelRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape' && closeOnEscape) {
                e.stopPropagation();
                onClose();
            }
        };
        document.addEventListener('keydown', onKey);
        (initialFocusRef?.current ?? panelRef.current)?.focus();

        return (): void => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose, closeOnEscape, initialFocusRef]);

    if (!open) return null;

    const onBackdropPointer = (e: React.MouseEvent): void => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
    };

    const onSentinelFocus = (dir: 'start' | 'end'): void => {
        const all = panelRef.current?.querySelectorAll<HTMLElement>(
            'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
        );
        if (!all || all.length === 0) return;
        (dir === 'start' ? all[all.length - 1] : all[0])?.focus();
    };

    return (
        <div className="modal-backdrop is-open" onMouseDown={onBackdropPointer}>
            <button
                ref={startSentinelRef}
                type="button"
                tabIndex={0}
                className="modal-sentinel"
                aria-hidden="true"
                onFocus={(): void => onSentinelFocus('start')}
            />
            <div
                ref={panelRef}
                className={`modal modal--${variant} modal--${size}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
            >
                <header className="modal-head">
                    <h2 id={titleId} className="modal-title">
                        {title}
                    </h2>
                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        <X size={18} strokeWidth={1.75} />
                    </button>
                </header>
                <div className="modal-body">{children}</div>
                {footer && <footer className="modal-foot">{footer}</footer>}
            </div>
            <button
                ref={endSentinelRef}
                type="button"
                tabIndex={0}
                className="modal-sentinel"
                aria-hidden="true"
                onFocus={(): void => onSentinelFocus('end')}
            />
        </div>
    );
}
