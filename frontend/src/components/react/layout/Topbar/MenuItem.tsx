import type { LucideIcon } from 'lucide-react';
import type { JSX } from 'react/jsx-runtime';
/**
 * Properties for a menu item.
 * @interface MenuItemProps
 * @property {LucideIcon} icon - The menu item icon.
 * @property {string} label - The menu item label.
 * @property {string} [shortcut] - Optional shortcut text.
 * @property {boolean} [danger] - Optional danger flag.
 * @property {() => void} [onClick] - Optional click handler.
 */
interface MenuItemProps {
    icon: LucideIcon;
    label: string;
    shortcut?: string;
    danger?: boolean;
    onClick?: () => void;
}
/**
 * Menu item component.
 * @param {MenuItemProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function MenuItem({
    icon: Icon,
    label,
    shortcut,
    danger,
    onClick,
}: MenuItemProps): JSX.Element {
    return (
        <button
            type="button"
            className={`chrome-menu-item${danger ? ' is-danger' : ''}`}
            onClick={onClick}
        >
            <Icon size={15} strokeWidth={1.6} className="glyph" />
            <span>{label}</span>
            {shortcut && <span className="shortcut">{shortcut}</span>}
        </button>
    );
}
