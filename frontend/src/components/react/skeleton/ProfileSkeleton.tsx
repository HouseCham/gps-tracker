import type { JSX } from "react/jsx-runtime";
/**
 * Interface for the ProfileSkeleton component.
 * @interface ProfileSkeletonProps
 * @property {string} [className] - Extra class appended to the class list.
 */
interface ProfileSkeletonProps {
    className?: string;
}
/**
 * Pulsing placeholder shown while the initial fetch is in flight.
 * @param {ProfileSkeletonProps} props - The component props.
 * @returns {JSX.Element} The rendered skeleton.
 */
export function ProfileSkeleton({ className }: ProfileSkeletonProps): JSX.Element {
    const wrapperClass = className ?? 'profile-body';
    return (
        <div className={wrapperClass} aria-busy="true" aria-live="polite">
            <section className="profile-card profile-card--skeleton">
                <div className="profile-card__skeleton-row profile-card__skeleton-row--avatar" />
                <div className="profile-card__skeleton-row profile-card__skeleton-row--heading" />
            </section>
            <section className="profile-card profile-card--skeleton">
                <div className="profile-card__skeleton-row profile-card__skeleton-row--title" />
                <div className="profile-card__skeleton-row profile-card__skeleton-row--line" />
                <div className="profile-card__skeleton-row profile-card__skeleton-row--line" />
                <div className="profile-card__skeleton-row profile-card__skeleton-row--line profile-card__skeleton-row--short" />
            </section>
        </div>
    );
}