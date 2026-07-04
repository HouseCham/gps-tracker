import { describe, expect, it, beforeEach } from 'vitest';
import { $toasts, TOAST_STACK_MAX, toastBus } from './toast.store';

/**
 * Reset the store between tests so each one starts with an empty
 * stack. The bus is a module singleton, so test ordering would
 * otherwise leak state.
 */
beforeEach(() => {
    $toasts.set([]);
});

describe('toastBus.push', () => {
    it('appends a toast with a unique id', () => {
        const id = toastBus.push({
            variant: 'success',
            title: 'A',
            message: 'a',
        });
        expect(id).toMatch(/^t-\d+-\d+$/);
        expect($toasts.get()).toHaveLength(1);
        expect($toasts.get()[0]).toMatchObject({
            id,
            variant: 'success',
            title: 'A',
            message: 'a',
        });
    });

    it('keeps multiple toasts in order', () => {
        toastBus.push({ variant: 'success', title: 'A' });
        toastBus.push({ variant: 'error', title: 'B' });
        toastBus.push({ variant: 'info', title: 'C' });
        const stack = $toasts.get();
        expect(stack.map(t => t.title)).toEqual(['A', 'B', 'C']);
    });

    it(`caps the stack at TOAST_STACK_MAX (${TOAST_STACK_MAX}), dropping the oldest`, () => {
        for (let i = 0; i < TOAST_STACK_MAX + 2; i += 1) {
            toastBus.push({ variant: 'info', title: `t${i}` });
        }
        const stack = $toasts.get();
        expect(stack).toHaveLength(TOAST_STACK_MAX);
        // The two earliest toasts (t0, t1) were dropped; the rest survived
        // in insertion order.
        expect(stack.map(t => t.title)).toEqual(
            Array.from(
                { length: TOAST_STACK_MAX },
                (_, i) => `t${i + 2}`
            )
        );
    });
});

describe('toastBus.dismiss', () => {
    it('removes a toast by id', () => {
        const a = toastBus.push({ variant: 'info', title: 'A' });
        const b = toastBus.push({ variant: 'info', title: 'B' });
        toastBus.dismiss(a);
        expect($toasts.get().map(t => t.id)).toEqual([b]);
    });

    it('is a no-op when the id is unknown', () => {
        toastBus.push({ variant: 'info', title: 'A' });
        toastBus.dismiss('t-9999-9999');
        expect($toasts.get()).toHaveLength(1);
    });
});

describe('toastBus.clear', () => {
    it('empties the stack', () => {
        toastBus.push({ variant: 'info', title: 'A' });
        toastBus.push({ variant: 'info', title: 'B' });
        toastBus.clear();
        expect($toasts.get()).toEqual([]);
    });
});
