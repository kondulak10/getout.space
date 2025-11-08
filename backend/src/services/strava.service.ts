import { User } from '../models/User';
import { refreshStravaToken } from '../utils/strava';

/**
 * Get a valid Strava access token for a user (used by webhooks).
 * Automatically refreshes the token if it's expired or about to expire.
 *
 * NOTE: This is primarily for webhook processing. Frontend uses POST /api/auth/refresh-token endpoint.
 *
 * @param userId - MongoDB user ID
 * @returns Valid Strava access token
 * @throws Error if user not found or refresh fails
 */
export async function getValidAccessToken(userId: string): Promise<string> {
	const user = await User.findById(userId);

	if (!user) {
		throw new Error('User not found');
	}

	const now = Math.floor(Date.now() / 1000);
	const timeUntilExpiry = user.tokenExpiresAt - now;

	// Refresh if token expires in less than 1 hour
	if (timeUntilExpiry < 3600) {
		console.log(`🔄 Webhook: Refreshing token for user ${user.stravaProfile.firstname} (expires in ${timeUntilExpiry}s)...`);

		const tokenData = await refreshStravaToken(user);

		// Update user's tokens in database
		user.accessToken = tokenData.access_token;
		user.refreshToken = tokenData.refresh_token;
		user.tokenExpiresAt = tokenData.expires_at;
		await user.save();

		console.log(`✅ Webhook: Token refreshed successfully (new expiry: ${new Date(tokenData.expires_at * 1000).toISOString()})`);
		return user.accessToken;
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
 * @returns Activity data from Strava API
 * @throws Error if activity fetch fails
 */
export async function fetchStravaActivity(
	activityId: number | string,
	accessToken: string
): Promise<StravaActivityData> {
	const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
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
