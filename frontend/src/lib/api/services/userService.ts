import type {
    ApiError,
    // CreateUserDto,
    Envelope,
    // UpdateUserDto,
    User,
    // UserWithDevices,
} from '@/types/api';
import { handleApiError } from '@/lib/api/api-utils';
import { useState } from 'react';
import { apiClient } from '@/lib/auth/client';
import type { BetterFetchOption } from '@better-fetch/fetch';

/**
 * The HTTP client used to interact with the users API.
 */
export function useUserService() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<ApiError | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    /**
     * Resets the state of the service to its initial values.
     * @returns {void}
     */
    function resetState(): void {
        setIsLoading(false);
        setError(null);
        setUsers([]);
    };
    /**
     * Retrieves a list of all users.
     * @returns {Promise<void>} Resolves when the users are fetched and state is updated.
     */
    async function getAllUsers(): Promise<void> {
        resetState();
        setIsLoading(true);
        try {
            const { data: response } = await apiClient<Envelope<User[]> | null>(
                '/users',
                {
                    method: 'GET',
                } as BetterFetchOption
            );
            if (!response) {
                handleApiError(new Error('get all users returned a null response'));
            };
            setUsers(response.data);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Retrieves a user by their ID, including their associated devices.
     * @param {string} id - The ID of the user to retrieve.
     * @returns {Promise<UserWithDevices>} A promise that resolves to the user with devices.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    // function getById(id: string): Promise<UserWithDevices>{

    // }

    /**
     * Creates a new user.
     * @param {CreateUserDto} payload - The user data to create.
     * @returns {Promise<User>} A promise that resolves to the created user object.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    // function create(payload: CreateUserDto): Promise<User> {

    // }

    /**
     * Updates an existing user.
     * @param {string} id - The ID of the user to update.
     * @param {UpdateUserDto} payload - The fields to update.
     * @returns {Promise<User>} A promise that resolves to the updated user object.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    // function update(id: string, payload: UpdateUserDto): Promise<User> {

    // }

    /**
     * Deletes a user by their ID.
     * @param {string} id - The ID of the user to delete.
     * @returns {Promise<void>} A promise that resolves once the user is deleted.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    // function delete(id: string): Promise<void> {

    // }

    return {
        isLoading,
        error,
        users,
        getAllUsers
    }
};