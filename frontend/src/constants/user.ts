import type { Language } from '@/types';

/**
 * The literal phrase a user must type to enable the destructive button.
 * Kept in sync with the matching template in `user.delete.prompt`.
 * @constant {Record<Language, string>}
 */
export const DELETE_USER_CONFIRM_PHRASE: Record<Language, string> = {
    en: 'confirm',
    es: 'confirmar',
};
