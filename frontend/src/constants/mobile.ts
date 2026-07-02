//-- Types
import type { Translation } from "@/i18n";
import type { User } from "@/types/api";
import type { MobileCardVariant } from "@/types/components";

/**
 * @constant MOBILE_CARD_LIST_MODIFIER_CLASS
 * @description Maps MobileCardVariant to the corresponding BEM modifier class for the wrapping `<ul>`.
 * @type {Record<MobileCardVariant, string>}
 */
export const MOBILE_CARD_LIST_MODIFIER_CLASS: Record<MobileCardVariant, string> = {
    user: 'user-cards',
    device: 'device-cards',
    access: 'access-cards',
};

/**
 * @constant MOBILE_CARD_META_BLOCK_CLASS
 * @description Maps MobileCardVariant to the corresponding BEM block class for the child `<dl>` metadata items.
 * @type {Record<MobileCardVariant, string>}
 */
export const MOBILE_CARD_META_BLOCK_CLASS: Record<MobileCardVariant, string> = {
    user: 'user-card',
    device: 'mobile-device-card',
    access: 'access-card',
};

/**
 * @constant USER_MOBILE_CARD_ROLE_BADGE_VARIANT
 * @description Maps the {@link User.role} enum to the BEM variant used by the role badge. Mirrors the lookup that `UserTable.tsx` builds inline.
 * @type {Record<User['role'], 'accent' | 'default'>}
 */
export const USER_MOBILE_CARD_ROLE_BADGE_VARIANT: Record<User['role'], 'accent' | 'default'> = {
    super_admin: 'accent',
    user: 'default',
};

/**
 * @constant USER_MOBILE_CARD_ROLE_LABEL_KEY
 * @description Maps the {@link User.role} enum to the localized role label. Necessary because the translation keys are camelCase (`superAdmin`, `user`) while the API role enum is snake_case (`super_admin`, `user`).
 * @type {Record<User['role'], keyof Translation['admin']['roles']>}
 */
export const USER_MOBILE_CARD_ROLE_LABEL_KEY: Record<User['role'], keyof Translation['admin']['roles']> = {
    super_admin: 'superAdmin',
    user: 'user',
};