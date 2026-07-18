import type { JSX } from 'react';
//-- Stores
import { useStore } from '@nanostores/react';
import { $sidebarOpen, closeSidebar } from '@/lib/stores/layout';
import { $user } from '@/lib/stores/auth';
//-- Icons
import { ChevronDown } from 'lucide-react';
//-- Constants
import { SHELL_NAV_ITEMS, SIDEBAR_ICONS } from '@/constants/layout';
//-- i18n
import type { Translation } from '@/i18n';
import type { Language } from '@/types';
//-- Utils
import { getInitials } from '@/lib';

/**
 * Properties for the sidebar component.
 * @interface SidebarProps
 * @property {Language} locale - The current locale.
 * @property {string} pathname - The current pathname.
 * @property {Translation['nav']} nav - The navigation items.
 * @property {Translation['layout']} layout - The layout strings.
 */
export interface SidebarProps {
    locale: Language;
    pathname: string;
    nav: Translation['nav'];
    layout: Translation['layout'];
}
/**
 * Renders the sidebar. This is the left-hand navigation for the app.
 * @param {SidebarProps} props - The props for the component.
 * @returns {JSX.Element} The rendered sidebar.
 */
export function Sidebar({ locale, pathname, nav, layout }: SidebarProps): JSX.Element {
    const sidebarOpen = useStore($sidebarOpen);
    const user = useStore($user);

    return (
        <aside
            className={`gp-sidebar${sidebarOpen ? ' is-open' : ''}`}
            aria-label={layout.primaryNav}
        >
            <div
                className={`gp-sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`}
                onClick={closeSidebar}
                aria-hidden="true"
            />
            <header className="gp-sidebar-head">
                <div className="gp-sidebar-mark">GPS</div>
                <div>
                    <div className="gp-sidebar-title">{layout.appName}</div>
                    <div className="gp-sidebar-sub">{layout.version}</div>
                </div>
            </header>
            <nav className="gp-sidebar-scroll" aria-label={layout.primaryNav}>
                <div className="gp-sidebar-section">{layout.workspace}</div>
                <div className="gp-sidebar-nav">
                    {SHELL_NAV_ITEMS.map(item => {
                        const Icon = SIDEBAR_ICONS[item.icon];
                        const href = `/${locale}${item.href}`;
                        const isActive =
                            pathname === href ||
                            (href !== `/${locale}` &&
                                pathname.startsWith(`${href}/`));
                        return (
                            <a
                                key={item.id}
                                href={href}
                                className={`gp-sidebar-link${isActive ? ' is-active' : ''}`}
                                aria-current={isActive ? 'page' : undefined}
                                onClick={closeSidebar}
                            >
                                <Icon strokeWidth={1.6} />
                                <span>{nav[item.labelKey]}</span>
                                {item.count !== undefined && (
                                    <span className="gp-sidebar-count">{item.count}</span>
                                )}
                            </a>
                        );
                    })}
                </div>
            </nav>
            <footer className="gp-sidebar-foot">
                <button type="button" className="gp-sidebar-user" aria-label={layout.profileMenu}>
                    <span className="gp-sidebar-avatar">
                        {user ? getInitials(user.name) : layout.unknownInitials}
                    </span>
                    <span className="gp-sidebar-user-info">
                        <span className="gp-sidebar-user-name">
                            {user?.name ?? layout.unknownUser}
                        </span>
                        <span className="gp-sidebar-user-mail">
                            {user?.email ?? layout.unknownMail}
                        </span>
                    </span>
                    <ChevronDown size={14} strokeWidth={1.6} />
                </button>
            </footer>
        </aside>
    );
}
