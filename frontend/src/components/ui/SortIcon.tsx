import type { JSX } from 'react/jsx-runtime';
import { ChevronDown, ChevronUp } from 'lucide-react';
/**
 * @interface SortIconProps
 * @param {string} direction - The direction of the sort.
 */
interface SortIconProps {
    direction: 'asc' | 'desc' | null
}
/**
 * Render a sort icon.
 * @param {SortIconProps} props - The props of the sort icon.
 * @returns {JSX.Element} The sort icon.
 */
export function SortIcon({ direction }: SortIconProps): JSX.Element {
    if (!direction) return <></>;
    if (direction === 'asc') return <ChevronUp size={10} />
    return <ChevronDown size={10} />
}