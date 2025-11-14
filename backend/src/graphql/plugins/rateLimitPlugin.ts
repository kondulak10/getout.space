import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLError } from 'graphql';

interface RateLimitConfig {
	[operationName: string]: {
		limit: number; // requests per window
		window: number; // seconds
	};
}

/**
 * Rate limit configuration for specific GraphQL operations
 * Expensive queries have tighter limits
 */
const rateLimitConfig: RateLimitConfig = {
	// Expensive queries (load lots of data)
	myHexagons: { limit: 10, window: 60 },
	hexagonsByParents: { limit: 30, window: 60 },
	regionalActiveLeaders: { limit: 10, window: 60 },
	regionalOGDiscoverers: { limit: 10, window: 60 },
	versusStats: { limit: 20, window: 60 },
	hexagonsStolenFromUser: { limit: 20, window: 60 },

	// Mutations (more restrictive)
	deleteActivity: { limit: 5, window: 60 },
	updateProfile: { limit: 10, window: 60 },
	deleteMyAccount: { limit: 1, window: 3600 }, // 1 per hour
	markNotificationAsRead: { limit: 30, window: 60 },
	deleteNotification: { limit: 30, window: 60 },

	// Less expensive queries (more lenient)
	me: { limit: 100, window: 60 },
	user: { limit: 50, window: 60 },
	myActivities: { limit: 20, window: 60 },
};

// In-memory store for rate limiting
// Key format: "userId:operationName" or "ip:operationName"
const store: Record<string, { count: number; resetTime: number }> = {};

// Clean up expired entries every 5 minutes
setInterval(
	() => {
		const now = Date.now();
		Object.keys(store).forEach((key) => {
			if (store[key].resetTime < now) {
				delete store[key];
			}
		});
	},
	5 * 60 * 1000
);

export const rateLimitPlugin: ApolloServerPlugin = {
	async requestDidStart() {
		return {
			async didResolveOperation(requestContext) {
				const operationName = requestContext.operationName;

				// Skip rate limiting for introspection queries
				if (operationName === 'IntrospectionQuery') {
					return;
				}

				// Skip if operation is not configured for rate limiting
				if (!operationName || !rateLimitConfig[operationName]) {
					return;
				}

				const config = rateLimitConfig[operationName];
				const context = requestContext.contextValue as any;
				const userId =
					context.userId ||
					requestContext.request.http?.headers.get('x-forwarded-for') ||
					'anonymous';

				// Skip rate limiting for admins
				if (context.user?.isAdmin === true) {
					return;
				}

				const key = `${userId}:${operationName}`;
				const now = Date.now();

				const record = store[key];

				if (record && now < record.resetTime) {
					if (record.count >= config.limit) {
						const retryAfter = Math.ceil((record.resetTime - now) / 1000);
						throw new GraphQLError(
							`Rate limit exceeded for ${operationName}. Try again in ${retryAfter}s.`,
							{
								extensions: {
									code: 'RATE_LIMIT_EXCEEDED',
									retryAfter,
									operationName,
									limit: config.limit,
									window: config.window,
								},
							}
						);
					}
					record.count++;
				} else {
					store[key] = {
						count: 1,
						resetTime: now + config.window * 1000,
					};
				}
			},
		};
	},
};

console.log('✅ GraphQL rate limiting plugin initialized');
