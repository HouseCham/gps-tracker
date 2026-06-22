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

/**
 * Path to the sign-in page. Used by route protection to redirect
 * unauthenticated users. The locale is resolved by `index.astro`.
 * @constant {string}
 */
export const LOGIN_PATH = '/login';

/**
 * Path to the sign-up page. Used by route protection to redirect
 * unauthenticated users. The locale is resolved by `index.astro`.
 * @constant {string}
 */
export const SIGNUP_PATH = '/signup';

/**
 * Path to the authenticated dashboard. Used by `<PublicOnlyRoute />`
 * to redirect users who are already signed in away from the sign-in
 * and sign-up pages. The locale is resolved by `index.astro`.
 * @constant {string}
 */
export const DASHBOARD_PATH = '/';