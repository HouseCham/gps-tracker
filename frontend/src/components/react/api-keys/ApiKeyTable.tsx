import '@/styles/components/api-keys.css';
//-- React
import { lazy, Suspense, useEffect, useState } from 'react';
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
//-- Components
import { TableStatus } from '@/components/ui/DataTable';
import { Button } from '@/components/ui';
//-- Icons
import { Plus } from 'lucide-react';
//-- Utils
import { getApiKeyTableColumns } from '@/lib/api-keys-utils';
import type { ApiKeyDevice } from '@/components/react/form/ApiKeyForm';
//-- Services
import { useApiKeyService, useDeviceService } from '@/lib/api/services';
//-- Toast bus
import { toastBus } from '@/lib/stores/toast.store';
//-- Lazy components
const Modal = lazy(() => import('@/components/react/ui/Modal'));
const ConfirmActionModal = lazy(() =>
    import('@/components/react/shared/ConfirmActionModal').then(m => ({
        default: m.ConfirmActionModal,
    }))
);
const EmptyTable = lazy(() =>
    import('@/components/react/table/EmptyTable').then(m => ({
        default: m.EmptyTable,
    }))
);
const DataTable = lazy(() =>
    import('@/components/ui/DataTable').then(m => ({
        default: m.DataTable,
    }))
);
const MobileCardList = lazy(() =>
    import('@/components/react/shared/MobileCard/MobileCardList').then(m => ({
        default: m.MobileCardList,
    }))
);
const ApiKeyTableRow = lazy(() =>
    import('@/components/react/api-keys/ApiKeyTableRow').then(m => ({
        default: m.ApiKeyTableRow,
    }))
);
const ApiKeyMobileCard = lazy(() =>
    import('@/components/react/api-keys/ApiKeyMobileCard').then(m => ({
        default: m.ApiKeyMobileCard,
    }))
);
const ApiKeyForm = lazy(() =>
    import('@/components/react/form/ApiKeyForm').then(m => ({
        default: m.ApiKeyForm,
    }))
);
const ApiKeyReveal = lazy(() =>
    import('@/components/react/api-keys/ApiKeyReveal').then(m => ({
        default: m.ApiKeyReveal,
    }))
);
/**
 * Interface for the ApiKeyTable island.
 * @interface ApiKeyTableProps
 * @param {Language} locale - Current locale.
 * @param {Translation} translation - Localized strings.
 * @param {string} [className] - Extra class appended to the wrapper.
 */
interface ApiKeyTableProps {
    locale: Language;
    translation: Translation;
    className?: string;
}

