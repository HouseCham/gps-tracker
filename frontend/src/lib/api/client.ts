import { createFetch } from '@better-fetch/fetch'

/**
 * The HTTP client used to interact with the API.
 * @type {typeof import('@better-fetch/fetch').createFetch}
 */
export const client = createFetch({
  baseURL: import.meta.env.PUBLIC_API_URL || '/api/v1',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
})