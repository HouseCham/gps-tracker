import type { BetterFetchOption } from '@better-fetch/fetch';
import type { BootstrapResponseEnvelope, BootstrapStatus } from '@/types/api';
import { client } from '../client';
import { handleApiError } from '../helpers/handle-api-error';

/**
 * The HTTP client used to interact with the system bootstrap endpoint.
 * @class BootstrapService
 */
export class BootstrapService {
    constructor(private http: typeof client) {}

    /**
     * Asks the backend whether the app needs its first user.
     *
     * The endpoint is intentionally unauthenticated: it has to be
     * reachable before the visitor has signed in. Any error here
     * is treated as a hard failure and re-thrown — the frontend
     * gate cannot make a safe decision without the answer.
     * @returns {Promise<BootstrapStatus>} The bootstrap status.
     * @throws {ApiError} When the backend is unreachable or returns a non-2xx response.
     */
    async getStatus(): Promise<BootstrapStatus> {
        try {
            const { data } = await this.http<BootstrapResponseEnvelope>(
                '/system/bootstrap',
                {
                    method: 'GET',
                } as BetterFetchOption,
            );
            // generic HTTP client returns unknown; trusted backend response shape
            return { needsSetup: (data as unknown as BootstrapResponseEnvelope).data };
        } catch (error) {
            console.error("Error fetching bootstrap status:", error);
            handleApiError(error);
        }
    }
}

export const bootstrapService = new BootstrapService(client);