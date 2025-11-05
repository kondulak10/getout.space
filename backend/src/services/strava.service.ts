import { User } from '../models/User';
import { refreshStravaToken } from '../utils/strava';

/**
 * In-memory lock to prevent concurrent token refreshes for the same user.
 * Maps userId -> Promise<string> (the access token)
 */
const tokenRefreshLocks = new Map<string, Promise<string>>();

/**
 * Get a valid Strava access token for a user.
 * Automatically refreshes the token if it's expired or about to expire.
 * Prevents race conditions when multiple requests try to refresh simultaneously.
 *
 * @param userId - MongoDB user ID
 * @param forceRefresh - Force a token refresh even if not expired (for retry scenarios)
 * @returns Valid Strava access token
 * @throws Error if user not found or refresh fails
 */
export async function getValidAccessToken(userId: string, forceRefresh: boolean = false): Promise<string> {
	const user = await User.findById(userId);

	if (!user) {
		throw new Error('User not found');
	}

	const now = Math.floor(Date.now() / 1000);
	const timeUntilExpiry = user.tokenExpiresAt - now;

	// If token expires in less than 5 minutes, refresh it (or force refresh if requested)
	if (forceRefresh || timeUntilExpiry < 300) {
		const reason = forceRefresh ? 'forced refresh requested' : `expires in ${timeUntilExpiry}s`;
		console.log(`🔄 Access token needs refresh (${reason})...`);

		// CRITICAL: Check-and-set must be atomic to prevent race conditions
		// Check if a refresh is already in progress for this user
		let existingRefresh = tokenRefreshLocks.get(userId);
		if (existingRefresh) {
			console.log(`⏳ Token refresh already in progress for user ${userId}, waiting...`);
			try {
				const token = await existingRefresh;
				console.log(`✅ Reused token from concurrent refresh for user ${userId}`);
				return token;
			} catch (error) {
				console.error(`❌ Concurrent refresh failed:`, error);
				// Lock should be cleaned up by the failed refresh, try to get fresh lock state
				existingRefresh = tokenRefreshLocks.get(userId);
				if (existingRefresh) {
					// Another request already created a new lock, wait for it
					console.log(`⏳ Another refresh started, waiting for it...`);
					return await existingRefresh;
				}
				// Fall through to create our own refresh
			}
		}

		// Create a new refresh promise and store it in the lock map
		const refreshPromise = (async (): Promise<string> => {
			try {
				// Refetch user just before refresh to get latest state
				const latestUser = await User.findById(userId);
				if (!latestUser) {
					throw new Error('User not found during refresh');
				}

				// Check again - maybe another request already refreshed
				const nowAgain = Math.floor(Date.now() / 1000);
				const timeUntilExpiryAgain = latestUser.tokenExpiresAt - nowAgain;

				// Only skip refresh if token was recently refreshed (< 30 seconds ago) and not forcing
				// This prevents using a token that was refreshed with a bad refresh token
				if (!forceRefresh && timeUntilExpiryAgain >= 300) {
					// Double-check token is actually fresh (expires > 5 hours from now = recently refreshed)
					if (timeUntilExpiryAgain > 5 * 3600) {
						console.log(`✅ Token was already refreshed by another request (expires in ${timeUntilExpiryAgain}s)`);
						return latestUser.accessToken;
					}
					console.log(`⚠️ Token expires in ${timeUntilExpiryAgain}s but seems stale, will refresh anyway`);
				}

				console.log(`🔄 Proceeding with token refresh for user ${userId}`);
				const tokenData = await refreshStravaToken(latestUser);

				// Update user's tokens in database
				latestUser.accessToken = tokenData.access_token;
				latestUser.refreshToken = tokenData.refresh_token;
				latestUser.tokenExpiresAt = tokenData.expires_at;
				await latestUser.save();

				console.log(`✅ Token refreshed and saved to DB for user ${userId} (expires at ${new Date(tokenData.expires_at * 1000).toISOString()})`);
				return latestUser.accessToken;
			} catch (error) {
				console.error(`❌ Token refresh failed for user ${userId}:`, error);
				throw error;
			} finally {
				// Always clean up the lock when done (success or failure)
				tokenRefreshLocks.delete(userId);
				console.log(`🔓 Lock released for user ${userId}`);
			}
		})();

		// ATOMIC OPERATION: Try to set lock only if it doesn't exist
		// If another request set it between our check and now, use theirs
		const raceCheckLock = tokenRefreshLocks.get(userId);
		if (raceCheckLock) {
			console.log(`⏳ Race condition detected: lock was set by another request, using that one`);
			// Clean up our promise since we won't use it
			refreshPromise.catch(() => {}); // Prevent unhandled rejection
			return await raceCheckLock;
		}

		// Store the promise in the lock map before awaiting
		tokenRefreshLocks.set(userId, refreshPromise);

		return await refreshPromise;
	}

	return user.accessToken;
}

/**
 * Strava Activity response from API
 */
export interface StravaActivityData {
	id: number;
	name: string;
	type: string;
	sport_type: string;
	description?: string;
	start_date: string;
	start_date_local: string;
	timezone?: string;
	moving_time: number;
	elapsed_time: number;
	distance: number;
	total_elevation_gain: number;
	average_speed: number;
	start_latlng?: [number, number];
	end_latlng?: [number, number];
	map?: {
		summary_polyline: string;
		polyline?: string;
	};
	manual: boolean;
	private: boolean;
}

/**
 * Fetch a Strava activity by ID from the Strava API
 *
 * @param activityId - Strava activity ID
 * @param accessToken - Valid Strava access token
 * @param userId - User ID for token refresh on retry (optional)
 * @param isRetry - Internal flag to prevent infinite retry loops
 * @returns Activity data from Strava API
 * @throws Error if activity fetch fails
 */
export async function fetchStravaActivity(
	activityId: number | string,
	accessToken: string,
	userId?: string,
	isRetry: boolean = false
): Promise<StravaActivityData> {
	const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		// Handle 401 Unauthorized - token might be stale
		if (response.status === 401 && !isRetry && userId) {
			console.warn(`⚠️ Got 401 when fetching activity ${activityId}, attempting token refresh and retry...`);

			try {
				// Force refresh the token and retry once
				const newAccessToken = await getValidAccessToken(userId, true);
				console.log(`🔄 Retrying activity fetch with refreshed token...`);

				// Retry with new token (set isRetry to prevent infinite loops)
				return await fetchStravaActivity(activityId, newAccessToken, userId, true);
			} catch (retryError) {
				const errorMsg = retryError instanceof Error ? retryError.message : 'Unknown error';
				console.error(`❌ Retry after token refresh failed:`, retryError);
				throw new Error(`Strava API error even after token refresh - Original: 401, Retry: ${errorMsg}`);
			}
		}

		// Log the full error for debugging
		let errorBody = '';
		try {
			errorBody = await response.text();
		} catch (e) {
			// Ignore if we can't read the body
		}

		console.error(`❌ Strava API error when fetching activity ${activityId}:`, {
			status: response.status,
			statusText: response.statusText,
			body: errorBody,
			isRetry,
		});

		throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
	}

	return await response.json() as StravaActivityData;
}

/**
 * Validate if a Strava activity is a running activity
 *
 * @param activity - Strava activity object
 * @returns True if activity is a running activity
 */
export function isRunningActivity(activity: StravaActivityData): boolean {
	const activityType = activity.type;
	const sportType = activity.sport_type;
	return activityType === 'Run' || sportType === 'TrailRun' || sportType === 'VirtualRun';
}
