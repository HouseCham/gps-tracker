import '@/styles/ui/dropdown.css';
//-- React
import {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
//-- Types
import type { DropdownItem, DropdownSection } from '@/types/components';
//-- Icons
import { ChevronDown } from 'lucide-react';
/**
 * @interface DropdownProps
 * @param {ReactNode} trigger - The trigger element for the dropdown.
 * @param {DropdownItem[]} items - The items to display in the dropdown.
 * @param {DropdownSection[]} sections - The sections to display in the dropdown.
 * @param {string} [align='start'] - The alignment of the dropdown.
 * @param {string} [side='auto'] - The side of the dropdown.
 * @param {boolean} [open] - Whether the dropdown is open.
 * @param {boolean} [defaultOpen=false] - Whether the dropdown should be open by default.
 * @param {function} [onOpenChange] - The function to call when the dropdown is opened or closed.
 * @param {boolean} [closeOnSelect=true] - Whether to close the dropdown when an item is selected.
 * @param {string} [ariaLabel] - The aria-label for the dropdown.
 */
export interface DropdownProps {
    trigger: ReactNode;
    items?: DropdownItem[];
    sections?: DropdownSection[];
    align?: 'start' | 'end';
    side?: 'bottom' | 'top' | 'auto';
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    closeOnSelect?: boolean;
    ariaLabel?: string;
}
/**
 * @typedef MenuPos
 * @property {number} top - The top position of the menu.
 * @property {number} left - The left position of the menu.
 * @property {number} minWidth - The minimum width of the menu.
 * @property {'bottom' | 'top'} side - The side of the menu.
 */
type MenuPos = {
    top: number;
    left: number;
    minWidth: number;
    side: 'bottom' | 'top';
};

/**
 * Vertical clearance reserved for the open menu. Used only when the menu has
 * not yet been measured (first paint) so the auto-side flip can still decide
 * whether to open upward.
 * @constant MENU_HEIGHT_ESTIMATE
 */
const MENU_HEIGHT_ESTIMATE = 240;

/**
 * Dropdown component.
 * @param {DropdownProps} props
 * @returns {JSX.Element}
 */
export default function Dropdown({
    trigger,
    items,
    sections,
    align = 'start',
    side = 'auto',
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    closeOnSelect = true,
    ariaLabel,
}: DropdownProps): React.JSX.Element {
    const isControlled = controlledOpen !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] =
        useState<boolean>(defaultOpen);
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    const menuId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const [menuPos, setMenuPos] = useState<MenuPos | null>(null);

    const setOpen = (next: boolean): void => {
        if (!isControlled) setUncontrolledOpen(next);
        onOpenChange?.(next);
    };

    /**
     * Computes the menu's viewport position from the trigger's bounding rect.
     * Uses the actually-measured menu height when available so the auto-flip
     * accounts for the real menu size.
     */
    const computeMenuPos = (): void => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const menuHeight =
            menuRef.current?.offsetHeight ?? MENU_HEIGHT_ESTIMATE;
        const flipUp =
            side === 'top' ||
            (side === 'auto' &&
                window.innerHeight - rect.bottom < menuHeight + 8);
        const top = flipUp ? rect.top - menuHeight - 4 : rect.bottom + 4;
        const minWidth = rect.width;
        let left = rect.left;
        if (align === 'end') {
            const menuWidth = menuRef.current?.offsetWidth ?? minWidth;
            left = rect.right - menuWidth;
            if (left < 4) left = 4;
        }
        setMenuPos({ top, left, minWidth, side: flipUp ? 'top' : 'bottom' });
    };

    const computeMenuPosRef = useRef(computeMenuPos);
    computeMenuPosRef.current = computeMenuPos;

    useEffect(() => {
        if (!open) return;
        const onPointer = (e: MouseEvent): void => {
            const root = rootRef.current;
            const menu = menuRef.current;
            const target = e.target as Node | null;
            if (!target) return;
            if (root && root.contains(target)) return;
            if (menu && menu.contains(target)) return;
            setOpen(false);
        };
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return (): void => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, setOpen]);

    // Recompute position on open + on viewport changes while open. Scroll is
    // captured so ancestor scrolls (e.g. the table's overflow:auto wrapper)
    // also reposition the menu.
    useEffect(() => {
        if (!open) {
            setMenuPos(null);
            return;
        }
        computeMenuPosRef.current();
        const onChange = (): void => computeMenuPosRef.current();
        window.addEventListener('resize', onChange);
        window.addEventListener('scroll', onChange, true);
        return (): void => {
            window.removeEventListener('resize', onChange);
            window.removeEventListener('scroll', onChange, true);
        };
    }, [open]);

    // After the menu mounts, recompute so we can use its real height/width
    // (the first paint uses an estimate).
    useLayoutEffect(() => {
        if (open) computeMenuPos();
    }, [open, items, sections]);

    const handleTrigger = (): void => setOpen(!open);

    const handleItem = (item: DropdownItem): void => {
        if (item.disabled) return;
        item.onSelect?.();
        if (closeOnSelect) setOpen(false);
    };

    const renderItem = (item: DropdownItem): React.JSX.Element => {
        const cls = [
            'dropdown-item',
            item.destructive && 'dropdown-item--destructive',
            item.disabled && 'is-disabled',
        ]
            .filter(Boolean)
            .join(' ');
        return (
            <button
                key={item.key}
                type="button"
                role="menuitem"
                className={cls}
                disabled={item.disabled}
                onClick={(): void => handleItem(item)}
            >
                {item.icon && (
                    <span className="dropdown-item__icon" aria-hidden="true">
                        {item.icon}
                    </span>
                )}
                <span className="dropdown-item__label">{item.label}</span>
            </button>
        );
    };

    return (
        <div
            ref={rootRef}
            className={`dropdown ${open ? 'is-open' : ''}`}
            data-side={menuPos?.side ?? 'bottom'}
        >
            <button
                ref={triggerRef}
                type="button"
                className="dropdown-trigger"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={handleTrigger}
            >
                {trigger}
                <ChevronDown
                    size={14}
                    strokeWidth={2}
                    className="dropdown-trigger__caret"
                />
            </button>
            {open && menuPos && (
                <div
                    ref={menuRef}
                    id={menuId}
                    role="menu"
                    aria-label={ariaLabel}
                    className={`dropdown-menu dropdown-menu--align-${align}`}
                    style={{
                        position: 'fixed',
                        top: menuPos.top,
                        left: menuPos.left,
                        minWidth: menuPos.minWidth,
                    }}
                    data-side={menuPos.side}
                >
                    {(items ?? []).length > 0 && (
                        <div className="dropdown-section" role="none">
                            {(items ?? []).map(renderItem)}
                        </div>
                    )}
                    {(sections ?? []).map((section, idx) => (
                        <div
                            key={section.key}
                            className="dropdown-section"
                            role="none"
                        >
                            {idx > 0 && (
                                <div
                                    className="dropdown-divider"
                                    role="separator"
                                />
                            )}
                            {section.items.map(renderItem)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
