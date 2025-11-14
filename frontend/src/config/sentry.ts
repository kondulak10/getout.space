import * as Sentry from '@sentry/react';

export function initializeSentry() {
	// Don't initialize in development
	if (import.meta.env.DEV) {
		console.log('🐛 Sentry: Disabled in development');
		return;
	}

	if (!import.meta.env.VITE_SENTRY_DSN_FRONTEND) {
		console.log('⚠️  Sentry: VITE_SENTRY_DSN_FRONTEND not set, skipping initialization');
		return;
	}

	Sentry.init({
		dsn: import.meta.env.VITE_SENTRY_DSN_FRONTEND,
		environment: import.meta.env.MODE || 'production',

		// Performance monitoring
		integrations: [
			// Browser tracing for performance monitoring
			Sentry.browserTracingIntegration(),

			// Replay sessions (see what user did before error)
			Sentry.replayIntegration({
				maskAllText: true, // Privacy: hide all text
				blockAllMedia: true, // Privacy: hide images
			}),
		],

		// Performance monitoring: sample 10% in production
		tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

		// Session replay: capture 10% of sessions, 100% of error sessions
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,

		// Filter out noisy errors
		beforeSend(event, hint) {
			const error = hint.originalException;

			// Don't send GraphQL auth errors (expected when token expires)
			if (error instanceof Error && error.message.includes('Unauthorized')) {
				return null;
			}

			// Don't send network errors (user offline)
			if (error instanceof Error && error.message.includes('Failed to fetch')) {
				return null;
			}

			// Don't send AbortController errors (user cancelled request)
			if (error instanceof Error && error.message.includes('AbortError')) {
				return null;
			}

			return event;
		},
	});

	console.log('✅ Sentry initialized');
}
