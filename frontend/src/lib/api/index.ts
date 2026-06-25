import type { ApiError } from "./helpers/handle-api-error";
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