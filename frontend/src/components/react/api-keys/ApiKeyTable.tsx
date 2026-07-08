import '@/styles/components/api-keys.css';
//-- React
import { useState } from 'react';
import type { JSX } from 'react';
//-- Types
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
//-- Components
import { Button } from '@/components/ui';
import { DataTable, TableStatus } from '@/components/ui/DataTable';
import { MobileCardList } from '@/components/react/shared';
import Modal from '@/components/react/ui/Modal';
//-- Icons
import { Inbox, Plus } from 'lucide-react';
//-- Utils
import { getApiKeyTableColumns } from '@/lib/api-keys-utils';
//-- Toast bus
import { toastBus } from '@/lib/stores/toast.store';
//-- Local sub-components
import { ApiKeyTableRow } from './ApiKeyTableRow';
import { ApiKeyMobileCard } from './ApiKeyMobileCard';
import { ApiKeyReveal } from './ApiKeyReveal';
import { CreateApiKeyForm } from './CreateApiKeyForm';
import type { CreateApiKeyDevice } from './CreateApiKeyForm';

/**
 * One row in the flat `(device, key)` table. Holds only metadata —
 * `plain_key` is intentionally absent; once the user closes the
 * reveal modal the value is dropped and the row is forever
 * metadata-only.
 * @typedef {Object} ApiKeyRow
 * @property {string} deviceId
 * @property {string} deviceName
 * @property {string} vehicleType
 * @property {'owner'} accessRole - Always 'owner' for the
 *   initial release — only owners can issue keys.
 * @property {string} keyId
 * @property {string} createdAt
 * @property {string | null} lastUsedAt
 * @property {string | null} expiresAt
 */
export interface ApiKeyRow {
    deviceId: string;
    deviceName: string;
    vehicleType: string;
    accessRole: 'owner';
    keyId: string;
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
}

/**
 * Hardcoded dummy devices used by the picker. Backend wiring replaces
 * this with a `useDeviceService().getAllDevices()` fanout.
 * @constant DUMMY_DEVICES
 */
const DUMMY_DEVICES: CreateApiKeyDevice[] = [
    { id: 'd-001', name: 'Delivery Van #3', vehicleType: 'van' },
    { id: 'd-002', name: 'Bike Tracker',    vehicleType: 'bicycle' },
    { id: 'd-003', name: 'Office Tracker',  vehicleType: 'car' },
];

/**
 * Initial seed of 3 mock rows spread across the dummy devices so the
 * page renders something meaningful on first paint.
 * @function getInitialRows
 * @returns {ApiKeyRow[]} Seed rows.
 */
function getInitialRows(): ApiKeyRow[] {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    return [
        {
            deviceId: 'd-001',
            deviceName: 'Delivery Van #3',
            vehicleType: 'van',
            accessRole: 'owner',
            keyId: 'ae0a8d4f-d0f9-4fd0-ad7d-4f40d87c098f',
            createdAt: new Date(now - 7 * day).toISOString(),
            lastUsedAt: new Date(now - 60 * 1000).toISOString(),
            expiresAt: null,
        },
        {
            deviceId: 'd-002',
            deviceName: 'Bike Tracker',
            vehicleType: 'bicycle',
            accessRole: 'owner',
            keyId: 'b1f2c3d4-e5f6-7890-abcd-ef1234567890',
            createdAt: new Date(now - 30 * day).toISOString(),
            lastUsedAt: null,
            expiresAt: null,
        },
        {
            deviceId: 'd-003',
            deviceName: 'Office Tracker',
            vehicleType: 'car',
            accessRole: 'owner',
            keyId: 'c5d6e7f8-a9b0-c1d2-e3f4-a5b6c7d8e9f0',
            createdAt: new Date(now - 90 * day).toISOString(),
            lastUsedAt: new Date(now - 3 * day).toISOString(),
            expiresAt: new Date(now + 365 * day).toISOString(),
        },
    ];
}

/**
 * Generates a fake 32-byte base64url-style token for the reveal phase.
 * Uses `crypto.randomUUID` + a short entropy tail — good enough for a
 * dummy client-side stub, replaced by the real `plain_key` from the
 * backend once the service is wired.
 * @function generateFakePlainKey
 * @returns {string} A 43-character fake token.
 */
