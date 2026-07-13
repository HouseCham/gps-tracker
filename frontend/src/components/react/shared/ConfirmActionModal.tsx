//-- React
import { type ChangeEventHandler, type JSX } from 'react';
import Modal from '@/components/react/ui/Modal';
import { Button, Input } from '@/components/ui';

/**
 * Shared substrate for the destructive-action modals used across admin
 * tables (user delete, device delete, api key revoke). Renders a danger
 * modal with a warning, optional typed-name confirmation, and cancel /
 * confirm buttons. The parent owns the entity shape, the service call,
 * and the success toast; this component only owns the modal markup,
 * the typed-name gate, and the loading state of the confirm button.
 * @interface ConfirmActionModalProps
 */
export interface ConfirmActionModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    warning: string;
    rootClassName: string;
    warningClassName: string;
    errorClassName: string;
    confirmLabel: string;
    cancelLabel: string;
    isLoading: boolean;
    errorMessage: string | null;
    onConfirm: () => void;
    // Typed-name confirmation (optional). The input is rendered only when
    // both `confirmName` and `expectedName` are provided; the confirm
    // button is gated on `confirmName.trim() === expectedName.trim()`.
    confirmNameLabel?: string;
    confirmNamePlaceholder?: string;
    confirmName?: string;
    expectedName?: string;
    onConfirmNameChange?: ChangeEventHandler<HTMLInputElement>;
}

/**
 * ConfirmActionModal component.
 * @param {ConfirmActionModalProps} props - Component props.
 * @returns {JSX.Element} The rendered modal.
 */
export function ConfirmActionModal({
    open,
    onClose,
    title,
    warning,
    rootClassName,
    warningClassName,
    errorClassName,
    confirmLabel,
    cancelLabel,
    isLoading,
    errorMessage,
    onConfirm,
    confirmNameLabel,
    confirmNamePlaceholder,
    confirmName,
    expectedName,
    onConfirmNameChange,
}: ConfirmActionModalProps): JSX.Element {
    const requiresTypedName =
        confirmName !== undefined && expectedName !== undefined;
    const canConfirm =
        !isLoading &&
        (!requiresTypedName ||
            (confirmName?.trim() ?? '') === expectedName.trim());
    const inputPlaceholder = expectedName ?? confirmNamePlaceholder ?? '';

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            variant="danger"
            size="md"
            footer={
                <>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={onConfirm}
                        disabled={!canConfirm}
                        loading={isLoading && canConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <div className={rootClassName}>
                <p className={warningClassName} role="alert">
                    {warning}
                </p>
                {requiresTypedName && (
                    <Input
                        name="confirm-action-name"
                        label={confirmNameLabel}
                        placeholder={inputPlaceholder}
                        value={confirmName}
                        onChange={onConfirmNameChange}
                        disabled={isLoading}
                        autocomplete="off"
                    />
                )}
                {errorMessage && (
                    <p className={errorClassName} role="alert">
                        {errorMessage}
                    </p>
                )}
            </div>
        </Modal>
    );
}