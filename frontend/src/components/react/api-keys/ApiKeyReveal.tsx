import '@/styles/components/api-keys.css';
//-- React
import { useState } from 'react';
import type { JSX } from 'react';
//-- Types
import type { Translation } from '@/i18n';
//-- Components
import { Button } from '@/components/ui';
//-- Icons
import { Check, Copy } from 'lucide-react';
//-- Utils
import { copyToClipboard } from '@/lib/copy-to-clipboard';
//-- Toast bus
import { toastBus } from '@/lib/stores/toast.store';

/**
 * Second phase of the create-modal flow. Renders the freshly issued
 * `plain_key` in monospace alongside a copy button and a strong
 * warning that this is the only time the value will be displayed.
 * @interface ApiKeyRevealProps
 * @param {string} plainKey - The one-time token returned by the server.
 * @param {string} deviceName - Display name of the owning device, shown in the toast.
 * @param {Translation['apiKeys']['reveal']} strings - Localized labels.
 * @param {Translation['toast']} toastStrings - Toast labels for success/error feedback.
 * @param {() => void} onClose - Closes the modal and drops the `plainKey` from view.
 */
export interface ApiKeyRevealProps {
    plainKey: string;
    deviceName: string;
    strings: Translation['apiKeys']['reveal'];
    toastStrings: Translation['toast'];
    onClose: () => void;
}

/**
 * Reveal view for a freshly generated API key.
 * @param {ApiKeyRevealProps} props - Component props.
 * @returns {JSX.Element} The rendered reveal block.
 */
export function ApiKeyReveal({
    plainKey,
    deviceName,
    strings,
    toastStrings,
    onClose,
}: ApiKeyRevealProps): JSX.Element {
    const [copied, setCopied] = useState(false);

    /**
     * Copies the plain key to the clipboard. Surfaces a toast on success
     * or failure, and toggles the button label to "Copied!" briefly
     * so the user sees the action landed without watching the toast.
     * @returns {Promise<void>}
     */
    async function handleCopy(): Promise<void> {
        const ok = await copyToClipboard(plainKey);
        if (ok) {
            toastBus.push({
                variant: 'success',
                title: toastStrings.apiKeyCopied.title,
                message: toastStrings.apiKeyCopied.message,
            });
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } else {
            toastBus.push({
                variant: 'error',
                title: toastStrings.copyFailed.title,
                message: toastStrings.copyFailed.message,
            });
        }
    }

    // deviceName is reserved for a future audit-log entry once the
    // backend is wired; consuming it here keeps the prop alive without
    // re-plumbing callers when that arrives.
    void deviceName;

    return (
        <div className="api-key-reveal">
            <p className="api-key-reveal__warning" role="alert">
                {strings.warning}
            </p>
            <div className="api-key-reveal__key-wrap">
                <code className="api-key-reveal__key" aria-label="API key">
                    {plainKey}
                </code>
                <button
                    type="button"
                    className={`api-key-reveal__copy${copied ? ' is-copied' : ''}`}
                    onClick={() => void handleCopy()}
                    aria-label={strings.copy}
                >
                    {copied ? (
                        <Check size={14} strokeWidth={2} aria-hidden="true" />
                    ) : (
                        <Copy size={14} strokeWidth={2} aria-hidden="true" />
                    )}
                    {copied ? strings.copied : strings.copy}
                </button>
            </div>
            <div className="api-key-reveal__actions">
                <Button variant="primary" size="sm" onClick={onClose}>
                    {strings.done}
                </Button>
            </div>
        </div>
    );
}