/**
 * Main island for the `/api-keys` page. Fetches the flat list of every
 * active api key across every device the caller has access to via the
 * global `GET /api/v1/api-keys` endpoint and renders the table.
 * Issuance lives behind the toolbar `+ New API key` button: the user
 * picks a device, the backend issues a one-time `plain_key`, and the
 * reveal modal flashes the value with a copy button before the user
 * dismisses it.
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

    const { isLoading, error, rows, getAllApiKeys, issueApiKey, revokeApiKey } =
        useApiKeyService();

    const { devices, getAllDevices } = useDeviceService();

    // ─── Create-key flow state ────────────────────────────────────────────
    const [createOpen, setCreateOpen] = useState(false);
    const [issuedKey, setIssuedKey] = useState<{
        plainKey: string;
        deviceName: string;
    } | null>(null);

    // ─── Revoke flow state ────────────────────────────────────────────────
    const [revokeTarget, setRevokeTarget] = useState<{
        deviceId: string;
        keyId: string;
        deviceName: string;
    } | null>(null);
    const [revokeError, setRevokeError] = useState<string | null>(null);

    // ─── Initial load ─────────────────────────────────────────────────────
    /**
     * Fetches the global key list and the device list on mount. Runs once.
     */
    useEffect(() => {
        getAllApiKeys();
        getAllDevices();
    }, []);

    // ─── Create-key flow ──────────────────────────────────────────────────
    /**
     * Devices the user can pick from in the create modal. Filters out
     * every device that already appears in `rows` (joined on
     * `device_id`) so the picker can't offer an option the backend
     * would reject with 409 "already has a key".
     */
    const pickableDevices: ApiKeyDevice[] = ((): ApiKeyDevice[] => {
        const takenIds = new Set(rows.map(r => r.device_id));
        return devices
            .filter(d => !takenIds.has(d.id))
            .map(d => ({
                id: d.id,
                name: d.name,
                vehicleType:
                    translation.device.table.vehicleTypes[d.vehicle_type] ??
                    d.vehicle_type,
            }));
    })();

    /**
     * Issues a fresh API key for the picked device. On success swaps the
     * modal body to the reveal view. On `null` (incl. 409 / network
     * failure) the form stays put so the user can retry — the service
     * already pushed the matching toast.
     * @param {string} deviceId - The picked device's id.
     */
    async function handleIssue(deviceId: string): Promise<void> {
        const created = await issueApiKey(deviceId);
        if (!created) return;
        const device = devices.find(d => d.id === deviceId);
        setIssuedKey({
            plainKey: created.plain_key,
            deviceName: device?.name ?? '',
        });
    }

    /**
     * Closes the create modal and resets reveal state so a stale
     * `plain_key` never survives a reopen.
     */
    function handleCloseCreate(): void {
        setCreateOpen(false);
        setIssuedKey(null);
    }

    /**
     * Refreshes the global keys list after the user confirms they've
     * saved the new key, then closes the modal.
     */
    async function handleDone(): Promise<void> {
        await getAllApiKeys();
        handleCloseCreate();
    }

    // ─── Revoke flow ──────────────────────────────────────────────────────
    /**
     * Opens the revoke modal for the given row.
     * @param {{ deviceId: string; keyId: string; deviceName: string }} row -
     *   Row targeted for revocation.
     */
    function openRevoke(row: {
        deviceId: string;
        keyId: string;
        deviceName: string;
    }): void {
        setRevokeError(null);
        setRevokeTarget(row);
    }

    /**
     * Closes the revoke modal and clears the target / error.
     */
    function closeRevoke(): void {
        setRevokeTarget(null);
        setRevokeError(null);
    }

    /**
     * Confirms revocation: calls the service, surfaces a toast on
     * success, closes the modal. On failure the inline error stays put
     * so the user can retry without re-opening the modal.
     */
    async function confirmRevoke(): Promise<void> {
        if (!revokeTarget) return;
        try {
            await revokeApiKey(revokeTarget.deviceId, revokeTarget.keyId);
            toastBus.push({
                variant: 'success',
                title: toastStrings.apiKeyRevoked.title,
                message: toastStrings.apiKeyRevoked.message,
            });
            closeRevoke();
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : t.revoke.revokeFailed;
            setRevokeError(msg);
        }
    }

    /**
     * Per-row click callbacks for the row actions. Same shape as
     * {@link UserTable.rowHandlersById} and {@link DeviceTable.rowHandlersById}
     * -- the `.map` below reads from this Map instead of allocating
     * inline arrows inside the render loop.
     */
    const rowHandlersById = ((): Map<string, { onRevoke: () => void }> => {
        const map = new Map<string, { onRevoke: () => void }>();
        for (const row of rows) {
            map.set(row.id, {
                onRevoke: (): void =>
                    openRevoke({
                        deviceId: row.device_id,
                        keyId: row.id,
                        deviceName: row.device_name,
                    }),
            });
        }
        return map;
    })();

    // ─── Render ───────────────────────────────────────────────────────────
    // -- Loading state: built-in DataTable skeleton
    if (isLoading && rows.length === 0)
        return <TableStatus mode="loading" className={className} />;

    // -- Error state: empty DataTable with error copy
    if (error && rows.length === 0) {
        return (
            <TableStatus
                mode="empty"
                className={className}
                title={t.failedToLoad}
                message={error.message}
            />
        );
    }

    return (
        <>
            {/* Toolbar */}
            <div className="api-keys__toolbar">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    disabled={devices.length === 0}
                >
                    <Plus size={14} strokeWidth={2} aria-hidden="true" />
                    {t.newKey}
                </Button>
            </div>
            {/* Content */}
            {rows.length === 0 ? (
                <Suspense
                    fallback={
                        <TableStatus mode="loading" className={className} />
                    }
                >
                    <EmptyTable
                        columns={columns}
                        emptyTitle={t.noKeys}
                        emptyMessage={t.noKeysMessage}
                    />
                </Suspense>
            ) : (
                <Suspense
                    fallback={
                        <TableStatus mode="loading" className={className} />
                    }
                >
                    <DataTable columns={columns}>
                        {rows.map(row => {
                            const handlers = rowHandlersById.get(row.id);
                            if (!handlers) return null;
                            return (
                                <ApiKeyTableRow
                                    key={row.id}
                                    locale={locale}
                                    keyId={row.id}
                                    deviceName={row.device_name}
                                    vehicleType=""
                                    createdAt={row.created_at}
                                    lastUsedAt={null}
                                    expiresAt={null}
                                    labels={t.table}
                                    onRevoke={handlers.onRevoke}
                                    isLoading={isLoading}
                                />
                            );
                        })}
                    </DataTable>
                    <MobileCardList variant="api-key" label={t.table.device}>
                        {rows.map(row => {
                            const handlers = rowHandlersById.get(row.id);
                            if (!handlers) return null;
                            return (
                                <ApiKeyMobileCard
                                    key={row.id}
                                    locale={locale}
                                    keyId={row.id}
                                    deviceName={row.device_name}
                                    vehicleType=""
                                    createdAt={row.created_at}
                                    lastUsedAt={null}
                                    expiresAt={null}
                                    labels={t.table}
                                    onRevoke={handlers.onRevoke}
                                    isLoading={isLoading}
                                />
                            );
                        })}
                    </MobileCardList>
                </Suspense>
            )}

            {/* Create / Reveal modal */}
            <Suspense fallback={null}>
                <Modal
                    open={createOpen}
                    onClose={handleCloseCreate}
                    title={issuedKey ? t.reveal.title : t.createModal.title}
                >
                    {issuedKey ? (
                        <ApiKeyReveal
                            plainKey={issuedKey.plainKey}
                            deviceName={issuedKey.deviceName}
                            strings={t.reveal}
                            toastStrings={toastStrings}
                            onClose={() => void handleDone()}
                        />
                    ) : (
                        <ApiKeyForm
                            devices={pickableDevices}
                            strings={t.createModal}
                            saving={isLoading}
                            onSubmit={deviceId => {
                                void handleIssue(deviceId);
                            }}
                            onCancel={handleCloseCreate}
                        />
                    )}
                </Modal>
            </Suspense>

            {/* Revoke confirmation modal */}
            <Suspense fallback={null}>
                <ConfirmActionModal
                    open={revokeTarget !== null}
                    onClose={closeRevoke}
                    title={t.revoke.title}
                    warning={t.revoke.warning.replace(
                        '{device}',
                        revokeTarget?.deviceName ?? ''
                    )}
                    rootClassName="api-key-revoke"
                    warningClassName="api-key-revoke__warning"
                    errorClassName="api-key-revoke__error"
                    confirmLabel={t.revoke.confirm}
                    cancelLabel={t.revoke.cancel}
                    isLoading={isLoading}
                    errorMessage={revokeError}
                    onConfirm={(): void => {
                        void confirmRevoke();
                    }}
                />
            </Suspense>
        </>
    );
}
