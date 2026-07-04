import { describe, expect, it, beforeEach } from 'vitest';
import { BetterFetchError } from '@better-fetch/fetch';
import { withApiErrorToast } from './with-api-error-toast';
import { $toasts } from '@/lib/stores/toast.store';

/**
 * Build a BetterFetchError whose `.cause` is whatever the test wants the
 * handleApiError branch to read.
 */
function bfErr(
    status: number,
    statusText: string,
    cause: unknown
): BetterFetchError {
    return new BetterFetchError(status, statusText, cause as never);
}

beforeEach(() => {
    $toasts.set([]);
});

describe('withApiErrorToast', () => {
    it('returns the resolved value on success and pushes no toast', async () => {
        const result = await withApiErrorToast(async () => 42);
        expect(result).toBe(42);
        expect($toasts.get()).toEqual([]);
    });

    it('on a BetterFetchError, pushes a status-mapped error toast and rethrows a typed ApiError', async () => {
        const err = bfErr(401, 'Unauthorized', {
            message: 'Bad credentials',
            code: 'AUTH_INVALID',
        });

        await expect(
            withApiErrorToast(() => {
                throw err;
            })
        ).rejects.toMatchObject({ status: 401, message: 'Bad credentials' });

        const stack = $toasts.get();
        expect(stack).toHaveLength(1);
        expect(stack[0]).toMatchObject({
            variant: 'error',
            title: 'Unauthorized',
            message: 'Bad credentials',
        });
    });

    it('maps 404 / 5xx / 0 to the right title', async () => {
        const cases: Array<[number, string]> = [
            [404, 'Not found'],
            [500, 'Server error'],
            [503, 'Server error'],
            [0, 'Network error'],
        ];
        for (const [status, expectedTitle] of cases) {
            $toasts.set([]);
            await expect(
                withApiErrorToast(() => {
                    throw { status, message: 'x' };
                })
            ).rejects.toMatchObject({ status });
            expect($toasts.get()[0]?.title).toBe(expectedTitle);
        }
    });

    it('falls back to a network-style ApiError for an unknown thrown value', async () => {
        await expect(
            withApiErrorToast(() => {
                throw 'oops';
            })
        ).rejects.toMatchObject({ status: 0, message: 'Network error' });

        expect($toasts.get()[0]).toMatchObject({
            variant: 'error',
            title: 'Network error',
        });
    });

    it('preserves the message of a plain Error', async () => {
        await expect(
            withApiErrorToast(() => {
                throw new Error('socket reset');
            })
        ).rejects.toMatchObject({ status: 0, message: 'socket reset' });

        expect($toasts.get()[0]?.message).toBe('socket reset');
    });
});
