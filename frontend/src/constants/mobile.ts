//-- Types
import type { MobileCardVariant } from '@/types/components';

/**
 * @constant MOBILE_CARD_LIST_MODIFIER_CLASS
 * @description Maps MobileCardVariant to the corresponding BEM modifier class for the wrapping `<ul>`.
 * @type {Record<MobileCardVariant, string>}
 */
export const MOBILE_CARD_LIST_MODIFIER_CLASS: Record<
    MobileCardVariant,
    string
> = {
    user: 'user-cards',
    device: 'device-cards',
    access: 'access-cards',
    'api-key': 'api-key-cards',
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
    'api-key': 'api-key-card',
};
