import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthUser } from '@/types/api';
import {
    $isAuthenticated,
    $isAuthLoading,
    $user,
    clearUser,
    setAuthLoading,
    setUser,
} from './auth';

const sampleUser: AuthUser = {
    id: 'u-1',
    email: 'jane@example.com',
    name: 'Jane Doe',
};

/**
 * Reset atom state between tests. These are module-level singletons,
 * so without this, test ordering would leak state across specs.
 */
beforeEach(() => {
    $user.set(null);
    $isAuthLoading.set(false);
});

describe('$user + setUser / clearUser', () => {
    it('starts null', () => {
        expect($user.get()).toBeNull();
    });

    it('setUser replaces the held user', () => {
        setUser(sampleUser);
        expect($user.get()).toEqual(sampleUser);
    });

    it('clearUser resets the held user to null', () => {
        setUser(sampleUser);
        clearUser();
        expect($user.get()).toBeNull();
    });
});

describe('$isAuthenticated', () => {
    it('is false when no user is held', () => {
        expect($isAuthenticated.get()).toBe(false);
    });

    it('flips to true after setUser', () => {
        setUser(sampleUser);
        expect($isAuthenticated.get()).toBe(true);
    });

    it('flips back to false after clearUser', () => {
        setUser(sampleUser);
        clearUser();
        expect($isAuthenticated.get()).toBe(false);
    });

    it('notifies subscribers on every transition (not just the final snapshot)', () => {
        const seen: Array<boolean> = [];
        const unsub = $isAuthenticated.subscribe(v => seen.push(v));
        setUser(sampleUser);
        clearUser();
        unsub();
        expect(seen).toEqual([false, true, false]);
    });
});

describe('$isAuthLoading + setAuthLoading', () => {
    it('starts false', () => {
        expect($isAuthLoading.get()).toBe(false);
    });

    it('setAuthLoading flips to true and back to false', () => {
        setAuthLoading(true);
        expect($isAuthLoading.get()).toBe(true);
        setAuthLoading(false);
        expect($isAuthLoading.get()).toBe(false);
    });
});
