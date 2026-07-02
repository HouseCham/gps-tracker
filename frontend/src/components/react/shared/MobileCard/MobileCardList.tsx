import '@/styles/components/mobile-cards.css';
//-- Types
import type { MobileCardVariant } from '@/types/components';
import type { JSX, ReactNode } from 'react';
//-- Constants
import { MOBILE_CARD_LIST_MODIFIER_CLASS } from '@/constants';

/**
 * Interface for the MobileCardList component.
 * @interface MobileCardListProps
 * @property {MobileCardVariant} variant - Which card family to render.
 * @property {string} label - Accessible label for the list (aria-label).
 * @property {ReactNode} children - Card items to render inside.
 */
interface MobileCardListProps {
    variant: MobileCardVariant;
    label: string;
    children: ReactNode;
}

/**
 * Wrapper around the mobile `<ul className="mobile-cards …">` list. The
 * container is `display: none` by default and only revealed at
 * ≤ 767.98px — desktop layouts keep using the `<DataTable>` next to it.
 * @param {MobileCardListProps} props - The props for the component.
 * @returns {JSX.Element} The rendered list.
 */
export function MobileCardList({
    variant,
    label,
    children,
}: MobileCardListProps): JSX.Element {
    return (
        <ul
            className={`mobile-cards ${MOBILE_CARD_LIST_MODIFIER_CLASS[variant]}`}
            aria-label={label}
        >
            {children}
        </ul>
    );
}
