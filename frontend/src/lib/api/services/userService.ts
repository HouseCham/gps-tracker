import { useState } from 'react';
//-- Types
import type { ApiError, CreateUserDto, Envelope, User } from '@/types/api';
import type { BetterFetchOption } from '@better-fetch/fetch';
//-- Utils
import { handleApiError } from '@/lib/api/api-utils';
//-- Http Client
import { apiClient } from '@/lib/auth/client';
/**
 * The interface for the user service.
 * @interface IUserService
 * @property {boolean} isLoading - Whether the service is currently loading data.
 * @property {ApiError | null} error - The error that occurred, if any.
 * @property {User[]} users - The list of users.
 * @method getAllUsers - Retrieves a list of all users.
 * @method createUser - Creates a new user.
 */
interface IUserService {
    isLoading: boolean;
    error: ApiError | null;
    users: User[];
    getAllUsers: () => Promise<void>;
    createUser: (payload: CreateUserDto) => Promise<void>;
}
/**
 * The HTTP client used to interact with the users API.
 */
export const useUserService = (): IUserService => {
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
    }
    /**
     * Retrieves a list of all users.
     * @returns {Promise<void>} Resolves when the users are fetched and state is updated.
     */
    async function getAllUsers(): Promise<void> {
        resetState();
        setIsLoading(true);
        setUsers([]);
        try {
            const { data: response } = await apiClient<Envelope<User[]> | null>(
                '/users',
                {
                    method: 'GET',
                } as BetterFetchOption
            );
            if (!response) {
                handleApiError(
                    new Error('get all users returned a null response')
                );
            }
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
    async function createUser(payload: CreateUserDto): Promise<void> {
        resetState();
        setIsLoading(true);
        try {
            const { data: response } = await apiClient<Envelope<User> | null>(
                '/users',
                {
                    method: 'POST',
                    body: payload,
                } as BetterFetchOption
            );
            if (!response || !response.data) {
                handleApiError(
                    new Error('create user returned a null response')
                );
            }
            setUsers([...users, response.data]);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }

    return {
        isLoading,
        error,
        users,
        //-- actions
        getAllUsers,
        createUser,
    };
};
