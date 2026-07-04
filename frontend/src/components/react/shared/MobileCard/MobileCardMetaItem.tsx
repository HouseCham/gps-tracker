//-- Types
import type { MobileCardVariant } from '@/types/components';
import type { JSX, ReactNode } from 'react';
//-- Constants
import { MOBILE_CARD_META_BLOCK_CLASS } from '@/constants';

/**
 * Interface for the MobileCardMetaItem component.
 * @interface MobileCardMetaItemProps
 * @property {MobileCardVariant} variant - Which card family to render for.
 * @property {ReactNode} label - `<dt>` content for the row label.
 * @property {ReactNode} value - `<dd>` content for the row value.
 * @property {boolean} [mono=false] - Apply the `--mono` modifier (font).
 * @property {boolean} [muted=false] - Apply the `--muted` modifier (color).
 */
interface MobileCardMetaItemProps {
    variant: MobileCardVariant;
    label: ReactNode;
    value: ReactNode;
    mono?: boolean;
    muted?: boolean;
}

/**
 * Single label/value row inside a mobile card's `<dl>` metadata block.
 * Encapsulates the `{block}__meta-item` / `__meta-label` / `__meta-value`
 * BEM triplet and the optional `--mono` / `--muted` modifiers so the three
 * card variants don't rebuild the same class string.
 * @param {MobileCardMetaItemProps} props - The props for the component.
 * @returns {JSX.Element} The rendered row.
 */
export function MobileCardMetaItem({
    variant,
    label,
    value,
    mono = false,
    muted = false,
}: MobileCardMetaItemProps): JSX.Element {
    const block = MOBILE_CARD_META_BLOCK_CLASS[variant];
    const valueClasses = [`${block}__meta-value`]
        .concat(mono ? [`${block}__meta-value--mono`] : [])
        .concat(muted ? [`${block}__meta-value--muted`] : [])
        .join(' ');

    return (
        <div className={`${block}__meta-item`}>
            <dt className={`${block}__meta-label`}>{label}</dt>
            <dd className={valueClasses}>{value}</dd>
        </div>
    );
}
