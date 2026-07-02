//-- React
import type { JSX } from 'react';
//-- Hooks
import { useHydrateOnce } from '@/lib/hooks/useHydrateOnce';
//-- Styles
import '@/styles/components/profile-view.css';
//-- Types
import type { Translation } from '@/i18n';
//-- Components
import { Button, StatusIndicator } from '@/components/ui';
import { ProfileAvatar } from '@/components/react/shared';
import { ProfileSkeleton } from '@/components/react/skeleton';
//-- Constants
import { USER_ROLE_LABEL } from '@/constants/components/admin';
//-- Services
import { useProfileService } from '@/lib/api/services';
import { formatDate } from '@/lib';
import type { Language } from '@/types';

/**
 * Interface for the ProfileView island.
 * @interface ProfileViewProps
 * @property {Language} locale - Current locale.
 * @property {Translation} translation - Localized strings.
 * @property {string} [className] - Extra class appended to the class list.
 */
interface ProfileViewProps {
    locale: Language;
    translation: Translation;
    className?: string;
}

/**
 * Renders the authenticated user's profile view, including account and personal info.
 * @param {ProfileViewProps} props - The component props.
 * @returns {JSX.Element} The rendered profile view.
 */
export function ProfileView({
    locale,
    translation,
    className,
}: ProfileViewProps): JSX.Element {
    const { isLoading, error, profile, deviceCount, refresh } =
        useProfileService();

    useHydrateOnce(refresh);

    const wrapperClass = `profile-body ${className ?? ''}`.trim();
    const t = translation.profile;
    const deviceStrings = translation.device;
    const adminStrings = translation.admin;

    if (isLoading && !profile) {
        return <ProfileSkeleton className={wrapperClass} />;
    }

    if (error && !profile) {
        return (
            <section className={wrapperClass}>
                <div className="profile-card profile-card--error">
                    <h2 className="profile-card__title">{t.loadFailed}</h2>
                    <p className="profile-card__error-message">
                        {error.message}
                    </p>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => void refresh()}
                        disabled={isLoading}
                    >
                        {t.retry}
                    </Button>
                </div>
            </section>
        );
    }

    if (!profile) {
        return <ProfileSkeleton className={wrapperClass} />;
    }

    const fullName = `${profile.name} ${profile.lastname}`.trim();
    const roleKey = profile.role === 'super_admin' ? 'superAdmin' : 'user';
    const roleLabel =
        USER_ROLE_LABEL[profile.role] ?? adminStrings.roles[roleKey];
    const memberSince = profile.created_at.slice(0, 10);
    const verifiedStatus = profile.email_verified ? 'online' : 'offline';
    const verifiedLabel = profile.email_verified
        ? adminStrings.userTable.verified
        : adminStrings.userTable.unverified;

    return (
        <div className={wrapperClass}>
            {/* Avatar header */}
            <section className="profile-card profile-card--header">
                <ProfileAvatar profile={profile} />
                <div className="profile-card__heading">
                    <p className="profile-card__eyebrow">
                        {translation.nav.profile}
                    </p>
                    <h2 className="profile-card__title profile-card__title--name">
                        {fullName}
                    </h2>
                </div>
            </section>

            {/* Account info */}
            <section className="profile-card">
                {/* Title */}
                <h3 className="profile-card__title">{t.accountInfo}</h3>
                {/* Profile Details */}
                <dl className="profile-grid">
                    {/* Email */}
                    <div className="profile-field">
                        <dt className="profile-label">Email</dt>
                        <dd className="profile-value">{profile.email}</dd>
                    </div>
                    {/* Status */}
                    <div className="profile-field">
                        <dt className="profile-label">
                            {deviceStrings.status}
                        </dt>
                        <dd className="profile-value">
                            <StatusIndicator
                                status={verifiedStatus}
                                label={verifiedLabel}
                            />
                        </dd>
                    </div>
                    {/* Role */}
                    <div className="profile-field">
                        <dt className="profile-label">
                            {adminStrings.roles.superAdmin}
                        </dt>
                        <dd className="profile-value">{roleLabel}</dd>
                    </div>
                    {/* Device count */}
                    <div className="profile-field">
                        <dt className="profile-label">{t.deviceCount}</dt>
                        <dd className="profile-value">{deviceCount ?? '—'}</dd>
                    </div>
                    {/* Member since */}
                    <div className="profile-field">
                        <dt className="profile-label">{t.memberSince}</dt>
                        <dd className="profile-value profile-value--mono">
                            {formatDate(locale, memberSince)}
                        </dd>
                    </div>
                </dl>
            </section>

            {/* Personal info */}
            <section className="profile-card">
                <h3 className="profile-card__title">{t.personalInfo}</h3>
                <dl className="profile-grid">
                    <div className="profile-field">
                        <dt className="profile-label">
                            {translation.auth.name}
                        </dt>
                        <dd className="profile-value">{fullName}</dd>
                    </div>
                </dl>
            </section>
        </div>
    );
};
