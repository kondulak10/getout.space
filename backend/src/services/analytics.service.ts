import * as amplitude from '@amplitude/analytics-node';

// Backend event type definitions
// Only user-initiated events should be tracked here to avoid polluting Amplitude data
export interface BackendAnalyticsEvents {
	// User operations (triggered by actual user actions, not webhooks)
	user_registered: {
		user_id: string;
		strava_id: number;
		is_admin: boolean;
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
