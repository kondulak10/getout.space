import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { getStravaAuthUrl, exchangeCodeForToken, fetchActivities, processActivity } from '@/services/stravaApi.service';

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
	 * Auto-process 3 latest runs for new users
	 */
	const autoProcessLatestRuns = async () => {
		try {
			console.log('🎉 New user detected! Auto-processing 3 latest runs...');

			// Fetch activities from Strava (backend already filters to runs)
			const activitiesData = await fetchActivities(1, 30);

			if (!activitiesData.success || !activitiesData.activities.length) {
				console.log('ℹ️ No activities found to process');
				return;
			}

			// Get the 3 most recent activities (already filtered to runs on backend)
			const latestRuns = activitiesData.activities
				.filter(activity => !activity.isStored) // Only process activities not already stored
				.slice(0, 3);

			console.log(`📊 Found ${latestRuns.length} runs to process`);

			// Process each run sequentially
			for (const run of latestRuns) {
				try {
					console.log(`🏃 Processing run: ${run.name}`);
					await processActivity(run.id);
					console.log(`✅ Successfully processed: ${run.name}`);
				} catch (error) {
					console.error(`❌ Failed to process run: ${run.name}`, error);
					// Continue with next activity even if one fails
				}
			}

			console.log('🎊 Finished auto-processing runs!');
		} catch (error) {
			console.error('❌ Error during auto-processing:', error);
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

				// If this is a new user, auto-process their 3 latest runs
				if (data.isNewUser) {
					// Run in background, don't block the login flow
					autoProcessLatestRuns().catch(err => {
						console.error('Failed to auto-process activities:', err);
					});
				}

				window.history.replaceState({}, document.title, '/');
			} else {
				console.error('Authentication failed:', data.error || data.details || 'Unknown error');
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
