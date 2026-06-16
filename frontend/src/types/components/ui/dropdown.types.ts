import type { ReactNode } from "react";
/**
 * @interface DropdownItem
 * @description Interface for DropdownItem representing an item in a dropdown menu.
 * @property {string} key - The key of the item.
 * @property {string} label - The label of the item.
 * @property {ReactNode | undefined} icon - The icon to display next to the label.
 * @property {() => void | undefined} onSelect - The function to call when the item is selected.
 * @property {boolean | undefined} destructive - Whether the item is destructive.
 * @property {boolean | undefined} disabled - Whether the item is disabled.
 */
export interface DropdownItem {
    key: string;
    label: string;
    icon?: ReactNode;
    onSelect?: () => void;
    destructive?: boolean;
    disabled?: boolean;
}
/**
 * @interface DropdownSection
 * @description Interface for DropdownSection representing a section in a dropdown menu.
 * @property {string} key - The key of the section.
 * @property {DropdownItem[]} items - The items in the section.
 */
export interface DropdownSection {
    key: string;
    items: DropdownItem[];
}