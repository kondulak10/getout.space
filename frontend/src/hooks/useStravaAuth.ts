import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/useAuth';
import { getStravaAuthUrl, exchangeCodeForToken, fetchActivities, processActivity } from '@/services/stravaApi.service';

interface UseStravaAuthOptions {
	onActivitiesProcessed?: () => void;
}

// GLOBAL flag to prevent multiple hook instances from exchanging the same code
// This is necessary because the hook is used in multiple components
let globalCodeExchangeInProgress = false;
let globalCodeExchanged = '';

/**
 * Hook for managing Strava OAuth authentication flow
 */
export function useStravaAuth(options?: UseStravaAuthOptions) {
	const { isAuthenticated, login, user } = useAuth();
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const onActivitiesProcessedRef = useRef(options?.onActivitiesProcessed);

	// Handle OAuth callback on component mount
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const scope = urlParams.get('scope');

		// OAuth codes can only be used once!
		// Use GLOBAL flag to prevent multiple hook instances from exchanging the same code
		if (code && scope && !isAuthenticated) {
			// Check if this exact code has already been exchanged or is in progress
			if (globalCodeExchanged === code || globalCodeExchangeInProgress) {
				console.log('⏭️ OAuth code already exchanged or in progress, skipping...');
				return;
			}

			globalCodeExchangeInProgress = true;
			globalCodeExchanged = code;
			setIsAuthenticating(true);
			handleOAuthCallback(code);
		}
	}, []); // Empty deps - only run once on mount

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
			toast.info('Processing your recent activities...', {
				description: 'This may take a moment.',
			});

			// Fetch activities from Strava (backend already filters to runs)
			const activitiesData = await fetchActivities(1, 30);

			if (!activitiesData.success || !activitiesData.activities.length) {
				console.log('ℹ️ No activities found to process');
				toast.info('No activities found', {
					description: 'Try adding some activities from Strava!',
				});
				return;
			}

			// Get the 3 most recent activities (already filtered to runs on backend)
			const latestRuns = activitiesData.activities
				.filter(activity => !activity.isStored) // Only process activities not already stored
				.slice(0, 3);

			console.log(`📊 Found ${latestRuns.length} runs to process`);

			if (latestRuns.length === 0) {
				toast.info('Activities already processed', {
					description: 'Your recent activities are already on the map!',
				});
				return;
			}

			let processedCount = 0;
			let failedCount = 0;

			// Process each run sequentially
			for (const run of latestRuns) {
				try {
					console.log(`🏃 Processing run: ${run.name}`);
					await processActivity(run.id);
					console.log(`✅ Successfully processed: ${run.name}`);
					processedCount++;
				} catch (error) {
					console.error(`❌ Failed to process run: ${run.name}`, error);
					failedCount++;
					// Continue with next activity even if one fails
				}
			}

			console.log('🎊 Finished auto-processing runs!');

			// Show success toast
			if (processedCount > 0) {
				toast.success(`${processedCount} ${processedCount === 1 ? 'activity' : 'activities'} processed!`, {
					description: 'Your hexagons are now visible on the map.',
				});

				// Trigger callback to refresh map
				if (onActivitiesProcessedRef.current) {
					onActivitiesProcessedRef.current();
				}
			}

			if (failedCount > 0) {
				toast.error(`Failed to process ${failedCount} ${failedCount === 1 ? 'activity' : 'activities'}`, {
					description: 'Some activities could not be processed.',
				});
			}
		} catch (error) {
			console.error('❌ Error during auto-processing:', error);
			toast.error('Failed to process activities', {
				description: 'An error occurred during auto-processing.',
			});
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

				// If this is a new user, show welcome celebration
				if (data.isNewUser) {
					// Trigger fullscreen confetti celebration
					const duration = 3000; // 3 seconds
					const animationEnd = Date.now() + duration;

					const interval = setInterval(() => {
						const timeLeft = animationEnd - Date.now();

						if (timeLeft <= 0) {
							clearInterval(interval);
							return;
						}

						const particleCount = 50 * (timeLeft / duration);

						// Launch confetti from both sides
						confetti({
							particleCount,
							angle: 60,
							spread: 55,
							origin: { x: 0 },
							colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
						});
						confetti({
							particleCount,
							angle: 120,
							spread: 55,
							origin: { x: 1 },
							colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
						});
					}, 250);

					// Show welcome toast
					toast.success('🎉 Welcome to GetOut!', {
						description: 'Start running to conquer the territory',
						duration: 5000,
					});

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
			console.error('OAuth callback error:', error);
		} finally {
			setIsAuthenticating(false);
			globalCodeExchangeInProgress = false; // Reset flag when done
		}
	};

	return {
		isAuthenticated,
		isAuthenticating,
		user,
		loginWithStrava,
	};
}
