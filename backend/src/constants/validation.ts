/**
 * Shared validation constants
 */

/**
 * Regular expression for validating email addresses
 * Matches: user@domain.com, user.name@sub.domain.co.uk, etc.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
	return EMAIL_REGEX.test(email);
};
