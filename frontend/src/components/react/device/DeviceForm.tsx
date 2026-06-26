import '@/styles/components/device-form.css';
//-- React
import { useId, useState } from 'react';
import type { ReactElement, SyntheticEvent } from 'react';
//-- Types
import type { DeviceFormStrings, DeviceFormValues } from '@/types/components';
//-- Constants
import { UUID_REGEX } from '@/constants';
/**
 * @interface DeviceFormProps
 * @param {DeviceFormValues} device - The device to edit.
 * @param {Function} onSubmit - The function to call when the form is submitted.
 * @param {Function} onCancel - The function to call when the form is canceled.
 * @param {Function} onDelete - The function to call when the device is deleted.
 * @param {boolean} saving - Whether the form is saving.
 * @param {DeviceFormStrings} strings - The strings to use in the form.
 */
export interface DeviceFormProps {
    device?: { id: string; name: string; uuid_firmware: string };
    onSubmit: (data: DeviceFormValues) => void;
    onCancel: () => void;
    onDelete?: (id: string) => void;
    saving?: boolean;
    strings?: DeviceFormStrings;
}
/**
 * @function DeviceForm
 * @param {DeviceFormProps} props - The props for the component.
 * @returns {ReactElement} The rendered component.
 */
export default function DeviceForm({
    device,
    onSubmit,
    onCancel,
    onDelete,
    saving = false,
    strings,
}: DeviceFormProps): ReactElement {
    const nameId = useId();
    const uuidId = useId();
    const isEdit = !!device;

    const [name, setName] = useState(device?.name ?? '');
    const [uuid, setUuid] = useState(device?.uuid_firmware ?? '');
    const [errors, setErrors] = useState<{ name?: string; uuid?: string }>({});
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const s = {
        ...({
            title: 'Create Device',
            nameLabel: 'Name',
            namePlaceholder: 'Delivery Van #3',
            uuidLabel: 'UUID',
            uuidPlaceholder: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            nameRequired: 'Name is required',
            uuidRequired: 'UUID is required',
            uuidInvalid: 'UUID is invalid',
            save: 'Save',
            saving: 'Saving',
            cancel: 'Cancel',
            deleteConfirm: 'Are you sure you want to delete this device?',
            deleteDevice: 'Delete Device',
        } as DeviceFormStrings),
        ...strings,
    };

    function validate(): boolean {
        const next: { name?: string; uuid?: string } = {};
        if (!name.trim()) next.name = s.nameRequired;
        if (!uuid.trim()) next.uuid = s.uuidRequired;
        else if (!UUID_REGEX.test(uuid.trim())) next.uuid = s.uuidInvalid;
        setErrors(next);
        return Object.keys(next).length === 0;
    }
    /**
     * Handles the submission of the form
     * @param {SyntheticEvent<HTMLFormElement>} e - The event
     */
    function handleSubmit(e: SyntheticEvent<HTMLFormElement>): void {
        e.preventDefault();
        e.preventDefault();
        if (!validate()) return;
        onSubmit({ name: name.trim(), uuid_firmware: uuid.trim() });
    }
    /**
     * Handles the deletion of the device
     */
    function handleDelete(): void {
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }
        onDelete?.(device!.id);
    }

    return (
        <form className="device-form" onSubmit={handleSubmit} noValidate>
            <h2 className="device-form__title">{s.title}</h2>

            <div
                className={`device-form__field ${errors.name ? 'device-form__field--error' : ''}`}
            >
                <label className="device-form__label" htmlFor={nameId}>
                    {s.nameLabel}
                </label>
                <input
                    id={nameId}
                    className="device-form__input"
                    type="text"
                    value={name}
                    onChange={e => {
                        setName(e.target.value);
                        setErrors(p => ({ ...p, name: undefined }));
                    }}
                    placeholder={s.namePlaceholder}
                    disabled={saving}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? `${nameId}-err` : undefined}
                />
                {errors.name && (
                    <p
                        id={`${nameId}-err`}
                        className="device-form__error"
                        role="alert"
                    >
                        {errors.name}
                    </p>
                )}
            </div>

            <div
                className={`device-form__field ${errors.uuid ? 'device-form__field--error' : ''}`}
            >
                <label className="device-form__label" htmlFor={uuidId}>
                    {s.uuidLabel}
                </label>
                <input
                    id={uuidId}
                    className="device-form__input device-form__input--mono"
                    type="text"
                    value={uuid}
                    onChange={e => {
                        setUuid(e.target.value);
                        setErrors(p => ({ ...p, uuid: undefined }));
                    }}
                    placeholder={s.uuidPlaceholder}
                    disabled={saving}
                    aria-invalid={!!errors.uuid}
                    aria-describedby={errors.uuid ? `${uuidId}-err` : undefined}
                />
                {errors.uuid && (
                    <p
                        id={`${uuidId}-err`}
                        className="device-form__error"
                        role="alert"
                    >
                        {errors.uuid}
                    </p>
                )}
            </div>

            <div className="device-form__actions">
                <button
                    type="submit"
                    className="device-form__btn device-form__btn--primary"
                    disabled={saving}
                >
                    {saving ? s.saving : s.save}
                </button>
                <button
                    type="button"
                    className="device-form__btn device-form__btn--secondary"
                    onClick={onCancel}
                    disabled={saving}
                >
                    {s.cancel}
                </button>
            </div>

            {isEdit && onDelete && (
                <div className="device-form__danger">
                    <button
                        type="button"
                        className="device-form__btn device-form__btn--danger"
                        onClick={handleDelete}
                        disabled={saving}
                    >
                        {deleteConfirm ? s.deleteConfirm : s.deleteDevice}
                    </button>
                </div>
            )}
        </form>
    );
}
