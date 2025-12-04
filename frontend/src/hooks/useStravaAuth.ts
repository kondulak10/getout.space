import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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
				return;
			}

			globalCodeExchangeInProgress = true;
			globalCodeExchanged = code;
			setIsAuthenticating(true);
			handleOAuthCallback(code);
		}
		// This effect runs only on mount to handle OAuth callback from URL params.
		// handleOAuthCallback is defined below and isAuthenticated check is a guard.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loginWithStrava = () => {
		console.log('🚀 Starting Strava login...');

		// Safari fix: Don't use async/await - use .then() to keep the user gesture context
		getStravaAuthUrl()
			.then((authUrl) => {
				console.log('🔀 Redirecting to:', authUrl);
				window.location.href = authUrl;
			})
			.catch((error) => {
				console.error('❌ Login failed:', error);
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';

				toast.error('Login failed! Please spam jan.kondula@gmail.com', {
					description: `Error: ${errorMessage}. Jan clearly didn't fix this properly.`,
					duration: 10000,
				});

				// Also show a browser alert for extra visibility
				alert(
					'🚨 Login Failed!\n\n' +
					`Error: ${errorMessage}\n\n` +
					'Please spam jan.kondula@gmail.com because he failed to fix the login properly.\n\n' +
					'(Check the browser console for technical details)'
				);
			});
	};

	const autoProcessLatestRuns = async () => {
		try {
			toast.info('Processing your recent activities...', {
				description: 'This may take a moment.',
			});

			const activitiesData = await fetchActivities(1, 30);

			if (!activitiesData.success || !activitiesData.activities.length) {
				toast.info('No activities found', {
					description: 'Try adding some activities from Strava!',
				});
				return;
			}

			const latestRuns = activitiesData.activities
				.filter(activity => !activity.isStored)
				.slice(0, 3);

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
					await processActivity(run.id);
					processedCount++;
				} catch {
					failedCount++;
				}
			}

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
		} catch {
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
					import('canvas-confetti').then((confettiModule) => {
						const confetti = confettiModule.default;
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
					}).catch(() => {});

					toast.success('🎉 Welcome to GetOut!', {
						description: 'Start running to conquer the territory',
						duration: 5000,
					});

					autoProcessLatestRuns().catch(() => {});
				}

				window.history.replaceState({}, document.title, '/');
			} else {
				const errorMessage = data.details || data.error || 'Unknown error';
				const statusCode = data.statusCode ? ` (${data.statusCode})` : '';
				toast.error(`Authentication failed${statusCode}`, {
					description: errorMessage,
					duration: 6000,
				});
			}
		} catch (error) {
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
