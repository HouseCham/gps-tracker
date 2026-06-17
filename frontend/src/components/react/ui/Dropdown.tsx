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

    const setOpen = useCallback(
        (next: boolean): void => {
            if (!isControlled) setUncontrolledOpen(next);
            onOpenChange?.(next);
        },
        [isControlled, onOpenChange]
    );

    useEffect(() => {
        if (!open) return;
        const onPointer = (e: MouseEvent): void => {
            if (
                rootRef.current &&
                !rootRef.current.contains(e.target as Node)
            ) {
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
/**
 * Hook to resolve the side of the dropdown.
 * @param {string} side - The side of the dropdown.
 * @param {boolean} open - Whether the dropdown is open.
 * @returns {string} The resolved side of the dropdown.
 */
function useResolvedSide(
    side: 'bottom' | 'top' | 'auto',
    open: boolean
): 'bottom' | 'top' {
    const [resolved, setResolved] = useState<'bottom' | 'top'>('bottom');
    useEffect((): void => {
        if (!open || side !== 'auto') {
            setResolved(side === 'top' ? 'top' : 'bottom');
            return;
        }
        const el = document.activeElement as HTMLElement | null;
        if (!el) {
            setResolved('bottom');
            return;
        }
        setResolved(
            window.innerHeight - el.getBoundingClientRect().bottom < 220
                ? 'top'
                : 'bottom'
        );
    }, [open, side]);
    return resolved;
}
