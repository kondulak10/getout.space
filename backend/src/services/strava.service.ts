import { User } from '../models/User';
import { refreshStravaToken } from '../utils/strava';

/**
 * Get a valid Strava access token for a user.
 * Automatically refreshes the token if it's expired or about to expire.
 *
 * @param userId - MongoDB user ID
 * @returns Valid Strava access token
 * @throws Error if user not found
 */
export async function getValidAccessToken(userId: string): Promise<string> {
	const user = await User.findById(userId);

	if (!user) {
		throw new Error('User not found');
	}

	const now = Math.floor(Date.now() / 1000);

	// If token expires in less than 5 minutes, refresh it
	if (user.tokenExpiresAt - now < 300) {
		console.log('🔄 Access token expired or expiring soon, refreshing...');

		const tokenData = await refreshStravaToken(user);

		// Update user's tokens in database
		user.accessToken = tokenData.access_token;
		user.refreshToken = tokenData.refresh_token;
		user.tokenExpiresAt = tokenData.expires_at;
		await user.save();

		console.log('✅ Token refreshed and saved to DB');
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
export async function fetchStravaActivity(activityId: number | string, accessToken: string): Promise<StravaActivityData> {
	const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Strava API error: ${response.status}`);
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
