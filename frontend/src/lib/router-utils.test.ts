import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/i18n';
import { generateNavbarItems, redirectTo } from './router-utils';

describe('generateNavbarItems', () => {
    it('returns dashboard + devices + profile when showAdmin is false', () => {
        const items = generateNavbarItems('en', en, false);
        expect(items.map(i => i.key)).toEqual([
            'dashboard',
            'devices',
            'profile',
        ]);
    });

    it('inserts admin before profile when showAdmin is true', () => {
        const items = generateNavbarItems('en', en, true);
        expect(items.map(i => i.key)).toEqual([
            'dashboard',
            'devices',
            'admin',
            'profile',
        ]);
    });

    it('prefixes every href with the locale', () => {
        const items = generateNavbarItems('es', en, true);
        for (const item of items) {
            expect(item.href.startsWith('/es/')).toBe(true);
        }
    });

    it('uses nav translation keys as labels and assigns an Icon per item', () => {
        const items = generateNavbarItems('en', en, true);
        expect(items.find(i => i.key === 'dashboard')?.label).toBe(
            en.nav.dashboard
        );
        expect(items.find(i => i.key === 'devices')?.label).toBe(
            en.nav.devices
        );
        expect(items.find(i => i.key === 'admin')?.label).toBe(en.nav.admin);
        expect(items.find(i => i.key === 'profile')?.label).toBe(
            en.nav.profile
        );
        for (const item of items) {
            expect(item.Icon).toBeDefined();
        }
    });
});

describe('redirectTo', () => {
    let originalReplace: typeof window.location.replace;
    let replaceSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        originalReplace = window.location.replace;
        replaceSpy = vi.fn();
        // redirectTo only touches .replace on window.location, so swapping
        // that single method is enough — the rest of the Location object
        // can stay intact.
        window.location.replace =
            replaceSpy as unknown as typeof window.location.replace;
    });

    afterEach(() => {
        window.location.replace = originalReplace;
    });

    it('prefixes the path with /en when navigator.language is en-US', () => {
        Object.defineProperty(navigator, 'language', {
            value: 'en-US',
            configurable: true,
        });
        redirectTo('/dashboard');
        expect(replaceSpy).toHaveBeenCalledWith('/en/dashboard');
    });

    it('prefixes the path with /es when navigator.language starts with es', () => {
        Object.defineProperty(navigator, 'language', {
            value: 'es-MX',
            configurable: true,
        });
        redirectTo('/perfil');
        expect(replaceSpy).toHaveBeenCalledWith('/es/perfil');
    });

    it('falls back to /en for an unsupported navigator.language', () => {
        Object.defineProperty(navigator, 'language', {
            value: 'fr-FR',
            configurable: true,
        });
        redirectTo('/foo');
        expect(replaceSpy).toHaveBeenCalledWith('/en/foo');
    });

    it('falls back to /en when navigator.language is empty', () => {
        Object.defineProperty(navigator, 'language', {
            value: '',
            configurable: true,
        });
        redirectTo('/foo');
        expect(replaceSpy).toHaveBeenCalledWith('/en/foo');
    });
});
