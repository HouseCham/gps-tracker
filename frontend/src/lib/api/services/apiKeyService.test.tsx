import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/client', () => ({
    authClient: vi.fn(),
    apiClient: vi.fn(),
}));

import * as clientMod from '@/lib/auth/client';
import { $toasts } from '@/lib/stores/toast.store';
import type {
    ApiKey,
    ApiKeyListResponse,
    CreateApiKeyResponse,
    Envelope,
} from '@/types/api';
import { useApiKeyService } from './apiKeyService';

const apiClient = vi.mocked(clientMod.apiClient);

function key(id: string, overrides: Partial<ApiKey> = {}): ApiKey {
    return {
        id,
        created_at: '2024-01-01T00:00:00Z',
        last_used_at: null,
        expires_at: null,
        ...overrides,
    };
}

function listEnv(items: ApiKey[]): { data: Envelope<ApiKeyListResponse> } {
    return {
        data: {
            status_code: 200,
            message: 'OK',
            data: items,
        },
    };
}

function issueEnv(
    payload: CreateApiKeyResponse
): { data: Envelope<CreateApiKeyResponse> } {
    return {
        data: {
            status_code: 201,
            message: 'api key issued',
            data: payload,
        },
    };
}

beforeEach(() => {
    apiClient.mockReset();
    $toasts.set([]);
});

describe('useApiKeyService', () => {
    describe('getApiKeys', () => {
        it('hydrates apiKeys from the list response', async () => {
            const items = [key('k1'), key('k2')];
            apiClient.mockResolvedValue(listEnv(items));

            const { result } = renderHook(() => useApiKeyService());

            await act(async () => {
                await result.current.getApiKeys('d1');
            });

            expect(result.current.apiKeys).toEqual(items);
            expect(apiClient).toHaveBeenCalledWith(
                '/devices/d1/api-keys',
                expect.objectContaining({ method: 'GET' }),
            );
        });

        it('clears prior apiKeys before refetching', async () => {
            apiClient
                .mockResolvedValueOnce(listEnv([key('old')]))
                .mockResolvedValueOnce(listEnv([key('new')]));

            const { result } = renderHook(() => useApiKeyService());

            await act(async () => {
                await result.current.getApiKeys('d1');
            });
            expect(result.current.apiKeys.map(k => k.id)).toEqual(['old']);

            await act(async () => {
                await result.current.getApiKeys('d1');
            });
            expect(result.current.apiKeys.map(k => k.id)).toEqual(['new']);
        });
    });

    describe('issueApiKey', () => {
        it('returns the plain_key once and optimistically prepends metadata to the list', async () => {
            const created: CreateApiKeyResponse = {
                id: 'k-new',
                created_at: '2024-02-02T00:00:00Z',
                plain_key: 'opaque-token-abc123',
            };
            apiClient
                .mockResolvedValueOnce(listEnv([key('k-old')]))
                .mockResolvedValueOnce(issueEnv(created));

            const { result } = renderHook(() => useApiKeyService());

            await act(async () => {
                await result.current.getApiKeys('d1');
            });

            let returned: CreateApiKeyResponse | null = null;
            await act(async () => {
                returned = await result.current.issueApiKey('d1');
            });

            expect(returned).toMatchObject({
                id: 'k-new',
                created_at: '2024-02-02T00:00:00Z',
                plain_key: 'opaque-token-abc123',
            });

            // The cached list now holds the new metadata, with no plain_key.
            expect(result.current.apiKeys.map(k => k.id)).toEqual([
                'k-new',
                'k-old',
            ]);
            expect(
                result.current.apiKeys[0] as unknown as
                    | { plain_key?: string }
                    | undefined,
            ).not.toHaveProperty('plain_key');

            // POST went to the correct URL with no body.
            expect(apiClient).toHaveBeenNthCalledWith(
                2,
                '/devices/d1/api-keys',
                expect.objectContaining({ method: 'POST' }),
            );
        });

        it('emits a warning toast reminding the user to save plain_key', async () => {
            apiClient.mockResolvedValueOnce(
                issueEnv({
                    id: 'k-new',
                    created_at: '2024-02-02T00:00:00Z',
                    plain_key: 'opaque',
                }),
            );

            const { result } = renderHook(() => useApiKeyService());

            await act(async () => {
                await result.current.issueApiKey('d1');
            });

            const toasts = $toasts.get();
            expect(toasts).toHaveLength(1);
            expect(toasts[0]?.variant).toBe('warning');
            expect(toasts[0]?.message).toMatch(/only once/i);
        });
    });

    describe('revokeApiKey', () => {
        it('DELETEs the key and removes it from the cached list', async () => {
            apiClient
                .mockResolvedValueOnce(listEnv([key('k1'), key('k2')]))
                .mockResolvedValueOnce({ data: null });

            const { result } = renderHook(() => useApiKeyService());

            await act(async () => {
                await result.current.getApiKeys('d1');
            });

            await act(async () => {
                await result.current.revokeApiKey('d1', 'k1');
            });

            expect(apiClient).toHaveBeenNthCalledWith(
                2,
                '/devices/d1/api-keys/k1',
                expect.objectContaining({ method: 'DELETE' }),
            );
            expect(result.current.apiKeys.map(k => k.id)).toEqual(['k2']);
        });

        it('is a no-op against the cached list when the key was not there', async () => {
            apiClient
                .mockResolvedValueOnce(listEnv([key('k1')]))
                .mockResolvedValueOnce({ data: null });

            const { result } = renderHook(() => useApiKeyService());

            await act(async () => {
                await result.current.getApiKeys('d1');
            });

            await act(async () => {
                await result.current.revokeApiKey('d1', 'k-ghost');
            });

            expect(result.current.apiKeys.map(k => k.id)).toEqual(['k1']);
        });
    });
});