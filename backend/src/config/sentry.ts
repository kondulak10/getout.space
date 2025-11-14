import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initializeSentry() {
	// Only enable in production and staging
	if (process.env.NODE_ENV === 'development') {
		console.log('🐛 Sentry: Disabled in development');
		return;
	}

	if (!process.env.SENTRY_DSN_BACKEND) {
		console.log('⚠️  Sentry: SENTRY_DSN_BACKEND not set, skipping initialization');
		return;
	}

	Sentry.init({
		dsn: process.env.SENTRY_DSN_BACKEND,
		environment: process.env.NODE_ENV || 'production',

		// Release tracking (tie errors to specific deployments)
		release: process.env.npm_package_version || 'unknown',

		// Performance monitoring
		tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
		profilesSampleRate: 0.1, // Profile 10% of transactions

		integrations: [
			// Performance profiling
			nodeProfilingIntegration(),

			// HTTP request tracking (replaces old Handlers.requestHandler)
			Sentry.httpIntegration(),

			// MongoDB integration (automatically detected)
			Sentry.mongooseIntegration(),
		],

		// Filter out noisy errors
		beforeSend(event, hint) {
			const error = hint.originalException;

			// Don't send non-running activity errors (expected)
			if (error instanceof Error && error.message.includes('Only running activities')) {
				return null;
			}

			// Don't send token expiration errors (user needs to re-auth)
			if (error instanceof Error && error.message.includes('Token refresh failed')) {
				return null;
			}

			// Don't send GraphQL introspection errors (noisy from playground)
			if (
				error instanceof Error &&
				error.message.includes('IntrospectionQuery') &&
				error.message.includes('Unauthorized')
			) {
				return null;
			}

			return event;
		},
	});

	console.log('✅ Sentry initialized:', Sentry.getClient()?.getDsn()?.toString());
}
