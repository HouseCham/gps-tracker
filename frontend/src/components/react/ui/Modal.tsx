import '@/styles/ui/modal.css';
//-- React
import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
//-- Types
import type { ModalSize, ModalVariant } from '@/types/components/ui';
//-- Icons
import { X } from 'lucide-react';
/**
 * @interface ModalProps
 * @property {boolean} open - Whether the modal is open.
 * @property {() => void} onClose - The function to call when the modal is closed.
 * @property {string} title - The title of the modal.
 * @property {ReactNode} children - The children of the modal.
 * @property {ReactNode | undefined} footer - The footer of the modal.
 * @property {ModalVariant} variant - The variant of the modal.
 * @property {ModalSize} size - The size of the modal.
 * @property {boolean} closeOnBackdrop - Whether to close the modal when the backdrop is clicked.
 * @property {boolean} closeOnEscape - Whether to close the modal when the escape key is pressed.
 * @property {React.RefObject<HTMLElement> | undefined} initialFocusRef - The ref to focus when the modal is opened.
 */
interface ModalProps {
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
 * @component Modal
 * @description Modal component for displaying content in a modal window.
 * @props {ModalProps} props - The props for the Modal component.
 * @returns {React.JSX.Element | null} The rendered Modal component.
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

        const focusTarget = initialFocusRef?.current ?? panelRef.current;
        focusTarget?.focus();

        return (): void => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose, closeOnEscape, initialFocusRef]);

    if (!open) return null;

    const onBackdropClick = (e: React.MouseEvent): void => {
        if (!closeOnBackdrop) return;
        if (e.target === e.currentTarget) onClose();
    };

    const onSentinelFocus = (direction: 'start' | 'end'): void => {
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (first === undefined || last === undefined) return;
        if (direction === 'start') {
            last.focus();
        } else {
            first.focus();
        }
    };

    return (
        <div
            className="modal-backdrop is-open"
            onMouseDown={onBackdropClick}
            aria-hidden={false}
        >
            <button
                ref={startSentinelRef}
                type="button"
                tabIndex={0}
                className="modal-sentinel"
                aria-hidden="true"
                onFocus={() => onSentinelFocus('start')}
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
                onFocus={() => onSentinelFocus('end')}
            />
        </div>
    );
}
