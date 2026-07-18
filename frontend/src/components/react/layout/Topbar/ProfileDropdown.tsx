import { useRef, type JSX } from "react";
//-- Types
import type { Translation } from "@/i18n";
//-- Icons
import { Bell, HelpCircle, Key, LogOut, Moon, Shield, Sun, User as UserIcon } from "lucide-react";
//-- Components
import { MenuItem } from "./MenuItem";
//-- Utils
import { getInitials, useClickOutside } from "@/lib";
import type { AuthUser } from "@/types/api";

/**
 * Properties for the profile dropdown component.
 * @interface ProfileDropdownProps
 * @property {Translation['layout']} layout - The layout strings.
 * @property {string} theme - The current theme.
 * @property {AuthUser | null} user - The current user.
 * @property {(next: 'light' | 'dark') => void} setTheme - The function to set the theme.
 * @property {() => void} onSignOut - The function to sign out.
 * @property {() => void} handleClose - The function to close the dropdown.
 */
interface ProfileDropdownProps {
    layout: Translation['layout'];
    theme: 'light' | 'dark';
    user: AuthUser | null;
    setTheme: (next: 'light' | 'dark') => void;
    onSignOut: () => void;
    handleClose: () => void;
}
/**
 * The profile dropdown component.
 * @param {ProfileDropdownProps} props - The props for the component.
 * @returns {JSX.Element} The rendered component.
 */
export function ProfileDropdown({ layout, theme, user, setTheme, onSignOut, handleClose }: ProfileDropdownProps): JSX.Element {
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, handleClose);

    return (
        <div
            className="chrome-dropdown chrome-dropdown--profile"
            ref={ref}
            style={{ width: 280, right: 0, left: 'auto' }}
        >
            <div className="chrome-profile-card">
                <div className="chrome-profile-avatar">
                    {user ? getInitials(user.name) : '?'}
                </div>
                <div className="chrome-profile-info">
                    <div className="chrome-profile-name">{user?.name ?? layout.unknownUser}</div>
                    <div className="chrome-profile-mail">
                        {user?.email ?? layout.unknownMail}
                    </div>
                    <div className="chrome-profile-org">
                        <Shield size={10} strokeWidth={1.6} />
                        {layout.superAdminOrg}
                    </div>
                </div>
            </div>
            <div className="chrome-menu-section">
                <div className="chrome-menu-label">{layout.appearance}</div>
                <div className="chrome-theme-toggle" style={{ margin: '0 0 var(--s-2)' }}>
                    <button
                        type="button"
                        className={`chrome-theme-toggle-btn${theme === 'light' ? ' is-active' : ''}`}
                        onClick={() => setTheme('light')}
                    >
                        <Sun size={13} strokeWidth={1.6} />
                        {layout.themeLight}
                    </button>
                    <button
                        type="button"
                        className={`chrome-theme-toggle-btn${theme === 'dark' ? ' is-active' : ''}`}
                        onClick={() => setTheme('dark')}
                    >
                        <Moon size={13} strokeWidth={1.6} />
                        {layout.themeDark}
                    </button>
                </div>
            </div>
            <div className="chrome-menu-divider" />
            <div className="chrome-menu-section">
                <MenuItem icon={UserIcon} label={layout.accountSettings} />
                <MenuItem icon={Bell} label={layout.notificationsMenu} shortcut="⌘N" />
                <MenuItem icon={Key} label={layout.apiTokens} />
                <MenuItem icon={HelpCircle} label={layout.helpDocs} />
            </div>
            <div className="chrome-menu-divider" />
            <div className="chrome-menu-section">
                <MenuItem
                    icon={LogOut}
                    label={layout.signOut}
                    shortcut="⌘Q"
                    danger
                    onClick={onSignOut}
                />
            </div>
        </div>
    );
}