/**
 * Redirects the user to a new page, preserving the current locale.
 * @param {string} path - The path to redirect to.
 * @returns {void}
 */
export function redirectTo(path: string): void {
    const supported = new Set(['en', 'es']);
    let lang = (navigator.language || 'en').split('-')[0];
    if (!supported.has(lang)) lang = 'en';
    window.location.replace('/' + lang + path);
}
