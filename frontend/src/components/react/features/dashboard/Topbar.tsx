import { DEFAULT_ICONS_CONFIG } from "@/constants";
import { getFirstNameWithInitial, getUserInitials } from "@/lib";
import type { Language, User } from "@/types";
import { Sun, Circle, ChevronDown, Search } from "lucide-react";
/**
 * @interface TopbarProps
 * @property {Language} locale - The current language of the website, used for localization in the topbar.
 * @property {User} user - An object representing the current user, containing their name and role, which can be displayed in the topbar for personalization.
 */
interface TopbarProps {
    locale: Language;
    user: User;
};
/**
 * Renders the topbar component of the dashboard, which includes a search bar, theme toggle, language selector, and user information.
 * @param {TopbarProps} props - The properties for the Topbar component, including the current locale and user information.
 * @returns {JSX.Element} The rendered Topbar component.
 */
export function Topbar({ locale, user }: TopbarProps) {
    return (
        <div className="dash-topbar">
            {/* Search Bar */}
            <div className="search">
                <Search />
                <input type="text" placeholder="Buscar dispositivos, usuarios..." />
                <span className="kbd">⌘K</span>
            </div>
            {/* Right Side: Theme Toggle, Language Selector, User Info */}
            <div className="dash-topbar-right">
                {/* Theme Toggle Button */}
                <button className="icon-btn">
                    <Sun />
                </button>
                {/* Language Selector Button */}
                <button className="lang-btn">
                    <Circle {...DEFAULT_ICONS_CONFIG} />
                    <span id="dashLangLabel">{locale.toUpperCase()}</span>
                </button>
                {/* User Information */}
                <div className="dash-topbar-user">
                    <div className="avatar">{getUserInitials(user.name)}</div>
                    <span className="name">{getFirstNameWithInitial(user.name)}</span>
                    <ChevronDown />
                </div>
            </div>
        </div>
    )
}