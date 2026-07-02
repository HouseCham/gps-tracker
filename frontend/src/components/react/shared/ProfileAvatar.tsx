//-- React
import type { JSX } from 'react/jsx-runtime';
//-- Types
import type { User } from '@/types/api';

//* note: ratio picked so two uppercase letters fit cleanly inside
//   the circular fallback; bump if the letterforms change.
const AVATAR_FONT_SIZE_RATIO = 0.34;

/**
 * Interface for the ProfileAvatar component.
 * @interface ProfileAvatarProps
 * @property {User} profile - The user whose initials/image to render.
 * @property {number} [size=64] - The square edge length in pixels.
 * @property {string} [className] - Extra class appended to the class list.
 */
interface ProfileAvatarProps {
    profile: User;
    size?: number;
    className?: string;
}

/**
 * Renders a profile avatar with initials or image.
 * @param {ProfileAvatarProps} props - The component props.
 * @returns {JSX.Element} The rendered avatar.
 */
export function ProfileAvatar({
    profile,
    size = 64,
    className,
}: ProfileAvatarProps): JSX.Element {
    const initials =
        `${profile.name.charAt(0)}${profile.lastname.charAt(0)}`.toUpperCase();
    const wrapperClasses = ['profile-avatar', className]
        .filter(Boolean)
        .join(' ');

    if (profile.image) {
        return (
            <img
                className={wrapperClasses}
                src={profile.image}
                alt=""
                width={size}
                height={size}
            />
        );
    }
    return (
        <div
            className={`${wrapperClasses} profile-avatar--initials`}
            aria-hidden="true"
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * AVATAR_FONT_SIZE_RATIO),
            }}
        >
            {initials || '?'}
        </div>
    );
}
