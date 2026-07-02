//-- React
import type { JSX } from 'react';
//-- Hooks
import { useHydrateOnce } from '@/lib/hooks/useHydrateOnce';
//-- Types
import type { Language } from '@/types';
import type { Translation } from '@/i18n';
//-- Components
import { ProfileAvatar } from '@/components/react/shared';
import LogoutButton from '@/components/react/auth/LogoutButton';
//-- Constants
import { USER_ROLE_LABEL } from '@/constants/components/admin';
//-- Services
import { useProfileService } from '@/lib/api/services';

/**
 * Interface for the SidebarUserCard island.
 * @interface SidebarUserCardProps
 * @property {Translation} translation - Localized strings.
 * @property {Language} locale - Current locale, used to build the profile-link href.
 */
interface SidebarUserCardProps {
    translation: Translation;
    locale: Language;
}

/**
 * Renders the user-card + logout button at the foot of the desktop
 * sidebar. Pulls the authenticated user's full local projection from
 * `/api/v1/users/me` on mount via `useProfileService`.
 *
 * Loading and error states render the same fallback text the old
 * hardcoded markup used ("User" / "Member" / "?"), so the sidebar
 * never looks broken while `/users/me` is in flight or has failed.
 *
 * @param {SidebarUserCardProps} props - The component props.
 * @returns {JSX.Element} The rendered footer card.
 */
export function SidebarUserCard({
    translation,
    locale,
}: SidebarUserCardProps): JSX.Element {
    const { isLoading, profile, refresh } = useProfileService();

    useHydrateOnce(refresh);

    // ponytail: deliberate fallbacks mirror the original hardcoded
    //   strings so the sidebar reads fine mid-fetch and on error.
    const userName = profile
        ? `${profile.name} ${profile.lastname}`.trim() || 'User'
        : isLoading
          ? '…'
          : 'User';
    const roleKey = profile?.role === 'super_admin' ? 'superAdmin' : 'user';
    const roleLabel = profile
        ? (USER_ROLE_LABEL[profile.role] ?? translation.admin.roles[roleKey])
        : isLoading
          ? '…'
          : 'Member';

    return (
        <>
            <a
                href={`/${locale}/profile`}
                className="sidebar__user-card"
                aria-label={translation.layout.userMenu}
            >
                {profile ? (
                    <ProfileAvatar profile={profile} size={32} />
                ) : (
                    <span className="avatar sidebar__avatar" aria-hidden="true">
                        ?
                    </span>
                )}
                <span className="sidebar__user-meta">
                    <span className="sidebar__user-name">{userName}</span>
                    <span className="sidebar__user-role">{roleLabel}</span>
                </span>
            </a>
            <LogoutButton ariaLabel={translation.nav.logout} />
        </>
    );
}
