import type {
    CreateDeviceDto,
    Device,
    DeviceAccess,
    DeviceAccessListItem,
    Envelope,
    UpdateDeviceDto,
} from '@/types/api';
import { client } from '../client';
import { handleApiError } from '../helpers/handle-api-error';
import type { BetterFetchOption } from '@better-fetch/fetch';
/**
 * The HTTP client used to interact with the API.
 * @class DevicesService
 */
export class DevicesService {
    constructor(private http: typeof client) {}
    /**
     * Retrieves a list of all devices.
     * @returns {Promise<Device[]>} A promise that resolves to an array of devices.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    async getAll(): Promise<Device[]> {
        try {
            const { data } = await this.http<Device[]>('/devices', {
                method: 'GET',
            } as BetterFetchOption);
            return (data as unknown as Envelope<Device[]>).data;
        } catch (error) {
            handleApiError(error);
        }
    }
    /**
     * Retrieves a device by its ID.
     * @param {string} id - The ID of the device to retrieve.
     * @returns {Promise<Device>} A promise that resolves to the device object.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    async getById(id: string): Promise<Device> {
        try {
            const { data } = await this.http<Device>(`/devices/${id}`, {
                method: 'GET',
            } as BetterFetchOption);
            return (data as unknown as Envelope<Device>).data;
        } catch (error) {
            handleApiError(error);
        }
    }
    /**
     * Creates a new device.
     * @param {CreateDeviceDto} payload - The device data to create.
     * @returns {Promise<Device>} A promise that resolves to the created device object.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    async create(payload: CreateDeviceDto): Promise<Device> {
        try {
            const { data } = await this.http<Device>('/devices', {
                method: 'POST',
                body: payload,
            } as BetterFetchOption);
            return (data as unknown as Envelope<Device>).data;
        } catch (error) {
            handleApiError(error);
        }
    }
    /**
     * Updates an existing device.
     * @param {string} id - The ID of the device to update.
     * @param {UpdateDeviceDto} payload - The device data to update.
     * @returns {Promise<Device>} A promise that resolves to the updated device object.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    async update(id: string, payload: UpdateDeviceDto): Promise<Device> {
        try {
            const { data } = await this.http<Device>(`/devices/${id}`, {
                method: 'PUT',
                body: payload,
            } as BetterFetchOption);
            return (data as unknown as Envelope<Device>).data;
        } catch (error) {
            handleApiError(error);
        }
    }
    /**
     * Deletes a device.
     * @param {string} id - The ID of the device to delete.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    async delete(id: string): Promise<void> {
        try {
            await this.http(`/devices/${id}`, {
                method: 'DELETE',
            } as BetterFetchOption);
        } catch (error) {
            handleApiError(error);
        }
    }
    /**
     * Grants access to a device to a user.
     * @param {string} deviceId - The ID of the device to grant access to.
     * @param {string} userId - The ID of the user to grant access to the device.
     * @returns {Promise<DeviceAccess>} A promise that resolves to the device access object.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    async grantAccess(deviceId: string, userId: string): Promise<DeviceAccess> {
        try {
            const { data } = await this.http<DeviceAccess>(
                `/devices/${deviceId}/access`,
                {
                    method: 'POST',
                    body: { user_id: userId },
                } as BetterFetchOption
            );
            return (data as unknown as Envelope<DeviceAccess>).data;
        } catch (error) {
            handleApiError(error);
        }
    }
    /**
     * Retrieves a list of users with access to a device.
     * @param {string} deviceId - The ID of the device to retrieve access for.
     * @returns {Promise<DeviceAccessListItem[]>} A promise that resolves to an array of device access list items.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    async listAccess(deviceId: string): Promise<DeviceAccessListItem[]> {
        try {
            const { data } = await this.http<DeviceAccessListItem[]>(
                `/devices/${deviceId}/access`,
                {
                    method: 'GET',
                } as BetterFetchOption
            );
            return (data as unknown as Envelope<DeviceAccessListItem[]>).data;
        } catch (error) {
            handleApiError(error);
        }
    }
    /**
     * Revokes access to a device from a user.
     * @param {string} deviceId - The ID of the device to revoke access from.
     * @param {string} userId - The ID of the user to revoke access from the device.
     * @throws {ApiError} An error object containing the error status, message, and code.
     */
    async revokeAccess(deviceId: string, userId: string): Promise<void> {
        try {
            await this.http(`/devices/${deviceId}/access/${userId}`, {
                method: 'DELETE',
            } as BetterFetchOption);
        } catch (error) {
            handleApiError(error);
        }
    }
}

export const devicesService = new DevicesService(client);
