import { DEFAULT_ICONS_CONFIG } from "@/constants";
import { Bell, Box, LayoutDashboard, Server, UserRound, UsersRound } from "lucide-react";
/**
 * @interface NavbarOptionProps
 * @property {string} label - The label of the navigation item, used for display and localization.
 * @property {string} dataI18n - The key for internationalization, used to fetch the localized string for the navigation item.
 * @property {string} href - The URL or path that the navigation item links to when clicked.
 */
interface NavbarOptionProps {
    label: string;
    dataI18n: string;
    href: string;
    toggled?: boolean;
};
/**
 * NavbarOption component. It represents a single navigation item in the sidebar, displaying an icon and a label.
 * @param {NavbarOptionProps} props - The props for the NavbarOption component, including the label, dataI18n for localization, and href for navigation.
 * @returns {JSX.Element} - A JSX element representing the navigation item in the sidebar, including the icon and label.
 */
export function NavbarOption({ label, dataI18n, href, toggled = false }: NavbarOptionProps): React.JSX.Element {
    return (
        <div className={`nav-item ${toggled ? 'active' : ''}`}>
            {HandleNavbarIconToShow(dataI18n)}
            <span className="nav-label" data-i18n={dataI18n}>
                {label}
            </span>
        </div>
    )
};
/**
 * HandleNavbarIconToShow function. It takes a navigation item label as input and returns the corresponding icon component based on the label.
 * @param {string} navItemLabel - The label of the navigation item, used to determine which icon to display.
 * @returns {JSX.Element} - The icon component corresponding to the navigation item label.
 */
function HandleNavbarIconToShow(navItemLabel: string): React.JSX.Element {
    switch (navItemLabel) {
        case 'dashboard':
            return <LayoutDashboard />;
        case 'devices':
            return <Box />;
        case 'alerts':
            return <Bell />;
        case 'profile':
            return <UserRound />;
        case 'users':
            return <UsersRound />
        case 'all-devices':
            return <Server />
        default:
            return <LayoutDashboard />;

    }
};