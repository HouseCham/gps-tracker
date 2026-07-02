import type { ApiError } from '@/types/api';
import { BetterFetchError } from '@better-fetch/fetch';
/**
 * Checks if the provided value is an ApiError object.
 * Validates the field types so the guard narrows to the full `ApiError`
 * shape (status: number, message: string); callers that need to store
 * the value in `ApiError`-typed state don't need a follow-up cast.
 * @param {unknown} error - The value to check.
 * @returns {boolean} True if the value is an ApiError object, false otherwise.
 */
export function isApiError(error: unknown): error is ApiError {
    if (typeof error !== 'object' || error === null) return false;
    const e = error as Record<string, unknown>;
    return typeof e.status === 'number' && typeof e.message === 'string';
}
/**
 * Narrows an unknown thrown value (typically from `handleApiError`) into a
 * partial {@link ApiError} shape so callers can pluck `message` for inline
 * UI without each component redefining its own guard.
 * @param {unknown} err - Whatever the rejected promise gave us.
 * @returns {{ message?: string }} A safe subset of fields for rendering.
 */
export function asApiError(err: unknown): { message?: string } {
    if (typeof err === 'object' && err !== null) {
        // ponytail: at this point `err` is `object & not null`. The narrowed
        //   shape is consumed defensively (only `?.message` is read) so a
        //   stray `message` field is the worst-case we accept.
        return err as { message?: string };
    }
    return {};
}
/**
 * Handles errors thrown by the API.
 * @param {unknown} error - The error to handle.
 * @throws {ApiError} An object containing the error status, message, and code.
 */
export function handleApiError(error: unknown): never {
    if (error instanceof BetterFetchError) {
        const body = error.cause as
            | { message?: string; code?: string }
            | undefined;
        throw {
            status: error.status,
            message: body?.message || 'An unexpected error occurred',
            code: body?.code,
        } satisfies ApiError;
    }

    throw {
        status: 0,
        message: error instanceof Error ? error.message : 'Network error',
    } satisfies ApiError;
}
