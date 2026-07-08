import '@/styles/components/api-keys.css';
//-- React
import { useId, useMemo, useState } from 'react';
import type { JSX } from 'react';
//-- Types
import type { Translation } from '@/i18n';
//-- Components
import { Button } from '@/components/ui';
import Dropdown from '@/components/react/ui/Dropdown';

/**
 * A single device option in the create-key device picker. The
 * dropdown uses this shape directly as its `items` payload.
 * @interface CreateApiKeyDevice
 * @param {string} id - Device UUID.
 * @param {string} name - Display name.
 * @param {string} vehicleType - Pre-localized vehicle-type label.
 */
export interface CreateApiKeyDevice {
    id: string;
    name: string;
    vehicleType: string;
}

/**
 * First phase of the create-modal flow. Lets the user pick a device
 * and trigger generation. Validates that a device was selected and
 * delegates submission to the parent.
 * @interface CreateApiKeyFormProps
 * @param {CreateApiKeyDevice[]} devices - Devices available to issue a key for.
 * @param {Translation['apiKeys']['createModal']} strings - Localized labels.
 * @param {(deviceId: string) => void} onSubmit - Invoked with the chosen device id.
 * @param {() => void} onCancel - Closes the modal without generating.
 * @param {boolean} [saving] - Disables inputs while generation is in flight.
 */
export interface CreateApiKeyFormProps {
    devices: CreateApiKeyDevice[];
    strings: Translation['apiKeys']['createModal'];
    onSubmit: (deviceId: string) => void;
    onCancel: () => void;
    saving?: boolean;
}

/**
 * Form for selecting a device and triggering an API-key issue.
 * @param {CreateApiKeyFormProps} props - Component props.
 * @returns {JSX.Element} The rendered form.
 */
export function CreateApiKeyForm({
    devices,
    strings: s,
    onSubmit,
    onCancel,
    saving = false,
}: CreateApiKeyFormProps): JSX.Element {
    const labelId = useId();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const items = useMemo(
        () =>
            devices.map(d => ({
                key: d.id,
                label: `${d.name} · ${d.vehicleType}`,
                onSelect: (): void => {
                    setSelectedId(d.id);
                },
            })),
        [devices]
    );

    const selected = devices.find(d => d.id === selectedId) ?? null;
    const showError = touched && !selected;

    /**
     * Submits the form if a device is selected; otherwise surfaces the
     * inline error. The parent handles the actual generation.
     * @returns {void}
     */
    function handleGenerate(): void {
        setTouched(true);
        if (!selected) return;
        onSubmit(selected.id);
    }

    return (
        <div className="api-key-form">
            <div className="api-key-form__field">
                <label id={labelId} className="api-key-form__label">
                    {s.deviceLabel}
                </label>
                <Dropdown
                    ariaLabel={s.devicePlaceholder}
                    align="start"
                    items={items}
                    trigger={
                        <span
                            className={`api-key-form__trigger${
                                !selected ? ' is-placeholder' : ''
                            }${showError ? ' is-error' : ''}`}
                        >
                            {selected
                                ? `${selected.name} · ${selected.vehicleType}`
                                : s.devicePlaceholder}
                        </span>
                    }
                />
                {showError ? (
                    <p className="api-key-form__error" role="alert">
                        {s.deviceRequired}
                    </p>
                ) : (
                    <p className="api-key-form__hint">
                        {s.devicePlaceholder}
                    </p>
                )}
            </div>
            <div className="api-key-form__actions">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={saving}
                >
                    {s.cancel}
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerate}
                    loading={saving}
                >
                    {saving ? s.generating : s.generate}
                </Button>
            </div>
        </div>
    );
}