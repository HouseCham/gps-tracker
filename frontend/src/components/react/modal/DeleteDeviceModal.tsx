import { useEffect, useState, type ChangeEvent } from "react";
//-- Types
import type { Translation } from "@/i18n";
import type { DeviceWithAccess } from "@/types/api";
import type { JSX } from "react/jsx-runtime";
//-- Icons
import { AlertTriangle, Trash2 } from "lucide-react";
//-- Components
import { Button, Modal } from "@/components/react/ui";
import { VehicleIcon } from "@/components/react/devices";
import { Field, Input } from "@/components/react/form/ui";
//-- Utils
import { interpolateTemplate } from "@/lib";
/**
 * Props for the DeleteDeviceModal component.
 * @interface DeleteDeviceModalProps
 * @prop {boolean} open - Whether the modal is open.
 * @prop {DeviceWithAccess | null} device - The device to be deleted.
 * @prop {() => void} onClose - Callback for closing the modal.
 * @prop {() => Promise<void> | void} onConfirm - Callback for confirming the deletion.
 * @prop {Translation['device']} t - Translation strings.
 */
interface DeleteDeviceModalProps {
    open: boolean;
    device: DeviceWithAccess | null;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    t: Translation['device'];
}
/**
 * The DeleteDeviceModal component.
 * @param {DeleteDeviceModalProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered component.
 */
export function DeleteDeviceModal({
    open,
    device,
    onClose,
    onConfirm,
    t,
}: DeleteDeviceModalProps): JSX.Element | null {
    const [typed, setTyped] = useState('');
    useEffect(() => {
        if (open) setTyped('');
    }, [open]);
    if (!open || !device) return null;
    const canConfirm = typed.trim() === device.name;
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t.modals.deleteTitle}
            subtitle={t.modals.deleteSubtitle}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t.modals.cancel}
                    </Button>
                    <Button
                        variant="destructive"
                        icon={<Trash2 size={14} strokeWidth={1.6} />}
                        disabled={!canConfirm}
                        onClick={() => void onConfirm()}
                    >
                        {t.modals.delete}
                    </Button>
                </>
            }
        >
            <div className="delete-warn">
                <span className="delete-warn-icon">
                    <AlertTriangle size={16} strokeWidth={1.6} />
                </span>
                <div className="delete-warn-body">
                    <div className="delete-warn-title">{t.modals.deleteWarningTitle}</div>
                    <div className="delete-warn-msg">{t.modals.deleteWarningMessage}</div>
                </div>
            </div>
            <div className="delete-target">
                <span className="delete-target-icon">
                    <VehicleIcon type={device.vehicle_type} size={18} />
                </span>
                <div className="delete-target-info">
                    <div className="delete-target-name">{device.name}</div>
                    <div className="delete-target-meta">
                        {device.uuid_firmware} · {t.table.vehicleTypes[device.vehicle_type]}
                    </div>
                </div>
            </div>
            <Field label={interpolateTemplate(t.modals.deleteTypeToConfirm, { name: device.name })}>
                <Input
                    value={typed}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTyped(e.target.value)}
                    placeholder={device.name}
                    autoFocus
                />
            </Field>
            <div className="confirm-prompt">{t.modals.deleteTip}</div>
        </Modal>
    );
}