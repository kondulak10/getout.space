export interface StravaOAuthTokenResponse {
	token_type: string;
	expires_at: number;
	expires_in: number;
	refresh_token: string;
	access_token: string;
	scope: string;
	athlete: {
		id: number;
		username?: string;
		firstname: string;
		lastname: string;
		city?: string;
		state?: string;
		country?: string;
		sex?: string;
		profile: string;
		profile_medium?: string;
	};
}

export interface StravaActivity {
	id: number;
	name: string;
	type: string;
	sport_type: string;
	distance: number;
	moving_time: number;
	elapsed_time: number;
	total_elevation_gain: number;
	start_date: string;
	start_date_local: string;
	average_speed: number;
	max_speed: number;
	start_latlng?: [number, number];
	end_latlng?: [number, number];
	map?: {
		summary_polyline: string;
		polyline?: string;
	};
	manual: boolean;
	private: boolean;
}

export interface StravaAthleteStats {
	recent_run_totals: {
		count: number;
		distance: number;
		moving_time: number;
		elapsed_time: number;
		elevation_gain: number;
	};
	all_run_totals: {
		count: number;
		distance: number;
		moving_time: number;
		elapsed_time: number;
		elevation_gain: number;
	};
	ytd_run_totals: {
		count: number;
		distance: number;
		moving_time: number;
		elapsed_time: number;
		elevation_gain: number;
	};
}

export interface StravaWebhookEvent {
	aspect_type: string;
	event_time: number;
	object_id: number;
	object_type: string;
	owner_id: number;
	subscription_id: number;
	updates?: Record<string, unknown>;
}
