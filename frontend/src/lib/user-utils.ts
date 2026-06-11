/**
 * Returns the initials of a user's name.
 * @param {string} name - The full name of the user.
 * @returns {string} The initials of the user's name in uppercase.
 */
export function getUserInitials(name: string) {
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
