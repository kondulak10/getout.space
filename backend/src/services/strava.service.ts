import { User } from '../models/User';
import { refreshStravaToken } from '../utils/strava';

export async function getValidAccessToken(userId: string): Promise<string> {
	const user = await User.findById(userId);

	if (!user) {
		throw new Error('User not found');
	}

	const now = Math.floor(Date.now() / 1000);
	const timeUntilExpiry = user.tokenExpiresAt - now;

	if (timeUntilExpiry < 3600) {
		console.log(
			`🔄 Webhook: Refreshing token for user ${user.stravaProfile.firstname} (expires in ${timeUntilExpiry}s)...`
		);

		const tokenData = await refreshStravaToken(user);

		user.accessToken = tokenData.access_token;
		user.refreshToken = tokenData.refresh_token;
		user.tokenExpiresAt = tokenData.expires_at;
		await user.save();

		console.log(
			`✅ Webhook: Token refreshed successfully (new expiry: ${new Date(tokenData.expires_at * 1000).toISOString()})`
		);
		return user.accessToken;
	}

	return user.accessToken;
}

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
		let errorBody = '';
		try {
			errorBody = await response.text();
		} catch (_e) {
			// Ignore error - errorBody will remain empty string
		}

		console.error(`❌ Strava API error when fetching activity ${activityId}:`, {
			status: response.status,
			statusText: response.statusText,
			body: errorBody,
		});

		throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
	}

	return (await response.json()) as StravaActivityData;
}

export function isRunningActivity(activity: StravaActivityData): boolean {
	const activityType = activity.type;
	const sportType = activity.sport_type;
	return activityType === 'Run' || sportType === 'TrailRun' || sportType === 'VirtualRun';
}
