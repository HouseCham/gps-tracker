/**
 * Two-letter initials from a display name for the avatar fallback.
 * @param {string} name - Full display name.
 * @returns {string} Uppercase initials (1–2 chars).
 */
export function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0] ?? '').slice(0, 2).toUpperCase();
}
/**
 * Returns the initials of a user's name.
 * @param {string} name - The full name of the user.
 * @returns {string} The initials of the user's name in uppercase.
 */
export function getUserInitials(name: string): string {
    const nameParts = name.split(' ');
    const initials = nameParts.map(part => part.charAt(0)).join('');
    return initials.toUpperCase();
}

/**
 * Returns the user's first name followed by the initial of the second name
 * (if it exists), with a trailing period.
 * @param {string} name - The full name of the user.
 * @returns {string} The first name and the initial of the second name.
 */
export function getFirstNameWithInitial(name: string): string {
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? '';
    const secondName = nameParts[1];
    if (!secondName) return firstName;
    return `${firstName} ${secondName.charAt(0).toUpperCase()}.`;
}
