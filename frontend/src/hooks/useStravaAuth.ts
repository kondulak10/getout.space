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
			console.log('📥 Received authorization code, exchanging for tokens...');
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
			console.log('🔐 Initiating Strava login...');
			const authUrl = await getStravaAuthUrl();
			window.location.href = authUrl;
		} catch (error) {
			console.error('❌ Failed to get auth URL:', error);
			throw error;
		}
	};

	/**
	 * Handle OAuth callback - exchange code for tokens
	 */
	const handleOAuthCallback = async (code: string) => {
		try {
			console.log('🔄 Exchanging OAuth code for tokens...');

			const data = await exchangeCodeForToken(code);

			console.log('📥 Server response:', data);

			if (data.success && data.token && data.user) {
				console.log('✅ Authentication successful!');
				console.log(`👤 User: ${data.user.profile.firstname} ${data.user.profile.lastname}${data.user.isAdmin ? ' 👑' : ''}`);
				console.log(`🖼️ Profile: ${data.user.profile.profile || 'Not set'}`);
				console.log(`🔷 Hexagon: ${data.user.profile.imghex || 'Not set'}`);

				login(data.token, data.user);

				window.history.replaceState({}, document.title, '/');
			} else {
				const errorMsg = data.error || data.details || 'Unknown error';
				console.error('❌ Authentication failed:', errorMsg);
				console.error(`Login failed: ${errorMsg}`);
			}
		} catch (error) {
			console.error('❌ Token exchange failed:', error);
			console.error(`Login error: ${error instanceof Error ? error.message : 'Network error'}`);
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
