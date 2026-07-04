import { afterEach, describe, expect, it } from 'vitest';
import { readDeviceIdFromUrl } from './http-utils';

function setSearch(value: string): void {
    Object.defineProperty(window.location, 'search', {
        value,
        configurable: true,
        writable: true,
    });
}

describe('readDeviceIdFromUrl', () => {
    const originalSearch = window.location.search;

    afterEach(() => {
        setSearch(originalSearch);
    });

    it('returns the id when ?id=<value> is present', () => {
        setSearch('?id=abc-123');
        expect(readDeviceIdFromUrl()).toBe('abc-123');
    });

    it('returns null when the ?id= parameter is absent', () => {
        setSearch('?other=foo');
        expect(readDeviceIdFromUrl()).toBeNull();
    });

    it('returns null when the search string is empty', () => {
        setSearch('');
        expect(readDeviceIdFromUrl()).toBeNull();
    });

    it('returns null when ?id= is present but empty', () => {
        setSearch('?id=');
        expect(readDeviceIdFromUrl()).toBeNull();
    });

    it('coexists with other query params', () => {
        setSearch('?foo=bar&id=device-42&baz=qux');
        expect(readDeviceIdFromUrl()).toBe('device-42');
    });
});
