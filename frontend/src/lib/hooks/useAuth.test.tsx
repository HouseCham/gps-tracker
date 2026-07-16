import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { authService } from '@/lib/auth/service';
import { $isAuthLoading, $user, setUser } from '@/lib/stores/auth';
import { useAuth } from './useAuth';

const sample: Parameters<typeof setUser>[0] = {
    id: 'u-1',
    email: 'a@b.com',
    name: 'A B',
};

beforeEach(() => {
    $user.set(null);
    $isAuthLoading.set(false);
});

describe('useAuth', () => {
    it('returns the current snapshot of the auth atoms', () => {
        setUser(sample);
        const { result } = renderHook(() => useAuth());

        expect(result.current.user).toEqual(sample);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isAuthLoading).toBe(false);
    });

    it('re-renders when $user flips', () => {
        const { result } = renderHook(() => useAuth());
        expect(result.current.isAuthenticated).toBe(false);

        act(() => setUser(sample));

        expect(result.current.user).toEqual(sample);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('re-renders when $isAuthLoading flips', () => {
        const { result } = renderHook(() => useAuth());
        expect(result.current.isAuthLoading).toBe(false);

        act(() => $isAuthLoading.set(true));

        expect(result.current.isAuthLoading).toBe(true);
    });

    it('exposes the authService actions unchanged', () => {
        const { result } = renderHook(() => useAuth());
        expect(result.current.signIn).toBe(authService.signIn);
        expect(result.current.signUp).toBe(authService.signUp);
        expect(result.current.signInOAuth).toBe(authService.signInOAuth);
        expect(result.current.signOut).toBe(authService.signOut);
    });
});
