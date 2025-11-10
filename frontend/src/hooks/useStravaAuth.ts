import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/useAuth';
import { getStravaAuthUrl, exchangeCodeForToken, fetchActivities, processActivity } from '@/services/stravaApi.service';

interface UseStravaAuthOptions {
	onActivitiesProcessed?: () => void;
}

let globalCodeExchangeInProgress = false;
let globalCodeExchanged = '';

export function useStravaAuth(options?: UseStravaAuthOptions) {
	const { isAuthenticated, login, user } = useAuth();
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const onActivitiesProcessedRef = useRef(options?.onActivitiesProcessed);

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const scope = urlParams.get('scope');

		if (code && scope && !isAuthenticated) {
			if (globalCodeExchanged === code || globalCodeExchangeInProgress) {
				console.log('⏭️ OAuth code already exchanged or in progress, skipping...');
				return;
			}

			globalCodeExchangeInProgress = true;
			globalCodeExchanged = code;
			setIsAuthenticating(true);
			handleOAuthCallback(code);
		}
	}, []);

	const loginWithStrava = async () => {
		const authUrl = await getStravaAuthUrl();
		window.location.href = authUrl;
	};

	const autoProcessLatestRuns = async () => {
		try {
			console.log('🎉 New user detected! Auto-processing 3 latest runs...');
			toast.info('Processing your recent activities...', {
				description: 'This may take a moment.',
			});

			const activitiesData = await fetchActivities(1, 30);

			if (!activitiesData.success || !activitiesData.activities.length) {
				console.log('ℹ️ No activities found to process');
				toast.info('No activities found', {
					description: 'Try adding some activities from Strava!',
				});
				return;
			}

			const latestRuns = activitiesData.activities
				.filter(activity => !activity.isStored)
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

			for (const run of latestRuns) {
				try {
					console.log(`🏃 Processing run: ${run.name}`);
					await processActivity(run.id);
					console.log(`✅ Successfully processed: ${run.name}`);
					processedCount++;
				} catch (error) {
					console.error(`❌ Failed to process run: ${run.name}`, error);
					failedCount++;
				}
			}

			console.log('🎊 Finished auto-processing runs!');

			if (processedCount > 0) {
				toast.success(`${processedCount} ${processedCount === 1 ? 'activity' : 'activities'} processed!`, {
					description: 'Your hexagons are now visible on the map.',
				});

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

	const handleOAuthCallback = async (code: string) => {
		try {
			// Get scope from URL params - Strava returns this in the redirect
			const urlParams = new URLSearchParams(window.location.search);
			const grantedScope = urlParams.get('scope') || 'read,activity:read_all';

			const data = await exchangeCodeForToken(code, grantedScope);

			if (data.success && data.token && data.user) {
				const user = {
					...data.user,
					tokenIsExpired: data.user.tokenIsExpired ?? false,
					updatedAt: data.user.updatedAt ?? data.user.createdAt,
				};
				login(data.token, user);

				if (data.isNewUser) {
					const duration = 3000;
					const animationEnd = Date.now() + duration;

					const interval = setInterval(() => {
						const timeLeft = animationEnd - Date.now();

						if (timeLeft <= 0) {
							clearInterval(interval);
							return;
						}

						const particleCount = 50 * (timeLeft / duration);

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

					toast.success('🎉 Welcome to GetOut!', {
						description: 'Start running to conquer the territory',
						duration: 5000,
					});

					autoProcessLatestRuns().catch(err => {
						console.error('Failed to auto-process activities:', err);
					});
				}

				window.history.replaceState({}, document.title, '/');
			} else {
				const errorMessage = data.error || data.details || 'Unknown error';
				const statusCode = data.statusCode ? ` (${data.statusCode})` : '';
				console.error('Authentication failed:', errorMessage, statusCode);
				toast.error(`Authentication failed${statusCode}`, {
					description: errorMessage,
					duration: 6000,
				});
			}
		} catch (error) {
			console.error('OAuth callback error:', error);
			const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during authentication';
			toast.error('Authentication failed', {
				description: errorMessage,
				duration: 6000,
			});
		} finally {
			setIsAuthenticating(false);
			globalCodeExchangeInProgress = false;
		}
	};

	return {
		isAuthenticated,
		isAuthenticating,
		user,
		loginWithStrava,
	};
}
