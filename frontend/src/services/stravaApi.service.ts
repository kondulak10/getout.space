const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
function getAuthToken(): string | null {
	return localStorage.getItem('getout_auth_token');
}
function createAuthHeaders(): HeadersInit {
	const token = getAuthToken();
	return {
		'Authorization': token ? `Bearer ${token}` : '',
		'Content-Type': 'application/json',
	};
}
async function authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
	const response = await fetch(url, options);
	if (response.status === 401) {
		console.log('Strava API: 401 Unauthorized - attempting token refresh');
		try {
			const refreshResponse = await fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
				method: 'POST',
				headers: createAuthHeaders(),
			});
			if (refreshResponse.ok) {
				console.log('Strava API: Token refreshed successfully, reloading page');
				window.location.reload();
				return new Promise(() => {});
			} else {
				console.log('Strava API: Token refresh failed - logging out');
				localStorage.removeItem('getout_auth_token');
				window.location.href = '/';
				return new Promise(() => {});
			}
		} catch {
			console.log('Strava API: Error during token refresh, logging out');
			localStorage.removeItem('getout_auth_token');
			window.location.href = '/';
			return new Promise(() => {});
		}
	}
	return response;
}
export interface AuthResponse {
	success: boolean;
	token?: string;
	isNewUser?: boolean;
	user?: {
		id: string;
		stravaId: number;
		isAdmin: boolean;
		profile: {
			firstname: string;
			lastname: string;
			profile: string;
			imghex?: string;
		};
		tokenExpiresAt: number;
		tokenIsExpired?: boolean;
		createdAt: string;
		updatedAt?: string;
	};
	error?: string;
	details?: string;
	needsReauth?: boolean;
	statusCode?: number;
}
export async function getStravaAuthUrl(): Promise<string> {
	const response = await fetch(`${BACKEND_URL}/api/strava/auth`);
	const data = await response.json();
	return data.authUrl;
}
export async function exchangeCodeForToken(code: string, scope: string): Promise<AuthResponse> {
	const response = await fetch(`${BACKEND_URL}/api/strava/callback`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ code, scope }),
	});
	const data = await response.json();
	return {
		...data,
		statusCode: response.status,
	};
}
export async function refreshToken(): Promise<AuthResponse> {
	const response = await fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
		method: 'POST',
		headers: createAuthHeaders(),
	});
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(errorData.error || 'Failed to refresh token');
	}
	return await response.json();
}
export interface StravaActivity {
	id: number;
	name: string;
	type: string;
	distance: number;
	moving_time: number;
	elapsed_time: number;
	total_elevation_gain: number;
	start_date: string;
	start_date_local: string;
	average_speed: number;
	max_speed: number;
	isStored?: boolean;
	lastHex?: string;
}
export interface ActivitiesResponse {
	success: boolean;
	activities: StravaActivity[];
	count: number;
	page: number;
	hasMorePages: boolean;
	infoMessage?: string;
	error?: string;
}
export async function fetchActivities(page: number = 1, perPage: number = 30): Promise<ActivitiesResponse> {
	const url = new URL(`${BACKEND_URL}/api/strava/activities`);
	url.searchParams.set('page', page.toString());
	url.searchParams.set('per_page', perPage.toString());
	const response = await authenticatedFetch(url.toString(), {
		headers: createAuthHeaders(),
	});
	return await response.json();
}
export interface ActivityDetails {
	id: number;
	name: string;
	type: string;
	distance: number;
	moving_time: number;
	map?: {
		polyline: string;
		summary_polyline: string;
	};
}
export interface ActivityDetailsResponse {
	success: boolean;
	activity: ActivityDetails;
	error?: string;
}
export async function fetchActivityDetails(activityId: number): Promise<ActivityDetailsResponse> {
	const response = await authenticatedFetch(`${BACKEND_URL}/api/strava/activities/${activityId}`, {
		headers: createAuthHeaders(),
	});
	return await response.json();
}
export interface ProcessActivityResponse {
	success: boolean;
	activity: {
		id: string;
		stravaActivityId: number;
		name: string;
		distance: number;
		wasCreated: boolean;
		lastHex?: string;
	};
	hexagons: {
		totalParsed: number;
		created: number;
		updated: number;
		couldNotUpdate: number;
		hexagonIds: string[];
		details: {
			created: string[];
			updated: string[];
			skipped: string[];
		};
	};
	error?: string;
	details?: string;
}
export async function processActivity(activityId: number): Promise<ProcessActivityResponse> {
	const response = await authenticatedFetch(`${BACKEND_URL}/api/strava/process-activity`, {
		method: 'POST',
		headers: createAuthHeaders(),
		body: JSON.stringify({ activityId }),
	});
	return await response.json();
}
export interface DeleteActivityResponse {
	success: boolean;
	message: string;
	hexagons: {
		restored: number;
		deleted: number;
	};
	error?: string;
	details?: string;
}
export async function deleteActivity(activityId: number): Promise<DeleteActivityResponse> {
	const response = await authenticatedFetch(`${BACKEND_URL}/api/strava/activities/${activityId}`, {
		method: 'DELETE',
		headers: createAuthHeaders(),
	});
	return await response.json();
}
export interface StatsResponse {
	success: boolean;
	runCount: number;
	error?: string;
}
export async function fetchAthleteStats(): Promise<StatsResponse> {
	const response = await authenticatedFetch(`${BACKEND_URL}/api/strava/stats`, {
		headers: createAuthHeaders(),
	});
	return await response.json();
}
export interface UserActivity {
	id: string;
	stravaActivityId: number;
	name: string;
	distance: number;
	startDate: string;
	lastHex?: string;
}
export interface LatestActivityResponse {
	success: boolean;
	activity: UserActivity | null;
	error?: string;
}
export interface AllActivitiesResponse {
	success: boolean;
	count: number;
	activities: UserActivity[];
	error?: string;
}
export async function fetchLatestActivity(): Promise<LatestActivityResponse> {
	const response = await authenticatedFetch(`${BACKEND_URL}/api/activities/latest`, {
		headers: createAuthHeaders(),
	});
	return await response.json();
}
export async function fetchAllActivities(): Promise<AllActivitiesResponse> {
	const response = await authenticatedFetch(`${BACKEND_URL}/api/activities/all`, {
		headers: createAuthHeaders(),
	});
	return await response.json();
}