function generateFakePlainKey(): string {
    const tail = Math.random().toString(36).slice(2, 14);
    return `${crypto.randomUUID().replace(/-/g, '')}${tail}`.slice(0, 43);
}

/**
 * Interface for the ApiKeyTable island.
 * @interface ApiKeyTableProps
 * @param {Language} locale - Current locale.
 * @param {Translation} translation - Localized strings.
 */
interface ApiKeyTableProps {
    locale: Language;
    translation: Translation;
    className?: string;
}

/**
 * Main island for the /api-keys page. Owns the in-memory row state,
 * the create + revoke modals, and the dummy data seed. Replaced with
 * real `useApiKeyService`/`useDeviceService` calls once the backend
 * fanout lands.
 * @function ApiKeyTable
 * @param {ApiKeyTableProps} props - Component props.
 * @returns {JSX.Element} The rendered island.
 */
export function ApiKeyTable({
    locale,
    translation,
    className,
}: ApiKeyTableProps): JSX.Element {
    const t = translation.apiKeys;
    const toastStrings = translation.toast;
    const columns = getApiKeyTableColumns(t.table);

    // ─── State ────────────────────────────────────────────────────────────
    const [rows, setRows] = useState<ApiKeyRow[]>(() => getInitialRows());
    const [createOpen, setCreateOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [reveal, setReveal] = useState<{
        plainKey: string;
        deviceName: string;
    } | null>(null);
    const [revokeTarget, setRevokeTarget] = useState<ApiKeyRow | null>(null);

    // ─── Create flow ──────────────────────────────────────────────────────
    /**
     * Opens the create modal in form phase, dropping any leftover
     * reveal state from a previous run.
     */
    function openCreate(): void {
        setReveal(null);
        setCreateOpen(true);
    }

    /**
     * Closes the create modal and clears in-flight state. The reveal
     * blob (if any) is dropped here so the `plainKey` is forgotten.
     */
    function closeCreate(): void {
        setCreateOpen(false);
        setReveal(null);
        setGenerating(false);
    }

    /**
     * Generates a fake plain key, pushes a new metadata-only row to
     * the list, and switches the modal into the reveal phase.
     * Backend wiring will replace `setTimeout` + fake token with a
     * real `issueApiKey(deviceId)` call.
     * @param {string} deviceId - UUID of the chosen device.
     */
    function handleGenerate(deviceId: string): void {
        const device = DUMMY_DEVICES.find(d => d.id === deviceId);
        if (!device) return;
        setGenerating(true);
        window.setTimeout(() => {
            const plainKey = generateFakePlainKey();
            const newRow: ApiKeyRow = {
                deviceId: device.id,
                deviceName: device.name,
                vehicleType: device.vehicleType,
                accessRole: 'owner',
                keyId: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                lastUsedAt: null,
                expiresAt: null,
            };
            setRows(prev => [newRow, ...prev]);
            setReveal({ plainKey, deviceName: device.name });
            setGenerating(false);
            toastBus.push({
                variant: 'success',
                title: toastStrings.apiKeyCreated.title,
                message: toastStrings.apiKeyCreated.message,
            });
        }, 400);
    }

    // ─── Revoke flow ──────────────────────────────────────────────────────
    /**
     * Opens the revoke modal for the given row.
     * @param {ApiKeyRow} row - Row targeted for revocation.
     */
    function openRevoke(row: ApiKeyRow): void {
        setRevokeTarget(row);
    }

    /**
     * Closes the revoke modal and clears the target.
     */
    function closeRevoke(): void {
        setRevokeTarget(null);
    }

    /**
     * Confirms revocation: removes the row from the list, surfaces a
     * toast, closes the modal. Backend wiring will replace the local
     * `setRows` filter with a `revokeApiKey(deviceId, keyId)` call.
     */
    function confirmRevoke(): void {
        if (!revokeTarget) return;
        setRows(prev => prev.filter(r => r.keyId !== revokeTarget.keyId));
        toastBus.push({
            variant: 'success',
            title: toastStrings.apiKeyRevoked.title,
            message: toastStrings.apiKeyRevoked.message,
        });
        closeRevoke();
    }

    /**
     * Per-row revoke callbacks. Stored in a Map so the .map below
     * looks them up by keyId instead of allocating inline arrows.
     */
    const revokeHandlersById = new Map<string, { onRevoke: () => void }>();
    for (const row of rows) {
        revokeHandlersById.set(row.keyId, {
            onRevoke: (): void => openRevoke(row),
        });
    }

    const isEmpty = rows.length === 0;

    return (
        <section className={`api-keys${className ? ` ${className}` : ''}`}>
            <div className="api-keys__toolbar">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreate}
                    disabled={DUMMY_DEVICES.length === 0}
                >
                    <Plus size={14} strokeWidth={2} aria-hidden="true" />
                    {t.newKey}
                </Button>
            </div>

            {isEmpty ? (
                <>
                    <TableStatus
                        mode="empty"
                        title={t.noKeys}
                        message={t.noKeysMessage}
                    />
                    <div className="mobile-empty">
                        <div
                            className="mobile-empty__icon"
                            aria-hidden="true"
                        >
                            <Inbox />
                        </div>
                        <h3 className="mobile-empty__title">{t.noKeys}</h3>
                        <p className="mobile-empty__message">
                            {t.noKeysMessage}
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <DataTable columns={columns}>
                        {rows.map(row => {
                            const handlers = revokeHandlersById.get(row.keyId);
                            if (!handlers) return null;
                            return (
                                <ApiKeyTableRow
                                    key={row.keyId}
                                    locale={locale}
                                    keyId={row.keyId}
                                    deviceName={row.deviceName}
                                    vehicleType={row.vehicleType}
                                    createdAt={row.createdAt}
                                    lastUsedAt={row.lastUsedAt}
                                    expiresAt={row.expiresAt}
                                    labels={t.table}
                                    onRevoke={handlers.onRevoke}
                                    isLoading={false}
                                />
                            );
                        })}
                    </DataTable>
                    <MobileCardList variant="api-key" label={t.table.device}>
                        {rows.map(row => {
                            const handlers = revokeHandlersById.get(row.keyId);
                            if (!handlers) return null;
                            return (
                                <ApiKeyMobileCard
                                    key={row.keyId}
                                    locale={locale}
                                    keyId={row.keyId}
                                    deviceName={row.deviceName}
                                    vehicleType={row.vehicleType}
                                    createdAt={row.createdAt}
                                    lastUsedAt={row.lastUsedAt}
                                    expiresAt={row.expiresAt}
                                    labels={t.table}
                                    onRevoke={handlers.onRevoke}
                                    isLoading={false}
                                />
                            );
                        })}
                    </MobileCardList>
                </>
            )}

            {/* Create modal — form + reveal phases */}
            <Modal
                open={createOpen}
                onClose={closeCreate}
                title={
                    reveal
                        ? t.reveal.title
                        : t.createModal.title
                }
                size="md"
            >
                {reveal ? (
                    <ApiKeyReveal
                        plainKey={reveal.plainKey}
                        deviceName={reveal.deviceName}
                        strings={t.reveal}
                        toastStrings={toastStrings}
                        onClose={closeCreate}
                    />
                ) : (
                    <CreateApiKeyForm
                        devices={DUMMY_DEVICES}
                        strings={t.createModal}
                        onSubmit={handleGenerate}
                        onCancel={closeCreate}
                        saving={generating}
                    />
                )}
            </Modal>

            {/* Revoke modal — warning + Cancel/Revoke */}
            <Modal
                open={revokeTarget !== null}
                onClose={closeRevoke}
                title={t.revoke.title}
                variant="danger"
                size="md"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={closeRevoke}
                        >
                            {t.revoke.cancel}
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={confirmRevoke}
                        >
                            {t.revoke.confirm}
                        </Button>
                    </>
                }
            >
                <p className="api-key-revoke__warning" role="alert">
                    {t.revoke.warning.replace(
                        '{device}',
                        revokeTarget?.deviceName ?? ''
                    )}
                </p>
            </Modal>
        </section>
    );
}