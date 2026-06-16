import '@/styles/ui/dropdown.css';
//-- React
import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    type ReactNode,
} from 'react';
//-- Icons
import { ChevronDown } from 'lucide-react';
import type { DropdownItem, DropdownSection } from '@/types/components/ui';

/**
 * @interface DropdownProps
 * @description Interface for DropdownProps representing the props for the Dropdown component.
 * @property {ReactNode} trigger - The trigger button for the dropdown.
 * @property {DropdownItem[] | undefined} items - The items in the dropdown menu.
 * @property {DropdownSection[] | undefined} sections - The sections in the dropdown menu.
 * @property {'start' | 'end'} align - The alignment of the dropdown menu.
 * @property {'bottom' | 'top' | 'auto'} side - The side of the dropdown menu.
 * @property {boolean | undefined} open - Whether the dropdown menu is open.
 * @property {boolean | undefined} defaultOpen - Whether the dropdown menu is initially open.
 * @property {(open: boolean) => void | undefined} onOpenChange - The function to call when the dropdown menu is opened or closed.
 * @property {boolean | undefined} closeOnSelect - Whether to close the dropdown menu when an item is selected.
 * @property {string | undefined} ariaLabel - The aria-label for the dropdown menu.
 */
interface DropdownProps {
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
 * Dropdown — dropdown menu component.
 * @props {DropdownProps} props - The props for the Dropdown component.
 * @returns {React.JSX.Element} The rendered Dropdown component.
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
    const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(defaultOpen);
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    const menuId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const setOpen = useCallback(
        (next: boolean): void => {
            if (!isControlled) setUncontrolledOpen(next);
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange],
    );

    useEffect(() => {
        if (!open) return;
        const onPointer = (e: MouseEvent): void => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
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

    const resolvedSide = useResolvedSide(side, open);

    const handleTrigger = (): void => setOpen(!open);
    const handleItem = (item: DropdownItem): void => {
        if (item.disabled) return;
        item.onSelect?.();
        if (closeOnSelect) setOpen(false);
    };

    const renderItem = (item: DropdownItem): React.JSX.Element => {
        const classes = [
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
                className={classes}
                disabled={item.disabled}
                onClick={() => handleItem(item)}
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

    const flatItems = items ?? [];
    const groupedSections = sections ?? [];

    return (
        <div
            ref={rootRef}
            className={`dropdown ${open ? 'is-open' : ''}`}
            data-side={resolvedSide}
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
            {open && (
                <div
                    id={menuId}
                    role="menu"
                    aria-label={ariaLabel}
                    className={`dropdown-menu dropdown-menu--align-${align}`}
                >
                    {flatItems.length > 0 && (
                        <div className="dropdown-section" role="none">
                            {flatItems.map(renderItem)}
                        </div>
                    )}
                    {groupedSections.map((section, sIdx) => (
                        <div key={section.key} className="dropdown-section" role="none">
                            {sIdx > 0 && <div className="dropdown-divider" role="separator" />}
                            {section.items.map(renderItem)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function useResolvedSide(
    side: 'bottom' | 'top' | 'auto',
    open: boolean,
): 'bottom' | 'top' {
    const [resolved, setResolved] = useState<'bottom' | 'top'>('bottom');
    useEffect((): void => {
        if (!open || side !== 'auto') {
            setResolved(side === 'top' ? 'top' : 'bottom');
            return;
        }
        const trigger = document.activeElement as HTMLElement | null;
        if (!trigger) {
            setResolved('bottom');
            return;
        }
        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setResolved(spaceBelow < 220 ? 'top' : 'bottom');
    }, [open, side]);
    return resolved;
}
