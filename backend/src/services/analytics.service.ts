import * as amplitude from '@amplitude/analytics-node';

// Backend event type definitions
export interface BackendAnalyticsEvents {
	// Activity processing
	activity_webhook_received: {
		strava_activity_id: number;
		aspect_type: string;
		owner_id: number;
	};
	activity_processing_started: {
		activity_id: string;
		strava_activity_id: number;
		user_id: string;
	};
	activity_processing_completed: {
		activity_id: string;
		strava_activity_id: number;
		user_id: string;
		hexagons_captured: number;
		hexagons_stolen: number;
		processing_time_ms: number;
		route_type: 'line' | 'area';
	};
	activity_processing_failed: {
		activity_id?: string;
		strava_activity_id: number;
		user_id: string;
		error_message: string;
		error_type: string;
	};

	// Hexagon operations
	hexagons_captured: {
		user_id: string;
		hexagon_count: number;
		activity_id: string;
		new_captures: number;
		stolen_from_others: number;
	};
	hexagon_battle_won: {
		winner_id: string;
		loser_id: string;
		hexagon_id: string;
		time_difference_hours: number;
	};

	// Token operations
	token_refresh_started: {
		user_id: string;
	};
	token_refresh_completed: {
		user_id: string;
		refresh_time_ms: number;
	};
	token_refresh_failed: {
		user_id: string;
		error_message: string;
	};

	// User operations
	user_registered: {
		user_id: string;
		strava_id: number;
		is_admin: boolean;
	};
	user_profile_updated: {
		user_id: string;
		fields_updated: string[];
	};

	// GraphQL operations
	graphql_query_executed: {
		operation_name: string;
		user_id?: string;
		execution_time_ms: number;
	};
	graphql_error: {
		operation_name: string;
		error_message: string;
		user_id?: string;
	};

	// Notifications
	notification_sent: {
		user_id: string;
		notification_type: string;
	};

	// System events
	webhook_registered: {
		callback_url: string;
	};
	webhook_verification: {
		mode: string;
		challenge: string;
	};
}

export type BackendEventName = keyof BackendAnalyticsEvents;
export type BackendEventProperties<T extends BackendEventName> = BackendAnalyticsEvents[T];

class AnalyticsService {
	private initialized = false;

	init(apiKey: string) {
		if (!apiKey) {
			console.warn('Amplitude API key not provided. Backend analytics disabled.');
			return;
		}

		amplitude.init(apiKey);
		this.initialized = true;
		console.log('✅ Amplitude analytics initialized');
	}

	track<T extends BackendEventName>(
		eventName: T,
		properties: BackendEventProperties<T>,
		userId?: string
	): void {
		if (!this.initialized) return;

		amplitude.track(
			eventName,
			properties as Record<string, unknown>,
			userId ? { user_id: userId } : undefined
		);
	}

	identify(userId: string, properties?: Record<string, unknown>): void {
		if (!this.initialized) return;

		const identifyEvent = new amplitude.Identify();

		if (properties) {
			Object.entries(properties).forEach(([key, value]) => {
				identifyEvent.set(key, value as string | number | boolean | string[] | number[]);
			});
		}

		amplitude.identify(identifyEvent, { user_id: userId });
	}

	async flush(): Promise<void> {
		if (!this.initialized) return;

		try {
			await amplitude.flush();
		} catch (error) {
			console.error('❌ Failed to flush analytics events:', error);
			// Don't throw - analytics failure shouldn't break the app
		}
	}
}

export const analyticsService = new AnalyticsService();
