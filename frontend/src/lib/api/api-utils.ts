import type { ApiError } from '@/types/api';
import { BetterFetchError } from '@better-fetch/fetch';
/**
 * Checks if the provided value is an ApiError object.
 * @param {unknown} error - The value to check.
 * @returns {boolean} True if the value is an ApiError object, false otherwise.
 */
export function isApiError(error: unknown): error is Partial<ApiError> {
    return (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        'message' in error
    );
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