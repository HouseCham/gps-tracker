import { describe, expect, it } from 'vitest';
import { BetterFetchError } from '@better-fetch/fetch';
import type { ApiError } from '@/types/api';
import {
    asApiError,
    handleApiError,
    isApiError,
    toApiError,
} from './api-utils';

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

describe('isApiError', () => {
    it('returns false for primitives', () => {
        expect(isApiError(0)).toBe(false);
        expect(isApiError('string')).toBe(false);
        expect(isApiError(true)).toBe(false);
    });

    it('returns false for null and undefined', () => {
        expect(isApiError(null)).toBe(false);
        expect(isApiError(undefined)).toBe(false);
    });

    it('returns false when status is not a number', () => {
        expect(isApiError({ status: '500', message: 'x' })).toBe(false);
    });

    it('returns false when message is not a string', () => {
        expect(isApiError({ status: 500, message: 42 })).toBe(false);
    });

    it('returns false when a required field is missing', () => {
        expect(isApiError({ status: 500 })).toBe(false);
        expect(isApiError({ message: 'oops' })).toBe(false);
    });

    it('returns true for the full ApiError shape', () => {
        const e: ApiError = { status: 500, message: 'boom' };
        expect(isApiError(e)).toBe(true);
    });

    it('returns true when the optional code is present', () => {
        expect(isApiError({ status: 401, message: 'no', code: 'AUTH' })).toBe(
            true
        );
    });
});

describe('asApiError', () => {
    it('returns an empty object for null', () => {
        expect(asApiError(null)).toEqual({});
    });

    it('returns an empty object for primitives', () => {
        expect(asApiError('x')).toEqual({});
        expect(asApiError(42)).toEqual({});
        expect(asApiError(undefined)).toEqual({});
    });

    it('plucks message off an object that has one', () => {
        expect(asApiError({ message: 'hi' })).toEqual({ message: 'hi' });
    });

    it('returns the object as-is so callers can pluck `.message`', () => {
        const got = asApiError({ message: 'hi', extra: 'kept' });
        expect(got.message).toBe('hi');
    });
});

describe('toApiError', () => {
    it('uses Error.message and status 0', () => {
        expect(toApiError(new Error('boom'))).toEqual({
            status: 0,
            message: 'boom',
        });
    });

    it('falls back to "Network error" for non-Errors', () => {
        expect(toApiError('string')).toEqual({
            status: 0,
            message: 'Network error',
        });
        expect(toApiError({ random: 'object' })).toEqual({
            status: 0,
            message: 'Network error',
        });
        expect(toApiError(null)).toEqual({
            status: 0,
            message: 'Network error',
        });
    });
});

describe('handleApiError', () => {
    it('reads status/message/code from a BetterFetchError cause', () => {
        const err = bfErr(401, 'Unauthorized', {
            message: 'Bad credentials',
            code: 'AUTH_INVALID',
        });
        expect(() => handleApiError(err)).toThrowError(
            expect.objectContaining({
                status: 401,
                message: 'Bad credentials',
                code: 'AUTH_INVALID',
            })
        );
    });

    it('falls back to the default message when cause has no message', () => {
        const err = bfErr(500, 'Server Error', { code: 'BOOM' });
        expect(() => handleApiError(err)).toThrowError(
            expect.objectContaining({
                status: 500,
                message: 'An unexpected error occurred',
                code: 'BOOM',
            })
        );
    });

    it('falls back to the default message when cause is undefined', () => {
        const err = bfErr(403, 'Forbidden', undefined);
        expect(() => handleApiError(err)).toThrowError(
            expect.objectContaining({
                status: 403,
                message: 'An unexpected error occurred',
            })
        );
    });

    it('throws a network-error ApiError for a generic Error', () => {
        expect(() => handleApiError(new Error('oops'))).toThrowError(
            expect.objectContaining({ status: 0, message: 'oops' })
        );
    });

    it('throws a network-error ApiError for a non-Error value', () => {
        expect(() => handleApiError('plain string')).toThrowError(
            expect.objectContaining({
                status: 0,
                message: 'Network error',
            })
        );
    });
});
