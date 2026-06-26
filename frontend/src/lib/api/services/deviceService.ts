import { useState } from 'react';
//-- Types
import type {
    ApiError,
    CreateDeviceDto,
    Device,
    DeviceListResponse,
    DeviceWithAccess,
    Envelope,
    UpdateDeviceDto,
} from '@/types/api';
//-- Utils
import { handleApiError } from '@/lib/api/api-utils';
//-- Http Client
import { apiClient } from '@/lib/auth/client';

/**
 * The interface for the device service.
 * @interface IDeviceService
 * @property {boolean} isLoading - Whether the service is currently loading data.
 * @property {ApiError | null} error - The error that occurred, if any.
 * @property {DeviceWithAccess[]} devices - The list of devices the authenticated user has access to.
 * @property {Device | null} device - The single device retrieved by ID (if any).
 * @method getAllDevices - Retrieves a paginated list of devices for the authenticated user.
 * @method getDeviceById - Retrieves a single device by its ID.
 * @method createDevice - Creates a new device.
 * @method updateDevice - Updates an existing device's name and/or vehicle type.
 * @method deleteDevice - Soft-deletes a device by its ID.
 */
interface IDeviceService {
    isLoading: boolean;
    error: ApiError | null;
    devices: DeviceWithAccess[];
    device: Device | null;
    getAllDevices: (page?: number, pageSize?: number) => Promise<void>;
    getDeviceById: (id: string) => Promise<void>;
    createDevice: (payload: CreateDeviceDto) => Promise<void>;
    updateDevice: (id: string, payload: UpdateDeviceDto) => Promise<void>;
    deleteDevice: (id: string) => Promise<void>;
}

/**
 * The HTTP client used to interact with the devices API.
 */
export const useDeviceService = (): IDeviceService => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<ApiError | null>(null);
    const [devices, setDevices] = useState<DeviceWithAccess[]>([]);
    const [device, setDevice] = useState<Device | null>(null);

    /**
     * Resets the state of the service to its initial values.
     * @returns {void}
     */
    function resetState(): void {
        setIsLoading(false);
        setError(null);
    }

    /**
     * Retrieves a paginated list of devices for the authenticated user.
     * @param {number} [page=1] - The page number to retrieve.
     * @param {number} [pageSize=20] - The number of items per page.
     * @returns {Promise<void>} Resolves when the devices are fetched and state is updated.
     */
    async function getAllDevices(
        page: number = 1,
        pageSize: number = 20,
    ): Promise<void> {
        resetState();
        setIsLoading(true);
        setDevices([]);
        try {
            const { data: response } = await apiClient<Envelope<DeviceListResponse> | null>(
                '/devices',
                {
                    method: 'GET',
                    query: { page, page_size: pageSize },
                },
            );
            if (!response) {
                handleApiError(new Error('get all devices returned a null response'));
            }
            setDevices(response!.data.items);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Retrieves a single device by its ID.
     * @param {string} id - The ID of the device to retrieve.
     * @returns {Promise<void>} Resolves when the device is fetched and state is updated.
     */
    async function getDeviceById(id: string): Promise<void> {
        resetState();
        setIsLoading(true);
        setDevice(null);
        try {
            const { data: response } = await apiClient<Envelope<Device> | null>(
                `/devices/${id}`,
                {
                    method: 'GET',
                },
            );
            if (!response) {
                handleApiError(new Error('get device returned a null response'));
            }
            setDevice(response!.data);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Creates a new device and grants the authenticated user owner access to it.
     * @param {CreateDeviceDto} payload - The device data to create.
     * @returns {Promise<void>} Resolves when the device is created and state is updated.
     */
    async function createDevice(payload: CreateDeviceDto): Promise<void> {
        resetState();
        setIsLoading(true);
        try {
            const { data: response } = await apiClient<Envelope<Device> | null>(
                '/devices',
                {
                    method: 'POST',
                    body: payload,
                },
            );
            if (!response || !response.data) {
                handleApiError(new Error('create device returned a null response'));
            }
            // Optimistically add the new device to the list as a DeviceWithAccess
            const newDeviceWithAccess: DeviceWithAccess = {
                ...response!.data,
                access_role: 'owner',
            };
            setDevices([newDeviceWithAccess, ...devices]);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Updates an existing device's name and/or vehicle type.
     * @param {string} id - The ID of the device to update.
     * @param {UpdateDeviceDto} payload - The fields to update.
     * @returns {Promise<void>} Resolves when the device is updated and state is updated.
     */
    async function updateDevice(id: string, payload: UpdateDeviceDto): Promise<void> {
        resetState();
        setIsLoading(true);
        try {
            const { data: response } = await apiClient<Envelope<Device> | null>(
                `/devices/${id}`,
                {
                    method: 'PUT',
                    body: payload,
                },
            );
            if (!response || !response.data) {
                handleApiError(new Error('update device returned a null response'));
            }
            // Update the device in the list if it is present there
            setDevices((prev) =>
                prev.map((d) =>
                    d.id === id ? { ...d, ...response!.data } : d,
                ),
            );
            // Update the single-device state if it matches
            if (device && device.id === id) {
                setDevice(response!.data);
            }
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Soft-deletes a device by its ID.
     * @param {string} id - The ID of the device to delete.
     * @returns {Promise<void>} Resolves when the device is deleted and state is updated.
     */
    async function deleteDevice(id: string): Promise<void> {
        resetState();
        setIsLoading(true);
        try {
            await apiClient<Envelope<null> | null>(
                `/devices/${id}`,
                {
                    method: 'DELETE',
                },
            );
            // Remove the deleted device from the list
            setDevices((prev) => prev.filter((d) => d.id !== id));
            // Clear single-device state if it matches
            if (device && device.id === id) {
                setDevice(null);
            }
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }

    return {
        isLoading,
        error,
        devices,
        device,
        //-- actions
        getAllDevices,
        getDeviceById,
        createDevice,
        updateDevice,
        deleteDevice,
    };
};
