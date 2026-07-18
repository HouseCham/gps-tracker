import { useEffect, useRef, useState, type JSX } from 'react';
//-- Stores
import { useStore } from '@nanostores/react';
import { $sidebarOpen, closeSidebar, toggleSidebar } from '@/lib/stores/layout';
import { $user } from '@/lib/stores/auth';
//-- Types
import type { Translation } from '@/i18n';
//-- Hooks
import { useAuth } from '@/lib/hooks/useAuth';
import { useTheme } from '@/lib/hooks/useTheme';
//-- Constants
import { MOBILE_BREAKPOINT } from '@/constants/layout';
//-- Utils
import { getInitials } from '@/lib';
//-- Icons
import {
    Bell,
    Menu,
    Search as SearchIcon,
    Settings as SettingsIcon,
} from 'lucide-react';
//-- Components
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationsDropdown } from './NotificationDropdown';
import { ThemeGlyph } from './ThemeGlyph';

/**
 * Props for the Topbar component.
 * @interface TopbarProps
 * @property {string} pageLabel - The label of the current page.
 * @property {string} [pageEyebrow] - Optional eyebrow text for the current page.
 * @property {Translation['layout']} layout - The layout strings.
 * @property {string} [searchValue] - The current search value.
 * @property {(value: string) => void} [onSearchChange] - Called on each keystroke.
 */
export interface TopbarProps {
    pageLabel: string;
    pageEyebrow?: string;
    layout: Translation['layout'];
    searchValue?: string;
    onSearchChange?: (value: string) => void;
}
/**
 * The Topbar component.
 * @param {TopbarProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function Topbar({
    pageLabel,
    pageEyebrow,
    layout,
    onSearchChange,
    searchValue,
}: TopbarProps): JSX.Element {
    const sidebarOpen = useStore($sidebarOpen);
    const user = useStore($user);
    const [theme, setTheme] = useTheme();
    const { signOut } = useAuth();
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const update = (): void => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent): void => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        if (!sidebarOpen) return;
        const onResize = (): void => {
            if (window.innerWidth > MOBILE_BREAKPOINT) closeSidebar();
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [sidebarOpen]);

    return (
        <header className="gp-topbar">
            {isMobile && (
                <button
                    type="button"
                    className="gp-mobile-menu"
                    onClick={toggleSidebar}
                    aria-label={layout.openMenu}
                >
                    <Menu size={16} strokeWidth={1.6} />
                </button>
            )}
            <div className="gp-topbar-meta">
                {pageEyebrow && <span className="gp-topbar-eyebrow">{pageEyebrow}</span>}
                <span className="gp-topbar-title">{pageLabel}</span>
            </div>
            <label className="chrome-topbar-search">
                <span aria-hidden="true">
                    <SearchIcon size={14} strokeWidth={1.6} />
                </span>
                <input
                    ref={searchRef}
                    type="text"
                    placeholder={layout.searchPlaceholder}
                    value={searchValue ?? ''}
                    onChange={e => onSearchChange?.(e.target.value)}
                />
                <kbd>⌘K</kbd>
            </label>
            <div className="gp-topbar-actions">
                <button
                    type="button"
                    className="chrome-icon-btn"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    aria-label={theme === 'dark' ? layout.switchToLight : layout.switchToDark}
                    title={theme === 'dark' ? layout.themeLight : layout.themeDark}
                >
                    <ThemeGlyph theme={theme} />
                </button>
                <div className="chrome-pop">
                    <button
                        type="button"
                        className={`chrome-icon-btn${notifOpen ? ' is-active' : ''}`}
                        onClick={() => {
                            setNotifOpen(o => !o);
                            setProfileOpen(false);
                        }}
                        aria-label={layout.notifications}
                    >
                        <Bell size={16} strokeWidth={1.6} />
                        <span className="chrome-notif-dot" />
                    </button>
                    {notifOpen && <NotificationsDropdown layout={layout} />}
                </div>
                <button
                    type="button"
                    className="chrome-icon-btn"
                    aria-label={layout.settingsLabel}
                    title={layout.settingsLabel}
                >
                    <SettingsIcon size={16} strokeWidth={1.6} />
                </button>
                <div className="chrome-pop">
                    <button
                        type="button"
                        className={`chrome-icon-btn chrome-icon-btn--avatar${profileOpen ? ' is-active' : ''}`}
                        onClick={() => {
                            setProfileOpen(o => !o);
                            setNotifOpen(false);
                        }}
                        aria-label={layout.profileMenu}
                    >
                        <span className="gp-sidebar-avatar">
                            {user ? getInitials(user.name) : '?'}
                        </span>
                    </button>
                    {profileOpen && (
                        <ProfileDropdown
                            user={user}
                            layout={layout}
                            theme={theme}
                            setTheme={setTheme}
                            onSignOut={signOut}
                        />
                    )}
                </div>
            </div>
        </header>
    );
}
