//-- React
import { useState, type JSX } from 'react';
//-- Types
import type { DeviceFormValues } from '@/types/components';
//-- Constants
import { DEMO_DEVICE } from '@/constants/components';
//-- Components
import { DeviceForm } from './DeviceForm';
/**
 * @function DeviceFormGallery
 * @description A gallery of DeviceForm components
 * @returns {JSX.Element} The rendered component
 */
export function DeviceFormGallery(): JSX.Element {
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [saving, setSaving] = useState(false);
    const [submitted, setSubmitted] = useState<DeviceFormValues | null>(null);
    /**
     * Handles the submission of the form
     * @param {DeviceFormValues} data - The data to submit
     * @returns {void}
     */
    function handleSubmit(data: DeviceFormValues): void {
        setSaving(true);
        setTimeout(() => {
            setSubmitted(data);
            setSaving(false);
        }, 800);
    }
    /**
     * Handles the deletion of the device
     */
    function handleDelete(): void {
        alert(`Delete ${DEMO_DEVICE.id}`);
    }
    return (
        <div className="dfg">
            <div className="dfg__tabs">
                <button
                    type="button"
                    className={`dfg__tab ${mode === 'create' ? 'is-active' : ''}`}
                    onClick={() => setMode('create')}
                >
                    Create mode
                </button>
                <button
                    type="button"
                    className={`dfg__tab ${mode === 'edit' ? 'is-active' : ''}`}
                    onClick={() => setMode('edit')}
                >
                    Edit mode
                </button>
            </div>

            {mode === 'create' ? (
                <DeviceForm
                    onSubmit={handleSubmit}
                    onCancel={() => setSubmitted(null)}
                    saving={saving}
                />
            ) : (
                <DeviceForm
                    device={DEMO_DEVICE}
                    onSubmit={handleSubmit}
                    onCancel={() => setSubmitted(null)}
                    onDelete={handleDelete}
                    saving={saving}
                />
            )}

            {submitted && (
                <div className="dfg__result">
                    <strong>Submitted:</strong> {submitted.name} —{' '}
                    {submitted.uuid_firmware}
                </div>
            )}
        </div>
    );
}
