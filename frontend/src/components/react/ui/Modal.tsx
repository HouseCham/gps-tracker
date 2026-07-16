import '@/styles/ui/modal.css';
//-- React
import { useEffect, useId, useRef } from 'react';
//-- Types
import type { ReactNode } from 'react';
import type { ModalSize, ModalVariant } from '@/types/components';
//-- Icons
import { X } from 'lucide-react';
/**
 * @interface ModalProps
 * @param {boolean} open - Whether the modal is open.
 * @param {function} onClose - The function to call when the modal is closed.
 * @param {string} title - The title of the modal.
 * @param {ReactNode} children - The children of the modal.
 * @param {ReactNode} footer - The footer of the modal.
 * @param {ModalVariant} [variant='default'] - The variant of the modal.
 * @param {ModalSize} [size='md'] - The size of the modal.
 * @param {boolean} [closeOnBackdrop=true] - Whether to close the modal when the backdrop is clicked.
 * @param {boolean} [closeOnEscape=true] - Whether to close the modal when the escape key is pressed.
 * @param {React.RefObject<HTMLElement>} [initialFocusRef] - The ref of the element to focus when the modal is opened.
 */
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
/**
 * Renders a modal component.
 * @param {ModalProps} props - The props for the component.
 * @returns {React.JSX.Element | null} The rendered component.
 */
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

        return (): void => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose, closeOnEscape]);

    // Separate effect: only refocus on open transitions or when the
    // initialFocusRef identity changes. Keeping focus out of the effect
    // above prevents an unstable `onClose` (e.g. an inline handler from
    // the parent) from stealing focus from inputs on every keystroke.
    useEffect(() => {
        if (!open) return;
        (initialFocusRef?.current ?? panelRef.current)?.focus();
    }, [open, initialFocusRef]);

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
