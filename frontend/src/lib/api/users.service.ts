import type { BetterFetchOption } from '@better-fetch/fetch'
import type { CreateUserDto, Envelope, UpdateUserDto, User, UserWithDevices } from '@/types/api'
import { client } from './client'
import { handleApiError } from './helpers/handle-api-error'

/**
 * The HTTP client used to interact with the API.
 * @class UsersService
 */
export class UsersService {
  constructor(private http: typeof client) {}
  /**
   * Retrieves a list of all users.
   * @returns {Promise<User[]>} A promise that resolves to an array of users.
   */
  async getAll(): Promise<User[]> {
    try {
      const { data } = await this.http<User[]>('/users', {
        method: 'GET',
      } as BetterFetchOption)
      return (data as unknown as Envelope<User[]>).data
    } catch (error) {
      handleApiError(error)
    }
  }
  /**
   * Retrieves a user by their ID.
   * @param {string} id - The ID of the user to retrieve.
   * @returns {Promise<User>} A promise that resolves to the user object.
   * @throws {ApiError} An error object containing the error status, message, and code.
   */
  async getById(id: string, params?: { page?: number; page_size?: number }): Promise<UserWithDevices> {
    try {
      const { data } = await this.http<UserWithDevices>(`/users/${id}`, {
        method: 'GET',
        query: params,
      } as BetterFetchOption)
      return (data as unknown as Envelope<UserWithDevices>).data
    } catch (error) {
      handleApiError(error)
    }
  }
  /**
   * Creates a new user.
   * @param {CreateUserDto} payload - The user data to create.
   * @returns {Promise<User>} A promise that resolves to the created user object.
   * @throws {ApiError} An error object containing the error status, message, and code.
   */
  async create(payload: CreateUserDto): Promise<User> {
    try {
      const { data } = await this.http<User>('/users', {
        method: 'POST',
        body: payload,
      } as BetterFetchOption)
      return (data as unknown as Envelope<User>).data
    } catch (error) {
      handleApiError(error)
    }
  }
  /**
   * Updates an existing user.
   * @param {string} id - The ID of the user to update.
   * @param {UpdateUserDto} payload - The user data to update.
   * @returns {Promise<User>} A promise that resolves to the updated user object.
   * @throws {ApiError} An error object containing the error status, message, and code.
   */
  async update(id: string, payload: UpdateUserDto): Promise<User> {
    try {
      const { data } = await this.http<User>(`/users/${id}`, {
        method: 'PUT',
        body: payload,
      } as BetterFetchOption)
      return (data as unknown as Envelope<User>).data
    } catch (error) {
      handleApiError(error)
    }
  }

  /**
   * Deletes a user.
   * @param {string} id - The ID of the user to delete.
   * @throws {ApiError} An error object containing the error status, message, and code.
   */
  async delete(id: string): Promise<void> {
    try {
      await this.http(`/users/${id}`, {
        method: 'DELETE',
      } as BetterFetchOption)
    } catch (error) {
      handleApiError(error)
    }
  }
}

export const usersService = new UsersService(client)