import { describe, expect, it } from 'vitest';
import { en } from '@/i18n';
import {
    getDemoKpiItems,
    getDeviceAccessTableColumns,
    getDeviceTableColumns,
} from './device-utils';

describe('getDeviceTableColumns', () => {
    it('returns five columns in the documented order', () => {
        const cols = getDeviceTableColumns(en);
        expect(cols.map(c => c.key)).toEqual([
            'name',
            'vehicleType',
            'status',
            'lastSeen',
            'actions',
        ]);
    });

    it('marks only `name` as sortable', () => {
        const cols = getDeviceTableColumns(en);
        expect(cols.find(c => c.key === 'name')?.sortable).toBe(true);
        expect(cols.filter(c => c.sortable)).toHaveLength(1);
    });

    it('aligns `actions` to right; the others are left/default', () => {
        const cols = getDeviceTableColumns(en);
        expect(cols.find(c => c.key === 'actions')?.align).toBe('right');
        expect(cols.find(c => c.key === 'name')?.align).toBeUndefined();
        expect(cols.find(c => c.key === 'status')?.align).toBeUndefined();
    });

    it('uses device.table translation keys as labels', () => {
        const cols = getDeviceTableColumns(en);
        const t = en.device.table;
        expect(cols.find(c => c.key === 'name')?.label).toBe(t.name);
        expect(cols.find(c => c.key === 'vehicleType')?.label).toBe(t.vehicleType);
        expect(cols.find(c => c.key === 'status')?.label).toBe(t.status);
        expect(cols.find(c => c.key === 'lastSeen')?.label).toBe(t.lastSeen);
        expect(cols.find(c => c.key === 'actions')?.label).toBe(t.actions);
    });
});

describe('getDemoKpiItems', () => {
    it('returns four KPI items', () => {
        expect(getDemoKpiItems(en)).toHaveLength(4);
    });

    it('uses admin + device translations as labels', () => {
        const items = getDemoKpiItems(en);
        expect(items[0]?.label).toBe(en.admin.totalDevices);
        expect(items[1]?.label).toBe(en.admin.onlineNow);
        expect(items[2]?.label).toBe(en.device.offline);
        expect(items[3]?.label).toBe(en.admin.alerts);
    });

    it('emits valid variant/icon/trend literals', () => {
        for (const item of getDemoKpiItems(en)) {
            expect(['neutral', 'success', 'warning', 'danger']).toContain(item.variant);
            expect(['cpu', 'wifi', 'wifi-off', 'alert']).toContain(item.icon);
            expect(['up', 'down', 'flat']).toContain(item.trend);
        }
    });
});

describe('getDeviceAccessTableColumns', () => {
    it('returns four columns in the documented order', () => {
        const cols = getDeviceAccessTableColumns(en.device.detail.accessTable);
        expect(cols.map(c => c.key)).toEqual([
            'name',
            'email',
            'access_granted_at',
            'actions',
        ]);
    });

    it('aligns `actions` to right', () => {
        const cols = getDeviceAccessTableColumns(en.device.detail.accessTable);
        expect(cols.find(c => c.key === 'actions')?.align).toBe('right');
        expect(cols.find(c => c.key === 'name')?.align).toBeUndefined();
    });

    it('uses accessTable translation keys as labels', () => {
        const cols = getDeviceAccessTableColumns(en.device.detail.accessTable);
        const t = en.device.detail.accessTable;
        expect(cols.find(c => c.key === 'name')?.label).toBe(t.name);
        expect(cols.find(c => c.key === 'email')?.label).toBe(t.email);
        expect(cols.find(c => c.key === 'access_granted_at')?.label).toBe(
            t.accessGranted
        );
        expect(cols.find(c => c.key === 'actions')?.label).toBe(t.actions);
    });
});
