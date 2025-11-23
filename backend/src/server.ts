// Initialize Sentry FIRST (before other imports)
import * as Sentry from '@sentry/node';
import { initializeSentry } from './config/sentry';
initializeSentry();

// Initialize Amplitude analytics
import { analyticsService } from './services/analytics.service';
const amplitudeKey = process.env.AMPLITUDE_API_KEY;
if (amplitudeKey) {
	analyticsService.init(amplitudeKey);
}

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import compression from 'compression';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import expressPlayground from 'graphql-playground-middleware-express';
import path from 'path';
import { connectDatabase } from './config/database';
import { resolvers } from './graphql/resolvers/index';
import { typeDefs } from './graphql/schemas/index';
import stravaRoutes from './routes/strava.routes';
import testRoutes from './routes/test.routes';
import webhookRoutes from './routes/webhook.routes';
import { globalLimiter, graphqlLimiter } from './middleware/rateLimiter';
import { rateLimitPlugin } from './graphql/plugins/rateLimitPlugin';
import { initializeLeaderboardCron } from './services/leaderboard.service';

const PORT = process.env.PORT || 4000;

const app = express();

connectDatabase();

// Initialize cron jobs
initializeLeaderboardCron();

app.use(
	cors({
		origin: [
			'http://localhost:5173',
			'http://localhost:3000',
			'https://getout.space',
			'https://www.getout.space',
		],
		credentials: true,
	})
);

// Compression middleware - reduces response sizes by 70-80% for JSON
app.use(
	compression({
		level: 6, // Compression level (1-9, default 6) - balance between speed and ratio
		threshold: 1024, // Only compress responses larger than 1KB
		filter: (req, res) => {
			// Don't compress if client explicitly requests no compression
			if (req.headers['x-no-compression']) {
				return false;
			}
			// Use compression's default filter for other cases
			return compression.filter(req, res);
		},
	})
);

app.use(express.json());

// Simple request/response logging middleware
app.use((req, res, next) => {
	const startTime = Date.now();

	// Skip logging for GraphQL introspection queries (they're noisy)
	const isIntrospectionQuery =
		req.path === '/graphql' && req.body?.operationName === 'IntrospectionQuery';

	if (!isIntrospectionQuery) {
		const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
		console.log(`\x1b[2m[${timestamp}] ${req.method} ${req.path}\x1b[0m`);
	}

	// Capture response
	const originalJson = res.json;

	res.json = function (data) {
		if (!isIntrospectionQuery) {
			const duration = Date.now() - startTime;
			const statusCode = res.statusCode;
			const isError = statusCode >= 400;

			// Check for GraphQL errors
			const hasGraphQLErrors = req.path === '/graphql' && data?.errors?.length > 0;

			if (isError || hasGraphQLErrors) {
				console.log(`\x1b[31m❌ ${statusCode} | ${duration}ms | ${req.method} ${req.path}\x1b[0m`);
				if (hasGraphQLErrors) {
					console.log(`\x1b[31m   Errors: ${JSON.stringify(data.errors, null, 2)}\x1b[0m`);
				}
			} else {
				console.log(`\x1b[2m✓ ${statusCode} | ${duration}ms | ${req.method} ${req.path}\x1b[0m`);
			}
		}
		return originalJson.call(this, data);
	};

	next();
});

// Global rate limiter (baseline protection for all endpoints)
app.use(globalLimiter);

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'templates', 'landing.html'));
});

app.use(testRoutes);
app.use(stravaRoutes);
app.use(webhookRoutes);

const startApolloServer = async () => {
	const server = new ApolloServer({
		typeDefs,
		resolvers,
		introspection: true,
		plugins: [rateLimitPlugin],
	});

	await server.start();

	app.use(
		'/graphql',
		graphqlLimiter, // Rate limiter for GraphQL endpoint
		expressMiddleware(server, {
			context: async ({ req }) => {
				const { verifyToken, extractTokenFromHeader } = await import('./utils/jwt');
				const { User } = await import('./models/User');

				const token = extractTokenFromHeader(req.headers.authorization);

				if (token) {
					try {
						const payload = verifyToken(token);
						const user = await User.findById(payload.userId);

						if (user) {
							return {
								user,
								userId: payload.userId,
								isAuthenticated: true,
							};
						}
					} catch (error) {
						console.log('Invalid token in GraphQL request');
					}
				}

				return {
					user: undefined,
					userId: undefined,
					isAuthenticated: false,
				};
			},
		})
	);

	app.get(
		'/playground',
		expressPlayground({
			endpoint: '/graphql',
			settings: {
				'request.credentials': 'include',
			},
		})
	);

	// Sentry error handler MUST be after all routes (Sentry v8 API)
	Sentry.setupExpressErrorHandler(app);

	// Optional: catch-all error handler
	app.use(
		(err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
			console.error('❌ Unhandled error:', err);
			res.status(500).json({
				error: 'Internal server error',
				...(process.env.NODE_ENV === 'development' && { details: err.message }),
			});
		}
	);

	app.listen(PORT, () => {
		console.log(`
╔═══════════════════════════════════════════╗
║   🚀 GetOut Backend!                      ║
╠═══════════════════════════════════════════╣
║   Health:   http://localhost:${PORT}/health     ║
║   GraphQL:  http://localhost:${PORT}/graphql    ║
║   Test:     http://localhost:${PORT}/api/test   ║
╚═══════════════════════════════════════════╝
    `);
	});
};

startApolloServer().catch((error) => {
	console.error('Failed to start Apollo Server:', error);
	process.exit(1);
});
