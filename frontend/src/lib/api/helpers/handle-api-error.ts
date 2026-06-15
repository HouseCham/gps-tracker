import { BetterFetchError } from '@better-fetch/fetch'
/**
 * Represents an error returned by the API.
 * @interface ApiError
 * @property {number} status - The HTTP status code of the error.
 * @property {string} message - The error message.
 * @property {string} [code] - The error code.
 */
export interface ApiError {
  status: number
  message: string
  code?: string
}
/**
 * Handles errors thrown by the API.
 * @param {unknown} error - The error to handle.
 * @throws {ApiError} An object containing the error status, message, and code.
 */
export function handleApiError(error: unknown): never {
  if (error instanceof BetterFetchError) {
    const body = error.cause as { message?: string; code?: string } | undefined
    throw {
      status: error.status,
      message: body?.message || 'An unexpected error occurred',
      code: body?.code,
    } satisfies ApiError
  }

  throw {
    status: 0,
    message: error instanceof Error ? error.message : 'Network error',
  } satisfies ApiError
}