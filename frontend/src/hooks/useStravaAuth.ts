import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { getStravaAuthUrl, exchangeCodeForToken } from '@/services/stravaApi.service';

/**
 * Hook for managing Strava OAuth authentication flow
 */
export function useStravaAuth() {
	const { isAuthenticated, login, user } = useAuth();
	const hasExchangedCode = useRef(false);
	const [isAuthenticating, setIsAuthenticating] = useState(false);

	// Handle OAuth callback on component mount
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const scope = urlParams.get('scope');

		// OAuth codes can only be used once!
		// Prevent double execution with ref guard
		if (code && scope && !isAuthenticated && !hasExchangedCode.current) {
			hasExchangedCode.current = true;
			setIsAuthenticating(true);
			handleOAuthCallback(code);
		}
	}, [isAuthenticated]);

	/**
	 * Initiate Strava login flow
	 */
	const loginWithStrava = async () => {
		try {
			const authUrl = await getStravaAuthUrl();
			window.location.href = authUrl;
		} catch (error) {
			throw error;
		}
	};

	/**
	 * Handle OAuth callback - exchange code for tokens
	 */
	const handleOAuthCallback = async (code: string) => {
		try {

			const data = await exchangeCodeForToken(code);


			if (data.success && data.token && data.user) {

				login(data.token, data.user);

				window.history.replaceState({}, document.title, '/');
			} else {
				const errorMsg = data.error || data.details || 'Unknown error';
			}
		} catch (error) {
		} finally {
			setIsAuthenticating(false);
		}
	};

	return {
		isAuthenticated,
		isAuthenticating,
		user,
		loginWithStrava,
	};
}
