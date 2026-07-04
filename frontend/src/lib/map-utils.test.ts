import { describe, expect, it } from 'vitest';
import { en } from '@/i18n';
import type { DeviceMapRoutePoint } from '@/types/components';
import {
    formatCoords,
    getMapStatusLabels,
    getPathFromRoute,
    projectCoordinate,
} from './map-utils';

describe('projectCoordinate', () => {
    it('places (0,0) at the upper-left of the grid', () => {
        const { x, y } = projectCoordinate(75, -180);
        expect(x).toBe(0);
        expect(y).toBe(0);
    });

    it('places the lower bound at the lower-right of the grid', () => {
        const { x, y } = projectCoordinate(-60, 180);
        expect(x).toBe(100);
        expect(y).toBe(100);
    });

    it('clamps a latitude above the maximum to the top edge', () => {
        const { y } = projectCoordinate(80, 0);
        expect(y).toBe(0);
    });

    it('clamps a longitude past the antimeridian to the right edge', () => {
        const { x } = projectCoordinate(0, 200);
        expect(x).toBe(100);
    });

    it('mirrors a zero-meridian projection symmetrically', () => {
        const west = projectCoordinate(0, -90);
        const east = projectCoordinate(0, 90);
        expect(west.x).toBeCloseTo(25, 5);
        expect(east.x).toBeCloseTo(75, 5);
        expect(west.y).toBe(east.y);
    });
});

describe('formatCoords', () => {
    it('uses N/E for positive lat/lng', () => {
        expect(formatCoords(40.7128, -74.006)).toBe(
            '40.7128° N, 74.0060° W'
        );
    });

    it('uses S/W for negative lat/lng', () => {
        expect(formatCoords(-33.8688, -70.5)).toBe(
            '33.8688° S, 70.5000° W'
        );
    });

    it('treats zero as N/E (>=0 branch)', () => {
        expect(formatCoords(0, 0)).toBe('0.0000° N, 0.0000° E');
    });

    it('formats to 4 decimal places', () => {
        expect(formatCoords(12.3456789, 9.87654321)).toBe(
            '12.3457° N, 9.8765° E'
        );
    });
});

describe('getPathFromRoute', () => {
    it('returns an empty string for an empty route', () => {
        expect(getPathFromRoute([])).toBe('');
    });

    it('returns a single M command for one point', () => {
        const route: DeviceMapRoutePoint[] = [{ lat: 0, lng: 0 }];
        expect(getPathFromRoute(route)).toMatch(/^M[\d.]+,[\d.]+$/);
    });

    it('emits one M followed by Ls for multiple points', () => {
        const route: DeviceMapRoutePoint[] = [
            { lat: 0, lng: 0 },
            { lat: 10, lng: 10 },
            { lat: 20, lng: 20 },
        ];
        const out = getPathFromRoute(route);
        const matches = out.match(/M|L/g);
        expect(matches?.[0]).toBe('M');
        expect(matches?.filter(c => c === 'L')).toHaveLength(2);
    });

    it('joins commands with a single space', () => {
        const route: DeviceMapRoutePoint[] = [
            { lat: 0, lng: 0 },
            { lat: 10, lng: 10 },
        ];
        expect(getPathFromRoute(route)).not.toMatch(/  /);
    });
});

describe('getMapStatusLabels', () => {
    it('maps every MarkerStatus key to the en translation', () => {
        expect(getMapStatusLabels(en)).toEqual({
            online: en.device.online,
            offline: en.device.offline,
            'never-seen': en.device.neverSeen,
            unknown: en.device.unknown,
        });
    });

    it('covers exactly the four MarkerStatus keys', () => {
        const labels = getMapStatusLabels(en);
        expect(Object.keys(labels).sort()).toEqual(
            ['never-seen', 'offline', 'online', 'unknown']
        );
    });
});
