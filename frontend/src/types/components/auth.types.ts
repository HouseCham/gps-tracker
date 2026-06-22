/**
 * @interface LoginFormData
 * @property {string} email - The email address of the user.
 * @property {string} password - The password of the user.
 */
export interface LoginFormData {
    email: string;
    password: string;
}
/**
 * @interface LoginFormStrings
 * @property {string} email - The label for the email input.
 * @property {string} emailPlaceholder - The placeholder for the email input.
 * @property {string} password - The label for the password input.
 * @property {string} passwordPlaceholder - The placeholder for the password input.
 * @property {string} loggingIn - The text to display while the form is loading.
 * @property {string} login - The label for the login button.
 * @property {string} emailRequired - The error message to display if the email is required.
 * @property {string} emailInvalid - The error message to display if the email is invalid.
 * @property {string} passwordRequired - The error message to display if the password is required.
 * @property {string} loginTitle - The title for the login form.
 * @property {string} loginSubtitle - The subtitle for the login form.
 */
export interface LoginFormStrings {
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    loggingIn: string;
    login: string;
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    loginTitle: string;
    loginSubtitle: string;
}
/**
 * @interface SignupFormData
 * @property {string} email - The email address of the user.
 * @property {string} name - The name of the user.
 * @property {string} password - The password of the user.
 */
export interface SignupFormData {
    email: string;
    name: string;
    password: string;
}
/**
 * @interface SignupFormStrings
 * @property {string} email - The label for the email input.
 * @property {string} emailPlaceholder - The placeholder for the email input.
 * @property {string} password - The label for the password input.
 * @property {string} passwordPlaceholder - The placeholder for the password input.
 * @property {string} name - The label for the name input.
 * @property {string} namePlaceholder - The placeholder for the name input.
 * @property {string} signingUp - The label for the signing up button.
 * @property {string} signup - The label for the sign up button.
 * @property {string} haveAccount - The label for the have account text.
 * @property {string} loginLink - The label for the login link.
 * @property {string} emailRequired - The error message for the email input.
 * @property {string} emailInvalid - The error message for the email input.
 * @property {string} passwordRequired - The error message for the password input.
 * @property {string} passwordMin - The error message for the password input.
 * @property {string} nameRequired - The error message for the name input.
 * @property {string} signupTitle - The title for the sign up form.
 * @property {string} signupSubtitle - The subtitle for the sign up form.
 */
export interface SignupFormStrings {
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    name: string;
    namePlaceholder: string;
    signingUp: string;
    signup: string;
    haveAccount: string;
    loginLink: string;
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    passwordMin: string;
    nameRequired: string;
    signupTitle: string;
    signupSubtitle: string;
}
