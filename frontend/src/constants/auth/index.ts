/**
 * Path the user lands on after a successful sign-in or sign-up. The
 * frontend's index page resolves the active locale and forwards to
 * `/[lan]/index.astro`.
 * @constant {string}
 */
export const REDIRECT_AFTER_AUTH = '/';

/**
 * Path the user lands on after a successful sign-out.
 * @constant {string}
 */
export const REDIRECT_AFTER_SIGNOUT = '/';