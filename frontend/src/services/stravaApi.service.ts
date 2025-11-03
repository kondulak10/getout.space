/**
 * Strava API Service
 * Handles all API calls to the backend for Strava integration
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
	return localStorage.getItem('getout_auth_token');
}

/**
 * Create headers with authentication
 */
function createAuthHeaders(): HeadersInit {
	const token = getAuthToken();
	return {
		'Authorization': token ? `Bearer ${token}` : '',
		'Content-Type': 'application/json',
	};
}

// ============================================================
// OAuth & Authentication
// ============================================================

export interface AuthResponse {
	success: boolean;
	token?: string;
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
	};
	error?: string;
	details?: string;
}

/**
 * Get Strava OAuth authorization URL
 */
export async function getStravaAuthUrl(): Promise<string> {
	const response = await fetch(`${BACKEND_URL}/api/strava/auth`);
	const data = await response.json();
	return data.authUrl;
}

/**
 * Exchange OAuth code for JWT token
 */
export async function exchangeCodeForToken(code: string): Promise<AuthResponse> {
	const response = await fetch(`${BACKEND_URL}/api/strava/callback`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ code }),
	});

	return await response.json();
}

// ============================================================
// Activities
// ============================================================

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
}

export interface ActivitiesResponse {
	success: boolean;
	activities: StravaActivity[];
	count: number;
	page: number;
	hasMorePages: boolean;
	error?: string;
}

/**
 * Fetch Strava activities with pagination
 */
export async function fetchActivities(page: number = 1, perPage: number = 30): Promise<ActivitiesResponse> {
	const url = new URL(`${BACKEND_URL}/api/strava/activities`);
	url.searchParams.set('page', page.toString());
	url.searchParams.set('per_page', perPage.toString());

	const response = await fetch(url.toString(), {
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

/**
 * Fetch single activity details
 */
export async function fetchActivityDetails(activityId: number): Promise<ActivityDetailsResponse> {
	const response = await fetch(`${BACKEND_URL}/api/strava/activities/${activityId}`, {
		headers: createAuthHeaders(),
	});

	return await response.json();
}

// ============================================================
// Activity Processing
// ============================================================

export interface ProcessActivityResponse {
	success: boolean;
	activity: {
		id: string;
		stravaActivityId: number;
		name: string;
		distance: number;
		wasCreated: boolean;
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

/**
 * Process (save) a Strava activity to the database
 */
export async function processActivity(activityId: number): Promise<ProcessActivityResponse> {
	const response = await fetch(`${BACKEND_URL}/api/strava/process-activity`, {
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

/**
 * Delete an activity from the database
 */
export async function deleteActivity(activityId: number): Promise<DeleteActivityResponse> {
	const response = await fetch(`${BACKEND_URL}/api/strava/activities/${activityId}`, {
		method: 'DELETE',
		headers: createAuthHeaders(),
	});

	return await response.json();
}

// ============================================================
// Stats
// ============================================================

export interface StatsResponse {
	success: boolean;
	runCount: number;
	error?: string;
}

/**
 * Fetch athlete statistics
 */
export async function fetchAthleteStats(): Promise<StatsResponse> {
	const response = await fetch(`${BACKEND_URL}/api/strava/stats`, {
		headers: createAuthHeaders(),
	});

	return await response.json();
}

// ============================================================
// User Activities (from our database)
// ============================================================

export interface UserActivity {
	id: string;
	stravaActivityId: number;
	name: string;
	distance: number;
	startDate: string;
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

/**
 * Fetch latest activity from database
 */
export async function fetchLatestActivity(): Promise<LatestActivityResponse> {
	const response = await fetch(`${BACKEND_URL}/api/activities/latest`, {
		headers: createAuthHeaders(),
	});

	return await response.json();
}

/**
 * Fetch all activities from database
 */
export async function fetchAllActivities(): Promise<AllActivitiesResponse> {
	const response = await fetch(`${BACKEND_URL}/api/activities/all`, {
		headers: createAuthHeaders(),
	});

	return await response.json();
}
