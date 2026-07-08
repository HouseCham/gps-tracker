import { useState } from 'react';
//-- Types
import type {
    ApiError,
    ApiKey,
    ApiKeyListResponse,
    CreateApiKeyResponse,
    Envelope,
} from '@/types/api';
//-- Utils
import { handleApiError, withApiErrorToast } from '@/lib/api/api-utils';
import { toastBus } from '@/lib/stores/toast.store';
//-- Http Client
import { apiClient } from '@/lib/auth/client';

/**
 * The HTTP client used to interact with the device API keys endpoint.
 *
 * All three routes are session-authenticated and require `owner` access on
 * the target device. The IoT-side counterpart (`X-Device-API-Key`) lives on
 * the device firmware, not in this service.
 */
export const useApiKeyService = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<ApiError | null>(null);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

    /**
     * Resets the transient state (loading flag and error) before a new
     * operation. Does not clear `apiKeys` — that mirrors `deviceService`
     * which also keeps the list across mutations.
     * @returns {void}
     */
    function resetState(): void {
        setIsLoading(false);
        setError(null);
    }

    /**
     * Lists every active API key for the device. Returns metadata only —
     * no token, no hash.
     * @param {string} deviceId - The ID of the device whose keys to list.
     * @returns {Promise<void>} Resolves when the keys are fetched and state
     *   is updated.
     */
    async function getApiKeys(deviceId: string): Promise<void> {
        resetState();
        setIsLoading(true);
        setApiKeys([]);
        try {
            const { data: response } = await withApiErrorToast(() =>
                apiClient<Envelope<ApiKeyListResponse> | null>(
                    `/devices/${deviceId}/api-keys`,
                    { method: 'GET' }
                )
            );
            if (!response) {
                toastBus.push({
                    variant: 'error',
                    title: 'Error',
                    message: 'list api keys returned a null response',
                });
                handleApiError(
                    new Error('list api keys returned a null response')
                );
                return;
            }
            setApiKeys(response.data);
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Issues a fresh API key for the device. The backend revokes any
     * prior active key in the same transaction so the single-active
     * invariant always holds.
     *
     * The returned `plain_key` is the token to flash onto the device
     * firmware. It is returned **exactly once** by the backend; this
     * service surfaces a one-time warning toast and hands the value back
     * to the caller for immediate display. It is intentionally never
     * stored in component state — callers must display it and discard it.
     * @param {string} deviceId - The ID of the device to issue a key for.
     * @returns {Promise<CreateApiKeyResponse | null>} The newly issued key
     *   (with `plain_key`), or `null` if the request failed.
     */
    async function issueApiKey(
        deviceId: string
    ): Promise<CreateApiKeyResponse | null> {
        setIsLoading(true);
        setError(null);
        try {
            const { data: response } = await withApiErrorToast(() =>
                apiClient<Envelope<CreateApiKeyResponse> | null>(
                    `/devices/${deviceId}/api-keys`,
                    { method: 'POST' }
                )
            );
            if (!response || !response.data) {
                toastBus.push({
                    variant: 'error',
                    title: 'Error',
                    message: 'issue api key returned a null response',
                });
                handleApiError(
                    new Error('issue api key returned a null response')
                );
                return null;
            }
            const created: CreateApiKeyResponse = response.data;
            // Optimistically prepend the new key to the cached list so the
            // UI reflects rotation immediately, without a round-trip.
            const metadata: ApiKey = {
                id: created.id,
                created_at: created.created_at,
                last_used_at: null,
                expires_at: null,
            };
            setApiKeys(prev => [metadata, ...prev]);
            toastBus.push({
                variant: 'warning',
                title: 'Save this key now',
                message:
                    'The API key is shown only once. Copy it and flash it onto the device firmware — it cannot be retrieved later.',
            });
            return created;
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Revokes a single API key by its ID. Idempotent — revoking an
     * already-revoked or unknown key returns `204` on the backend.
     * @param {string} deviceId - The ID of the device the key belongs to.
     * @param {string} keyId - The UUID of the key to revoke.
     * @returns {Promise<void>} Resolves when the revocation completes.
     */
    async function revokeApiKey(
        deviceId: string,
        keyId: string
    ): Promise<void> {
        setIsLoading(true);
        setError(null);
        try {
            await withApiErrorToast(() =>
                apiClient<Envelope<null> | null>(
                    `/devices/${deviceId}/api-keys/${keyId}`,
                    { method: 'DELETE' }
                )
            );
            // Drop the revoked key from the cached list. The backend
            // returns 204 with no body, so the only signal is success.
            setApiKeys(prev => prev.filter(k => k.id !== keyId));
        } finally {
            setIsLoading(false);
        }
    }

    return {
        isLoading,
        error,
        apiKeys,
        //-- actions
        getApiKeys,
        issueApiKey,
        revokeApiKey,
    };
};