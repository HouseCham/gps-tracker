import { describe, expect, it } from 'vitest';
import { MAP_ONLINE_THRESHOLD_MS } from '@/constants/components';
import { getConnectionStateFrom, getConnectionVariant } from './locations';

const NOW = 1_700_000_000_000;

describe('getConnectionStateFrom', () => {
    it('returns `neverSeen` when recordedAt is null', () => {
        expect(getConnectionStateFrom(null, NOW)).toBe('neverSeen');
    });

    it('returns `neverSeen` when recordedAt is undefined', () => {
        expect(getConnectionStateFrom(undefined, NOW)).toBe('neverSeen');
    });

    it('returns `neverSeen` when recordedAt is an empty string', () => {
        expect(getConnectionStateFrom('', NOW)).toBe('neverSeen');
    });

    it('returns `neverSeen` when recordedAt is not a valid date', () => {
        expect(getConnectionStateFrom('not-a-date', NOW)).toBe('neverSeen');
    });

    it('returns `neverSeen` when recordedAt is in the future', () => {
        const future = new Date(NOW + 1_000).toISOString();
        expect(getConnectionStateFrom(future, NOW)).toBe('neverSeen');
    });

    it('returns `online` when the age is below the threshold', () => {
        const recent = new Date(
            NOW - MAP_ONLINE_THRESHOLD_MS / 2
        ).toISOString();
        expect(getConnectionStateFrom(recent, NOW)).toBe('online');
    });

    it('returns `online` at the exact threshold boundary', () => {
        const edge = new Date(NOW - MAP_ONLINE_THRESHOLD_MS).toISOString();
        expect(getConnectionStateFrom(edge, NOW)).toBe('online');
    });

    it('returns `disconnected` when the age is past the threshold', () => {
        const old = new Date(NOW - (MAP_ONLINE_THRESHOLD_MS + 1)).toISOString();
        expect(getConnectionStateFrom(old, NOW)).toBe('disconnected');
    });

    it('defaults `now` to Date.now() when omitted', () => {
        const recent = new Date(Date.now() - 1_000).toISOString();
        expect(getConnectionStateFrom(recent)).toBe('online');
    });
});

describe('getConnectionVariant', () => {
    it('maps `online` to `success`', () => {
        expect(getConnectionVariant('online')).toBe('success');
    });

    it('maps `disconnected` to `danger`', () => {
        expect(getConnectionVariant('disconnected')).toBe('danger');
    });

    it('maps `neverSeen` to `default`', () => {
        expect(getConnectionVariant('neverSeen')).toBe('default');
    });
});
