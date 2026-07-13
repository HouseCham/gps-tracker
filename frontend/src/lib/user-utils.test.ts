import { describe, expect, it } from 'vitest';
import { en } from '@/i18n';
import {
    getFirstNameWithInitial,
    getInitials,
    getUserTableColumns,
} from './user-utils';

describe('getInitials', () => {
    it('returns first + last initials for a two-word name', () => {
        expect(getInitials('Jane Doe')).toBe('JD');
    });

    it('takes the first and last word for a three-word name', () => {
        expect(getInitials('Jane Mary Doe')).toBe('JD');
    });

    it('uppercases a lowercase input', () => {
        expect(getInitials('ada lovelace')).toBe('AL');
    });

    it('returns the first two characters for a single-word name', () => {
        expect(getInitials('cher')).toBe('CH');
        expect(getInitials('Madonna')).toBe('MA');
    });

    it('returns the first char upper-cased when the single name has one char', () => {
        expect(getInitials('x')).toBe('X');
    });

    it('trims surrounding whitespace before splitting', () => {
        expect(getInitials('   Jane   Doe   ')).toBe('JD');
    });

    it('returns an empty string for an empty/whitespace-only input', () => {
        expect(getInitials('')).toBe('');
        expect(getInitials('   ')).toBe('');
    });
});

describe('getFirstNameWithInitial', () => {
    it('returns "FirstName X." for a two-word name', () => {
        expect(getFirstNameWithInitial('Jane Doe')).toBe('Jane D.');
    });

    it('returns just the first name when no second word is given', () => {
        expect(getFirstNameWithInitial('Jane')).toBe('Jane');
    });

    it('uppercases the second-word initial regardless of input case', () => {
        expect(getFirstNameWithInitial('jane doe')).toBe('jane D.');
    });

    it('returns an empty string for an empty/whitespace-only input', () => {
        expect(getFirstNameWithInitial('')).toBe('');
        expect(getFirstNameWithInitial('   ')).toBe('');
    });

    it('keeps extra whitespace from collapsing to single tokens', () => {
        expect(getFirstNameWithInitial('   Ada   Lovelace   ')).toBe('Ada L.');
    });
});

describe('getUserTableColumns', () => {
    it('returns seven columns in the documented order', () => {
        const cols = getUserTableColumns(en.admin.userTable);
        expect(cols.map(c => c.key)).toEqual([
            'name',
            'email',
            'role',
            'status',
            'created',
            'devices',
            'actions',
        ]);
    });

    it('marks only `name` as sortable', () => {
        const cols = getUserTableColumns(en.admin.userTable);
        expect(cols.find(c => c.key === 'name')?.sortable).toBe(true);
        expect(cols.filter(c => c.sortable)).toHaveLength(1);
    });

    it('aligns `created`, `devices`, and `actions` to center; others left/default', () => {
        const cols = getUserTableColumns(en.admin.userTable);
        expect(cols.find(c => c.key === 'created')?.align).toBe('center');
        expect(cols.find(c => c.key === 'devices')?.align).toBe('center');
        expect(cols.find(c => c.key === 'actions')?.align).toBe('center');
        expect(cols.find(c => c.key === 'email')?.align).toBeUndefined();
        expect(cols.find(c => c.key === 'status')?.align).toBeUndefined();
    });

    it('uses the userTable translation keys as labels', () => {
        const cols = getUserTableColumns(en.admin.userTable);
        const ut = en.admin.userTable;
        expect(cols.find(c => c.key === 'name')?.label).toBe(ut.name);
        expect(cols.find(c => c.key === 'email')?.label).toBe(ut.email);
        expect(cols.find(c => c.key === 'role')?.label).toBe(ut.role);
        expect(cols.find(c => c.key === 'status')?.label).toBe(ut.status);
    });
});
