import { useEffect, useState, type ChangeEvent } from "react";
//-- Types
import type { JSX } from "react/jsx-runtime";
import type { Translation } from "@/i18n";
import type { DeviceVehicleType, DeviceWithAccess } from "@/types/api";
import { VEHICLE_TYPE_OPTIONS, type DeviceAccessRole } from "@/constants";
//-- Icons
import { Check } from "lucide-react";
//-- Components
import { Button, Modal } from "@/components/react/ui";
import { Field, Input, Select } from "@/components/react/form/ui";
//-- Utils
import { interpolateTemplate } from "@/lib";
/**
 * Props for the EditDeviceModal component.
 * @interface EditDeviceModalProps
 * @prop {boolean} open - Whether the modal is open.
 * @prop {DeviceWithAccess | null} device - The device to be edited.
 * @prop {() => void} onClose - Callback for closing the modal.
 * @prop {() => Promise<void> | void} onSave - Callback for saving the edited device.
 * @prop {Translation['device']} t - Translation strings.
 */
interface EditDeviceModalProps {
    open: boolean;
    device: DeviceWithAccess | null;
    onClose: () => void;
    onSave: (
        id: string,
        data: { name: string; vehicle_type: DeviceVehicleType; access_role: DeviceAccessRole }
    ) => Promise<void> | void;
    t: Translation['device'];
}
/**
 * Component for editing a device.
 * @param {EditDeviceModalProps} props - Props for the component.
 * @returns {JSX.Element | null} The rendered component.
 */
export function EditDeviceModal({ open, device, onClose, onSave, t }: EditDeviceModalProps): JSX.Element | null {
    const [form, setForm] = useState<{
        name: string;
        vehicle_type: DeviceVehicleType;
        access_role: DeviceAccessRole;
    } | null>(null);
    const [errors, setErrors] = useState<{ name?: string }>({});

    useEffect(() => {
        if (open && device) {
            setForm({
                name: device.name,
                vehicle_type: device.vehicle_type,
                access_role: device.access_role,
            });
            setErrors({});
        }
        if (!open) setForm(null);
    }, [open, device]);

    if (!open || !device) return null;
    /**
     * Submit the form
     * @returns {void}
     */
    const submit = (): void => {
        if (!form) return;
        const e: { name?: string } = {};
        if (!form.name.trim()) e.name = t.modals.required;
        setErrors(e);
        if (Object.keys(e).length) return;
        void onSave(device.id, form);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t.modals.editTitle}
            subtitle={interpolateTemplate(t.modals.editSubtitle, {
                name: device.name,
                uuid: device.uuid_firmware,
            })}
            size="md"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        {t.modals.cancel}
                    </Button>
                    <Button
                        variant="primary"
                        icon={<Check size={14} strokeWidth={1.6} />}
                        onClick={submit}
                    >
                        {t.modals.save}
                    </Button>
                </>
            }
        >
            <div className="edit-readonly">
                <div className="edit-readonly-label">{t.modals.uuidLabel}</div>
                <div className="edit-readonly-value">
                    <code>{device.uuid_firmware}</code>
                    <span className="edit-readonly-hint">{t.modals.uuidImmutable}</span>
                </div>
            </div>
            {form && (
                <>
                    <Field label={t.modals.nameLabel} required error={errors.name}>
                        <Input
                            value={form.name}
                            invalid={!!errors.name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setForm(f =>
                                    f ? { ...f, name: e.target.value } : f
                                )
                            }
                            autoFocus
                        />
                    </Field>
                    <div className="gp-field-row">
                        <Field label={t.modals.vehicleTypeLabel}>
                            <Select
                                options={VEHICLE_TYPE_OPTIONS.map(v => ({
                                    value: v,
                                    label: t.table.vehicleTypes[v],
                                }))}
                                value={form.vehicle_type}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                    setForm(f =>
                                        f
                                            ? {
                                                ...f,
                                                vehicle_type: e.target.value as DeviceVehicleType,
                                            }
                                            : f
                                    )
                                }
                            />
                        </Field>
                        <Field label={t.modals.accessRoleLabel}>
                            <Select
                                options={(
                                    ['owner', 'editor', 'viewer'] as DeviceAccessRole[]
                                ).map(r => ({ value: r, label: t.roles[r] }))}
                                value={form.access_role}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                    setForm(f =>
                                        f
                                            ? {
                                                ...f,
                                                access_role: e.target.value as DeviceAccessRole,
                                            }
                                            : f
                                    )
                                }
                            />
                        </Field>
                    </div>
                </>
            )}
        </Modal>
    );
}