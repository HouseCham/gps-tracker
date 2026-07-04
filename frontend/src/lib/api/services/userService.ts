import { useState } from 'react';
//-- Types
import type {
    ApiError,
    CreateUserDto,
    Envelope,
    UpdateUserDto,
    User,
} from '@/types/api';

//-- Utils
import { handleApiError, withApiErrorToast } from '@/lib/api/api-utils';
import { toastBus } from '@/lib/stores/toast.store';
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
 * @method updateUser - Updates an existing user's `name` / `lastname`.
 * @method deleteUser - Soft-deletes a user (`204 No Content`).
 */
interface IUserService {
    isLoading: boolean;
    error: ApiError | null;
    users: User[];
    getAllUsers: () => Promise<void>;
    createUser: (payload: CreateUserDto) => Promise<void>;
    updateUser: (id: string, payload: UpdateUserDto) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
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
            const { data: response } = await withApiErrorToast(() =>
                apiClient<Envelope<User[]> | null>('/users', {
                    method: 'GET',
                })
            );
            if (!response) {
                toastBus.push({
                    variant: 'error',
                    title: 'Error',
                    message: 'get all users returned a null response',
                });
                handleApiError(
                    new Error('get all users returned a null response')
                );
            }
            setUsers(response.data);
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
     * @returns {Promise<void>} Resolves when the user is created.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    async function createUser(payload: CreateUserDto): Promise<void> {
        resetState();
        setIsLoading(true);
        try {
            const { data: response } = await withApiErrorToast(() =>
                apiClient<Envelope<User> | null>('/users', {
                    method: 'POST',
                    body: payload,
                })
            );
            if (!response || !response.data) {
                toastBus.push({
                    variant: 'error',
                    title: 'Error',
                    message: 'create user returned a null response',
                });
                handleApiError(
                    new Error('create user returned a null response')
                );
            }
            setUsers([...users, response.data]);
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Updates an existing user's `name` and/or `lastname`.
     * @param {string} id - The id of the user to update.
     * @param {UpdateUserDto} payload - The user fields to change.
     * @returns {Promise<void>} Resolves when the user is updated.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    async function updateUser(
        id: string,
        payload: UpdateUserDto
    ): Promise<void> {
        resetState();
        setIsLoading(true);
        try {
            const { data: response } = await withApiErrorToast(() =>
                apiClient<Envelope<User> | null>(`/users/${id}`, {
                    method: 'PUT',
                    body: payload,
                })
            );
            if (!response || !response.data) {
                toastBus.push({
                    variant: 'error',
                    title: 'Error',
                    message: 'update user returned a null response',
                });
                handleApiError(
                    new Error('update user returned a null response')
                );
            }
            const updated = response.data;
            setUsers(prev => prev.map(u => (u.id === id ? updated : u)));
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Soft-deletes a user. Backend returns `204 No Content`, so the
     * local state is updated by id without parsing a body.
     * @param {string} id - The id of the user to delete.
     * @returns {Promise<void>} Resolves when the user is deleted.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    async function deleteUser(id: string): Promise<void> {
        resetState();
        setIsLoading(true);
        try {
            await withApiErrorToast(() =>
                apiClient(`/users/${id}`, {
                    method: 'DELETE',
                })
            );
            setUsers(prev => prev.filter(u => u.id !== id));
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
        updateUser,
        deleteUser,
    };
};
